const db = require('../models');
const emailService = require('../services/emailService');

// API để gửi thông báo email cho một khoản thu cụ thể
const sendFeeNotificationEmail = async (req, res) => {
    try {
        const { feeId } = req.params;

        // Tìm thông tin khoản thu và người dùng
        const fee = await db.Fee.findOne({
            where: { id: feeId },
            include: [{
                model: db.User,
                attributes: ['id', 'firstName', 'lastName', 'email']
            }]
        });

        if (!fee) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy khoản thu'
            });
        }

        if (!fee.User) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng'
            });
        }

        // Chuẩn bị thông tin để gửi email
        const userInfo = {
            id: fee.User.id,
            firstName: fee.User.firstName,
            lastName: fee.User.lastName,
            email: fee.User.email
        };

        const feeInfo = {
            feeType: fee.feeType,
            feeAmount: fee.feeAmount,
            feeDescription: fee.feeDescription,
            deadline: fee.deadline
        };

        // Gửi email
        const result = await emailService.sendFeeNotification(userInfo, feeInfo);

        if (result.success) {
            return res.status(200).json({
                success: true,
                message: 'Email thông báo đã được gửi thành công',
                data: {
                    recipient: result.recipient,
                    messageId: result.messageId,
                    feeType: fee.feeType,
                    feeAmount: fee.feeAmount
                }
            });
        } else {
            return res.status(500).json({
                success: false,
                message: 'Không thể gửi email thông báo',
                error: result.error
            });
        }

    } catch (error) {
        console.error('Lỗi khi gửi email thông báo:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi gửi email thông báo',
            error: error.message
        });
    }
};

// API để gửi thông báo email cho tất cả khoản thu chưa thanh toán của một user
const sendAllPendingFeesNotification = async (req, res) => {
    try {
        const { userId } = req.params;

        // Tìm user và tất cả khoản thu chưa thanh toán
        const user = await db.User.findOne({
            where: { id: userId },
            include: [{
                model: db.Fee,
                where: { feeStatus: 'chưa thanh toán' },
                required: false
            }]
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy người dùng'
            });
        }

        const pendingFees = user.Fees || [];

        if (pendingFees.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Người dùng không có khoản thu nào cần thanh toán',
                data: { pendingCount: 0 }
            });
        }

        // Chuẩn bị danh sách thông báo
        const notifications = pendingFees.map(fee => ({
            userInfo: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            },
            feeInfo: {
                feeType: fee.feeType,
                feeAmount: fee.feeAmount,
                feeDescription: fee.feeDescription,
                deadline: fee.deadline
            }
        }));

        // Gửi email cho tất cả khoản thu
        const results = await emailService.sendBulkFeeNotifications(notifications);

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;

        return res.status(200).json({
            success: true,
            message: `Đã gửi ${successCount} email thành công, ${failCount} email thất bại`,
            data: {
                totalFees: pendingFees.length,
                successCount,
                failCount,
                results
            }
        });

    } catch (error) {
        console.error('Lỗi khi gửi email thông báo tất cả khoản thu:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi gửi email thông báo',
            error: error.message
        });
    }
};

// API để gửi thông báo email cho tất cả user có khoản thu chưa thanh toán
const sendBulkNotificationToAllUsers = async (req, res) => {
    try {
        // Tìm tất cả user có khoản thu chưa thanh toán
        const usersWithPendingFees = await db.User.findAll({
            include: [{
                model: db.Fee,
                where: { feeStatus: 'chưa thanh toán' },
                required: true
            }]
        });

        if (usersWithPendingFees.length === 0) {
            return res.status(200).json({
                success: true,
                message: 'Không có người dùng nào có khoản thu cần thanh toán',
                data: { userCount: 0 }
            });
        }

        // Chuẩn bị danh sách thông báo
        const allNotifications = [];

        usersWithPendingFees.forEach(user => {
            user.Fees.forEach(fee => {
                allNotifications.push({
                    userInfo: {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email
                    },
                    feeInfo: {
                        feeType: fee.feeType,
                        feeAmount: fee.feeAmount,
                        feeDescription: fee.feeDescription,
                        deadline: fee.deadline
                    }
                });
            });
        });

        // Gửi email cho tất cả
        const results = await emailService.sendBulkFeeNotifications(allNotifications);

        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        const uniqueUsers = [...new Set(results.map(r => r.email))].length;

        return res.status(200).json({
            success: true,
            message: `Đã gửi thông báo đến ${uniqueUsers} người dùng với ${successCount} email thành công, ${failCount} email thất bại`,
            data: {
                totalUsers: uniqueUsers,
                totalNotifications: allNotifications.length,
                successCount,
                failCount,
                summary: results.reduce((acc, r) => {
                    const key = r.email;
                    if (!acc[key]) {
                        acc[key] = { email: key, successCount: 0, failCount: 0 };
                    }
                    if (r.success) acc[key].successCount++;
                    else acc[key].failCount++;
                    return acc;
                }, {})
            }
        });

    } catch (error) {
        console.error('Lỗi khi gửi email thông báo hàng loạt:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi gửi email thông báo hàng loạt',
            error: error.message
        });
    }
};

// API để lấy danh sách người dùng có email và khoản thu chưa thanh toán
const getUsersWithPendingFees = async (req, res) => {
    try {
        const usersWithPendingFees = await db.User.findAll({
            attributes: ['id', 'firstName', 'lastName', 'email'],
            include: [{
                model: db.Fee,
                where: { feeStatus: 'chưa thanh toán' },
                attributes: ['id', 'feeType', 'feeAmount', 'feeDescription', 'deadline'],
                required: true
            }]
        });

        const summary = usersWithPendingFees.map(user => ({
            userId: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            pendingFeesCount: user.Fees.length,
            totalAmount: user.Fees.reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0),
            fees: user.Fees.map(fee => ({
                id: fee.id,
                type: fee.feeType,
                amount: fee.feeAmount,
                description: fee.feeDescription,
                deadline: fee.deadline
            }))
        }));

        return res.status(200).json({
            success: true,
            message: `Tìm thấy ${usersWithPendingFees.length} người dùng có khoản thu chưa thanh toán`,
            data: {
                userCount: usersWithPendingFees.length,
                totalPendingFees: summary.reduce((sum, user) => sum + user.pendingFeesCount, 0),
                users: summary
            }
        });

    } catch (error) {
        console.error('Lỗi khi lấy danh sách người dùng có khoản thu chưa thanh toán:', error);
        return res.status(500).json({
            success: false,
            message: 'Đã xảy ra lỗi khi lấy danh sách',
            error: error.message
        });
    }
};

module.exports = {
    sendFeeNotificationEmail,
    sendAllPendingFeesNotification,
    sendBulkNotificationToAllUsers,
    getUsersWithPendingFees
}; 