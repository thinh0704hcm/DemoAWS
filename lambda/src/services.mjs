// src/services.mjs
import { v4 as uuidv4 } from 'uuid';
import * as db from './database.mjs';

// Helper to get current timestamp
const now = () => new Date().toISOString();

// Daily (Agent) Services
export async function getAllDaily() {
  const result = await db.query('SELECT * FROM inventory.DAILY WHERE DeletedAt IS NULL');
  return result.rows;
}

export async function getDaily(maDaiLy) {
  const result = await db.query('SELECT * FROM inventory.DAILY WHERE MaDaiLy = $1 AND DeletedAt IS NULL', [maDaiLy]);
  if (result.rowCount === 0) {
    throw new Error('Agent not found');
  }
  return result.rows[0];
}

export async function createDaily({ ten, dienthoai, diachi, email, maloaidaily, maquan }) {
  if (!ten || !dienthoai || !diachi || !email || !maloaidaily || !maquan) {
    throw new Error('Missing required fields');
  }

  const loaidailyCheck = await db.query('SELECT 1 FROM inventory.LOAIDAILY WHERE MaLoaiDaiLy = $1 AND DeletedAt IS NULL', [maloaidaily]);
  if (loaidailyCheck.rowCount === 0) {
    throw new Error(`MaLoaiDaiLy ${maloaidaily} does not exist or is deleted`);
  }

  const quanCheck = await db.query('SELECT 1 FROM inventory.QUAN WHERE MaQuan = $1 AND DeletedAt IS NULL', [maquan]);
  if (quanCheck.rowCount === 0) {
    throw new Error(`MaQuan ${maquan} does not exist or is deleted`);
  }

  const maDaiLy = uuidv4();
  await db.query(
    'INSERT INTO inventory.DAILY (MaDaiLy, Ten, DienThoai, DiaChi, Email, MaLoaiDaiLy, MaQuan, DeletedAt) VALUES ($1, $2, $3, $4, $5, $6, $7, NULL)',
    [maDaiLy, ten, dienthoai, diachi, email, maloaidaily, maquan]
  );
  return { maDaiLy };
}

export async function updateDaily(maDaiLy, { ten, dienthoai, diachi, email, maloaidaily, maquan }) {
  if (maloaidaily) {
    const loaidailyCheck = await db.query('SELECT 1 FROM inventory.LOAIDAILY WHERE MaLoaiDaiLy = $1 AND DeletedAt IS NULL', [maloaidaily]);
    if (loaidailyCheck.rowCount === 0) {
      throw new Error(`MaLoaiDaiLy ${maloaidaily} does not exist or is deleted`);
    }
  }
  if (maquan) {
    const quanCheck = await db.query('SELECT 1 FROM inventory.QUAN WHERE MaQuan = $1 AND DeletedAt IS NULL', [maquan]);
    if (quanCheck.rowCount === 0) {
      throw new Error(`MaQuan ${maquan} does not exist or is deleted`);
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
  if (updates.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(maDaiLy);
  const queryText = `UPDATE inventory.DAILY SET ${updates.join(', ')} WHERE MaDaiLy = $${paramIndex} AND DeletedAt IS NULL`;
  const result = await db.query(queryText, values);
  if (result.rowCount === 0) {
    throw new Error('Agent not found or already deleted');
  }
}

export async function deleteDaily(maDaiLy) {
  const result = await db.query(
    'UPDATE inventory.DAILY SET DeletedAt = $1 WHERE MaDaiLy = $2 AND DeletedAt IS NULL',
    [now(), maDaiLy]
  );
  if (result.rowCount === 0) {
    throw new Error('Agent not found or already deleted');
  }
}

// DonViTinh (Unit of Measurement) Services
export async function getAllDonViTinh() {
  const result = await db.query('SELECT * FROM inventory.DONVITINH WHERE DeletedAt IS NULL');
  return result.rows;
}

export async function getDonViTinh(maDonViTinh) {
  const result = await db.query('SELECT * FROM inventory.DONVITINH WHERE MaDonViTinh = $1 AND DeletedAt IS NULL', [maDonViTinh]);
  if (result.rowCount === 0) {
    throw new Error('Unit of measurement not found');
  }
  return result.rows[0];
}

export async function createDonViTinh({ tendonvitinh }) {
  if (!tendonvitinh) {
    throw new Error('Missing required field: tendonvitinh');
  }
  const maDonViTinh = uuidv4();
  await db.query(
    'INSERT INTO inventory.DONVITINH (MaDonViTinh, TenDonViTinh, DeletedAt) VALUES ($1, $2, NULL)',
    [maDonViTinh, tendonvitinh]
  );
  return { maDonViTinh };
}

export async function updateDonViTinh(maDonViTinh, { tendonvitinh }) {
  if (!tendonvitinh) {
    throw new Error('Missing required field: tendonvitinh');
  }
  const result = await db.query(
    'UPDATE inventory.DONVITINH SET TenDonViTinh = $1 WHERE MaDonViTinh = $2 AND DeletedAt IS NULL',
    [tendonvitinh, maDonViTinh]
  );
  if (result.rowCount === 0) {
    throw new Error('Unit of measurement not found or already deleted');
  }
}

export async function deleteDonViTinh(maDonViTinh) {
  const result = await db.query(
    'UPDATE inventory.DONVITINH SET DeletedAt = $1 WHERE MaDonViTinh = $2 AND DeletedAt IS NULL',
    [now(), maDonViTinh]
  );
  if (result.rowCount === 0) {
    throw new Error('Unit of measurement not found or already deleted');
  }
}