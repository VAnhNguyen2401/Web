const db = require('../models');
const smsService = require('../services/smsService');

let getFeePage = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const user = req.session.user;
    try {
        const fees = await db.Fee.findAll({
            where: { userId: user.id },
            order: [['feeDate', 'DESC']]
        });

        // Kiểm tra và cập nhật trạng thái quá hạn
        const now = new Date();
        for (const fee of fees) {
            if (now > fee.deadline && fee.feeStatus === 'chưa thanh toán') {
                await fee.update({
                    isOverdue: true,
                    feeStatus: 'quá hạn',
                    lateFee: fee.feeAmount * 0.05 // Phí trễ hạn 5%
                });
            }
        }

        // Lấy lại danh sách phí đã cập nhật
        const updatedFees = await db.Fee.findAll({
            where: { userId: user.id },
            order: [['feeDate', 'DESC']]
        });

        res.render('fee', {
            user: user,
            fees: updatedFees
        });
    } catch (error) {
        console.error('Error fetching fees:', error);
        res.status(500).send('Lỗi khi tải dữ liệu');
    }
};

let payFee = async (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    const user = req.session.user;
    const feeId = req.params.id;

    try {
        const fee = await db.Fee.findOne({
            where: {
                id: feeId,
                userId: user.id
            }
        });

        if (!fee) {
            return res.status(404).send('Không tìm thấy khoản phí');
        }

        // Kiểm tra xem khoản phí đã được thanh toán chưa
        if (fee.feeStatus === 'đã thanh toán') {
            return res.status(400).send('Khoản phí này đã được thanh toán');
        }

        // Tính tổng số tiền cần thanh toán (bao gồm phí trễ hạn nếu có)
        const totalAmount = fee.isOverdue ? fee.feeAmount + fee.lateFee : fee.feeAmount;

        // Cập nhật trạng thái thanh toán
        await fee.update({
            feeStatus: 'đã thanh toán',
            paymentDate: new Date(),
            paidAmount: totalAmount
        });

        // Gửi thông báo SMS nếu người dùng có số điện thoại
        if (user.phoneNumber) {
            const message = `Cảm ơn bạn đã thanh toán khoản phí ${fee.feeName}. Số tiền: ${totalAmount.toLocaleString('vi-VN')} VNĐ`;
            try {
                await smsService.sendSMS(user.phoneNumber, message);
            } catch (smsError) {
                console.error('Error sending SMS:', smsError);
            }
        }

        res.redirect('/fee');
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).send('Lỗi khi xử lý thanh toán');
    }
};

module.exports = {
    getFeePage: getFeePage,
    payFee: payFee
}; 