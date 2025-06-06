CREATE TABLE Canho (
    id INT NULL,
    ApartmentID NVARCHAR(50) PRIMARY KEY,
    Area DECIMAL(10, 2) NOT NULL,
    SaleStatus NVARCHAR(50) NOT NULL CHECK (SaleStatus IN (N'Đã bán', N'Chưa bán')),
    HouseNum NVARCHAR(50) NOT NULL,
    Floors INT NOT NULL,
    BuildingName NVARCHAR(50) NOT NULL,
    Tech_Status NVARCHAR(50) NOT NULL CHECK (Tech_Status IN (N'Bình thường', N'Bảo trì', N'Hỏng')),
    Use_Status NVARCHAR(50) NOT NULL CHECK (Use_Status IN (N'Đang ở', N'Không ở')),
    FOREIGN KEY (id) REFERENCES Users(id);
);
