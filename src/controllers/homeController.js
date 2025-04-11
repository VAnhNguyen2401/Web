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
            const now = new Date('2025-04-11'); // Sử dụng ngày cố định để phù hợp với dữ liệu mẫu
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            // Lấy ngày 6 tháng trước
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

            console.log('Debug - Date Range:', {
                sixMonthsAgo: sixMonthsAgo.toISOString().split('T')[0],
                lastDayOfMonth: lastDayOfMonth.toISOString().split('T')[0]
            });

            // Tìm tất cả các khoản phí trong tháng hiện tại
            const monthlyFees = await db.Fee.findAll({
                where: {
                    userId: user.id,
                    feeDate: {
                        [Op.between]: [
                            firstDayOfMonth.toISOString().split('T')[0],
                            lastDayOfMonth.toISOString().split('T')[0]
                        ]
                    }
                }
            });

            // Tìm tất cả các khoản phí trong 6 tháng gần nhất
            const sixMonthsFees = await db.Fee.findAll({
                where: {
                    userId: user.id,
                    feeDate: {
                        [Op.between]: [
                            sixMonthsAgo.toISOString().split('T')[0],
                            lastDayOfMonth.toISOString().split('T')[0]
                        ]
                    }
                },
                order: [['feeDate', 'ASC']]
            });

            console.log('Debug - Found Fees:', {
                userId: user.id,
                totalFees: sixMonthsFees.length,
                fees: sixMonthsFees.map(f => ({
                    feeDate: f.feeDate,
                    amount: f.feeAmount,
                    status: f.feeStatus
                }))
            });

            // Tạo dữ liệu cho biểu đồ
            const monthlyData = {};
            for (let i = 0; i < 6; i++) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
                monthlyData[monthKey] = {
                    paid: 0,
                    unpaid: 0
                };
            }

            // Phân loại các khoản phí theo tháng
            sixMonthsFees.forEach(fee => {
                const feeDate = new Date(fee.feeDate);
                const monthKey = feeDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
                if (monthlyData[monthKey]) {
                    if (fee.feeStatus === 'đã thanh toán') {
                        monthlyData[monthKey].paid += parseFloat(fee.feeAmount);
                    } else {
                        monthlyData[monthKey].unpaid += parseFloat(fee.feeAmount);
                    }
                }
            });

            console.log('Debug - Chart Data:', monthlyData);

            // Tính tổng số tiền và số khoản phí đã/chưa thanh toán trong tháng
            const monthlyStats = {
                totalAmount: monthlyFees.reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0),
                paidAmount: monthlyFees
                    .filter(fee => fee.feeStatus === 'đã thanh toán')
                    .reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0),
                unpaidAmount: monthlyFees
                    .filter(fee => fee.feeStatus === 'chưa thanh toán')
                    .reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0),
                totalCount: monthlyFees.length,
                paidCount: monthlyFees.filter(fee => fee.feeStatus === 'đã thanh toán').length,
                unpaidCount: monthlyFees.filter(fee => fee.feeStatus === 'chưa thanh toán').length
            };

            // Render trang chủ với thông tin thống kê
            return res.render("homepage.ejs", {
                user: user,
                monthlyStats: monthlyStats,
                currentMonth: now.toLocaleString('vi-VN', { month: 'long', year: 'numeric' }),
                chartData: monthlyData
            });
        } else if (user.role === 'admin') {
            // Lấy ngày đầu tiên và cuối cùng của tháng hiện tại
            const now = new Date('2025-04-11');
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

            // Lấy ngày 6 tháng trước
            const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

            // Lấy tất cả người dùng
            const users = await db.User.findAll({
                where: { role: 'user' },
                include: [{
                    model: db.Fee,
                    where: {
                        feeDate: {
                            [Op.between]: [
                                firstDayOfMonth.toISOString().split('T')[0],
                                lastDayOfMonth.toISOString().split('T')[0]
                            ]
                        }
                    },
                    required: false
                }]
            });

            // Lấy tất cả phí trong 6 tháng gần nhất
            const sixMonthsFees = await db.Fee.findAll({
                where: {
                    feeDate: {
                        [Op.between]: [
                            sixMonthsAgo.toISOString().split('T')[0],
                            lastDayOfMonth.toISOString().split('T')[0]
                        ]
                    }
                },
                include: [{
                    model: db.User,
                    where: { role: 'user' }
                }],
                order: [['feeDate', 'ASC']]
            });

            // Tạo dữ liệu cho biểu đồ
            const monthlyData = {};
            for (let i = 0; i < 6; i++) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = date.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
                monthlyData[monthKey] = {
                    paid: 0,
                    unpaid: 0
                };
            }

            // Phân loại các khoản phí theo tháng
            sixMonthsFees.forEach(fee => {
                const feeDate = new Date(fee.feeDate);
                const monthKey = feeDate.toLocaleString('vi-VN', { month: 'long', year: 'numeric' });
                if (monthlyData[monthKey]) {
                    if (fee.feeStatus === 'đã thanh toán') {
                        monthlyData[monthKey].paid += parseFloat(fee.feeAmount);
                    } else {
                        monthlyData[monthKey].unpaid += parseFloat(fee.feeAmount);
                    }
                }
            });

            // Tính tổng số tiền và số khoản phí đã/chưa thanh toán trong tháng
            const monthlyStats = {
                totalAmount: sixMonthsFees.reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0),
                paidAmount: sixMonthsFees
                    .filter(fee => fee.feeStatus === 'đã thanh toán')
                    .reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0),
                unpaidAmount: sixMonthsFees
                    .filter(fee => fee.feeStatus === 'chưa thanh toán')
                    .reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0),
                totalCount: sixMonthsFees.length,
                paidCount: sixMonthsFees.filter(fee => fee.feeStatus === 'đã thanh toán').length,
                unpaidCount: sixMonthsFees.filter(fee => fee.feeStatus === 'chưa thanh toán').length
            };

            // Render trang chủ với thông tin thống kê
            return res.render("homepage.ejs", {
                user: user,
                users: users,
                monthlyStats: monthlyStats,
                currentMonth: now.toLocaleString('vi-VN', { month: 'long', year: 'numeric' }),
                chartData: monthlyData
            });
        }

        // Nếu không phải user hoặc admin, render trang chủ bình thường
        return res.render("homepage.ejs", {
            user: user
        });
    } catch (error) {
        console.error('Error getting homepage stats:', error);
        return res.render("homepage.ejs", {
            user: user,
            error: 'Có lỗi xảy ra khi tải dữ liệu thống kê'
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
