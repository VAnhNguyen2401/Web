-- Sử dụng database Quanli
USE Quanli;
GO

-- Kiểm tra và tạo tài khoản admin@example.com nếu chưa tồn tại
IF NOT EXISTS (SELECT 1 FROM Users WHERE email = 'admin@example.com')
BEGIN
    INSERT INTO Users (firstName, lastName, email, password, role, createdAt, updatedAt)
    VALUES (N'Admin', N'Example', 'admin@example.com', 
           -- Mật khẩu: 123456
           '$2a$10$TDGwpG5SnCnEKGqdD1WnuOH7dUVLD2bQxKGy9RznyfUP9.QNnHoWS', 
           'admin', GETDATE(), GETDATE());
    
    PRINT 'Tài khoản admin@example.com đã được tạo thành công!';
END
ELSE
BEGIN
    UPDATE Users
    SET password = '$2a$10$TDGwpG5SnCnEKGqdD1WnuOH7dUVLD2bQxKGy9RznyfUP9.QNnHoWS' -- Mật khẩu: 123456
    WHERE email = 'admin@example.com';
    
    PRINT 'Đã cập nhật mật khẩu cho admin@example.com!';
END

-- Cập nhật mật khẩu cho tài khoản admin@gmail.com
IF EXISTS (SELECT 1 FROM Users WHERE email = 'admin@gmail.com')
BEGIN
    UPDATE Users
    SET password = '$2a$10$TDGwpG5SnCnEKGqdD1WnuOH7dUVLD2bQxKGy9RznyfUP9.QNnHoWS' -- Mật khẩu: 123456
    WHERE email = 'admin@gmail.com';
    
    PRINT 'Đã cập nhật mật khẩu cho admin@gmail.com!';
END

-- Kiểm tra các tài khoản admin trong hệ thống
SELECT id, firstName, lastName, email, role, phoneNumber 
FROM Users 
WHERE role = 'admin';
GO 