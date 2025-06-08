const nodemailer = require('nodemailer');
const ejs = require('ejs');
const path = require('path');

// Cấu hình email transporter
const createTransporter = () => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email configuration missing');
    }

    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

// Render template email
const renderEmailTemplate = async (templateName, data) => {
    const templatePath = path.join(__dirname, '..', 'views', 'emails', `${templateName}.ejs`);
    return await ejs.renderFile(templatePath, data);
};

// Template email thông báo khoản thu mới
const createFeeNotificationEmail = async (userInfo, feeInfo) => {
    const { firstName, lastName, email } = userInfo;
    const { feeType, feeAmount, feeDescription, deadline } = feeInfo;

    const formattedAmount = parseInt(feeAmount).toLocaleString('vi-VN');
    const formattedDeadline = new Date(deadline).toLocaleDateString('vi-VN');

    const emailData = {
        firstName,
        lastName,
        feeType,
        feeAmount,
        feeDescription,
        formattedAmount,
        formattedDeadline,
        appUrl: process.env.APP_URL || 'http://localhost:8080'
    };

    const htmlContent = await renderEmailTemplate('fee-notification', emailData);

    return {
        from: process.env.EMAIL_USER || 'noreply@chungcu.com',
        to: email,
        subject: `🏢 Thông báo khoản thu mới - ${feeType}`,
        html: htmlContent
    };
};

// Gửi email thông báo khoản thu mới
const sendFeeNotification = async (userInfo, feeInfo) => {
    try {
        const transporter = createTransporter();
        const mailOptions = await createFeeNotificationEmail(userInfo, feeInfo);

        const result = await transporter.sendMail(mailOptions);

        return {
            success: true,
            messageId: result.messageId,
            recipient: userInfo.email
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            recipient: userInfo.email
        };
    }
};

// Gửi email thông báo cho nhiều người dùng (bulk)
const sendBulkFeeNotifications = async (notifications) => {
    const results = [];

    for (const notification of notifications) {
        const result = await sendFeeNotification(notification.userInfo, notification.feeInfo);
        results.push({
            userId: notification.userInfo.id,
            email: notification.userInfo.email,
            feeType: notification.feeInfo.feeType,
            ...result
        });

        // Thêm delay nhỏ để tránh spam email
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
};

module.exports = {
    sendFeeNotification,
    sendBulkFeeNotifications,
    createFeeNotificationEmail,
    renderEmailTemplate
}; 