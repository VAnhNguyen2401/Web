-- Thêm cột ApartmentID vào bảng PhuongTien
USE BlueMoonApartmentDB;

-- Kiểm tra xem cột ApartmentID đã tồn tại chưa
IF NOT EXISTS (
    SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'PhuongTien' 
    AND COLUMN_NAME = 'ApartmentID'
)
BEGIN
    ALTER TABLE PhuongTien
    ADD ApartmentID NVARCHAR(10) NULL;
    
    PRINT 'Đã thêm cột ApartmentID vào bảng PhuongTien';
    
    -- Thêm foreign key constraint
    ALTER TABLE PhuongTien
    ADD CONSTRAINT FK_PhuongTien_Canho 
    FOREIGN KEY (ApartmentID) REFERENCES Canho(ApartmentID);
    
    PRINT 'Đã thêm foreign key constraint cho ApartmentID';
END
ELSE
BEGIN
    PRINT 'Cột ApartmentID đã tồn tại trong bảng PhuongTien';
END

PRINT 'Hoàn thành việc thêm cột ApartmentID vào bảng PhuongTien'; 