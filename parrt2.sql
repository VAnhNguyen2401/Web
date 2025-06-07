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




-- Tạo function để tính diện tích căn hộ dựa theo vị trí
CREATE OR ALTER FUNCTION fn_CalculateApartmentArea(
    @FloorNumber INT,
    @RoomNumber INT
)
RETURNS DECIMAL(8,2)
AS
BEGIN
    DECLARE @Area DECIMAL(8,2)
    
    -- Tính diện tích dựa theo loại căn hộ
    IF @RoomNumber IN (1, 10) -- Căn góc
        SET @Area = CASE 
            WHEN @FloorNumber <= 5 THEN 75.5    -- Tầng thấp: căn góc lớn hơn
            WHEN @FloorNumber <= 25 THEN 72.0   -- Tầng trung
            WHEN @FloorNumber <= 40 THEN 78.5   -- Tầng cao: view đẹp
            ELSE 85.0                           -- Tầng cao cấp: diện tích premium
        END
    ELSE IF @RoomNumber IN (5, 6) -- Căn giữa
        SET @Area = CASE 
            WHEN @FloorNumber <= 5 THEN 65.0
            WHEN @FloorNumber <= 25 THEN 68.0
            WHEN @FloorNumber <= 40 THEN 70.0
            ELSE 75.0
        END
    ELSE -- Căn thường
        SET @Area = CASE 
            WHEN @FloorNumber <= 5 THEN 55.0
            WHEN @FloorNumber <= 25 THEN 58.0
            WHEN @FloorNumber <= 40 THEN 60.0
            ELSE 65.0
        END
    
    RETURN @Area
END
GO






-- Tạo function để xác định loại căn hộ
CREATE OR ALTER FUNCTION fn_GetApartmentType(@RoomNumber INT)
RETURNS NVARCHAR(20)
AS
BEGIN
    DECLARE @ApartmentType NVARCHAR(20)
    
    SET @ApartmentType = CASE 
        WHEN @RoomNumber IN (1, 10) THEN N'Căn góc'
        WHEN @RoomNumber IN (5, 6) THEN N'Căn giữa'
        ELSE N'Căn thường'
    END
    
    RETURN @ApartmentType
END


GO





-- Stored procedure để kiểm tra căn hộ có tồn tại không
CREATE OR ALTER PROCEDURE sp_CheckApartmentExists
    @FloorNumber INT,
    @RoomNumber INT,
    @Exists BIT OUTPUT,
    @ExistingApartmentID NVARCHAR(20) OUTPUT
AS
BEGIN
    DECLARE @CheckApartmentID NVARCHAR(20)
    
    -- Tạo mã căn hộ để kiểm tra
    EXEC sp_GenerateApartmentID 1, @FloorNumber, @RoomNumber, @CheckApartmentID OUTPUT
    
    -- Kiểm tra trong database
    SELECT @ExistingApartmentID = ApartmentID 
    FROM Canho 
    WHERE ApartmentID = @CheckApartmentID 
       OR (Floors = @FloorNumber AND RIGHT(HouseNum, 2) = RIGHT('0' + CAST(@RoomNumber AS VARCHAR(2)), 2) AND BuildingName = N'Sky')
    
    IF @ExistingApartmentID IS NOT NULL
        SET @Exists = 1
    ELSE
        SET @Exists = 0
END
GO







-- Stored procedure để tạo căn hộ mới
CREATE OR ALTER PROCEDURE sp_CreateApartment
    @FloorNumber INT,
    @RoomNumber INT,
    @OwnerID INT = NULL,
    @UseStatus NVARCHAR(20) = N'Không ở',
    @Result NVARCHAR(500) OUTPUT,
    @NewApartmentID NVARCHAR(20) OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION
        
        -- Validate input
        IF @FloorNumber < 1 OR @FloorNumber > 50
        BEGIN
            SET @Result = N'Lỗi: Tầng phải từ 1 đến 50'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        IF @RoomNumber < 1 OR @RoomNumber > 10
        BEGIN
            SET @Result = N'Lỗi: Phòng phải từ 1 đến 10'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        -- Kiểm tra căn hộ đã tồn tại chưa
        DECLARE @Exists BIT, @ExistingID NVARCHAR(20)
        EXEC sp_CheckApartmentExists @FloorNumber, @RoomNumber, @Exists OUTPUT, @ExistingID OUTPUT
        
        IF @Exists = 1
        BEGIN
            SET @Result = N'Lỗi: Căn hộ tầng ' + CAST(@FloorNumber AS NVARCHAR) + N', phòng ' + CAST(@RoomNumber AS NVARCHAR) + N' đã tồn tại với mã ' + @ExistingID
            ROLLBACK TRANSACTION
            RETURN
        END
        
        -- Kiểm tra owner nếu có
        IF @OwnerID IS NOT NULL
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM Users WHERE id = @OwnerID AND role = 'user')
            BEGIN
                SET @Result = N'Lỗi: User không tồn tại hoặc không phải là user thường'
                ROLLBACK TRANSACTION
                RETURN
            END
        END
        
        -- Tạo thông tin căn hộ
        EXEC sp_GenerateApartmentID 1, @FloorNumber, @RoomNumber, @NewApartmentID OUTPUT
        
        DECLARE @Area DECIMAL(8,2) = dbo.fn_CalculateApartmentArea(@FloorNumber, @RoomNumber)
        DECLARE @HouseNum NVARCHAR(10) = RIGHT('0' + CAST(@FloorNumber AS VARCHAR(2)), 2) + RIGHT('0' + CAST(@RoomNumber AS VARCHAR(2)), 2)
        
        -- Tạo căn hộ mới
        INSERT INTO Canho (
            ApartmentID, Area, SaleStatus, HouseNum, Floors, 
            BuildingName, Tech_Status, Use_Status, id
        ) VALUES (
            @NewApartmentID, @Area, N'Chưa bán', @HouseNum, @FloorNumber,
            N'Sky', N'Bình thường', @UseStatus, @OwnerID
        )
        
        -- Tạo thông báo thành công
        DECLARE @OwnerInfo NVARCHAR(200) = N''
        IF @OwnerID IS NOT NULL
        BEGIN
            SELECT @OwnerInfo = N' và được gán cho ' + firstName + N' ' + lastName + N' (' + email + N')'
            FROM Users WHERE id = @OwnerID
        END
        
        SET @Result = N'Thành công: Đã tạo căn hộ ' + @NewApartmentID + N' (Tầng ' + CAST(@FloorNumber AS NVARCHAR) + 
                     N', Phòng ' + CAST(@RoomNumber AS NVARCHAR) + N', Diện tích: ' + CAST(@Area AS NVARCHAR) + N'm²)' + @OwnerInfo
        
        COMMIT TRANSACTION
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        SET @Result = N'Lỗi: ' + ERROR_MESSAGE()
        SET @NewApartmentID = NULL
    END CATCH
END
GO







-- Stored procedure để lấy thông tin căn hộ cho form
CREATE OR ALTER PROCEDURE sp_GetApartmentInfo
    @FloorNumber INT,
    @RoomNumber INT,
    @ApartmentID NVARCHAR(20) OUTPUT,
    @Area DECIMAL(8,2) OUTPUT,
    @ApartmentType NVARCHAR(20) OUTPUT,
    @FloorCategory NVARCHAR(20) OUTPUT,
    @HouseNum NVARCHAR(10) OUTPUT
AS
BEGIN
    -- Tạo thông tin căn hộ
    EXEC sp_GenerateApartmentID 1, @FloorNumber, @RoomNumber, @ApartmentID OUTPUT
    
    SET @Area = dbo.fn_CalculateApartmentArea(@FloorNumber, @RoomNumber)
    SET @ApartmentType = dbo.fn_GetApartmentType(@RoomNumber)
    SET @FloorCategory = dbo.fn_GetFloorCategory(@FloorNumber)
    SET @HouseNum = RIGHT('0' + CAST(@FloorNumber AS VARCHAR(2)), 2) + RIGHT('0' + CAST(@RoomNumber AS VARCHAR(2)), 2)
END
GO

-- Test các stored procedures
PRINT N'=== TESTING STORED PROCEDURES ==='

-- Test 1: Tạo mã căn hộ
DECLARE @TestID NVARCHAR(20)
EXEC sp_GenerateApartmentID 1, 5, 3, @TestID OUTPUT
PRINT N'Test 1 - Mã căn hộ tạo: ' + @TestID

-- Test 2: Tính diện tích
DECLARE @TestArea DECIMAL(8,2) = dbo.fn_CalculateApartmentArea(15, 1)
PRINT N'Test 2 - Diện tích căn góc tầng 15: ' + CAST(@TestArea AS NVARCHAR) + N'm²'

-- Test 3: Lấy thông tin căn hộ
DECLARE @InfoID NVARCHAR(20), @InfoArea DECIMAL(8,2), @InfoType NVARCHAR(20), @InfoFloor NVARCHAR(20), @InfoHouse NVARCHAR(10)
EXEC sp_GetApartmentInfo 25, 5, @InfoID OUTPUT, @InfoArea OUTPUT, @InfoType OUTPUT, @InfoFloor OUTPUT, @InfoHouse OUTPUT
PRINT N'Test 3 - Thông tin căn hộ: ' + @InfoID + N', ' + CAST(@InfoArea AS NVARCHAR) + N'm², ' + @InfoType + N', ' + @InfoFloor

PRINT N'=== TESTS COMPLETED ==='

GO








-- =====================================================
-- USER MANAGEMENT STORED PROCEDURES
-- =====================================================

-- Function để tạo Vehicle ID tự động
CREATE OR ALTER FUNCTION fn_GenerateVehicleID()
RETURNS NVARCHAR(10)
AS
BEGIN
    DECLARE @NewID NVARCHAR(10)
    DECLARE @MaxNum INT
    
    -- Lấy số lớn nhất hiện tại
    SELECT @MaxNum = ISNULL(MAX(CAST(SUBSTRING(VehicleID, 3, LEN(VehicleID)-2) AS INT)), 0)
    FROM PhuongTien 
    WHERE VehicleID LIKE 'VH%'
    
    -- Tạo ID mới
    SET @NewID = 'VH' + RIGHT('000' + CAST(@MaxNum + 1 AS VARCHAR(3)), 3)
    
    RETURN @NewID
END
GO

-- Stored procedure để tạo user mới
CREATE OR ALTER PROCEDURE sp_CreateUser
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @Email NVARCHAR(100),
    @Password NVARCHAR(255),
    @PhoneNumber NVARCHAR(20),
    @Role NVARCHAR(20) = 'user',
    @Result NVARCHAR(500) OUTPUT,
    @NewUserID INT OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION
        
        -- Validate input
        IF @FirstName IS NULL OR LTRIM(RTRIM(@FirstName)) = ''
        BEGIN
            SET @Result = N'Lỗi: Họ không được để trống'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        IF @LastName IS NULL OR LTRIM(RTRIM(@LastName)) = ''
        BEGIN
            SET @Result = N'Lỗi: Tên không được để trống'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        IF @Email IS NULL OR LTRIM(RTRIM(@Email)) = ''
        BEGIN
            SET @Result = N'Lỗi: Email không được để trống'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        -- Kiểm tra email format
        IF @Email NOT LIKE '%@%.%'
        BEGIN
            SET @Result = N'Lỗi: Email không đúng định dạng'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        -- Kiểm tra email đã tồn tại chưa
        IF EXISTS (SELECT 1 FROM Users WHERE email = @Email)
        BEGIN
            SET @Result = N'Lỗi: Email đã tồn tại trong hệ thống'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        -- Kiểm tra phone number format
        IF @PhoneNumber IS NOT NULL AND @PhoneNumber NOT LIKE '[0-9+]%'
        BEGIN
            SET @Result = N'Lỗi: Số điện thoại không đúng định dạng'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        -- Tạo user mới
        INSERT INTO Users (firstName, lastName, email, password, role, phoneNumber, createdAt, updatedAt)
        VALUES (@FirstName, @LastName, @Email, @Password, @Role, @PhoneNumber, GETDATE(), GETDATE())
        
        SET @NewUserID = SCOPE_IDENTITY()
        
        SET @Result = N'Thành công: Đã tạo user ' + @FirstName + N' ' + @LastName + N' với email ' + @Email
        
        COMMIT TRANSACTION
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        SET @Result = N'Lỗi: ' + ERROR_MESSAGE()
        SET @NewUserID = NULL
    END CATCH
END
GO






-- =====================================================
-- VEHICLE MANAGEMENT STORED PROCEDURES
-- =====================================================

-- Stored procedure để tạo phương tiện mới
CREATE OR ALTER PROCEDURE sp_CreateVehicle
    @VehicleType NVARCHAR(50),
    @LicensePlate NVARCHAR(20),
    @Brand NVARCHAR(50) = NULL,
    @ApartmentID NVARCHAR(20),
    @Result NVARCHAR(500) OUTPUT,
    @NewVehicleID NVARCHAR(10) OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION
        
        -- Validate input
        IF @VehicleType IS NULL OR LTRIM(RTRIM(@VehicleType)) = ''
        BEGIN
            SET @Result = N'Lỗi: Loại phương tiện không được để trống'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        IF @LicensePlate IS NULL OR LTRIM(RTRIM(@LicensePlate)) = ''
        BEGIN
            SET @Result = N'Lỗi: Biển số không được để trống'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        IF @ApartmentID IS NULL OR LTRIM(RTRIM(@ApartmentID)) = ''
        BEGIN
            SET @Result = N'Lỗi: Mã căn hộ không được để trống'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        -- Kiểm tra biển số đã tồn tại chưa
        IF EXISTS (SELECT 1 FROM PhuongTien WHERE LicensePlate = @LicensePlate)
        BEGIN
            SET @Result = N'Lỗi: Biển số ' + @LicensePlate + N' đã tồn tại trong hệ thống'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        -- Kiểm tra căn hộ có tồn tại không
        IF NOT EXISTS (SELECT 1 FROM Canho WHERE ApartmentID = @ApartmentID)
        BEGIN
            SET @Result = N'Lỗi: Căn hộ ' + @ApartmentID + N' không tồn tại'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        -- Tạo VehicleID mới
        SET @NewVehicleID = dbo.fn_GenerateVehicleID()
        
        -- Tạo phương tiện mới
        INSERT INTO PhuongTien (VehicleID, VehicleType, LicensePlate, Brand, ApartmentID)
        VALUES (@NewVehicleID, @VehicleType, @LicensePlate, @Brand, @ApartmentID)
        
        -- Lấy thông tin căn hộ để hiển thị
        DECLARE @ApartmentInfo NVARCHAR(100) = ''
        SELECT @ApartmentInfo = N' thuộc căn hộ ' + @ApartmentID + N' (Tầng ' + CAST(Floors AS NVARCHAR) + N')'
        FROM Canho WHERE ApartmentID = @ApartmentID
        
        SET @Result = N'Thành công: Đã tạo phương tiện ' + @NewVehicleID + N' (' + @VehicleType + N' - ' + @LicensePlate + N')' + @ApartmentInfo
        
        COMMIT TRANSACTION
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        SET @Result = N'Lỗi: ' + ERROR_MESSAGE()
        SET @NewVehicleID = NULL
    END CATCH
END
GO

-- Stored procedure để cập nhật phương tiện
CREATE OR ALTER PROCEDURE sp_UpdateVehicle
    @VehicleID NVARCHAR(10),
    @VehicleType NVARCHAR(50),
    @LicensePlate NVARCHAR(20),
    @Brand NVARCHAR(50) = NULL,
    @ApartmentID NVARCHAR(20),
    @Result NVARCHAR(500) OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION
        
        -- Kiểm tra phương tiện có tồn tại không
        IF NOT EXISTS (SELECT 1 FROM PhuongTien WHERE VehicleID = @VehicleID)
        BEGIN
            SET @Result = N'Lỗi: Phương tiện không tồn tại'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        -- Kiểm tra biển số trùng (trừ chính nó)
        IF EXISTS (SELECT 1 FROM PhuongTien WHERE LicensePlate = @LicensePlate AND VehicleID != @VehicleID)
        BEGIN
            SET @Result = N'Lỗi: Biển số ' + @LicensePlate + N' đã được sử dụng'
            ROLLBACK TRANSACTION
            RETURN
        END
        
        -- Cập nhật phương tiện
        UPDATE PhuongTien 
        SET VehicleType = @VehicleType,
            LicensePlate = @LicensePlate,
            Brand = @Brand,
            ApartmentID = @ApartmentID
        WHERE VehicleID = @VehicleID
        
        SET @Result = N'Thành công: Đã cập nhật phương tiện ' + @VehicleID
        
        COMMIT TRANSACTION
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        SET @Result = N'Lỗi: ' + ERROR_MESSAGE()
    END CATCH
END
GO






-- =====================================================
-- FEE MANAGEMENT STORED PROCEDURES
-- =====================================================

-- Function để tính phí dịch vụ theo diện tích
CREATE OR ALTER FUNCTION fn_CalculateServiceFee(@Area DECIMAL(8,2))
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @ServiceFee DECIMAL(10,2)
    
    -- Phí dịch vụ = Diện tích × 16,500 VNĐ/m²
    SET @ServiceFee = @Area * 16500
    
    RETURN @ServiceFee
END
GO

-- Function để tính phí gửi xe
CREATE OR ALTER FUNCTION fn_CalculateVehicleFee(@ApartmentID NVARCHAR(20))
RETURNS DECIMAL(10,2)
AS
BEGIN
    DECLARE @TotalFee DECIMAL(10,2) = 0
    DECLARE @MotorcycleCount INT = 0
    DECLARE @CarCount INT = 0
    
    -- Đếm số lượng xe máy và ô tô
    SELECT 
        @MotorcycleCount = SUM(CASE WHEN VehicleType = N'Xe máy' THEN 1 ELSE 0 END),
        @CarCount = SUM(CASE WHEN VehicleType = N'Ô tô' THEN 1 ELSE 0 END)
    FROM PhuongTien 
    WHERE ApartmentID = @ApartmentID
    
    -- Tính phí: Xe máy 50k/chiếc, Ô tô 200k/chiếc
    SET @TotalFee = (@MotorcycleCount * 50000) + (@CarCount * 200000)
    
    RETURN @TotalFee
END
GO

-- Stored procedure để tạo phí dịch vụ cho tất cả căn hộ
CREATE OR ALTER PROCEDURE sp_CreateServiceFeeForAll
    @CreatedBy NVARCHAR(100),
    @Result NVARCHAR(500) OUTPUT,
    @TotalCreated INT OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION
        
        SET @TotalCreated = 0
        
        -- Lấy danh sách tất cả căn hộ có chủ sở hữu
        DECLARE apartment_cursor CURSOR FOR
        SELECT c.ApartmentID, c.Area, c.id as UserId, u.firstName + ' ' + u.lastName as UserName
        FROM Canho c
        INNER JOIN Users u ON c.id = u.id
        WHERE c.id IS NOT NULL
        
        DECLARE @ApartmentID NVARCHAR(20), @Area DECIMAL(8,2), @UserId INT, @UserName NVARCHAR(100)
        DECLARE @ServiceFee DECIMAL(10,2), @Description NVARCHAR(500)
        
        OPEN apartment_cursor
        FETCH NEXT FROM apartment_cursor INTO @ApartmentID, @Area, @UserId, @UserName
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Tính phí dịch vụ
            SET @ServiceFee = dbo.fn_CalculateServiceFee(@Area)
            
            -- Tạo mô tả
            SET @Description = N'Phí dịch vụ tháng ' + CAST(MONTH(GETDATE()) AS NVARCHAR) + N'/' + CAST(YEAR(GETDATE()) AS NVARCHAR) + 
                              N' - Căn hộ ' + @ApartmentID + N' (' + CAST(@Area AS NVARCHAR) + N'm² × 16,500 VNĐ/m²)'
            
            -- Tạo khoản thu
            INSERT INTO Fees (
                feeType, feeAmount, feeDescription, feeStatus, 
                userId, feeCreatedBy, feeUpdatedBy, feeDate,
                feeCreatedAt, feeUpdatedAt, deadline, lateFee, isOverdue
            ) VALUES (
                N'Phí dịch vụ', @ServiceFee, @Description, N'chưa thanh toán',
                @UserId, @CreatedBy, @CreatedBy, GETDATE(),
                GETDATE(), GETDATE(), DATEADD(day, 15, GETDATE()), 0, 0
            )
            
            SET @TotalCreated = @TotalCreated + 1
            
            FETCH NEXT FROM apartment_cursor INTO @ApartmentID, @Area, @UserId, @UserName
        END
        
        CLOSE apartment_cursor
        DEALLOCATE apartment_cursor
        
        SET @Result = N'Thành công: Đã tạo phí dịch vụ cho ' + CAST(@TotalCreated AS NVARCHAR) + N' căn hộ'
        
        COMMIT TRANSACTION
        
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('global', 'apartment_cursor') >= 0
        BEGIN
            CLOSE apartment_cursor
            DEALLOCATE apartment_cursor
        END
        
        ROLLBACK TRANSACTION
        SET @Result = N'Lỗi: ' + ERROR_MESSAGE()
        SET @TotalCreated = 0
    END CATCH
END
GO

-- Stored procedure để tạo phí gửi xe cho tất cả căn hộ có xe
CREATE OR ALTER PROCEDURE sp_CreateVehicleFeeForAll
    @CreatedBy NVARCHAR(100),
    @Result NVARCHAR(500) OUTPUT,
    @TotalCreated INT OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION
        
        SET @TotalCreated = 0
        
        -- Lấy danh sách căn hộ có xe
        DECLARE vehicle_cursor CURSOR FOR
        SELECT DISTINCT c.ApartmentID, c.id as UserId, u.firstName + ' ' + u.lastName as UserName
        FROM Canho c
        INNER JOIN Users u ON c.id = u.id
        INNER JOIN PhuongTien p ON c.ApartmentID = p.ApartmentID
        WHERE c.id IS NOT NULL
        
        DECLARE @ApartmentID NVARCHAR(20), @UserId INT, @UserName NVARCHAR(100)
        DECLARE @VehicleFee DECIMAL(10,2), @Description NVARCHAR(500)
        DECLARE @MotorcycleCount INT, @CarCount INT
        
        OPEN vehicle_cursor
        FETCH NEXT FROM vehicle_cursor INTO @ApartmentID, @UserId, @UserName
        
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Tính phí gửi xe
            SET @VehicleFee = dbo.fn_CalculateVehicleFee(@ApartmentID)
            
            -- Đếm số xe để tạo mô tả
            SELECT 
                @MotorcycleCount = SUM(CASE WHEN VehicleType = N'Xe máy' THEN 1 ELSE 0 END),
                @CarCount = SUM(CASE WHEN VehicleType = N'Ô tô' THEN 1 ELSE 0 END)
            FROM PhuongTien 
            WHERE ApartmentID = @ApartmentID
            
            -- Tạo mô tả
            SET @Description = N'Phí gửi xe tháng ' + CAST(MONTH(GETDATE()) AS NVARCHAR) + N'/' + CAST(YEAR(GETDATE()) AS NVARCHAR) + 
                              N' - Căn hộ ' + @ApartmentID + N' (' + CAST(@MotorcycleCount AS NVARCHAR) + N' xe máy, ' + 
                              CAST(@CarCount AS NVARCHAR) + N' ô tô)'
            
            -- Tạo khoản thu
            INSERT INTO Fees (
                feeType, feeAmount, feeDescription, feeStatus, 
                userId, feeCreatedBy, feeUpdatedBy, feeDate,
                feeCreatedAt, feeUpdatedAt, deadline, lateFee, isOverdue
            ) VALUES (
                N'Phí gửi xe', @VehicleFee, @Description, N'chưa thanh toán',
                @UserId, @CreatedBy, @CreatedBy, GETDATE(),
                GETDATE(), GETDATE(), DATEADD(day, 15, GETDATE()), 0, 0
            )
            
            SET @TotalCreated = @TotalCreated + 1
            
            FETCH NEXT FROM vehicle_cursor INTO @ApartmentID, @UserId, @UserName
        END
        
        CLOSE vehicle_cursor
        DEALLOCATE vehicle_cursor
        
        SET @Result = N'Thành công: Đã tạo phí gửi xe cho ' + CAST(@TotalCreated AS NVARCHAR) + N' căn hộ có xe'
        
        COMMIT TRANSACTION
        
    END TRY
    BEGIN CATCH
        IF CURSOR_STATUS('global', 'vehicle_cursor') >= 0
        BEGIN
            CLOSE vehicle_cursor
            DEALLOCATE vehicle_cursor
        END
        
        ROLLBACK TRANSACTION
        SET @Result = N'Lỗi: ' + ERROR_MESSAGE()
        SET @TotalCreated = 0
    END CATCH
END
GO

-- Stored procedure để tạo phí internet cho tất cả căn hộ
CREATE OR ALTER PROCEDURE sp_CreateInternetFeeForAll
    @CreatedBy NVARCHAR(100),
    @InternetFee DECIMAL(10,2) = 150000,
    @Result NVARCHAR(500) OUTPUT,
    @TotalCreated INT OUTPUT
AS
BEGIN
    BEGIN TRY
        BEGIN TRANSACTION
        
        SET @TotalCreated = 0
        
        -- Tạo phí internet cho tất cả căn hộ có chủ sở hữu
        INSERT INTO Fees (
            feeType, feeAmount, feeDescription, feeStatus, 
            userId, feeCreatedBy, feeUpdatedBy, feeDate,
            feeCreatedAt, feeUpdatedAt, deadline, lateFee, isOverdue
        )
        SELECT 
            N'Phí internet',
            @InternetFee,
            N'Phí internet tháng ' + CAST(MONTH(GETDATE()) AS NVARCHAR) + N'/' + CAST(YEAR(GETDATE()) AS NVARCHAR) + 
            N' - Căn hộ ' + c.ApartmentID,
            N'chưa thanh toán',
            c.id,
            @CreatedBy,
            @CreatedBy,
            GETDATE(),
            GETDATE(),
            GETDATE(),
            DATEADD(day, 15, GETDATE()),
            0,
            0
        FROM Canho c
        INNER JOIN Users u ON c.id = u.id
        WHERE c.id IS NOT NULL
        
        SET @TotalCreated = @@ROWCOUNT
        
        SET @Result = N'Thành công: Đã tạo phí internet cho ' + CAST(@TotalCreated AS NVARCHAR) + N' căn hộ'
        
        COMMIT TRANSACTION
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION
        SET @Result = N'Lỗi: ' + ERROR_MESSAGE()
        SET @TotalCreated = 0
    END CATCH
END
GO

-- Test các stored procedures
PRINT N'=== TESTING NEW STORED PROCEDURES ==='

-- Test 1: Tạo VehicleID
DECLARE @TestVehicleID NVARCHAR(10) = dbo.fn_GenerateVehicleID()
PRINT N'Test 1 - Vehicle ID mới: ' + @TestVehicleID

-- Test 2: Tính phí dịch vụ
DECLARE @TestServiceFee DECIMAL(10,2) = dbo.fn_CalculateServiceFee(65.5)
PRINT N'Test 2 - Phí dịch vụ cho 65.5m²: ' + CAST(@TestServiceFee AS NVARCHAR) + N' VNĐ'

-- Test 3: Tính phí gửi xe (giả sử căn hộ SK-T01-P01 có xe)
DECLARE @TestVehicleFee DECIMAL(10,2) = dbo.fn_CalculateVehicleFee('SK-T01-P01')
PRINT N'Test 3 - Phí gửi xe căn hộ SK-T01-P01: ' + CAST(@TestVehicleFee AS NVARCHAR) + N' VNĐ'

PRINT N'=== TESTS COMPLETED ==='
