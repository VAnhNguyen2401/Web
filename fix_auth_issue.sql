-- Sử dụng database Quanli
USE Quanli;
GO

-- Chuỗi mật khẩu '123456' đã được hash bằng bcrypt với muối (salt) khác nhau
-- Cập nhật mật khẩu cho admin@example.com
IF EXISTS (SELECT 1 FROM Users WHERE email = 'admin@example.com')
BEGIN
    UPDATE Users 
    SET password = '$2a$10$RZG5adVbgQHEkBWZ0dLNr.PrDFsiDvOz4MmjI9epOPxKAsp6Yi87e',
        phoneNumber = COALESCE(phoneNumber, '0901234567')
    WHERE email = 'admin@example.com';
    PRINT 'Đã cập nhật mật khẩu cho admin@example.com';
END
ELSE
BEGIN
    INSERT INTO Users (firstName, lastName, email, password, role, phoneNumber, createdAt, updatedAt)
    VALUES (N'Admin', N'Example', 'admin@example.com', 
        '$2a$10$RZG5adVbgQHEkBWZ0dLNr.PrDFsiDvOz4MmjI9epOPxKAsp6Yi87e',
        'admin', '0901234567', GETDATE(), GETDATE());
    PRINT 'Đã tạo tài khoản admin@example.com';
END

-- Cập nhật mật khẩu cho admin@gmail.com nếu tồn tại
IF EXISTS (SELECT 1 FROM Users WHERE email = 'admin@gmail.com')
BEGIN
    UPDATE Users 
    SET password = '$2a$10$RZG5adVbgQHEkBWZ0dLNr.PrDFsiDvOz4MmjI9epOPxKAsp6Yi87e',
        phoneNumber = COALESCE(phoneNumber, '0909123456')
    WHERE email = 'admin@gmail.com';
    PRINT 'Đã cập nhật mật khẩu cho admin@gmail.com';
END
ELSE
BEGIN
    INSERT INTO Users (firstName, lastName, email, password, role, phoneNumber, createdAt, updatedAt)
    VALUES (N'Admin', N'System', 'admin@gmail.com', 
        '$2a$10$RZG5adVbgQHEkBWZ0dLNr.PrDFsiDvOz4MmjI9epOPxKAsp6Yi87e',
        'admin', '0909123456', GETDATE(), GETDATE());
    PRINT 'Đã tạo tài khoản admin@gmail.com';
END

-- Xóa tất cả các bản ghi hiện có trong bảng Fees
-- Chúng ta cần xóa dữ liệu này trước khi xóa users để tránh lỗi khóa ngoại
TRUNCATE TABLE Fees;
PRINT 'Đã xóa tất cả dữ liệu phí để tránh lỗi khóa ngoại';

-- Xóa tất cả người dùng khác (không phải admin)
DELETE FROM Users WHERE role != 'admin';
PRINT 'Đã xóa tất cả người dùng không phải admin';

-- Tạo lại một số người dùng thử nghiệm với mật khẩu mới
INSERT INTO Users (firstName, lastName, email, password, role, phoneNumber, createdAt, updatedAt)
VALUES 
    (N'Nguyễn', N'Văn A', 'nguyenvana@gmail.com', 
        '$2a$10$RZG5adVbgQHEkBWZ0dLNr.PrDFsiDvOz4MmjI9epOPxKAsp6Yi87e',
        'user', '0987654321', GETDATE(), GETDATE()),
    (N'Trần', N'Thị B', 'tranthib@gmail.com', 
        '$2a$10$RZG5adVbgQHEkBWZ0dLNr.PrDFsiDvOz4MmjI9epOPxKAsp6Yi87e',
        'user', '0912345678', GETDATE(), GETDATE());
PRINT 'Đã tạo 2 tài khoản người dùng test';

-- Hiển thị tất cả người dùng hiện có trong hệ thống
SELECT id, firstName, lastName, email, role, phoneNumber, SUBSTRING(password, 1, 20) + '...' AS passwordPreview 
FROM Users
ORDER BY role DESC, id ASC;
GO 