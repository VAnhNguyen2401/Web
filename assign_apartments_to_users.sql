-- Script gán căn hộ cho người dùng để test phí dịch vụ
USE Quanli;
GO

PRINT N'Bắt đầu gán căn hộ cho người dùng...';

-- Kiểm tra và gán căn hộ cho Nguyễn Văn A
DECLARE @UserAID INT;
SELECT @UserAID = id FROM Users WHERE email = 'nguyenvana@example.com';

IF @UserAID IS NOT NULL
BEGIN
    -- Kiểm tra xem có căn hộ A101 không và gán cho user
    IF EXISTS (SELECT 1 FROM Canho WHERE ApartmentID = 'A101')
    BEGIN
        UPDATE Canho SET id = @UserAID, Use_Status = N'Đang ở' WHERE ApartmentID = 'A101';
        PRINT N'Đã gán căn hộ A101 cho Nguyễn Văn A';
    END
    ELSE
    BEGIN
        -- Tạo căn hộ A101 nếu chưa có
        INSERT INTO Canho (ApartmentID, Floor, Area, Use_Status, id)
        VALUES ('A101', 1, 65.5, N'Đang ở', @UserAID);
        PRINT N'Đã tạo và gán căn hộ A101 (65.5m²) cho Nguyễn Văn A';
    END
END

-- Kiểm tra và gán căn hộ cho Trần Thị B  
DECLARE @UserBID INT;
SELECT @UserBID = id FROM Users WHERE email = 'tranthib@example.com';

IF @UserBID IS NOT NULL
BEGIN
    -- Kiểm tra xem có căn hộ B205 không và gán cho user
    IF EXISTS (SELECT 1 FROM Canho WHERE ApartmentID = 'B205')
    BEGIN
        UPDATE Canho SET id = @UserBID, Use_Status = N'Đang ở' WHERE ApartmentID = 'B205';
        PRINT N'Đã gán căn hộ B205 cho Trần Thị B';
    END
    ELSE
    BEGIN
        -- Tạo căn hộ B205 nếu chưa có
        INSERT INTO Canho (ApartmentID, Floor, Area, Use_Status, id)
        VALUES ('B205', 2, 78.0, N'Đang ở', @UserBID);
        PRINT N'Đã tạo và gán căn hộ B205 (78.0m²) cho Trần Thị B';
    END
END

-- Hiển thị kết quả
PRINT N'';
PRINT N'=== KẾT QUẢ GIÁN CĂN HỘ ===';
SELECT 
    u.id as UserID,
    u.firstName + N' ' + u.lastName as FullName,
    u.email,
    c.ApartmentID,
    c.Area,
    c.Use_Status,
    (c.Area * 16500) as ServiceFee
FROM Users u
LEFT JOIN Canho c ON u.id = c.id
WHERE u.role = 'user'
ORDER BY u.id;

PRINT N'';
PRINT N'✅ Hoàn tất gán căn hộ cho người dùng test!';
PRINT N'Bây giờ có thể test phí dịch vụ với giá 16,500 VNĐ/m²';
GO 