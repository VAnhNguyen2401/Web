-- Tạo database
CREATE DATABASE Quanli;
GO

USE Quanli;
GO

-- Tạo bảng Users
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    firstName NVARCHAR(255) NOT NULL,
    lastName NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(10) NOT NULL CHECK (role IN ('admin', 'user')) DEFAULT 'user',
    resetPasswordToken NVARCHAR(255) NULL,
    resetPasswordExpires BIGINT NULL,
    phoneNumber NVARCHAR(20) NULL,
    createdAt DATETIME NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME NOT NULL DEFAULT GETDATE()
);
GO

-- Tạo bảng Fees
CREATE TABLE Fees (
    id INT IDENTITY(1,1) PRIMARY KEY,
    feeType NVARCHAR(255) NOT NULL,
    feeAmount DECIMAL(10, 2) NOT NULL,
    feeDescription NTEXT NULL,
    feeDate DATE NOT NULL DEFAULT GETDATE(),
    feeStatus NVARCHAR(20) NOT NULL CHECK (feeStatus IN (N'chưa thanh toán', N'đã thanh toán')) DEFAULT N'chưa thanh toán',
    userId INT NOT NULL,
    feeCreatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    feeUpdatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    feeDeletedAt DATETIME NULL,
    feeCreatedBy NVARCHAR(255) NOT NULL,
    feeUpdatedBy NVARCHAR(255) NOT NULL,
    deadline DATETIME NOT NULL DEFAULT DATEADD(DAY, 15, GETDATE()),
    lateFee DECIMAL(10, 2) NULL DEFAULT 0,
    isOverdue BIT NOT NULL DEFAULT 0,
    notificationSent BIT NOT NULL DEFAULT 0,
    lastNotificationDate DATETIME NULL,
    createdAt DATETIME NOT NULL DEFAULT GETDATE(),
    updatedAt DATETIME NOT NULL DEFAULT GETDATE(),
    apartmentId NVARCHAR(50) NOT NULL,
    FOREIGN KEY (apartmentId) REFERENCES Canho(ApartmentID)
);
GO

-- Tạo indexes cho các trường thường tìm kiếm
CREATE INDEX idx_user_email ON Users(email);
CREATE INDEX idx_fee_status ON Fees(feeStatus);
CREATE INDEX idx_fee_date ON Fees(feeDate);
CREATE INDEX idx_fee_deadline ON Fees(deadline);
GO 