const TelegramBot = require('node-telegram-bot-api');
const db = require('../models');
require('dotenv').config();

let bot = null;

// Tắt log từ thư viện node-telegram-bot-api
process.env.NTBA_FIX_319 = 1;
process.env.NTBA_FIX_350 = 1;

// Khởi tạo bot Telegram
try {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!bot && token && token !== 'YOUR_TELEGRAM_BOT_TOKEN') {
        // Khởi tạo bot với các cài đặt để tránh log không cần thiết
        bot = new TelegramBot(token, {
            polling: true,
            webHook: false,
            filepath: false  // Tắt thông báo lưu file
        });

        // Bỏ log gốc của thư viện
        if (bot.hasOwnProperty('_debug')) {
            bot._debug = function () { };
        }

        console.log('✅ Telegram bot đã khởi tạo thành công');
    } else if (!token || token === 'YOUR_TELEGRAM_BOT_TOKEN') {
        console.log('⚠️ Chưa cấu hình TELEGRAM_BOT_TOKEN trong file .env');
        // Tạo mock bot nếu không có token
        bot = {
            sendMessage: () => Promise.resolve(),
            onText: () => { },
            on: () => { }
        };
    }
} catch (error) {
    console.error('❌ Lỗi khởi tạo Telegram bot:', error.message);
    // Tạo mock bot để tránh lỗi ứng dụng
    bot = {
        sendMessage: () => Promise.resolve(),
        onText: () => { },
        on: () => { }
    };
}

// Format số tiền sang định dạng VND
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

// Format ngày tháng sang định dạng Việt Nam
const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('vi-VN');
};

// Liên kết tài khoản người dùng với chatId Telegram
const linkUserAccount = async (email, chatId) => {
    try {
        // Tìm người dùng theo email (không phân biệt hoa thường)
        const user = await db.User.findOne({
            where: db.sequelize.where(
                db.sequelize.fn('LOWER', db.sequelize.col('email')),
                db.sequelize.fn('LOWER', email)
            )
        });

        if (!user) {
            return { success: false, message: 'Không tìm thấy tài khoản với email này' };
        }

        // Cập nhật chatId bằng truy vấn SQL trực tiếp để tránh lỗi
        await db.sequelize.query(
            `UPDATE [Users] SET [telegramChatId] = ? WHERE [id] = ?`,
            {
                replacements: [chatId.toString(), user.id],
                type: db.sequelize.QueryTypes.UPDATE
            }
        );

        return {
            success: true,
            message: 'Liên kết tài khoản thành công',
            user: {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email
            }
        };
    } catch (error) {
        console.error('❌ Lỗi khi liên kết tài khoản:', error);
        return { success: false, message: 'Đã xảy ra lỗi khi liên kết tài khoản' };
    }
};

// Gửi thông báo khoản phí mới
const sendNewFeeNotification = async (userId, feeData) => {
    try {
        const user = await db.User.findByPk(userId);
        if (!user || !user.telegramChatId) {
            return false;
        }

        let message = `🔔 *THÔNG BÁO KHOẢN PHÍ MỚI*\n\n`
            + `Kính gửi *${user.firstName} ${user.lastName}*,\n\n`
            + `Bạn có một khoản phí mới:\n`
            + `- Loại phí: *${feeData.feeType}*\n`
            + `- Số tiền: *${formatCurrency(feeData.feeAmount)}*\n`;

        if (feeData.dueDate) {
            message += `- Hạn thanh toán: *${formatDate(feeData.dueDate)}*\n\n`;
        } else {
            message += `\n`;
        }

        message += `Vui lòng thanh toán đúng hạn để tránh phí phạt.`;

        await bot.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
        return true;
    } catch (error) {
        console.error('❌ Lỗi gửi thông báo khoản phí mới:', error.message);
        return false;
    }
};

// Gửi thông báo thanh toán thành công
const sendPaymentSuccessNotification = async (userId, feeData) => {
    try {
        const user = await db.User.findByPk(userId);
        if (!user || !user.telegramChatId) {
            return false;
        }

        const message = `✅ *THANH TOÁN THÀNH CÔNG*\n\n`
            + `Kính gửi *${user.firstName} ${user.lastName}*,\n\n`
            + `Cảm ơn bạn đã thanh toán:\n`
            + `- Loại phí: *${feeData.feeType}*\n`
            + `- Số tiền: *${formatCurrency(feeData.feeAmount)}*\n`
            + `- Ngày thanh toán: *${formatDate(new Date())}*\n\n`
            + `Cảm ơn bạn đã sử dụng dịch vụ!`;

        await bot.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
        return true;
    } catch (error) {
        console.error('❌ Lỗi gửi thông báo thanh toán thành công:', error.message);
        return false;
    }
};

// Gửi nhắc nhở thanh toán
const sendPaymentReminder = async (userId, feeData) => {
    try {
        const user = await db.User.findByPk(userId);
        if (!user || !user.telegramChatId) {
            return false;
        }

        let message = `⚠️ *NHẮC NHỞ THANH TOÁN*\n\n`
            + `Kính gửi *${user.firstName} ${user.lastName}*,\n\n`
            + `Bạn có một khoản phí cần thanh toán:\n`
            + `- Loại phí: *${feeData.feeType}*\n`
            + `- Số tiền: *${formatCurrency(feeData.feeAmount)}*\n`;

        if (feeData.dueDate) {
            message += `- Hạn thanh toán: *${formatDate(feeData.dueDate)}*\n\n`;
        } else {
            message += `\n`;
        }

        message += `Vui lòng thanh toán để tránh phí phạt.`;

        await bot.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
        return true;
    } catch (error) {
        console.error('❌ Lỗi gửi nhắc nhở thanh toán:', error.message);
        return false;
    }
};

// Thiết lập bot commands
if (bot && typeof bot.onText === 'function') {
    // Xử lý khi người dùng bắt đầu chat với bot - lệnh /start
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const message = `👋 *Chào mừng bạn đến với Hệ thống thu phí chung cư*\n\n`
            + `Để kết nối với tài khoản của bạn, vui lòng gửi email bạn đã đăng ký với hệ thống.\n\n`
            + `_Ví dụ: nguoidung@gmail.com_`;

        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });

    // Lệnh trợ giúp - /help
    bot.onText(/\/help/, async (msg) => {
        const chatId = msg.chat.id;
        const message = `*Trợ giúp sử dụng bot*\n\n`
            + `- Gửi email đã đăng ký để liên kết tài khoản\n`
            + `- Sử dụng lệnh /status để kiểm tra trạng thái liên kết\n`
            + `- Sử dụng lệnh /unlink để hủy liên kết tài khoản\n`
            + `- Sử dụng lệnh /help để xem trợ giúp`;

        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    });

    // Kiểm tra trạng thái liên kết - /status
    bot.onText(/\/status/, async (msg) => {
        const chatId = msg.chat.id;

        try {
            // Tìm người dùng có telegramChatId tương ứng
            const user = await db.User.findOne({
                where: { telegramChatId: chatId.toString() }
            });

            if (user) {
                const message = `✅ *Trạng thái liên kết*\n\n`
                    + `Tài khoản của bạn đã được liên kết:\n`
                    + `- Tên: *${user.firstName} ${user.lastName}*\n`
                    + `- Email: *${user.email}*\n`
                    + `- Vai trò: *${user.role}*`;

                await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            } else {
                await bot.sendMessage(chatId,
                    '❌ Bạn chưa liên kết tài khoản. Vui lòng gửi email đã đăng ký để liên kết.',
                    { parse_mode: 'Markdown' });
            }
        } catch (error) {
            console.error('❌ Lỗi kiểm tra trạng thái:', error.message);
            await bot.sendMessage(chatId, '❌ Đã xảy ra lỗi khi kiểm tra trạng thái liên kết.');
        }
    });

    // Hủy liên kết tài khoản - /unlink
    bot.onText(/\/unlink/, async (msg) => {
        const chatId = msg.chat.id;

        try {
            // Tìm người dùng có telegramChatId tương ứng
            const user = await db.User.findOne({
                where: { telegramChatId: chatId.toString() }
            });

            if (user) {
                // Cập nhật để xóa telegramChatId
                await db.sequelize.query(
                    `UPDATE [Users] SET [telegramChatId] = NULL WHERE [id] = ?`,
                    {
                        replacements: [user.id],
                        type: db.sequelize.QueryTypes.UPDATE
                    }
                );

                await bot.sendMessage(chatId,
                    '✅ Đã hủy liên kết tài khoản thành công. Bạn sẽ không nhận được thông báo nữa.',
                    { parse_mode: 'Markdown' });
            } else {
                await bot.sendMessage(chatId,
                    '❌ Bạn chưa liên kết tài khoản nào.',
                    { parse_mode: 'Markdown' });
            }
        } catch (error) {
            console.error('❌ Lỗi hủy liên kết:', error.message);
            await bot.sendMessage(chatId, '❌ Đã xảy ra lỗi khi hủy liên kết tài khoản.');
        }
    });

    // Xử lý khi người dùng gửi email
    bot.on('message', async (msg) => {
        // Bỏ qua các lệnh đã xử lý ở trên
        if (msg.text && (msg.text.startsWith('/') || msg.text === '/start')) return;

        const chatId = msg.chat.id;
        const text = msg.text ? msg.text.trim() : '';

        // Kiểm tra định dạng email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(text)) {
            // Thực hiện liên kết tài khoản
            const result = await linkUserAccount(text, chatId);

            if (result.success) {
                const message = `✅ *Liên kết tài khoản thành công!*\n\n`
                    + `Tài khoản: *${result.user.name}*\n`
                    + `Email: *${result.user.email}*\n\n`
                    + `Từ giờ bạn sẽ nhận được thông báo về:\n`
                    + `- Khoản phí mới\n`
                    + `- Nhắc nhở thanh toán\n`
                    + `- Xác nhận thanh toán thành công\n\n`
                    + `Cảm ơn bạn đã sử dụng dịch vụ!`;

                await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            } else {
                await bot.sendMessage(chatId,
                    `❌ ${result.message}. Vui lòng kiểm tra lại email hoặc liên hệ quản trị viên.`,
                    { parse_mode: 'Markdown' });
            }
        } else if (text) {
            // Nếu không phải email, hướng dẫn người dùng
            await bot.sendMessage(chatId,
                '❌ Vui lòng gửi email hợp lệ để liên kết tài khoản.\n\nVí dụ: nguoidung@gmail.com',
                { parse_mode: 'Markdown' });
        }
    });
}

module.exports = {
    sendNewFeeNotification,
    sendPaymentSuccessNotification,
    sendPaymentReminder
}; 