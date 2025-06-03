-- Cải thiện bảng PhuongTien cho hệ thống quản lý chung cư
USE Quanli;
GO

-- Xóa bảng cũ nếu tồn tại
IF OBJECT_ID('PhuongTien', 'U') IS NOT NULL
DROP TABLE PhuongTien;
GO

-- Tạo bảng PhuongTien mới với cấu trúc hoàn thiện
CREATE TABLE PhuongTien (
    VehicleID INT IDENTITY(1,1) PRIMARY KEY,
    
    -- Thông tin phương tiện
    LicensePlate NVARCHAR(20) NOT NULL UNIQUE,
    VehicleType NVARCHAR(50) NOT NULL CHECK (VehicleType IN (N'Xe máy', N'Ô tô', N'Xe đạp', N'Xe điện')),
    Brand NVARCHAR(100) NULL,
    Model NVARCHAR(100) NULL,
    Color NVARCHAR(50) NULL,
    
    -- Liên kết với chủ sở hữu
    UserID INT NOT NULL,
    ApartmentID NVARCHAR(10) NOT NULL,
    
    -- Thông tin đăng ký
    RegisterDate DATETIME DEFAULT GETDATE(),
    Status NVARCHAR(20) DEFAULT N'Hoạt động' CHECK (Status IN (N'Hoạt động', N'Tạm dừng', N'Hủy bỏ')),
    
    -- Ghi chú
    Notes NVARCHAR(500) NULL,
    
    -- Audit fields
    CreatedBy NVARCHAR(255) NOT NULL,
    CreatedAt DATETIME DEFAULT GETDATE(),
    UpdatedBy NVARCHAR(255) NOT NULL,
    UpdatedAt DATETIME DEFAULT GETDATE(),
    
    -- Foreign Keys
    CONSTRAINT FK_PhuongTien_User FOREIGN KEY (UserID) REFERENCES Users(id) ON DELETE CASCADE,
    CONSTRAINT FK_PhuongTien_Apartment FOREIGN KEY (ApartmentID) REFERENCES Canho(ApartmentID) ON DELETE CASCADE
);
GO

-- Tạo indexes để tối ưu performance
CREATE INDEX IX_PhuongTien_UserID ON PhuongTien(UserID);
CREATE INDEX IX_PhuongTien_ApartmentID ON PhuongTien(ApartmentID);
CREATE INDEX IX_PhuongTien_VehicleType ON PhuongTien(VehicleType);
CREATE INDEX IX_PhuongTien_Status ON PhuongTien(Status);
GO

-- Tạo dữ liệu mẫu
PRINT N'Thêm dữ liệu mẫu cho bảng PhuongTien...';

-- Lấy user và apartment để tạo dữ liệu mẫu
DECLARE @UserID1 INT, @UserID2 INT;
DECLARE @ApartmentID1 NVARCHAR(10), @ApartmentID2 NVARCHAR(10);

SELECT TOP 1 @UserID1 = u.id, @ApartmentID1 = c.ApartmentID 
FROM Users u 
INNER JOIN Canho c ON u.id = c.id 
WHERE u.role = 'user' 
ORDER BY u.id;

SELECT TOP 1 @UserID2 = u.id, @ApartmentID2 = c.ApartmentID 
FROM Users u 
INNER JOIN Canho c ON u.id = c.id 
WHERE u.role = 'user' AND u.id != @UserID1
ORDER BY u.id;

IF @UserID1 IS NOT NULL AND @ApartmentID1 IS NOT NULL
BEGIN
    INSERT INTO PhuongTien (LicensePlate, VehicleType, Brand, Model, Color, UserID, ApartmentID, CreatedBy, UpdatedBy)
    VALUES 
    (N'29A1-12345', N'Xe máy', N'Honda', N'Wave Alpha', N'Đỏ', @UserID1, @ApartmentID1, 'admin@example.com', 'admin@example.com'),
    (N'30G-98765', N'Ô tô', N'Toyota', N'Vios', N'Trắng', @UserID1, @ApartmentID1, 'admin@example.com', 'admin@example.com');
    
    PRINT N'Đã thêm 2 phương tiện mẫu cho user ' + CAST(@UserID1 AS NVARCHAR(10));
END

IF @UserID2 IS NOT NULL AND @ApartmentID2 IS NOT NULL
BEGIN
    INSERT INTO PhuongTien (LicensePlate, VehicleType, Brand, Model, Color, UserID, ApartmentID, CreatedBy, UpdatedBy)
    VALUES 
    (N'29B2-67890', N'Xe máy', N'Yamaha', N'Exciter', N'Xanh', @UserID2, @ApartmentID2, 'admin@example.com', 'admin@example.com');
    
    PRINT N'Đã thêm 1 phương tiện mẫu cho user ' + CAST(@UserID2 AS NVARCHAR(10));
END

-- Hiển thị kết quả
SELECT 
    pt.VehicleID,
    pt.LicensePlate,
    pt.VehicleType,
    pt.Brand + N' ' + pt.Model as Vehicle,
    pt.Color,
    u.firstName + N' ' + u.lastName as Owner,
    pt.ApartmentID,
    pt.Status,
    pt.RegisterDate
FROM PhuongTien pt
INNER JOIN Users u ON pt.UserID = u.id
ORDER BY pt.VehicleID;

PRINT N'✅ Bảng PhuongTien đã được tạo thành công với dữ liệu mẫu!';
GO 