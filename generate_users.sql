USE Quanli;
GO

-- Tạo stored procedure để sinh mã căn hộ
CREATE OR ALTER PROCEDURE sp_GenerateApartmentID
    @TowerNumber INT,
    @FloorNumber INT,
    @ApartmentNumber INT,
    @ApartmentID NVARCHAR(20) OUTPUT
AS
BEGIN
    -- Format: SK-Txx-Pyy where:
    -- SK: Sky (prefix)
    -- xx: Số tòa (01-99)
    -- yy: Số căn hộ (01-99)
    SET @ApartmentID = 'SK-T' + 
        RIGHT('0' + CAST(@TowerNumber AS VARCHAR(2)), 2) + '-P' + 
        RIGHT('0' + CAST(@ApartmentNumber AS VARCHAR(2)), 2)
END
GO

-- Ví dụ sử dụng:
DECLARE @NewID NVARCHAR(20)
EXEC sp_GenerateApartmentID 1, 1, 1, @NewID OUTPUT
PRINT N'Mã căn hộ mới: ' + @NewID -- Kết quả: SK-T01-P01

GO
