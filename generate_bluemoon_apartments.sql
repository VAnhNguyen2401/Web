-- Script tạo tự động tất cả căn hộ cho tòa Blue Moon
-- 50 tầng x 10 phòng = 500 căn hộ
-- Chạy script này sau khi đã tạo bảng Canho

USE Quanli;
GO

-- Xóa dữ liệu cũ nếu có (chỉ của tòa Blue Moon)
DELETE FROM Canho WHERE BuildingName = N'Blue Moon';
GO

PRINT 'Bắt đầu tạo 500 căn hộ cho tòa Blue Moon...';

-- Khai báo biến
DECLARE @Floor INT = 1;
DECLARE @Room INT = 1;
DECLARE @ApartmentID NVARCHAR(50);
DECLARE @HouseNum NVARCHAR(50);
DECLARE @Area DECIMAL(10,2);
DECLARE @Count INT = 0;

-- Vòng lặp tạo căn hộ
WHILE @Floor <= 50
BEGIN
    SET @Room = 1;
    
    WHILE @Room <= 10
    BEGIN
        -- Tạo mã căn hộ: BM-T01-P01 (Blue Moon - Tầng 01 - Phòng 01)
        SET @ApartmentID = 'BM-T' + FORMAT(@Floor, '00') + '-P' + FORMAT(@Room, '00');
        
        -- Tạo số phòng: 0101, 0102, ..., 5010
        SET @HouseNum = FORMAT(@Floor, '00') + FORMAT(@Room, '00');
        
        -- Diện tích ngẫu nhiên từ 45-120m² tùy vào vị trí
        SET @Area = CASE 
            WHEN @Room IN (1, 10) THEN 85.5 + (@Floor * 0.1) -- Căn góc lớn hơn
            WHEN @Room IN (5, 6) THEN 65.0 + (@Floor * 0.1)   -- Căn giữa trung bình
            ELSE 55.5 + (@Floor * 0.1)                        -- Căn thường
        END;
        
        -- Thêm căn hộ vào database
        INSERT INTO Canho (
            ApartmentID, 
            Area, 
            SaleStatus, 
            HouseNum, 
            Floors, 
            BuildingName, 
            Tech_Status, 
            Use_Status, 
            id
        ) VALUES (
            @ApartmentID,
            @Area,
            N'Chưa bán',
            @HouseNum,
            @Floor,
            N'Blue Moon',
            N'Bình thường',
            N'Không ở',
            NULL -- Chưa có chủ sở hữu
        );
        
        SET @Count = @Count + 1;
        SET @Room = @Room + 1;
    END
    
    -- In tiến trình mỗi 10 tầng
    IF @Floor % 10 = 0
    BEGIN
        PRINT 'Đã tạo xong tầng ' + CAST(@Floor AS NVARCHAR(10)) + ' (' + CAST(@Count AS NVARCHAR(10)) + ' căn hộ)';
    END
    
    SET @Floor = @Floor + 1;
END

PRINT 'Hoàn thành! Đã tạo ' + CAST(@Count AS NVARCHAR(10)) + ' căn hộ cho tòa Blue Moon.';

-- Thống kê sau khi tạo
SELECT 
    BuildingName,
    COUNT(*) as TotalApartments,
    MIN(Area) as MinArea,
    MAX(Area) as MaxArea,
    AVG(Area) as AvgArea
FROM Canho 
WHERE BuildingName = N'Blue Moon'
GROUP BY BuildingName;

-- Hiển thị mẫu một số căn hộ
PRINT 'Một số căn hộ mẫu:';
SELECT TOP 20 
    ApartmentID,
    HouseNum,
    Floors,
    Area,
    SaleStatus,
    Use_Status
FROM Canho 
WHERE BuildingName = N'Blue Moon'
ORDER BY Floors, HouseNum;

GO

-- Tạo view đặc biệt cho tòa Blue Moon
IF OBJECT_ID('vw_BlueMoonApartments', 'V') IS NOT NULL
    DROP VIEW vw_BlueMoonApartments;
GO

CREATE VIEW vw_BlueMoonApartments AS
SELECT 
    ApartmentID,
    HouseNum,
    Floors,
    CASE 
        WHEN RIGHT(HouseNum, 2) IN ('01', '10') THEN N'Căn góc'
        WHEN RIGHT(HouseNum, 2) IN ('05', '06') THEN N'Căn giữa'
        ELSE N'Căn thường'
    END as ApartmentType,
    Area,
    SaleStatus,
    Tech_Status,
    Use_Status,
    u.firstName + ' ' + u.lastName as OwnerName,
    u.email as OwnerEmail,
    CASE 
        WHEN u.id IS NOT NULL THEN N'Đã có chủ'
        ELSE N'Trống'
    END as OwnershipStatus,
    CASE 
        WHEN Floors <= 5 THEN N'Tầng thấp'
        WHEN Floors <= 25 THEN N'Tầng trung'
        WHEN Floors <= 40 THEN N'Tầng cao'
        ELSE N'Tầng cao cấp'
    END as FloorCategory
FROM Canho c
LEFT JOIN Users u ON c.id = u.id
WHERE c.BuildingName = N'Blue Moon';
GO

PRINT 'Đã tạo view vw_BlueMoonApartments để truy vấn dễ dàng.';

-- Tạo stored procedure tìm căn hộ trống theo tầng
IF OBJECT_ID('sp_FindAvailableApartmentsByFloor', 'P') IS NOT NULL
    DROP PROCEDURE sp_FindAvailableApartmentsByFloor;
GO

CREATE PROCEDURE sp_FindAvailableApartmentsByFloor
    @FromFloor INT = 1,
    @ToFloor INT = 50,
    @ApartmentType NVARCHAR(20) = NULL -- 'Căn góc', 'Căn giữa', 'Căn thường'
AS
BEGIN
    SELECT 
        ApartmentID,
        HouseNum,
        Floors,
        ApartmentType,
        Area,
        FloorCategory
    FROM vw_BlueMoonApartments
    WHERE Floors BETWEEN @FromFloor AND @ToFloor
        AND OwnershipStatus = N'Trống'
        AND (@ApartmentType IS NULL OR ApartmentType = @ApartmentType)
    ORDER BY Floors, HouseNum;
END
GO

PRINT 'Đã tạo stored procedure sp_FindAvailableApartmentsByFloor.';
PRINT '=== HOÀN THÀNH THIẾT LẬP TÒA BLUE MOON ===';

-- Ví dụ sử dụng:
-- EXEC sp_FindAvailableApartmentsByFloor @FromFloor = 1, @ToFloor = 10, @ApartmentType = N'Căn góc'; 