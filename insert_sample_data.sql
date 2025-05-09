-- Sử dụng database Quanli
USE Quanli;
GO

-- Thêm dữ liệu mẫu vào bảng Users
INSERT INTO Users (firstName, lastName, email, password, role, createdAt, updatedAt)
VALUES
    (N'Admin', N'System', 'admin@gmail.com', '$2a$10$HAe.CSEwLTnwQUGVwGJEBeCu0ukmIBLG7K4A0CMXpWyldAVlW/87S', 'admin', GETDATE(), GETDATE()),
    (N'Admin', N'Example', 'admin@example.com', '$2a$10$HAe.CSEwLTnwQUGVwGJEBeCu0ukmIBLG7K4A0CMXpWyldAVlW/87S', 'admin', GETDATE(), GETDATE()),
    (N'Nguyễn', N'Văn A', 'nguyenvana@gmail.com', '$2a$10$HAe.CSEwLTnwQUGVwGJEBeCu0ukmIBLG7K4A0CMXpWyldAVlW/87S', 'user', GETDATE(), GETDATE()),
    (N'Trần', N'Thị B', 'tranthib@gmail.com', '$2a$10$HAe.CSEwLTnwQUGVwGJEBeCu0ukmIBLG7K4A0CMXpWyldAVlW/87S', 'user', GETDATE(), GETDATE()),
    (N'Lê', N'Văn C', 'levanc@gmail.com', '$2a$10$HAe.CSEwLTnwQUGVwGJEBeCu0ukmIBLG7K4A0CMXpWyldAVlW/87S', 'user', GETDATE(), GETDATE()),
    (N'Phạm', N'Thị D', 'phamthid@gmail.com', '$2a$10$HAe.CSEwLTnwQUGVwGJEBeCu0ukmIBLG7K4A0CMXpWyldAVlW/87S', 'user', GETDATE(), GETDATE()),
    (N'Hoàng', N'Văn E', 'hoangvane@gmail.com', '$2a$10$HAe.CSEwLTnwQUGVwGJEBeCu0ukmIBLG7K4A0CMXpWyldAVlW/87S', 'user', GETDATE(), GETDATE());
GO

-- Thêm dữ liệu mẫu vào bảng Fees
INSERT INTO Fees (feeType, feeAmount, feeDescription, feeDate, feeStatus, userId, feeCreatedBy, feeUpdatedBy, deadline, createdAt, updatedAt)
VALUES
    (N'Phí quản lý', 100000, N'Phí quản lý chung cư tháng 1/2024', '2024-01-01', N'đã thanh toán', 3, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-01-01'), GETDATE(), GETDATE()),
    (N'Phí gửi xe', 200000, N'Phí gửi xe tháng 1/2024', '2024-01-01', N'đã thanh toán', 3, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-01-01'), GETDATE(), GETDATE()),
    (N'Phí quản lý', 100000, N'Phí quản lý chung cư tháng 1/2024', '2024-01-01', N'đã thanh toán', 4, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-01-01'), GETDATE(), GETDATE()),
    (N'Phí quản lý', 100000, N'Phí quản lý chung cư tháng 2/2024', '2024-02-01', N'đã thanh toán', 3, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-02-01'), GETDATE(), GETDATE()),
    (N'Phí gửi xe', 200000, N'Phí gửi xe tháng 2/2024', '2024-02-01', N'đã thanh toán', 3, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-02-01'), GETDATE(), GETDATE()),
    (N'Phí quản lý', 100000, N'Phí quản lý chung cư tháng 2/2024', '2024-02-01', N'đã thanh toán', 4, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-02-01'), GETDATE(), GETDATE()),
    (N'Phí quản lý', 100000, N'Phí quản lý chung cư tháng 3/2024', '2024-03-01', N'đã thanh toán', 3, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-03-01'), GETDATE(), GETDATE()),
    (N'Phí gửi xe', 200000, N'Phí gửi xe tháng 3/2024', '2024-03-01', N'đã thanh toán', 3, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-03-01'), GETDATE(), GETDATE()),
    (N'Phí quản lý', 100000, N'Phí quản lý chung cư tháng 3/2024', '2024-03-01', N'chưa thanh toán', 4, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-03-01'), GETDATE(), GETDATE()),
    (N'Phí quản lý', 100000, N'Phí quản lý chung cư tháng 4/2024', '2024-04-01', N'chưa thanh toán', 3, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-04-01'), GETDATE(), GETDATE()),
    (N'Phí gửi xe', 200000, N'Phí gửi xe tháng 4/2024', '2024-04-01', N'chưa thanh toán', 3, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-04-01'), GETDATE(), GETDATE()),
    (N'Phí quản lý', 100000, N'Phí quản lý chung cư tháng 4/2024', '2024-04-01', N'chưa thanh toán', 4, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-04-01'), GETDATE(), GETDATE()),
    (N'Phí dịch vụ', 150000, N'Phí dịch vụ tháng 1/2024', '2024-01-01', N'đã thanh toán', 5, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-01-01'), GETDATE(), GETDATE()),
    (N'Phí dịch vụ', 150000, N'Phí dịch vụ tháng 2/2024', '2024-02-01', N'đã thanh toán', 5, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-02-01'), GETDATE(), GETDATE()),
    (N'Phí dịch vụ', 150000, N'Phí dịch vụ tháng 3/2024', '2024-03-01', N'chưa thanh toán', 5, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-03-01'), GETDATE(), GETDATE()),
    (N'Phí dịch vụ', 150000, N'Phí dịch vụ tháng 4/2024', '2024-04-01', N'chưa thanh toán', 5, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-04-01'), GETDATE(), GETDATE()),
    (N'Phí nước', 300000, N'Tiền nước tháng 1/2024', '2024-01-01', N'đã thanh toán', 6, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-01-01'), GETDATE(), GETDATE()),
    (N'Phí nước', 350000, N'Tiền nước tháng 2/2024', '2024-02-01', N'đã thanh toán', 6, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-02-01'), GETDATE(), GETDATE()),
    (N'Phí nước', 320000, N'Tiền nước tháng 3/2024', '2024-03-01', N'chưa thanh toán', 6, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-03-01'), GETDATE(), GETDATE()),
    (N'Phí nước', 340000, N'Tiền nước tháng 4/2024', '2024-04-01', N'chưa thanh toán', 6, N'Admin System', N'Admin System', DATEADD(DAY, 15, '2024-04-01'), GETDATE(), GETDATE());
GO

-- Cập nhật các khoản phí quá hạn
UPDATE Fees
SET 
    isOverdue = 1, 
    lateFee = feeAmount * 0.05
WHERE feeStatus = N'chưa thanh toán' AND deadline < GETDATE();
GO

-- Cập nhật thông tin số điện thoại cho một số người dùng
UPDATE Users
SET phoneNumber = '0987654321'
WHERE email = 'nguyenvana@gmail.com';

UPDATE Users
SET phoneNumber = '0912345678'
WHERE email = 'tranthib@gmail.com';

UPDATE Users
SET phoneNumber = '0909123456'
WHERE email = 'admin@gmail.com';

UPDATE Users
SET phoneNumber = '0901234567'
WHERE email = 'admin@example.com';
GO

-- Thống kê số lượng bản ghi đã thêm
SELECT 'Users' AS TableName, COUNT(*) AS NumberOfRecords FROM Users
UNION ALL
SELECT 'Fees' AS TableName, COUNT(*) AS NumberOfRecords FROM Fees;
GO 