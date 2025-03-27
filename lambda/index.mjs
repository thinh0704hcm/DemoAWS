import pkg from 'pg';
const { Pool } = pkg;
import { v4 as uuidv4 } from 'uuid';
import { DsqlSigner } from '@aws-sdk/dsql-signer';

// Create a connection pool outside the handler to reuse connections
let pool;

async function getPool() {
  if (!pool) {

    console.log('Initializing connection pool');
    console.log('Using region:', process.env.DB_REGION);
    console.log('Using hostname:', process.env.DB_HOST);

    // Create signer and generate token
    const signer = new DsqlSigner({
      hostname: process.env.DB_HOST,
      region: process.env.DB_REGION,
    });

    // Get admin token
    const token = await signer.getDbConnectAdminAuthToken();
    console.log('Admin token generated successfully');

    // Create connection pool
    pool = new Pool({
      host: process.env.DB_HOST,
      port: 5432,
      user: 'admin',
      password: token,
      database: 'postgres',
      ssl: true,
      // Connection pool settings
      max: 1, // Start with just 1 connection
      idleTimeoutMillis: 120000, // Keep connections alive
      connectionTimeoutMillis: 10000, // Allow more time to connect
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      pool = null; // Reset the pool to allow reinitialization
    });

    // Test connection
    const client = await pool.connect();
    client.release();
    console.log('Connection pool initialized successfully');
  }
  return pool;
}

// Lambda handler
export async function handler (event, context) {
  context.callbackWaitsForEmptyEventLoop = false; // Prevent connection timeout issues

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*', // Enable CORS for ReactJS
  };

  let client;
  try {
    // Get the connection pool
    const pool = await getPool();

    // Get a client from the pool
    client = await pool.connect();

    // Parse the HTTP request
    const { httpMethod, path, body } = event;
    const parsedBody = body ? JSON.parse(body) : {};

    // Route handling
    if (path === '/daily') {
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.DAILY');
        return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
      } else if (httpMethod === 'POST') {
        const { ten, dienthoai, diachi, email, maloaidaily, maquan } = parsedBody;
        if (!ten || !dienthoai || !diachi || !email || !maloaidaily || !maquan) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
        }
        const loaidailyCheck = await client.query('SELECT 1 FROM inventory.LOAIDAILY WHERE MaLoaiDaiLy = $1', [maloaidaily]);
        if (loaidailyCheck.rowCount === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: `MaLoaiDaiLy ${maloaidaily} does not exist` }) };
        }
        const quanCheck = await client.query('SELECT 1 FROM inventory.QUAN WHERE MaQuan = $1', [maquan]);
        if (quanCheck.rowCount === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: `MaQuan ${maquan} does not exist` }) };
        }
        const maDaiLy = uuidv4();
        await client.query('INSERT INTO inventory.DAILY (MaDaiLy, Ten, DienThoai, DiaChi, Email, MaLoaiDaiLy, MaQuan) VALUES ($1, $2, $3, $4, $5, $6, $7)', [maDaiLy, ten, dienthoai, diachi, email, maloaidaily, maquan]);
        return { statusCode: 201, headers, body: JSON.stringify({ maDaiLy, message: 'Agent created successfully' }) };
      }
    } else if (path.startsWith('/daily/')) {
      const maDaiLy = path.split('/')[2];
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.DAILY WHERE MaDaiLy = $1', [maDaiLy]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Agent not found' }) } : { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
      } else if (httpMethod === 'PUT') {
        const { ten, dienthoai, diachi, email, maloaidaily, maquan } = parsedBody;
        if (maloaidaily) {
          const loaidailyCheck = await client.query('SELECT 1 FROM inventory.LOAIDAILY WHERE MaLoaiDaiLy = $1', [maloaidaily]);
          if (loaidailyCheck.rowCount === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: `MaLoaiDaiLy ${maloaidaily} does not exist` }) };
          }
        }
        if (maquan) {
          const quanCheck = await client.query('SELECT 1 FROM inventory.QUAN WHERE MaQuan = $1', [maquan]);
          if (quanCheck.rowCount === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: `MaQuan ${maquan} does not exist` }) };
          }
        }
        const updates = [];
        const values = [];
        let paramIndex = 1;
        if (ten) { updates.push(`Ten = $${paramIndex++}`); values.push(ten); }
        if (dienthoai) { updates.push(`DienThoai = $${paramIndex++}`); values.push(dienthoai); }
        if (diachi) { updates.push(`DiaChi = $${paramIndex++}`); values.push(diachi); }
        if (email) { updates.push(`Email = $${paramIndex++}`); values.push(email); }
        if (maloaidaily) { updates.push(`MaLoaiDaiLy = $${paramIndex++}`); values.push(maloaidaily); }
        if (maquan) { updates.push(`MaQuan = $${paramIndex++}`); values.push(maquan); }
        if (updates.length === 0) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'No fields to update' }) }; }
        values.push(maDaiLy);
        const query = `UPDATE inventory.DAILY SET ${updates.join(', ')} WHERE MaDaiLy = $${paramIndex}`;
        const result = await client.query(query, values);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Agent not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Agent updated successfully' }) };
      } else if (httpMethod === 'DELETE') {
        const result = await client.query('DELETE FROM inventory.DAILY WHERE MaDaiLy = $1', [maDaiLy]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Agent not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Agent deleted successfully' }) };
      }
    } else if (path === '/donvitinh') {
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.DONVITINH');
        return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
      } else if (httpMethod === 'POST') {
        const { tendonvitinh } = parsedBody;
        const maDonViTinh = uuidv4();
        await client.query('INSERT INTO inventory.DONVITINH (MaDonViTinh, TenDonViTinh) VALUES ($1, $2)', [maDonViTinh, tendonvitinh]);
        return { statusCode: 201, headers, body: JSON.stringify({ maDonViTinh, message: 'Unit of measurement created successfully' }) };
      }
    } else if (path.startsWith('/donvitinh/')) {
      const maDonViTinh = path.split('/')[2];
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.DONVITINH WHERE MaDonViTinh = $1', [maDonViTinh]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Unit of measurement not found' }) } : { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
      } else if (httpMethod === 'PUT') {
        const { tendonvitinh } = parsedBody;
        const result = await client.query('UPDATE inventory.DONVITINH SET TenDonViTinh = $1 WHERE MaDonViTinh = $2', [tendonvitinh, maDonViTinh]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Unit of measurement not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Unit of measurement updated successfully' }) };
      } else if (httpMethod === 'DELETE') {
        const result = await client.query('DELETE FROM inventory.DONVITINH WHERE MaDonViTinh = $1', [maDonViTinh]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Unit of measurement not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Unit of measurement deleted successfully' }) };
      }
    } else if (path === '/loaidaily') {
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.LOAIDAILY');
        return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
      } else if (httpMethod === 'POST') {
        const { tenloaidaily, notoida } = parsedBody;
        const maLoaiDaiLy = uuidv4();
        await client.query('INSERT INTO inventory.LOAIDAILY (MaLoaiDaiLy, TenLoaiDaiLy, NoToiDa) VALUES ($1, $2, $3)', [maLoaiDaiLy, tenloaidaily, notoida]);
        return { statusCode: 201, headers, body: JSON.stringify({ maLoaiDaiLy, message: 'Agent type created successfully' }) };
      }
    } else if (path.startsWith('/loaidaily/')) {
      const maLoaiDaiLy = path.split('/')[2];
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.LOAIDAILY WHERE MaLoaiDaiLy = $1', [maLoaiDaiLy]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Agent type not found' }) } : { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
      } else if (httpMethod === 'PUT') {
        const { tenloaidaily, notoida } = parsedBody;
        const result = await client.query('UPDATE inventory.LOAIDAILY SET TenLoaiDaiLy = $1, NoToiDa = $2 WHERE MaLoaiDaiLy = $3', [tenloaidaily, notoida, maLoaiDaiLy]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Agent type not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Agent type updated successfully' }) };
      } else if (httpMethod === 'DELETE') {
        const result = await client.query('DELETE FROM inventory.LOAIDAILY WHERE MaLoaiDaiLy = $1', [maLoaiDaiLy]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Agent type not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Agent type deleted successfully' }) };
      }
    } else if (path === '/quan') {
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.QUAN');
        return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
      } else if (httpMethod === 'POST') {
        const { tenquan, ngaytiepnhan, nodaily } = parsedBody;
        const maQuan = uuidv4();
        // Format the date from DD/MM/YYYY to YYYY-MM-DD
        const [day, month, year] = ngaytiepnhan.split('/');
        const formattedNgayTiepNhan = `${year}-${month}-${day}`;

        await client.query('INSERT INTO inventory.QUAN (MaQuan, TenQuan, NgayTiepNhan, NoDaiLy) VALUES ($1, $2, $3, $4)', [maQuan, tenquan, formattedNgayTiepNhan, nodaily]);
        return { statusCode: 201, headers, body: JSON.stringify({ maQuan, message: 'District created successfully' }) };
        }
    } else if (path.startsWith('/quan/')) {
      const maQuan = path.split('/')[2];
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.QUAN WHERE MaQuan = $1', [maQuan]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'District not found' }) } : { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
      } else if (httpMethod === 'PUT') {
        const { tenquan, ngaytiepnhan, nodaily } = parsedBody;
        const result = await client.query('UPDATE inventory.QUAN SET TenQuan = $1, NgayTiepNhan = $2, NoDaiLy = $3 WHERE MaQuan = $4', [tenquan, ngaytiepnhan, nodaily, maQuan]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'District not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'District updated successfully' }) };
      } else if (httpMethod === 'DELETE') {
        const result = await client.query('DELETE FROM inventory.QUAN WHERE MaQuan = $1', [maQuan]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'District not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'District deleted successfully' }) };
      }
    } else if (path === '/mathang') {
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.MATHANG');
        return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
      } else if (httpMethod === 'POST') {
        const { tenmathang, madonvitinh, soluongton } = parsedBody;
        const maMatHang = uuidv4();
        await client.query('INSERT INTO inventory.MATHANG (MaMatHang, TenMatHang, MaDonViTinh, SoLuongTon) VALUES ($1, $2, $3, $4)', [maMatHang, tenmathang, madonvitinh, soluongton]);
        return { statusCode: 201, headers, body: JSON.stringify({ maMatHang, message: 'Product created successfully' }) };
      }
    } else if (path.startsWith('/mathang/')) {
      const maMatHang = path.split('/')[2];
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.MATHANG WHERE MaMatHang = $1', [maMatHang]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Product not found' }) } : { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
      } else if (httpMethod === 'PUT') {
        const { tenmathang, madonvitinh, soluongton } = parsedBody;
        const result = await client.query('UPDATE inventory.MATHANG SET TenMatHang = $1, MaDonViTinh = $2, SoLuongTon = $3 WHERE MaMatHang = $4', [tenmathang, madonvitinh, soluongton, maMatHang]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Product not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Product updated successfully' }) };
      } else if (httpMethod === 'DELETE') {
        const result = await client.query('DELETE FROM inventory.MATHANG WHERE MaMatHang = $1', [maMatHang]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Product not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Product deleted successfully' }) };
      }
    } else if (path === '/phieuthu') {
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.PHIEUTHU');
        return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
      } else if (httpMethod === 'POST') {
        const { madaily, ngaythutien, sotienthu } = parsedBody;
        const phieuThuCheck = await client.query('SELECT 1 FROM inventory.DAILY WHERE MaDaiLy = $1', [madaily]);
        if (phieuThuCheck.rowCount === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: `MaDaiLy ${madaily} does not exist` }) };
        }
        const maPhieuThu = uuidv4();
        await client.query('INSERT INTO inventory.PHIEUTHU (MaPhieuThu, MaDaiLy, NgayThuTien, SoTienThu) VALUES ($1, $2, $3, $4)', [maPhieuThu, madaily, ngaythutien, sotienthu]);
        return { statusCode: 201, headers, body: JSON.stringify({ maPhieuThu, message: 'Receipt created successfully' }) };
      }
    } else if (path.startsWith('/phieuthu/')) {
      const maPhieuThu = path.split('/')[2];
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.PHIEUTHU WHERE MaPhieuThu = $1', [maPhieuThu]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Receipt not found' }) } : { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
      } else if (httpMethod === 'PUT') {
        const { madaily, ngaythutien, sotienthu } = parsedBody;
        const phieuThuCheck = await client.query('SELECT 1 FROM inventory.DAILY WHERE MaDaiLy = $1', [madaily]);
        if (phieuThuCheck.rowCount === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: `MaDaiLy ${madaily} does not exist` }) };
        }
        const result = await client.query('UPDATE inventory.PHIEUTHU SET MaDaiLy = $1, NgayThuTien = $2, SoTienThu = $3 WHERE MaPhieuThu = $4', [madaily, ngaythutien, sotienthu, maPhieuThu]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Receipt not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Receipt updated successfully' }) };
      } else if (httpMethod === 'DELETE') {
        const result = await client.query('DELETE FROM inventory.PHIEUTHU WHERE MaPhieuThu = $1', [maPhieuThu]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Receipt not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Receipt deleted successfully' }) };
      }
    } else if (path === '/phieuxuat') {
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.PHIEUXUAT');
        return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
      } else if (httpMethod === 'POST') {
        const { madaily, ngaylap, tonggiatri } = parsedBody;
        const dailyCheck = await client.query('SELECT 1 FROM inventory.DAILY WHERE MaDaiLy = $1', [madaily]);
        if (dailyCheck.rowCount === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: `MaDaiLy ${madaily} does not exist` }) };
        }
        const maPhieuXuat = uuidv4();
        await client.query('INSERT INTO inventory.PHIEUXUAT (MaPhieuXuat, MaDaiLy, NgayLap, TongGiaTri) VALUES ($1, $2, $3, $4)', [maPhieuXuat, madaily, ngaylap, tonggiatri]);
        return { statusCode: 201, headers, body: JSON.stringify({ maPhieuXuat, message: 'Export slip created successfully' }) };
      }
    } else if (path.startsWith('/phieuxuat/')) {
      const maPhieuXuat = path.split('/')[2];
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.PHIEUXUAT WHERE MaPhieuXuat = $1', [maPhieuXuat]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Export slip not found' }) } : { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
      } else if (httpMethod === 'PUT') {
        const { madaily, ngaylap, tonggiatri } = parsedBody;
        const dailyCheck = await client.query('SELECT 1 FROM inventory.DAILY WHERE MaDaiLy = $1', [madaily]);
        if (dailyCheck.rowCount === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: `MaDaiLy ${madaily} does not exist` }) };
        }
        const result = await client.query('UPDATE inventory.PHIEUXUAT SET MaDaiLy = $1, NgayLap = $2, TongGiaTri = $3 WHERE MaPhieuXuat = $4', [madaily, ngaylap, tonggiatri, maPhieuXuat]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Export slip not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Export slip updated successfully' }) };
      } else if (httpMethod === 'DELETE') {
        const result = await client.query('DELETE FROM inventory.PHIEUXUAT WHERE MaPhieuXuat = $1', [maPhieuXuat]);
        return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Export slip not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Export slip deleted successfully' }) };
      }
    } else if (path === '/ctphieuxuat') {
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.CTPHIEUXUAT');
        return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
      } else if (httpMethod === 'POST') {
        const { maphieuxuat, mamathang, soluongxuat, dongiaxuat } = parsedBody;
        const phieuxuatCheck = await client.query('SELECT 1 FROM inventory.PHIEUXUAT WHERE MaPhieuXuat = $1', [maphieuxuat]);
        if (phieuxuatCheck.rowCount === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: `MaPhieuXuat ${maphieuxuat} does not exist` }) };
        }
        const mathangCheck = await client.query('SELECT 1 FROM inventory.MATHANG WHERE MaMatHang = $1', [mamathang]);
        if (mathangCheck.rowCount === 0) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: `MaMatHang ${mamathang} does not exist` }) };
        }
        const thanhtien = soluongxuat * dongiaxuat;
        await client.query('INSERT INTO inventory.CTPHIEUXUAT (MaPhieuXuat, MaMatHang, SoLuongXuat, DonGiaXuat, ThanhTien) VALUES ($1, $2, $3, $4, $5)', [maphieuxuat, mamathang, soluongxuat, dongiaxuat, thanhtien]);
        return { statusCode: 201, headers, body: JSON.stringify({ message: 'Export slip detail created successfully' }) };
      }
    } else if (path.startsWith('/ctphieuxuat/')) {
      const parts = path.split('/');
      if (parts.length === 4) {
        const maPhieuXuat = parts[2];
        const maMatHang = parts[3];
        if (httpMethod === 'GET') {
          const result = await client.query('SELECT * FROM inventory.CTPHIEUXUAT WHERE MaPhieuXuat = $1 AND MaMatHang = $2', [maPhieuXuat, maMatHang]);
          return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Export slip detail not found' }) } : { statusCode: 200, headers, body: JSON.stringify(result.rows[0]) };
        } else if (httpMethod === 'PUT') {
          const { soluongxuat, dongiaxuat } = parsedBody;
          const phieuxuatCheck = await client.query('SELECT 1 FROM inventory.PHIEUXUAT WHERE MaPhieuXuat = $1', [maPhieuXuat]);
          if (phieuxuatCheck.rowCount === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: `MaPhieuXuat ${maPhieuXuat} does not exist` }) };
          }
          const mathangCheck = await client.query('SELECT 1 FROM inventory.MATHANG WHERE MaMatHang = $1', [maMatHang]);
          if (mathangCheck.rowCount === 0) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: `MaMatHang ${maMatHang} does not exist` }) };
          }
          const thanhTien = soluongxuat * dongiaxuat;
          const result = await client.query('UPDATE inventory.CTPHIEUXUAT SET SoLuongXuat = $1, DonGiaXuat = $2, ThanhTien = $3 WHERE MaPhieuXuat = $4 AND MaMatHang = $5', [soluongxuat, dongiaxuat, thanhTien, maPhieuXuat, maMatHang]);
          return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Export slip detail not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Export slip detail updated successfully' }) };
        } else if (httpMethod === 'DELETE') {
          const result = await client.query('DELETE FROM inventory.CTPHIEUXUAT WHERE MaPhieuXuat = $1 AND MaMatHang = $2', [maPhieuXuat, maMatHang]);
          return result.rowCount === 0 ? { statusCode: 404, headers, body: JSON.stringify({ error: 'Export slip detail not found' }) } : { statusCode: 200, headers, body: JSON.stringify({ message: 'Export slip detail deleted successfully' }) };
        }
      }
    } else if (path === '/thamso') {
      if (httpMethod === 'GET') {
        const result = await client.query('SELECT * FROM inventory.THAMSO LIMIT 1');
        return { statusCode: 200, headers, body: JSON.stringify(result.rows) };
      } else if (httpMethod === 'PUT') {
        const { soluongdailytoida, quydinhtienthutienno } = parsedBody;
        const result = await client.query('UPDATE inventory.THAMSO SET SoLuongDaiLyToiDa = $1, QuyDinhTienThuTienNo = $2', [soluongdailytoida, quydinhtienthutienno]);
        return { statusCode: 200, headers, body: JSON.stringify({ message: 'Parameters updated successfully' }) };
      }
    }

    // If no route matches
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ error: 'Route not found' }),
    };

  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', details: err.message }),
    };
  } finally {
    if (client) {
      client.release();
    }
  }
};