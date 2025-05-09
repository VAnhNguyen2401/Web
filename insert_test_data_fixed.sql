-- Script tạo dữ liệu test cho hệ thống xác thực (Đã sửa lỗi)
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
-- user123456: $2a$10$wuU1M9YGxwQOKOmN.InSquZ.6wYcF5YIadZp9S.zRvjIpVkx0pVUO

-- Tạo biến để lưu các mật khẩu đã hash
DECLARE @AdminPassword NVARCHAR(100) = '$2a$10$RZG5adVbgQHEkBWZ0dLNr.PrDFsiDvOz4MmjI9epOPxKAsp6Yi87e';
DECLARE @UserPassword NVARCHAR(100) = '$2a$10$wuU1M9YGxwQOKOmN.InSquZ.6wYcF5YIadZp9S.zRvjIpVkx0pVUO';

-- Biến lưu ID người dùng để tạo dữ liệu phí
DECLARE @AdminID INT, @UserID1 INT, @UserID2 INT, @UserID3 INT;

-- Kiểm tra ràng buộc trên cột role
PRINT N'Kiểm tra ràng buộc trên cột role...';
DECLARE @RoleConstraint NVARCHAR(100);
SELECT @RoleConstraint = OBJECT_NAME(OBJECT_ID)
FROM sys.check_constraints
WHERE OBJECT_NAME(parent_object_id) = 'Users' AND type = 'C' AND OBJECT_DEFINITION(OBJECT_ID) LIKE '%role%';

IF @RoleConstraint IS NOT NULL
BEGIN
    PRINT N'Đã tìm thấy ràng buộc trên cột role: ' + @RoleConstraint;
    -- Hiển thị định nghĩa ràng buộc nếu có thể
    DECLARE @ConstraintDefinition NVARCHAR(1000);
    SELECT @ConstraintDefinition = OBJECT_DEFINITION(OBJECT_ID)
    FROM sys.check_constraints
    WHERE OBJECT_NAME(OBJECT_ID) = @RoleConstraint;
    
    IF @ConstraintDefinition IS NOT NULL
    BEGIN
        PRINT N'Định nghĩa ràng buộc: ' + @ConstraintDefinition;
    END
END

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
    -- Cập nhật mật khẩu nếu cần
    UPDATE Users SET password = @AdminPassword WHERE email = 'admin@example.com';
    PRINT N'Đã cập nhật mật khẩu cho admin@example.com';
END

-- Lấy ID của admin để sử dụng sau
SELECT @AdminID = id FROM Users WHERE email = 'admin@example.com';

-- Kiểm tra và tạo người dùng advanced nếu chưa tồn tại (sửa từ manager thành user)
IF NOT EXISTS (SELECT 1 FROM Users WHERE email = 'manager@example.com')
BEGIN
    INSERT INTO Users (firstName, lastName, email, password, role, phoneNumber, createdAt, updatedAt)
    VALUES (N'Manager', N'Project', 'manager@example.com', @UserPassword, 'user', '0987654321', GETDATE(), GETDATE());
    PRINT N'Đã tạo người dùng: manager@example.com (user - advanced user)';
END
ELSE
BEGIN
    PRINT N'Email manager@example.com đã tồn tại, bỏ qua';
    -- Cập nhật mật khẩu nếu cần
    UPDATE Users SET password = @UserPassword WHERE email = 'manager@example.com';
    PRINT N'Đã cập nhật mật khẩu cho manager@example.com';
END

-- Lấy ID của advanced user
SELECT @UserID3 = id FROM Users WHERE email = 'manager@example.com';

-- Kiểm tra và tạo người dùng thường 1
-- Sửa lỗi: Thay đổi email để tránh trùng lặp
IF NOT EXISTS (SELECT 1 FROM Users WHERE email = 'nguyenvana@example.com')
BEGIN
    INSERT INTO Users (firstName, lastName, email, password, role, phoneNumber, createdAt, updatedAt)
    VALUES (N'Nguyễn', N'Văn A', 'nguyenvana@example.com', @UserPassword, 'user', '0912345678', GETDATE(), GETDATE());
    PRINT N'Đã tạo người dùng: nguyenvana@example.com (user)';
END
ELSE
BEGIN
    PRINT N'Email nguyenvana@example.com đã tồn tại, bỏ qua';
    -- Cập nhật mật khẩu nếu cần
    UPDATE Users SET password = @UserPassword WHERE email = 'nguyenvana@example.com';
    PRINT N'Đã cập nhật mật khẩu cho nguyenvana@example.com';
END

-- Lấy ID của người dùng 1 để tạo phí
SELECT @UserID1 = id FROM Users WHERE email = 'nguyenvana@example.com';

-- Kiểm tra và tạo người dùng thường 2
IF NOT EXISTS (SELECT 1 FROM Users WHERE email = 'tranthib@example.com')
BEGIN
    INSERT INTO Users (firstName, lastName, email, password, role, phoneNumber, createdAt, updatedAt)
    VALUES (N'Trần', N'Thị B', 'tranthib@example.com', @UserPassword, 'user', '0865432109', GETDATE(), GETDATE());
    PRINT N'Đã tạo người dùng: tranthib@example.com (user)';
END
ELSE
BEGIN
    PRINT N'Email tranthib@example.com đã tồn tại, bỏ qua';
    -- Cập nhật mật khẩu nếu cần
    UPDATE Users SET password = @UserPassword WHERE email = 'tranthib@example.com';
    PRINT N'Đã cập nhật mật khẩu cho tranthib@example.com';
END

-- Lấy ID của người dùng 2 để tạo phí
SELECT @UserID2 = id FROM Users WHERE email = 'tranthib@example.com';

-- Kiểm tra xem các ID đã được lấy chưa
IF @UserID1 IS NULL OR @UserID2 IS NULL 
BEGIN
    PRINT N'Cảnh báo: Không thể lấy ID của một hoặc nhiều người dùng. Việc tạo phí có thể thất bại.';
END
ELSE
BEGIN
    PRINT N'Đã lấy thành công ID người dùng để tạo phí:';
    PRINT N'  - UserID1 (nguyenvana@example.com): ' + CAST(@UserID1 AS NVARCHAR);
    PRINT N'  - UserID2 (tranthib@example.com): ' + CAST(@UserID2 AS NVARCHAR);
    IF @UserID3 IS NOT NULL
        PRINT N'  - UserID3 (manager@example.com): ' + CAST(@UserID3 AS NVARCHAR);
END

-- Kiểm tra xem bảng Fees có tồn tại không
IF OBJECT_ID('dbo.Fees', 'U') IS NOT NULL
BEGIN
    PRINT N'Bảng Fees tồn tại, tiến hành tạo dữ liệu phí';
    
    -- Bây giờ các ID người dùng đã được lấy trước khi tạo phí
    
    -- 1. Phí đã thanh toán cho người dùng 1
    IF NOT EXISTS (SELECT 1 FROM Fees WHERE userId = @UserID1 AND feeType = N'Phí quản lý') AND @UserID1 IS NOT NULL
    BEGIN
        INSERT INTO Fees (feeType, feeAmount, feeDescription, feeDate, feeStatus, userId, feeCreatedBy, feeUpdatedBy, deadline, createdAt, updatedAt)
        VALUES (N'Phí quản lý', 500000, N'Phí quản lý tháng 4/2024', '2024-04-01', N'đã thanh toán', @UserID1, 'admin@example.com', 'admin@example.com', DATEADD(DAY, 15, '2024-04-01'), GETDATE(), GETDATE());
        PRINT N'Đã tạo phí quản lý đã thanh toán cho nguyenvana@example.com';
    END
    ELSE IF @UserID1 IS NULL
    BEGIN
        PRINT N'Không thể tạo phí cho nguyenvana@example.com vì không tìm thấy ID người dùng';
    END
    ELSE
    BEGIN
        PRINT N'Phí quản lý cho nguyenvana@example.com đã tồn tại, bỏ qua';
    END
    
    -- 2. Phí chưa thanh toán cho người dùng 1
    IF NOT EXISTS (SELECT 1 FROM Fees WHERE userId = @UserID1 AND feeType = N'Phí dịch vụ') AND @UserID1 IS NOT NULL
    BEGIN
        INSERT INTO Fees (feeType, feeAmount, feeDescription, feeDate, feeStatus, userId, feeCreatedBy, feeUpdatedBy, deadline, createdAt, updatedAt)
        VALUES (N'Phí dịch vụ', 200000, N'Phí dịch vụ tháng 4/2024', '2024-04-10', N'chưa thanh toán', @UserID1, 'admin@example.com', 'admin@example.com', DATEADD(DAY, 15, '2024-04-10'), GETDATE(), GETDATE());
        PRINT N'Đã tạo phí dịch vụ chưa thanh toán cho nguyenvana@example.com';
    END
    ELSE IF @UserID1 IS NULL
    BEGIN
        PRINT N'Không thể tạo phí cho nguyenvana@example.com vì không tìm thấy ID người dùng';
    END
    ELSE
    BEGIN
        PRINT N'Phí dịch vụ cho nguyenvana@example.com đã tồn tại, bỏ qua';
    END
    
    -- 3. Phí quá hạn cho người dùng 2
    IF NOT EXISTS (SELECT 1 FROM Fees WHERE userId = @UserID2 AND feeType = N'Phí bảo trì') AND @UserID2 IS NOT NULL
    BEGIN
        INSERT INTO Fees (feeType, feeAmount, feeDescription, feeDate, feeStatus, userId, feeCreatedBy, feeUpdatedBy, deadline, isOverdue, lateFee, createdAt, updatedAt)
        VALUES (N'Phí bảo trì', 300000, N'Phí bảo trì tháng 3/2024', '2024-03-01', N'chưa thanh toán', @UserID2, 'admin@example.com', 'admin@example.com', '2024-03-15', 1, 30000, GETDATE(), GETDATE());
        PRINT N'Đã tạo phí bảo trì quá hạn cho tranthib@example.com';
    END
    ELSE IF @UserID2 IS NULL
    BEGIN
        PRINT N'Không thể tạo phí cho tranthib@example.com vì không tìm thấy ID người dùng';
    END
    ELSE
    BEGIN
        PRINT N'Phí bảo trì cho tranthib@example.com đã tồn tại, bỏ qua';
    END
    
    -- 4. Phí cho advanced user (nếu có)
    IF @UserID3 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Fees WHERE userId = @UserID3 AND feeType = N'Phí nâng cao')
    BEGIN
        INSERT INTO Fees (feeType, feeAmount, feeDescription, feeDate, feeStatus, userId, feeCreatedBy, feeUpdatedBy, deadline, createdAt, updatedAt)
        VALUES (N'Phí nâng cao', 750000, N'Phí dịch vụ nâng cao tháng 4/2024', '2024-04-05', N'chưa thanh toán', @UserID3, 'admin@example.com', 'admin@example.com', DATEADD(DAY, 10, '2024-04-05'), GETDATE(), GETDATE());
        PRINT N'Đã tạo phí nâng cao cho manager@example.com';
    END
    ELSE IF @UserID3 IS NULL
    BEGIN
        PRINT N'Không thể tạo phí cho manager@example.com vì không tìm thấy ID người dùng';
    END
    ELSE
    BEGIN
        PRINT N'Phí nâng cao cho manager@example.com đã tồn tại, bỏ qua';
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
PRINT N'   - Email: manager@example.com, Mật khẩu: user123456, Vai trò: user (advanced user)';
PRINT N'   - Email: nguyenvana@example.com, Mật khẩu: user123456, Vai trò: user';
PRINT N'   - Email: tranthib@example.com, Mật khẩu: user123456, Vai trò: user';
GO 