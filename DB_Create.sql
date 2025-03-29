-- Drop the schema and all its objects
DROP SCHEMA IF EXISTS inventory CASCADE;

-- Recreate the schema
CREATE SCHEMA inventory;

-- Create tables
CREATE TABLE inventory.DONVITINH (
    MaDonViTinh VARCHAR(36) PRIMARY KEY,
    TenDonViTinh VARCHAR(50),
    DeletedAt TIMESTAMP DEFAULT NULL
);

CREATE TABLE inventory.LOAIDAILY (
    MaLoaiDaiLy VARCHAR(36) PRIMARY KEY,
    TenLoaiDaiLy VARCHAR(50),
    NoToiDa INTEGER,
    DeletedAt TIMESTAMP DEFAULT NULL
);

CREATE TABLE inventory.QUAN (
    MaQuan VARCHAR(36) PRIMARY KEY,
    TenQuan VARCHAR(50),
    NgayTiepNhan DATE,
    NoDaiLy INTEGER,
    DeletedAt TIMESTAMP DEFAULT NULL
);

CREATE TABLE inventory.MATHANG (
    MaMatHang VARCHAR(36) PRIMARY KEY,
    TenMatHang VARCHAR(100),
    MaDonViTinh VARCHAR(36),
    SoLuongTon INTEGER,
    DeletedAt TIMESTAMP DEFAULT NULL
);

CREATE TABLE inventory.DAILY (
    MaDaiLy VARCHAR(36) PRIMARY KEY,
    Ten VARCHAR(100),
    DienThoai VARCHAR(15),
    DiaChi VARCHAR(200),
    Email VARCHAR(100),
    MaLoaiDaiLy VARCHAR(36),
    MaQuan VARCHAR(36),
    NgayTiepNhan DATE,
    CongNo INTEGER DEFAULT 0,
    DeletedAt TIMESTAMP DEFAULT NULL
);

CREATE TABLE inventory.PHIEUTHU (
    MaPhieuThu VARCHAR(36) PRIMARY KEY,
    MaDaiLy VARCHAR(36),
    NgayThuTien DATE,
    SoTienThu INTEGER,
    DeletedAt TIMESTAMP DEFAULT NULL
);

CREATE TABLE inventory.PHIEUXUAT (
    MaPhieuXuat VARCHAR(36) PRIMARY KEY,
    MaDaiLy VARCHAR(36),
    NgayLap DATE,
    TongGiaTri INTEGER,
    DeletedAt TIMESTAMP DEFAULT NULL
);

CREATE TABLE inventory.CTPHIEUXUAT (
    MaPhieuXuat VARCHAR(36),
    MaMatHang VARCHAR(36),
    SoLuongXuat INTEGER,
    DonGiaXuat INTEGER,
    ThanhTien INTEGER,
    DeletedAt TIMESTAMP DEFAULT NULL,
    PRIMARY KEY (MaPhieuXuat, MaMatHang)
);

CREATE TABLE inventory.THAMSO (
    SoLuongDaiLyToiDa INTEGER,
    QuyDinhTienThuTienNo INTEGER
);

-- Indexes
CREATE INDEX ASYNC ON inventory.DAILY (MaLoaiDaiLy);
CREATE INDEX ASYNC ON inventory.DAILY (MaQuan);
CREATE INDEX ASYNC ON inventory.PHIEUXUAT (MaDaiLy);
CREATE INDEX ASYNC ON inventory.CTPHIEUXUAT (MaMatHang);

-- Insert into DONVITINH and MATHANG using CTE
WITH inserted_donvitinh AS (
    INSERT INTO inventory.DONVITINH (MaDonViTinh, TenDonViTinh)
    VALUES
        (gen_random_uuid(), 'Cái'),
        (gen_random_uuid(), 'Hộp'),
        (gen_random_uuid(), 'Thùng')
    RETURNING MaDonViTinh, TenDonViTinh
),
inserted_loaidaily AS (
    INSERT INTO inventory.LOAIDAILY (MaLoaiDaiLy, TenLoaiDaiLy, NoToiDa)
    VALUES
        (gen_random_uuid(), 'Loại 1', 20000),
        (gen_random_uuid(), 'Loại 2', 50000)
    RETURNING MaLoaiDaiLy
),
inserted_quan AS (
    INSERT INTO inventory.QUAN (MaQuan, TenQuan)
    VALUES
        (gen_random_uuid(), 'Quận 1'), (gen_random_uuid(), 'Quận 2'), (gen_random_uuid(), 'Quận 3'),
        (gen_random_uuid(), 'Quận 4'), (gen_random_uuid(), 'Quận 5'), (gen_random_uuid(), 'Quận 6'),
        (gen_random_uuid(), 'Quận 7'), (gen_random_uuid(), 'Quận 8'), (gen_random_uuid(), 'Quận 9'),
        (gen_random_uuid(), 'Quận 10'), (gen_random_uuid(), 'Quận 11'), (gen_random_uuid(), 'Quận 12'),
        (gen_random_uuid(), 'Quận 13'), (gen_random_uuid(), 'Quận 14'), (gen_random_uuid(), 'Quận 15'),
        (gen_random_uuid(), 'Quận 16'), (gen_random_uuid(), 'Quận 17'), (gen_random_uuid(), 'Quận 18'),
        (gen_random_uuid(), 'Quận 19'), (gen_random_uuid(), 'Quận 20')
    RETURNING MaQuan
)
INSERT INTO inventory.MATHANG (MaMatHang, TenMatHang, MaDonViTinh, SoLuongTon)
SELECT
    gen_random_uuid(), 'Mặt hàng 1', (SELECT MaDonViTinh FROM inserted_donvitinh WHERE TenDonViTinh = 'Cái'), 100
UNION ALL
SELECT
    gen_random_uuid(), 'Mặt hàng 2', (SELECT MaDonViTinh FROM inserted_donvitinh WHERE TenDonViTinh = 'Hộp'), 50
UNION ALL
SELECT
    gen_random_uuid(), 'Mặt hàng 3', (SELECT MaDonViTinh FROM inserted_donvitinh WHERE TenDonViTinh = 'Thùng'), 200
UNION ALL
SELECT
    gen_random_uuid(), 'Mặt hàng 4', (SELECT MaDonViTinh FROM inserted_donvitinh WHERE TenDonViTinh = 'Cái'), 150
UNION ALL
SELECT
    gen_random_uuid(), 'Mặt hàng 5', (SELECT MaDonViTinh FROM inserted_donvitinh WHERE TenDonViTinh = 'Hộp'), 75;

-- Insert into THAMSO
INSERT INTO inventory.THAMSO (SoLuongDaiLyToiDa, QuyDinhTienThuTienNo) VALUES (4, 1);