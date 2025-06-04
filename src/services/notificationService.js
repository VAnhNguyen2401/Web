import db from '../models/index.js';
import { Op } from 'sequelize';

class NotificationService {
    async checkAndSendNotifications() {
        try {
            // Lấy tất cả các khoản phí chưa thanh toán và chưa gửi thông báo
            const unpaidFees = await db.Fee.findAll({
                where: {
                    feeStatus: 'chưa thanh toán',
                    deadline: {
                        [Op.lte]: new Date() // Hạn nộp đã đến
                    },
                    notificationSent: false
                },
                include: [{
                    model: db.User,
                    attributes: ['id', 'email', 'firstName', 'lastName', 'phoneNumber']
                }]
            });

            // Chỉ cập nhật trạng thái thông báo mà không gửi SMS
            for (const fee of unpaidFees) {
                await this.markNotificationSent(fee);
            }

            return unpaidFees.length;
        } catch (error) {
            console.error('Error checking notifications:', error);
            throw error;
        }
    }

    async markNotificationSent(fee) {
        try {
            // Chỉ cập nhật trạng thái thông báo đã gửi
            await fee.update({
                notificationSent: true,
                lastNotificationDate: new Date()
            });

            return true;
        } catch (error) {
            console.error('Error marking notification sent:', error);
            throw error;
        }
    }

    async getUpcomingFees(userId) {
        try {
            const now = new Date();
            const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

            return await db.Fee.findAll({
                where: {
                    userId,
                    feeStatus: 'chưa thanh toán',
                    deadline: {
                        [Op.between]: [now, sevenDaysFromNow]
                    }
                },
                order: [['deadline', 'ASC']]
            });
        } catch (error) {
            console.error('Error getting upcoming fees:', error);
            throw error;
        }
    }
}

export default new NotificationService(); 