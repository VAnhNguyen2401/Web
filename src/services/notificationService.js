import db from '../models/index.js';
import { Op } from 'sequelize';
import smsService from './smsService.js';

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

            // Gửi thông báo cho từng khoản phí
            for (const fee of unpaidFees) {
                await this.sendNotification(fee);
            }

            return unpaidFees.length;
        } catch (error) {
            console.error('Error checking notifications:', error);
            throw error;
        }
    }

    async sendNotification(fee) {
        try {
            const user = fee.User;

            // Gửi SMS thông báo
            if (user.phoneNumber) {
                await smsService.sendFeeNotification(user, fee);
            }

            // Cập nhật trạng thái thông báo
            await fee.update({
                notificationSent: true,
                lastNotificationDate: new Date()
            });

            return true;
        } catch (error) {
            console.error('Error sending notification:', error);
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