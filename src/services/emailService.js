const nodemailer = require('nodemailer');

// Cấu hình email transporter
const createTransporter = () => {
    console.log('🔧 Đang tạo email transporter...');
    console.log('📧 Email config:', {
        service: 'gmail',
        user: process.env.EMAIL_USER || 'NOT_CONFIGURED',
        hasPassword: !!(process.env.EMAIL_PASS)
    });

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error('❌ THIẾU CÀI ĐẶT EMAIL! Vui lòng kiểm tra file .env');
        console.error('📝 Cần có: EMAIL_USER và EMAIL_PASS trong file .env');
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

// Template email thông báo khoản thu mới
const createFeeNotificationEmail = (userInfo, feeInfo) => {
    const { firstName, lastName, email } = userInfo;
    const { feeType, feeAmount, feeDescription, deadline } = feeInfo;

    const formattedAmount = parseInt(feeAmount).toLocaleString('vi-VN');
    const formattedDeadline = new Date(deadline).toLocaleDateString('vi-VN');

    return {
        from: process.env.EMAIL_USER || 'noreply@chungcu.com',
        to: email,
        subject: `🏢 Thông báo khoản thu mới - ${feeType}`,
        html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 15px;">
                        <span style="font-size: 36px; color: white;">🏢</span>
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                        Thông báo khoản thu mới
                    </h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                        Hệ thống quản lý chung cư
                    </p>
                </div>
                
                <!-- Content -->
                <div style="background: white; padding: 40px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Greeting -->
                    <div style="margin-bottom: 30px;">
                        <h2 style="color: #1e293b; margin: 0 0 10px 0; font-size: 24px;">
                            Xin chào ${firstName} ${lastName}!
                        </h2>
                        <p style="color: #64748b; margin: 0; font-size: 16px; line-height: 1.5;">
                            Bạn có một khoản thu mới cần thanh toán. Vui lòng xem thông tin chi tiết bên dưới:
                        </p>
                    </div>
                    
                    <!-- Fee Details Card -->
                    <div style="background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 5px solid #2563eb;">
                        <div style="display: flex; align-items: center; margin-bottom: 20px;">
                            <span style="font-size: 24px; margin-right: 12px;">💰</span>
                            <h3 style="color: #1e293b; margin: 0; font-size: 20px; font-weight: 600;">
                                Thông tin khoản thu
                            </h3>
                        </div>
                        
                        <div style="space-y: 15px;">
                            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #64748b; font-weight: 500;">Loại phí:</span>
                                <span style="color: #1e293b; font-weight: 600;">${feeType}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #64748b; font-weight: 500;">Số tiền:</span>
                                <span style="color: #dc2626; font-weight: 700; font-size: 18px;">${formattedAmount} VNĐ</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
                                <span style="color: #64748b; font-weight: 500;">Hạn thanh toán:</span>
                                <span style="color: #ea580c; font-weight: 600;">${formattedDeadline}</span>
                            </div>
                            ${feeDescription ? `
                            <div style="padding: 12px 0;">
                                <span style="color: #64748b; font-weight: 500;">Mô tả:</span>
                                <p style="color: #1e293b; margin: 8px 0 0 0; line-height: 1.5;">${feeDescription}</p>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <!-- Action Button -->
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${process.env.APP_URL || 'http://localhost:3000'}/fee" 
                           style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: all 0.3s ease;">
                            🔗 Xem chi tiết và thanh toán
                        </a>
                    </div>
                    
                    <!-- Important Notice -->
                    <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 25px 0;">
                        <div style="display: flex; align-items: flex-start;">
                            <span style="font-size: 20px; margin-right: 10px; margin-top: 2px;">⚠️</span>
                            <div>
                                <h4 style="color: #92400e; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">
                                    Lưu ý quan trọng
                                </h4>
                                <ul style="color: #92400e; margin: 0; padding-left: 20px; line-height: 1.6;">
                                    <li>Vui lòng thanh toán đúng hạn để tránh phí trễ hạn</li>
                                    <li>Sau hạn thanh toán, sẽ áp dụng phí trễ hạn 5% trên tổng số tiền</li>
                                    <li>Liên hệ ban quản lý nếu có thắc mắc</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="border-top: 1px solid #e2e8f0; padding-top: 25px; margin-top: 30px; text-align: center;">
                        <p style="color: #64748b; margin: 0 0 10px 0; font-size: 14px;">
                            Email này được gửi tự động từ hệ thống quản lý chung cư
                        </p>
                        <p style="color: #64748b; margin: 0; font-size: 14px;">
                            Nếu bạn có thắc mắc, vui lòng liên hệ ban quản lý hoặc trả lời email này
                        </p>
                    </div>
                </div>
            </div>
        `
    };
};

// Gửi email thông báo khoản thu mới
const sendFeeNotification = async (userInfo, feeInfo) => {
    try {
        console.log(`📤 Bắt đầu gửi email thông báo cho ${userInfo.email}`);
        console.log('📋 Thông tin khoản thu:', {
            feeType: feeInfo.feeType,
            amount: feeInfo.feeAmount,
            recipient: userInfo.email
        });

        const transporter = createTransporter();
        const mailOptions = createFeeNotificationEmail(userInfo, feeInfo);

        console.log('📬 Đang gửi email...');
        const result = await transporter.sendMail(mailOptions);

        console.log(`✅ Email thông báo khoản thu đã được gửi thành công tới ${userInfo.email}`);
        console.log(`📨 Message ID: ${result.messageId}`);

        return {
            success: true,
            messageId: result.messageId,
            recipient: userInfo.email
        };
    } catch (error) {
        console.error('❌ Lỗi khi gửi email thông báo khoản thu:');
        console.error('📧 Email người nhận:', userInfo.email);
        console.error('🔍 Chi tiết lỗi:', error.message);
        console.error('📊 Full error:', error);

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
    createFeeNotificationEmail
}; 