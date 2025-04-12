import notificationService from '../services/notificationService.js';
import cron from 'node-cron';

class NotificationJob {
    start() {
        // Chạy kiểm tra thông báo mỗi ngày vào lúc 9:00 sáng
        cron.schedule('0 9 * * *', async () => {
            console.log('Running notification check...');
            try {
                const count = await notificationService.checkAndSendNotifications();
                console.log(`Sent ${count} notifications`);
            } catch (error) {
                console.error('Error in notification job:', error);
            }
        });
    }
}

export default new NotificationJob(); 