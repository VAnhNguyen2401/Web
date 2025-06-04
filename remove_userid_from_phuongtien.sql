-- Xóa khóa ngoại UserID khỏi bảng PhuongTien
-- Bước 1: Xóa ràng buộc khóa ngoại (nếu có)
ALTER TABLE PhuongTien DROP FOREIGN KEY IF EXISTS FK_PhuongTien_Users;

-- Bước 2: Xóa cột UserID
ALTER TABLE PhuongTien DROP COLUMN IF EXISTS UserID;

-- Bước 3: Đảm bảo ApartmentID không được null
ALTER TABLE PhuongTien MODIFY COLUMN ApartmentID VARCHAR(10) NOT NULL;

-- Bước 4: Thêm ràng buộc khóa ngoại cho ApartmentID (nếu chưa có)
ALTER TABLE PhuongTien 
ADD CONSTRAINT FK_PhuongTien_Apartment 
FOREIGN KEY (ApartmentID) REFERENCES Canho(ApartmentID) 
ON DELETE CASCADE ON UPDATE CASCADE; 