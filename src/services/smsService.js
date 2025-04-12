const twilio = require('twilio');
require('dotenv').config();

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

const sendSMS = async (to, message) => {
    try {
        const result = await client.messages.create({
            body: message,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: to
        });
        console.log('SMS sent successfully:', result.sid);
        return true;
    } catch (error) {
        console.error('Error sending SMS:', error);
        return false;
    }
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
};

const sendPaymentConfirmation = async (phoneNumber, amount) => {
    const formattedAmount = formatCurrency(amount);
    const message = `Cảm ơn bạn đã thanh toán khoản phí ${formattedAmount}. Chúc bạn một ngày tốt lành!`;
    return await sendSMS(phoneNumber, message);
};

const sendPaymentReminder = async (phoneNumber, amount, dueDate) => {
    const formattedAmount = formatCurrency(amount);
    const formattedDate = new Date(dueDate).toLocaleDateString('vi-VN');
    const message = `Nhắc nhở: Bạn có một khoản phí ${formattedAmount} cần thanh toán trước ngày ${formattedDate}. Vui lòng thanh toán đúng hạn.`;
    return await sendSMS(phoneNumber, message);
};

module.exports = {
    sendSMS,
    sendPaymentConfirmation,
    sendPaymentReminder
}; 