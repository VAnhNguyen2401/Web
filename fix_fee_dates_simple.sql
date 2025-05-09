-- Script đơn giản để cập nhật ngày tháng phí
USE Quanli;
GO

-- Lấy ngày tháng hiện tại
DECLARE @CurrentDate DATE = GETDATE();
DECLARE @CurrentYear INT = YEAR(@CurrentDate);
DECLARE @CurrentMonth INT = MONTH(@CurrentDate);

-- Cập nhật phí 'đã thanh toán' vào tháng hiện tại
UPDATE Fees
SET feeDate = DATEFROMPARTS(@CurrentYear, @CurrentMonth, 5),
    updatedAt = GETDATE()
WHERE feeStatus = N'đã thanh toán';

-- Cập nhật phí 'chưa thanh toán' vào tháng hiện tại
UPDATE Fees
SET feeDate = DATEFROMPARTS(@CurrentYear, @CurrentMonth, 15),
    updatedAt = GETDATE()
WHERE feeStatus = N'chưa thanh toán';

-- Đảm bảo định dạng trạng thái chính xác
UPDATE Fees
SET feeStatus = N'đã thanh toán'
WHERE feeStatus LIKE N'%đã%thanh%toán%' AND feeStatus != N'đã thanh toán';

UPDATE Fees
SET feeStatus = N'chưa thanh toán'
WHERE feeStatus LIKE N'%chưa%thanh%toán%' AND feeStatus != N'chưa thanh toán';
GO 