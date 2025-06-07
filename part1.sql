-- =============================================
-- STORED PROCEDURES, VIEWS & TRIGGERS
-- Replacing all raw SQL queries in JavaScript
-- =============================================

USE Quanli;
GO

-- =============================================
-- VIEWS - For complex queries used multiple times
-- =============================================

-- View: All apartments with owner info
CREATE VIEW vw_ApartmentsWithOwners AS
SELECT 
    c.ApartmentID,
    c.Area,
    c.SaleStatus,
    c.HouseNum,
    c.Floors,
    c.BuildingName,
    c.Tech_Status,
    c.Use_Status,
    c.id as OwnerID,
    CASE 
        WHEN c.id IS NOT NULL THEN N'Đã có chủ'
        ELSE N'Còn trống'
    END as OwnershipStatus,
    CASE 
        WHEN u.firstName IS NOT NULL THEN u.firstName + ' ' + u.lastName
        ELSE NULL
    END as OwnerName,
    u.email as OwnerEmail,
    CASE 
        WHEN RIGHT(c.HouseNum, 2) IN ('01', '10') THEN N'Căn góc'
        WHEN RIGHT(c.HouseNum, 2) IN ('05', '06') THEN N'Căn giữa'
        ELSE N'Căn thường'
    END as ApartmentType,
    CASE 
        WHEN c.Floors <= 5 THEN N'Tầng thấp'
        WHEN c.Floors <= 15 THEN N'Tầng trung'
        WHEN c.Floors <= 25 THEN N'Tầng cao'
        ELSE N'Tầng cao cấp'
    END as FloorCategory
FROM Canho c
LEFT JOIN Users u ON c.id = u.id;
GO





-- View: Users with apartment details
IF OBJECT_ID('vw_UsersWithApartments', 'V') IS NOT NULL
    DROP VIEW vw_UsersWithApartments;
GO

CREATE VIEW vw_UsersWithApartments AS
SELECT 
    u.id, u.firstName, u.lastName, u.email, u.role, u.phoneNumber,
    u.createdAt, u.updatedAt,
    c.ApartmentID, c.Area, c.Use_Status,
    COUNT(c.ApartmentID) OVER (PARTITION BY u.id) as apartmentCount
FROM Users u
LEFT JOIN Canho c ON u.id = c.id;
GO

-- View: Users with fees
IF OBJECT_ID('vw_UsersWithFees', 'V') IS NOT NULL
    DROP VIEW vw_UsersWithFees;
GO

CREATE VIEW vw_UsersWithFees AS
SELECT 
    u.id, u.firstName, u.lastName, u.email, u.role, u.phoneNumber,
    u.createdAt, u.updatedAt,
    c.ApartmentID, c.Area, c.Use_Status,
    f.id as feeId, f.feeType, f.feeAmount, f.feeDescription, 
    f.feeStatus, f.feeCreatedAt
FROM Users u
LEFT JOIN Canho c ON u.id = c.id
LEFT JOIN Fees f ON u.id = f.userId
WHERE u.role != 'admin';
GO

-- View: Vehicle management info
IF OBJECT_ID('vw_VehicleManagement', 'V') IS NOT NULL
    DROP VIEW vw_VehicleManagement;
GO

CREATE VIEW vw_VehicleManagement AS
SELECT 
    p.VehicleID,
    p.VehicleType,
    p.LicensePlate,
    p.Brand,
    p.ApartmentID,
    c.Area as ApartmentArea,
    u.firstName + ' ' + u.lastName as OwnerName,
    u.email as OwnerEmail,
    u.id as OwnerID
FROM PhuongTien p
INNER JOIN Canho c ON p.ApartmentID = c.ApartmentID
LEFT JOIN Users u ON c.id = u.id;
GO

-- View: Apartment statistics
IF OBJECT_ID('vw_ApartmentStats', 'V') IS NOT NULL
    DROP VIEW vw_ApartmentStats;
GO

-- Create fixed view without building filter
CREATE VIEW vw_ApartmentStats AS
SELECT 
    COUNT(*) as totalApartments,
    SUM(CASE WHEN c.id IS NOT NULL THEN 1 ELSE 0 END) as ownedApartments,
    SUM(CASE WHEN c.id IS NULL THEN 1 ELSE 0 END) as availableApartments,
    SUM(CASE WHEN Use_Status = N'Đang ở' THEN 1 ELSE 0 END) as occupiedApartments,
    SUM(CASE WHEN Use_Status = N'Đang sử dụng' THEN 1 ELSE 0 END) as inUseApartments,
    SUM(CASE WHEN RIGHT(HouseNum, 2) IN ('01', '10') THEN 1 ELSE 0 END) as totalCornerApartments,
    SUM(CASE WHEN RIGHT(HouseNum, 2) IN ('05', '06') THEN 1 ELSE 0 END) as totalMiddleApartments,
    CAST(AVG(Area) as DECIMAL(8,2)) as avgArea,
    MIN(Area) as minArea,
    MAX(Area) as maxArea
FROM Canho c;
GO

-- =============================================
-- STORED PROCEDURES - Core business logic
-- =============================================

-- SP: Get apartment management page data
IF OBJECT_ID('sp_GetApartmentManagementData', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetApartmentManagementData;
GO

CREATE PROCEDURE sp_GetApartmentManagementData
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Return apartments with owners
    SELECT * FROM vw_ApartmentsWithOwners
    ORDER BY BuildingName, Floors, HouseNum;
    
    -- Return available users (no apartments)
    SELECT u.id, u.firstName, u.lastName, u.email, 
           COUNT(c.ApartmentID) as apartmentCount
    FROM Users u 
    LEFT JOIN Canho c ON u.id = c.id 
    WHERE u.role = 'user'
    GROUP BY u.id, u.firstName, u.lastName, u.email
    ORDER BY u.firstName, u.lastName;
    
    -- Return statistics
    SELECT * FROM vw_ApartmentStats;
END;
GO

-- SP: Get vehicle management page data
IF OBJECT_ID('sp_GetVehicleManagementData', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetVehicleManagementData;
GO

CREATE PROCEDURE sp_GetVehicleManagementData
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Return users
    SELECT id, firstName, lastName, email FROM Users WHERE role = 'user';
    
    -- Return apartments
    SELECT ApartmentID FROM Canho ORDER BY ApartmentID;
    
    -- Return vehicles with details
    SELECT * FROM vw_VehicleManagement ORDER BY VehicleID;
END;
GO

-- SP: Get fee management page data  
IF OBJECT_ID('sp_GetFeeManagementData', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetFeeManagementData;
GO

CREATE PROCEDURE sp_GetFeeManagementData
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * FROM vw_UsersWithFees
    ORDER BY firstName, lastName, feeCreatedAt DESC;
END;
GO

-- SP: Get user apartment info for fees
IF OBJECT_ID('sp_GetUserApartmentInfo', 'P') IS NOT NULL
    DROP PROCEDURE sp_GetUserApartmentInfo;
GO

CREATE PROCEDURE sp_GetUserApartmentInfo
    @UserId INT,
    @Result NVARCHAR(500) OUTPUT,
    @HasApartment BIT OUTPUT,
    @ApartmentID NVARCHAR(20) OUTPUT,
    @Area DECIMAL(8,2) OUTPUT,
    @ServiceFee DECIMAL(10,2) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @FirstName NVARCHAR(50), @LastName NVARCHAR(50), @Email NVARCHAR(100);
    DECLARE @UseStatus NVARCHAR(20);
    
    -- Get user info
    SELECT @FirstName = firstName, @LastName = lastName, @Email = email
    FROM Users WHERE id = @UserId;
    
    IF @FirstName IS NULL
    BEGIN
        SET @Result = N'Lỗi: Không tìm thấy user';
        SET @HasApartment = 0;
        RETURN;
    END
    
    -- Get apartment info
    SELECT @ApartmentID = c.ApartmentID, @Area = c.Area, @UseStatus = c.Use_Status
    FROM Canho c WHERE c.id = @UserId;
    
    IF @ApartmentID IS NULL
    BEGIN
        SET @Result = N'User này chưa có căn hộ';
        SET @HasApartment = 0;
        RETURN;
    END
    
    -- Calculate service fee
    SET @ServiceFee = dbo.fn_CalculateServiceFee(@Area);
    SET @HasApartment = 1;
    SET @Result = N'Thành công: Lấy thông tin căn hộ';
END;
GO

-- SP: Update apartment
IF OBJECT_ID('sp_UpdateApartment', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpdateApartment;
GO

CREATE PROCEDURE sp_UpdateApartment
    @ApartmentID NVARCHAR(20),
    @Area DECIMAL(8,2),
    @SaleStatus NVARCHAR(20),
    @HouseNum NVARCHAR(10),
    @Floors INT,
    @BuildingName NVARCHAR(50),
    @TechStatus NVARCHAR(20),
    @UseStatus NVARCHAR(20),
    @OwnerID INT = NULL,
    @Result NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Validate owner if provided
    IF @OwnerID IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM Users WHERE id = @OwnerID AND role = 'user')
        BEGIN
            SET @Result = N'Lỗi: User không tồn tại hoặc không phải là user thường';
            RETURN;
        END
    END
    
    -- Update apartment
    UPDATE Canho SET 
        Area = @Area,
        SaleStatus = @SaleStatus,
        HouseNum = @HouseNum,
        Floors = @Floors,
        BuildingName = @BuildingName,
        Tech_Status = @TechStatus,
        Use_Status = @UseStatus,
        id = @OwnerID
    WHERE ApartmentID = @ApartmentID;
    
    IF @@ROWCOUNT > 0
        SET @Result = N'Thành công: Cập nhật căn hộ';
    ELSE
        SET @Result = N'Lỗi: Không tìm thấy căn hộ để cập nhật';
END;
GO

-- SP: Delete apartment
IF OBJECT_ID('sp_DeleteApartment', 'P') IS NOT NULL
    DROP PROCEDURE sp_DeleteApartment;
GO

CREATE PROCEDURE sp_DeleteApartment
    @ApartmentID NVARCHAR(20),
    @Result NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    BEGIN TRY
        DECLARE @VehicleCount INT = 0;
        
        -- Check if apartment exists
        IF NOT EXISTS (SELECT 1 FROM Canho WHERE ApartmentID = @ApartmentID)
        BEGIN
            SET @Result = N'Lỗi: Không tìm thấy căn hộ để xóa';
            ROLLBACK TRANSACTION;
            RETURN;
        END
        
        -- Delete related vehicles first
        SELECT @VehicleCount = COUNT(*) FROM PhuongTien WHERE ApartmentID = @ApartmentID;
        DELETE FROM PhuongTien WHERE ApartmentID = @ApartmentID;
        
        -- Delete the apartment
        DELETE FROM Canho WHERE ApartmentID = @ApartmentID;
        
        IF @@ROWCOUNT > 0
        BEGIN
            IF @VehicleCount > 0
                SET @Result = N'Thành công: Xóa căn hộ và ' + CAST(@VehicleCount AS NVARCHAR(10)) + N' phương tiện liên quan';
            ELSE
                SET @Result = N'Thành công: Xóa căn hộ';
            
            COMMIT TRANSACTION;
        END
        ELSE
        BEGIN
            SET @Result = N'Lỗi: Không thể xóa căn hộ';
            ROLLBACK TRANSACTION;
        END
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SET @Result = N'Lỗi: ' + ERROR_MESSAGE();
    END CATCH
END;
GO

-- SP: Assign apartment to user
IF OBJECT_ID('sp_AssignApartment', 'P') IS NOT NULL
    DROP PROCEDURE sp_AssignApartment;
GO

CREATE PROCEDURE sp_AssignApartment
    @ApartmentID NVARCHAR(20),
    @OwnerID INT,
    @Result NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentOwner INT, @UserName NVARCHAR(100);
    
    -- Check apartment exists and availability
    SELECT @CurrentOwner = id FROM Canho WHERE ApartmentID = @ApartmentID;
    
    IF @CurrentOwner IS NULL AND NOT EXISTS (SELECT 1 FROM Canho WHERE ApartmentID = @ApartmentID)
    BEGIN
        SET @Result = N'Lỗi: Không tìm thấy căn hộ';
        RETURN;
    END
    
    IF @CurrentOwner IS NOT NULL
    BEGIN
        SET @Result = N'Lỗi: Căn hộ đã có chủ sở hữu';
        RETURN;
    END
    
    -- Validate user
    SELECT @UserName = firstName + ' ' + lastName 
    FROM Users WHERE id = @OwnerID AND role = 'user';
    
    IF @UserName IS NULL
    BEGIN
        SET @Result = N'Lỗi: Không tìm thấy user hoặc user không phải là user thường';
        RETURN;
    END
    
    -- Assign apartment
    UPDATE Canho SET id = @OwnerID WHERE ApartmentID = @ApartmentID;
    
    SET @Result = N'Thành công: Đã gán căn hộ ' + @ApartmentID + N' cho ' + @UserName;
END;
GO

-- SP: Remove apartment owner
IF OBJECT_ID('sp_RemoveApartmentOwner', 'P') IS NOT NULL
    DROP PROCEDURE sp_RemoveApartmentOwner;
GO

CREATE PROCEDURE sp_RemoveApartmentOwner
    @ApartmentID NVARCHAR(20),
    @Result NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentOwner INT, @OwnerName NVARCHAR(100);
    
    -- Get current owner info
    SELECT @CurrentOwner = c.id, @OwnerName = u.firstName + ' ' + u.lastName
    FROM Canho c
    LEFT JOIN Users u ON c.id = u.id
    WHERE c.ApartmentID = @ApartmentID;
    
    IF @CurrentOwner IS NULL AND NOT EXISTS (SELECT 1 FROM Canho WHERE ApartmentID = @ApartmentID)
    BEGIN
        SET @Result = N'Lỗi: Không tìm thấy căn hộ';
        RETURN;
    END
    
    IF @CurrentOwner IS NULL
    BEGIN
        SET @Result = N'Lỗi: Căn hộ chưa có chủ sở hữu';
        RETURN;
    END
    
    -- Remove owner
    UPDATE Canho SET id = NULL WHERE ApartmentID = @ApartmentID;
    
    SET @Result = N'Thành công: Đã hủy quyền sở hữu căn hộ ' + @ApartmentID + N' của ' + @OwnerName;
END;
GO

-- SP: Delete vehicle
IF OBJECT_ID('sp_DeleteVehicle', 'P') IS NOT NULL
    DROP PROCEDURE sp_DeleteVehicle;
GO

CREATE PROCEDURE sp_DeleteVehicle
    @VehicleID NVARCHAR(10),
    @Result NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM PhuongTien WHERE VehicleID = @VehicleID;
    
    IF @@ROWCOUNT > 0
        SET @Result = N'Thành công: Xóa phương tiện';
    ELSE
        SET @Result = N'Lỗi: Không tìm thấy phương tiện để xóa';
END;
GO

-- SP: Create individual fee
IF OBJECT_ID('sp_CreateIndividualFee', 'P') IS NOT NULL
    DROP PROCEDURE sp_CreateIndividualFee;
GO

CREATE PROCEDURE sp_CreateIndividualFee
    @FeeType NVARCHAR(100),
    @FeeAmount DECIMAL(10,2),
    @FeeDescription NVARCHAR(500),
    @UserID INT,
    @CreatedBy NVARCHAR(100),
    @Result NVARCHAR(500) OUTPUT,
    @NewFeeID INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @UserName NVARCHAR(100);
    
    -- Validate user
    SELECT @UserName = firstName + ' ' + lastName FROM Users WHERE id = @UserID;
    
    IF @UserName IS NULL
    BEGIN
        SET @Result = N'Lỗi: User không tồn tại';
        RETURN;
    END
    
    -- Create fee
    INSERT INTO Fees (
        feeType, feeAmount, feeDescription, feeStatus, 
        userId, feeCreatedBy, feeUpdatedBy, feeDate,
        feeCreatedAt, feeUpdatedAt, deadline, lateFee, isOverdue
    ) 
    VALUES (
        @FeeType, @FeeAmount, @FeeDescription, N'chưa thanh toán', 
        @UserID, @CreatedBy, @CreatedBy, GETDATE(),
        GETDATE(), GETDATE(), DATEADD(day, 15, GETDATE()), 0, 0
    );
    
    SET @NewFeeID = SCOPE_IDENTITY();
    SET @Result = N'Thành công: Đã tạo khoản thu ' + @FeeType + N' cho ' + @UserName;
END;
GO

-- SP: Update fee status
IF OBJECT_ID('sp_UpdateFeeStatus', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpdateFeeStatus;
GO

CREATE PROCEDURE sp_UpdateFeeStatus
    @FeeID INT,
    @UpdatedBy NVARCHAR(100),
    @Result NVARCHAR(500) OUTPUT,
    @NewStatus NVARCHAR(20) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CurrentStatus NVARCHAR(20);
    
    -- Get current status
    SELECT @CurrentStatus = feeStatus FROM Fees WHERE id = @FeeID;
    
    IF @CurrentStatus IS NULL
    BEGIN
        SET @Result = N'Lỗi: Không tìm thấy khoản thu';
        RETURN;
    END
    
    -- Toggle status
    SET @NewStatus = CASE 
        WHEN @CurrentStatus = N'chưa thanh toán' THEN N'đã thanh toán'
        ELSE N'chưa thanh toán'
    END;
    
    -- Update status
    UPDATE Fees 
    SET feeStatus = @NewStatus, feeUpdatedBy = @UpdatedBy 
    WHERE id = @FeeID;
    
    SET @Result = N'Thành công: Cập nhật trạng thái thành ' + @NewStatus;
END;
GO

-- SP: Update user
IF OBJECT_ID('sp_UpdateUser', 'P') IS NOT NULL
    DROP PROCEDURE sp_UpdateUser;
GO

CREATE PROCEDURE sp_UpdateUser
    @UserID INT,
    @FirstName NVARCHAR(50),
    @LastName NVARCHAR(50),
    @Email NVARCHAR(100),
    @PhoneNumber NVARCHAR(15) = NULL,
    @Role NVARCHAR(10),
    @Password NVARCHAR(255) = NULL,
    @Result NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if user exists
    IF NOT EXISTS (SELECT 1 FROM Users WHERE id = @UserID)
    BEGIN
        SET @Result = N'Lỗi: Không tìm thấy user';
        RETURN;
    END
    
    -- Check email uniqueness
    IF EXISTS (SELECT 1 FROM Users WHERE email = @Email AND id != @UserID)
    BEGIN
        SET @Result = N'Lỗi: Email đã tồn tại';
        RETURN;
    END
    
    -- Update user
    IF @Password IS NOT NULL
    BEGIN
        UPDATE Users SET 
            firstName = @FirstName,
            lastName = @LastName,
            email = @Email,
            phoneNumber = @PhoneNumber,
            role = @Role,
            password = @Password
        WHERE id = @UserID;
    END
    ELSE
    BEGIN
        UPDATE Users SET 
            firstName = @FirstName,
            lastName = @LastName,
            email = @Email,
            phoneNumber = @PhoneNumber,
            role = @Role
        WHERE id = @UserID;
    END
    
    SET @Result = N'Thành công: Cập nhật thông tin user';
END;
GO

-- SP: Delete user with related data cleanup
IF OBJECT_ID('sp_DeleteUserComplete', 'P') IS NOT NULL
    DROP PROCEDURE sp_DeleteUserComplete;
GO

CREATE PROCEDURE sp_DeleteUserComplete
    @UserID INT,
    @Result NVARCHAR(500) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    DECLARE @UserRole NVARCHAR(10), @UserName NVARCHAR(100);
    DECLARE @AdminCount INT;
    DECLARE @ApartmentCount INT, @VehicleCount INT;
    
    -- Get user info
    SELECT @UserRole = role, @UserName = firstName + ' ' + lastName
    FROM Users WHERE id = @UserID;
    
    IF @UserName IS NULL
    BEGIN
        SET @Result = N'Lỗi: Không tìm thấy user';
        ROLLBACK TRANSACTION;
        RETURN;
    END
    
    -- Check if admin and count
    IF @UserRole = 'admin'
    BEGIN
        SELECT @AdminCount = COUNT(*) FROM Users WHERE role = 'admin';
        IF @AdminCount <= 1
        BEGIN
            SET @Result = N'Lỗi: Không thể xóa admin cuối cùng';
            ROLLBACK TRANSACTION;
            RETURN;
        END
    END
    
    -- Delete related vehicles
    DELETE FROM PhuongTien WHERE ApartmentID IN (
        SELECT ApartmentID FROM Canho WHERE id = @UserID
    );
    SET @VehicleCount = @@ROWCOUNT;
    
    -- Remove apartment ownership
    UPDATE Canho SET id = NULL WHERE id = @UserID;
    SET @ApartmentCount = @@ROWCOUNT;
    
    -- Delete fees
    DELETE FROM Fees WHERE userId = @UserID;
    
    -- Delete user
    DELETE FROM Users WHERE id = @UserID;
    
    SET @Result = N'Thành công: Xóa user ' + @UserName;
    IF @ApartmentCount > 0
        SET @Result = @Result + N'. Đã trả lại ' + CAST(@ApartmentCount AS NVARCHAR(10)) + N' căn hộ';
    IF @VehicleCount > 0
        SET @Result = @Result + N'. Đã xóa ' + CAST(@VehicleCount AS NVARCHAR(10)) + N' phương tiện';
    
    COMMIT TRANSACTION;
END;
GO

-- =============================================
-- TRIGGERS - Automatic data integrity
-- =============================================

-- Trigger: Auto-update apartment use status when owner changes
IF OBJECT_ID('tr_Apartment_OwnerChange', 'TR') IS NOT NULL
    DROP TRIGGER tr_Apartment_OwnerChange;
GO

CREATE TRIGGER tr_Apartment_OwnerChange
ON Canho
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Auto-update Use_Status based on owner
    UPDATE c
    SET Use_Status = CASE 
        WHEN i.id IS NOT NULL THEN N'Đang ở'
        ELSE N'Không ở'
    END
    FROM Canho c
    INNER JOIN inserted i ON c.ApartmentID = i.ApartmentID
    INNER JOIN deleted d ON c.ApartmentID = d.ApartmentID
    WHERE i.id != d.id OR (i.id IS NULL AND d.id IS NOT NULL) OR (i.id IS NOT NULL AND d.id IS NULL);
END;
GO

-- Trigger: Auto-calculate late fees
IF OBJECT_ID('tr_Fee_LateFeeCalculation', 'TR') IS NOT NULL
    DROP TRIGGER tr_Fee_LateFeeCalculation;
GO

CREATE TRIGGER tr_Fee_LateFeeCalculation
ON Fees
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update overdue status and calculate late fees
    UPDATE f
    SET isOverdue = CASE 
        WHEN GETDATE() > f.deadline AND f.feeStatus = N'chưa thanh toán' THEN 1
        ELSE 0
    END,
    lateFee = CASE 
        WHEN GETDATE() > f.deadline AND f.feeStatus = N'chưa thanh toán' 
        THEN f.feeAmount * 0.05  -- 5% late fee
        ELSE 0
    END
    FROM Fees f
    INNER JOIN inserted i ON f.id = i.id;
END;
GO

PRINT 'All stored procedures, views, and triggers created successfully!'; 