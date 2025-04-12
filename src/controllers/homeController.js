import db from '../models/index.js';
import { Op } from 'sequelize';

let getHomePage = async (req, res) => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!req.session.user) {
        return res.redirect('/login');
    }

    // Lấy thông tin người dùng từ session
    const user = req.session.user;

    try {
        if (user.role === 'user') {
            // Lấy ngày đầu tiên và cuối cùng của tháng hiện tại
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            // Lấy ngày 6 tháng trước
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

            // Tìm tất cả các khoản phí trong tháng
            const fees = await db.Fee.findAll({
                where: {
                    userId: user.id,
                    feeDate: {
                        [Op.between]: [firstDayOfMonth, lastDayOfMonth]
                    }
                }
            });

            // Tính toán thống kê
            const monthlyStats = {
                totalAmount: fees.reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0),
                paidAmount: fees
                    .filter(fee => fee.feeStatus === 'đã thanh toán')
                    .reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0),
                unpaidAmount: fees
                    .filter(fee => fee.feeStatus === 'chưa thanh toán')
                    .reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0),
                totalCount: fees.length,
                paidCount: fees.filter(fee => fee.feeStatus === 'đã thanh toán').length,
                unpaidCount: fees.filter(fee => fee.feeStatus === 'chưa thanh toán').length
            };

            // Lấy dữ liệu cho biểu đồ 6 tháng
            const chartData = {};
            for (let i = 0; i < 6; i++) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
                const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
                const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

                const monthFees = await db.Fee.findAll({
                    where: {
                        userId: user.id,
                        feeDate: {
                            [Op.between]: [monthStart, monthEnd]
                        }
                    }
                });

                chartData[monthKey] = {
                    paid: monthFees
                        .filter(fee => fee.feeStatus === 'đã thanh toán')
                        .reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0),
                    unpaid: monthFees
                        .filter(fee => fee.feeStatus === 'chưa thanh toán')
                        .reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0)
                };
            }

            res.render('homepage', {
                user: user,
                monthlyStats: monthlyStats,
                currentMonth: now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
                chartData: chartData
            });
        } else if (user.role === 'admin') {
            // Lấy ngày đầu tiên và cuối cùng của tháng hiện tại
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            // Lấy tất cả người dùng và phí của họ trong tháng
            const users = await db.User.findAll({
                where: { role: 'user' },
                attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber'],
                include: [{
                    model: db.Fee,
                    where: {
                        feeDate: {
                            [Op.between]: [firstDayOfMonth, lastDayOfMonth]
                        }
                    },
                    required: false
                }]
            });

            // Tính toán thống kê tổng hợp
            const monthlyStats = {
                totalAmount: users.reduce((sum, user) =>
                    sum + (user.Fees?.reduce((feeSum, fee) => feeSum + parseFloat(fee.feeAmount), 0) || 0), 0),
                paidAmount: users.reduce((sum, user) =>
                    sum + (user.Fees?.filter(fee => fee.feeStatus === 'đã thanh toán')
                        .reduce((feeSum, fee) => feeSum + parseFloat(fee.feeAmount), 0) || 0), 0),
                unpaidAmount: users.reduce((sum, user) =>
                    sum + (user.Fees?.filter(fee => fee.feeStatus === 'chưa thanh toán')
                        .reduce((feeSum, fee) => feeSum + parseFloat(fee.feeAmount), 0) || 0), 0),
                totalCount: users.reduce((sum, user) => sum + (user.Fees?.length || 0), 0),
                paidCount: users.reduce((sum, user) =>
                    sum + (user.Fees?.filter(fee => fee.feeStatus === 'đã thanh toán').length || 0), 0),
                unpaidCount: users.reduce((sum, user) =>
                    sum + (user.Fees?.filter(fee => fee.feeStatus === 'chưa thanh toán').length || 0), 0)
            };

            // Lấy dữ liệu cho biểu đồ 6 tháng
            const chartData = {};
            for (let i = 0; i < 6; i++) {
                const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = month.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
                const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
                const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59);

                const monthFees = await db.Fee.findAll({
                    where: {
                        feeDate: {
                            [Op.between]: [monthStart, monthEnd]
                        }
                    }
                });

                chartData[monthKey] = {
                    paid: monthFees
                        .filter(fee => fee.feeStatus === 'đã thanh toán')
                        .reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0),
                    unpaid: monthFees
                        .filter(fee => fee.feeStatus === 'chưa thanh toán')
                        .reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0)
                };
            }

            res.render('homepage', {
                user: user,
                monthlyStats: monthlyStats,
                currentMonth: now.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
                chartData: chartData,
                users: users
            });
        }
    } catch (error) {
        console.error('Error getting homepage stats:', error);
        res.render('homepage', {
            user: user,
            monthlyStats: null,
            currentMonth: new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }),
            chartData: {},
            users: []
        });
    }
};

let getAboutPage = (req, res) => {
    return res.send("Trang giới thiệu");
};

export default {
    getHomePage,
    getAboutPage
};
