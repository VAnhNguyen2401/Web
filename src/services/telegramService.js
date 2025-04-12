const TelegramBot = require('node-telegram-bot-api');
const db = require('../models');
require('dotenv').config();

let bot = null;

try {
    // Khởi tạo bot nếu chưa được khởi tạo
    if (!bot) {
        console.log('Initializing Telegram bot...');
        bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, {
            polling: true,
            webHook: false
        });
        console.log('Telegram bot initialized successfully');
    }
} catch (error) {
    console.error('Error initializing Telegram bot:', error);
    process.exit(1);
}

// Lưu trữ chat_id của người dùng
const saveTelegramChatId = async (email, chatId) => {
    try {
        const user = await db.User.findOne({ where: { email } });
        if (user) {
            await user.update({ telegramChatId: chatId });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error saving telegram chat ID:', error);
        return false;
    }
};

// Format số tiền sang định dạng VND
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

// Gửi thông báo khoản phí mới
const sendNewFeeNotification = async (userId, feeData) => {
    try {
        const user = await db.User.findByPk(userId);
        if (user && user.telegramChatId) {
            const message = `🔔 *Thông báo khoản phí mới*\n\n`
                + `Kính gửi ${user.firstName} ${user.lastName},\n\n`
                + `Bạn có một khoản phí mới:\n`
                + `- Loại phí: ${feeData.feeType}\n`
                + `- Số tiền: ${formatCurrency(feeData.feeAmount)}\n`
                + `- Hạn thanh toán: ${new Date(feeData.dueDate).toLocaleDateString('vi-VN')}\n\n`
                + `Vui lòng thanh toán trước hạn để tránh phí phạt.`;

            await bot.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error sending new fee notification:', error);
        return false;
    }
};

// Gửi thông báo thanh toán thành công
const sendPaymentSuccessNotification = async (userId, feeData) => {
    try {
        const user = await db.User.findByPk(userId);
        if (user && user.telegramChatId) {
            const message = `✅ *Thanh toán thành công*\n\n`
                + `Kính gửi ${user.firstName} ${user.lastName},\n\n`
                + `Cảm ơn bạn đã thanh toán:\n`
                + `- Loại phí: ${feeData.feeType}\n`
                + `- Số tiền: ${formatCurrency(feeData.feeAmount)}\n`
                + `- Ngày thanh toán: ${new Date().toLocaleDateString('vi-VN')}\n\n`
                + `Cảm ơn bạn đã sử dụng dịch vụ!`;

            await bot.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error sending payment success notification:', error);
        return false;
    }
};

// Gửi nhắc nhở thanh toán
const sendPaymentReminder = async (userId, feeData) => {
    try {
        const user = await db.User.findByPk(userId);
        if (user && user.telegramChatId) {
            const message = `⚠️ *Nhắc nhở thanh toán*\n\n`
                + `Kính gửi ${user.firstName} ${user.lastName},\n\n`
                + `Bạn có một khoản phí sắp đến hạn thanh toán:\n`
                + `- Loại phí: ${feeData.feeType}\n`
                + `- Số tiền: ${formatCurrency(feeData.feeAmount)}\n`
                + `- Hạn thanh toán: ${new Date(feeData.dueDate).toLocaleDateString('vi-VN')}\n\n`
                + `Vui lòng thanh toán để tránh phí phạt.`;

            await bot.sendMessage(user.telegramChatId, message, { parse_mode: 'Markdown' });
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error sending payment reminder:', error);
        return false;
    }
};

// Xử lý khi người dùng bắt đầu chat với bot
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const message = `👋 *Chào mừng bạn đến với Hệ thống thu phí chung cư*\n\n`
        + `Để kết nối với tài khoản của bạn, vui lòng gửi email bạn đã đăng ký với hệ thống.\n\n`
        + `_Ví dụ: example@gmail.com_`;

    bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
});

// Xử lý khi người dùng gửi email
bot.on('message', async (msg) => {
    if (msg.text === '/start') return;

    const chatId = msg.chat.id;
    const email = msg.text;

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        bot.sendMessage(chatId, '❌ Email không hợp lệ. Vui lòng gửi lại email đúng định dạng.');
        return;
    }

    // Lưu chat_id
    const success = await saveTelegramChatId(email, chatId);
    if (success) {
        const message = `✅ *Liên kết tài khoản thành công!*\n\n`
            + `Từ giờ bạn sẽ nhận được thông báo về:\n`
            + `- Khoản phí mới\n`
            + `- Nhắc nhở thanh toán\n`
            + `- Xác nhận thanh toán thành công\n\n`
            + `Cảm ơn bạn đã sử dụng dịch vụ! 🙏`;

        bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    } else {
        bot.sendMessage(chatId, '❌ Không tìm thấy tài khoản với email này. Vui lòng kiểm tra lại.');
    }
});

module.exports = {
    sendNewFeeNotification,
    sendPaymentSuccessNotification,
    sendPaymentReminder
}; 