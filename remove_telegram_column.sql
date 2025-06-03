-- Script để xóa cột telegramChatId khỏi bảng Users
-- Chạy script này trong SQL Server Management Studio

USE Quanli;
GO

-- Kiểm tra xem cột có tồn tại không trước khi xóa
IF COL_LENGTH('Users', 'telegramChatId') IS NOT NULL
BEGIN
    ALTER TABLE Users DROP COLUMN telegramChatId;
    PRINT 'Đã xóa cột telegramChatId khỏi bảng Users thành công.';
END
ELSE
BEGIN
    PRINT 'Cột telegramChatId không tồn tại trong bảng Users.';
END 