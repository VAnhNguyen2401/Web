-- Script tạo dữ liệu test cho hệ thống xác thực
-- Hướng dẫn sử dụng:
-- 1. Mở SQL Server Management Studio (SSMS)
-- 2. Kết nối đến SQL Server với thông tin: Server=DESKTOP-D7SSCQ5, User=sa, Password=Vietanh24
-- 3. Mở file này và nhấn F5 hoặc nút Execute để chạy

-- Sử dụng database Quanli
USE Quanli;
GO

PRINT N'Bắt đầu tạo dữ liệu test...';

-- Mật khẩu đã hash bằng bcrypt
-- admin123456: $2a$10$RZG5adVbgQHEkBWZ0dLNr.PrDFsiDvOz4MmjI9epOPxKAsp6Yi87e
-- manager123: $2a$10$nRXAqE.n.IyVH8AQwr8YA.j.jX47siDQCnDwN9D.3TbpkgG2beOLi
-- user123456: $2a$10$wuU1M9YGxwQOKOmN.InSquZ.6wYcF5YIadZp9S.zRvjIpVkx0pVUO

-- Tạo biến để lưu các mật khẩu đã hash
DECLARE @AdminPassword NVARCHAR(100) = '$2a$10$RZG5adVbgQHEkBWZ0dLNr.PrDFsiDvOz4MmjI9epOPxKAsp6Yi87e';
DECLARE @ManagerPassword NVARCHAR(100) = '$2a$10$nRXAqE.n.IyVH8AQwr8YA.j.jX47siDQCnDwN9D.3TbpkgG2beOLi';
DECLARE @UserPassword NVARCHAR(100) = '$2a$10$wuU1M9YGxwQOKOmN.InSquZ.6wYcF5YIadZp9S.zRvjIpVkx0pVUO';

-- Kiểm tra và tạo người dùng admin nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM Users WHERE email = 'admin@example.com')
BEGIN
    INSERT INTO Users (firstName, lastName, email, password, role, phoneNumber, createdAt, updatedAt)
    VALUES (N'Admin', N'System', 'admin@example.com', @AdminPassword, 'admin', '0123456789', GETDATE(), GETDATE());
    PRINT N'Đã tạo người dùng: admin@example.com (admin)';
END
ELSE
BEGIN
    PRINT N'Email admin@example.com đã tồn tại, bỏ qua';
END

-- Kiểm tra và tạo người dùng manager nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM Users WHERE email = 'manager@example.com')
BEGIN
    INSERT INTO Users (firstName, lastName, email, password, role, phoneNumber, createdAt, updatedAt)
    VALUES (N'Manager', N'Project', 'manager@example.com', @ManagerPassword, 'manager', '0987654321', GETDATE(), GETDATE());
    PRINT N'Đã tạo người dùng: manager@example.com (manager)';
END
ELSE
BEGIN
    PRINT N'Email manager@example.com đã tồn tại, bỏ qua';
END

-- Kiểm tra và tạo người dùng thường nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM Users WHERE email = 'nguyenvana@example.com')
BEGIN
    INSERT INTO Users (firstName, lastName, email, password, role, phoneNumber, createdAt, updatedAt)
    VALUES (N'Nguyễn', N'Văn A', 'nguyenvana@example.com', @UserPassword, 'user', '0912345678', GETDATE(), GETDATE());
    PRINT N'Đã tạo người dùng: nguyenvana@example.com (user)';
END
ELSE
BEGIN
    PRINT N'Email nguyenvana@example.com đã tồn tại, bỏ qua';
END

IF NOT EXISTS (SELECT 1 FROM Users WHERE email = 'tranthib@example.com')
BEGIN
    INSERT INTO Users (firstName, lastName, email, password, role, phoneNumber, createdAt, updatedAt)
    VALUES (N'Trần', N'Thị B', 'tranthib@example.com', @UserPassword, 'user', '0865432109', GETDATE(), GETDATE());
    PRINT N'Đã tạo người dùng: tranthib@example.com (user)';
END
ELSE
BEGIN
    PRINT N'Email tranthib@example.com đã tồn tại, bỏ qua';
END

-- Kiểm tra xem bảng Fees có tồn tại không
IF OBJECT_ID('dbo.Fees', 'U') IS NOT NULL
BEGIN
    PRINT N'Bảng Fees tồn tại, tiến hành tạo dữ liệu phí';
    
    -- Lấy danh sách UserID
    DECLARE @AdminID INT, @UserID1 INT, @UserID2 INT;
    
    SELECT @AdminID = id FROM Users WHERE email = 'admin@example.com';
    SELECT @UserID1 = id FROM Users WHERE email = 'nguyenvana@example.com';
    SELECT @UserID2 = id FROM Users WHERE email = 'tranthib@example.com';
    
    -- Tạo dữ liệu mẫu cho bảng Fees
    -- 1. Phí đã thanh toán cho người dùng 1
    IF NOT EXISTS (SELECT 1 FROM Fees WHERE userId = @UserID1 AND feeType = N'Phí quản lý')
    BEGIN
        INSERT INTO Fees (feeType, feeAmount, feeDescription, feeDate, feeStatus, userId, feeCreatedBy, feeUpdatedBy, deadline, createdAt, updatedAt)
        VALUES (N'Phí quản lý', 500000, N'Phí quản lý tháng 4/2024', '2024-04-01', N'đã thanh toán', @UserID1, 'admin@example.com', 'admin@example.com', DATEADD(DAY, 15, '2024-04-01'), GETDATE(), GETDATE());
        PRINT N'Đã tạo phí quản lý đã thanh toán cho nguyenvana@example.com';
    END
    
    -- 2. Phí chưa thanh toán cho người dùng 1
    IF NOT EXISTS (SELECT 1 FROM Fees WHERE userId = @UserID1 AND feeType = N'Phí dịch vụ')
    BEGIN
        INSERT INTO Fees (feeType, feeAmount, feeDescription, feeDate, feeStatus, userId, feeCreatedBy, feeUpdatedBy, deadline, createdAt, updatedAt)
        VALUES (N'Phí dịch vụ', 200000, N'Phí dịch vụ tháng 4/2024', '2024-04-10', N'chưa thanh toán', @UserID1, 'admin@example.com', 'admin@example.com', DATEADD(DAY, 15, '2024-04-10'), GETDATE(), GETDATE());
        PRINT N'Đã tạo phí dịch vụ chưa thanh toán cho nguyenvana@example.com';
    END
    
    -- 3. Phí quá hạn cho người dùng 2
    IF NOT EXISTS (SELECT 1 FROM Fees WHERE userId = @UserID2 AND feeType = N'Phí bảo trì')
    BEGIN
        INSERT INTO Fees (feeType, feeAmount, feeDescription, feeDate, feeStatus, userId, feeCreatedBy, feeUpdatedBy, deadline, isOverdue, lateFee, createdAt, updatedAt)
        VALUES (N'Phí bảo trì', 300000, N'Phí bảo trì tháng 3/2024', '2024-03-01', N'chưa thanh toán', @UserID2, 'admin@example.com', 'admin@example.com', '2024-03-15', 1, 30000, GETDATE(), GETDATE());
        PRINT N'Đã tạo phí bảo trì quá hạn cho tranthib@example.com';
    END
END
ELSE
BEGIN
    PRINT N'Bảng Fees không tồn tại, bỏ qua tạo dữ liệu phí';
END

-- Hiển thị tổng kết
PRINT N'';
PRINT N'✅ Dữ liệu test đã được tạo thành công';
PRINT N'';
PRINT N'📝 Thông tin đăng nhập:';
PRINT N'   - Email: admin@example.com, Mật khẩu: admin123456, Vai trò: admin';
PRINT N'   - Email: manager@example.com, Mật khẩu: manager123, Vai trò: manager';
PRINT N'   - Email: nguyenvana@example.com, Mật khẩu: user123456, Vai trò: user';
PRINT N'   - Email: tranthib@example.com, Mật khẩu: user123456, Vai trò: user';
GO 