 -- Script cải thiện bảng Canho để đảm bảo mỗi user chỉ sở hữu 1 căn hộ
-- Chạy script này trong SQL Server Management Studio

USE Quanli;
GO

-- Thêm ràng buộc UNIQUE cho cột id (user id) để đảm bảo 1 user chỉ có 1 căn hộ
-- Trước tiên kiểm tra xem constraint đã tồn tại chưa
IF NOT EXISTS (
    SELECT * FROM sys.indexes 
    WHERE object_id = OBJECT_ID('Canho') 
    AND name = 'UK_Canho_UserID'
)
BEGIN
    -- Tạo unique constraint cho user id (cho phép NULL)
    CREATE UNIQUE INDEX UK_Canho_UserID ON Canho(id) 
    WHERE id IS NOT NULL;
    
    PRINT 'Đã thêm ràng buộc UNIQUE cho user ID trong bảng Canho.';
END
ELSE
BEGIN
    PRINT 'Ràng buộc UNIQUE cho user ID đã tồn tại.';
END
GO

-- Thêm constraint check để đảm bảo dữ liệu hợp lệ
IF NOT EXISTS (
    SELECT * FROM sys.check_constraints 
    WHERE name = 'CK_Canho_Area_Positive'
)
BEGIN
    ALTER TABLE Canho ADD CONSTRAINT CK_Canho_Area_Positive 
    CHECK (Area > 0);
    
    PRINT 'Đã thêm constraint kiểm tra diện tích > 0.';
END

IF NOT EXISTS (
    SELECT * FROM sys.check_constraints 
    WHERE name = 'CK_Canho_Floors_Positive'
)
BEGIN
    ALTER TABLE Canho ADD CONSTRAINT CK_Canho_Floors_Positive 
    CHECK (Floors > 0);
    
    PRINT 'Đã thêm constraint kiểm tra số tầng > 0.';
END

-- Tạo view để dễ dàng truy vấn thông tin căn hộ kèm chủ sở hữu
IF OBJECT_ID('vw_ApartmentWithOwner', 'V') IS NOT NULL
    DROP VIEW vw_ApartmentWithOwner;
GO

CREATE VIEW vw_ApartmentWithOwner AS
SELECT 
    c.ApartmentID,
    c.Area,
    c.SaleStatus,
    c.HouseNum,
    c.Floors,
    c.BuildingName,
    c.Tech_Status,
    c.Use_Status,
    u.id as OwnerID,
    u.firstName + ' ' + u.lastName as OwnerName,
    u.email as OwnerEmail,
    u.phoneNumber as OwnerPhone,
    CASE 
        WHEN u.id IS NOT NULL THEN N'Có chủ sở hữu'
        ELSE N'Chưa có chủ sở hữu'
    END as OwnershipStatus
FROM Canho c
LEFT JOIN Users u ON c.id = u.id;
GO

PRINT 'Đã tạo view vw_ApartmentWithOwner để truy vấn thông tin căn hộ.';

-- Tạo stored procedure để thêm căn hộ mới với validation
IF OBJECT_ID('sp_CreateApartment', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateApartment;
GO

CREATE PROCEDURE sp_CreateApartment
    @ApartmentID NVARCHAR(50),
    @Area DECIMAL(10,2),
    @SaleStatus NVARCHAR(50) = N'Chưa bán',
    @HouseNum NVARCHAR(50),
    @Floors INT,
    @BuildingName NVARCHAR(50),
    @Tech_Status NVARCHAR(50) = N'Bình thường',
    @Use_Status NVARCHAR(50) = N'Không ở',
    @OwnerID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Kiểm tra apartment ID đã tồn tại
        IF EXISTS (SELECT 1 FROM Canho WHERE ApartmentID = @ApartmentID)
        BEGIN
            RAISERROR(N'Mã căn hộ đã tồn tại', 16, 1);
            RETURN;
        END
        
        -- Kiểm tra user đã có căn hộ khác
        IF @OwnerID IS NOT NULL AND EXISTS (SELECT 1 FROM Canho WHERE id = @OwnerID)
        BEGIN
            RAISERROR(N'User này đã sở hữu căn hộ khác', 16, 1);
            RETURN;
        END
        
        -- Thêm căn hộ mới
        INSERT INTO Canho (
            ApartmentID, Area, SaleStatus, HouseNum, Floors,
            BuildingName, Tech_Status, Use_Status, id
        ) VALUES (
            @ApartmentID, @Area, @SaleStatus, @HouseNum, @Floors,
            @BuildingName, @Tech_Status, @Use_Status, @OwnerID
        );
        
        PRINT 'Thêm căn hộ thành công: ' + @ApartmentID;
        
    END TRY
    BEGIN CATCH
        PRINT 'Lỗi: ' + ERROR_MESSAGE();
        THROW;
    END CATCH
END
GO

PRINT 'Đã tạo stored procedure sp_CreateApartment.';
PRINT 'Hoàn tất cải thiện bảng Canho!';