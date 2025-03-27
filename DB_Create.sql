DROP SCHEMA IF EXISTS inventory;
CREATE SCHEMA inventory;

-- Create DONVITINH table
CREATE TABLE inventory.DONVITINH (
    MaDonViTinh VARCHAR(36) PRIMARY KEY,
    TenDonViTinh VARCHAR(50),
    DeletedAt TIMESTAMP DEFAULT NULL
);

-- Create LOAIDAILY table
CREATE TABLE inventory.LOAIDAILY (
    MaLoaiDaiLy VARCHAR(36) PRIMARY KEY,
    TenLoaiDaiLy VARCHAR(50),
    NoToiDa INTEGER,
    DeletedAt TIMESTAMP DEFAULT NULL
);

-- Create QUAN table
CREATE TABLE inventory.QUAN (
    MaQuan VARCHAR(36) PRIMARY KEY,
    TenQuan VARCHAR(50),
    NgayTiepNhan DATE,
    NoDaiLy INTEGER,
    DeletedAt TIMESTAMP DEFAULT NULL
);

-- Create MATHANG table
CREATE TABLE inventory.MATHANG (
    MaMatHang VARCHAR(36) PRIMARY KEY,
    TenMatHang VARCHAR(100),
    MaDonViTinh VARCHAR(36),
    SoLuongTon INTEGER,
    DeletedAt TIMESTAMP DEFAULT NULL
);

-- Create DAILY table
CREATE TABLE inventory.DAILY (
    MaDaiLy VARCHAR(36) PRIMARY KEY,
    Ten VARCHAR(100),
    DienThoai VARCHAR(15),
    DiaChi VARCHAR(200),
    Email VARCHAR(100),
    MaLoaiDaiLy VARCHAR(36),
    MaQuan VARCHAR(36),
    DeletedAt TIMESTAMP DEFAULT NULL
);

-- Create PHIEUTHU table
CREATE TABLE inventory.PHIEUTHU (
    MaPhieuThu VARCHAR(36) PRIMARY KEY,
    MaDaiLy VARCHAR(36),
    NgayThuTien DATE,
    SoTienThu INTEGER,
    DeletedAt TIMESTAMP DEFAULT NULL
);

-- Create PHIEUXUAT table
CREATE TABLE inventory.PHIEUXUAT (
    MaPhieuXuat VARCHAR(36) PRIMARY KEY,
    MaDaiLy VARCHAR(36),
    NgayLap DATE,
    TongGiaTri INTEGER,
    DeletedAt TIMESTAMP DEFAULT NULL
);

-- Create CTPHIEUXUAT table
CREATE TABLE inventory.CTPHIEUXUAT (
    MaPhieuXuat VARCHAR(36),
    MaMatHang VARCHAR(36),
    SoLuongXuat INTEGER,
    DonGiaXuat INTEGER,
    ThanhTien INTEGER,
    DeletedAt TIMESTAMP DEFAULT NULL,
    PRIMARY KEY (MaPhieuXuat, MaMatHang)
);

-- Create THAMSO table (no soft delete needed)
CREATE TABLE inventory.THAMSO (
    SoLuongDaiLyToiDa INTEGER,
    QuyDinhTienThuTienNo INTEGER
);

-- Indexes
CREATE INDEX ASYNC ON inventory.DAILY (MaLoaiDaiLy);
CREATE INDEX ASYNC ON inventory.DAILY (MaQuan);
CREATE INDEX ASYNC ON inventory.PHIEUXUAT (MaDaiLy);
CREATE INDEX ASYNC ON inventory.CTPHIEUXUAT (MaMatHang);