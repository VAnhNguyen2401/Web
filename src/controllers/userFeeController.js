import db from '../models/index.js';

let getFeePage = async (req, res) => {
    try {
        // Get the logged-in user's ID from session
        const userId = req.session.user.id;

        // Find all fees associated with this user
        const fees = await db.Fee.findAll({
            where: { userId: userId },
            order: [['feeCreatedAt', 'DESC']] // Sort by creation date, newest first
        });

        // Calculate total amount and pending amount
        const totalAmount = fees.reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0);
        const pendingFees = fees.filter(fee => fee.feeStatus === 'chưa thanh toán');
        const pendingAmount = pendingFees.reduce((sum, fee) => sum + parseFloat(fee.feeAmount), 0);

        return res.render("users/fee.ejs", {
            fees: fees,
            totalAmount: totalAmount,
            pendingAmount: pendingAmount,
            pendingCount: pendingFees.length,
            user: req.session.user
        });
    } catch (e) {
        console.log(e);
        return res.status(500).send("Có lỗi xảy ra khi tải dữ liệu.");
    }
};

let payFee = async (req, res) => {
    try {
        let feeId = req.params.id;
        let userId = req.session.user.id;

        // Find the fee and verify it belongs to the user
        let fee = await db.Fee.findOne({
            where: {
                id: feeId,
                userId: userId
            }
        });

        if (!fee) {
            return res.status(404).send("Không tìm thấy khoản thu hoặc không có quyền truy cập.");
        }

        if (fee.feeStatus === 'chưa thanh toán') {
            await db.Fee.update(
                {
                    feeStatus: 'đã thanh toán',
                    feeUpdatedAt: new Date(),
                    feeUpdatedBy: req.session.user.email
                },
                { where: { id: feeId } }
            );
        }

        return res.redirect('/fee');
    } catch (e) {
        console.log(e);
        return res.status(500).send("Có lỗi xảy ra khi nộp phí.");
    }
};

// Kiểm tra trạng thái thanh toán
let checkPaymentStatus = async (req, res) => {
    try {
        const feeId = req.params.feeId;
        const userId = req.session.user.id;

        // Kiểm tra xem khoản thu có thuộc về người dùng không
        const fee = await db.Fee.findOne({
            where: {
                id: feeId,
                userId: userId
            }
        });

        if (!fee) {
            return res.status(404).json({ error: 'Khoản thu không tồn tại' });
        }

        // TODO: Thêm logic kiểm tra trạng thái thanh toán thực tế từ ngân hàng
        // Hiện tại chỉ trả về trạng thái hiện tại trong database
        res.json({
            status: fee.feeStatus
        });
    } catch (error) {
        console.error('Error in checkPaymentStatus:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

// Cập nhật trạng thái thanh toán
let updatePaymentStatus = async (req, res) => {
    try {
        const feeId = req.params.feeId;
        const userId = req.session.user.id;

        // Kiểm tra xem khoản thu có thuộc về người dùng không
        const fee = await db.Fee.findOne({
            where: {
                id: feeId,
                userId: userId
            }
        });

        if (!fee) {
            return res.status(404).json({ error: 'Khoản thu không tồn tại' });
        }

        // Cập nhật trạng thái thanh toán
        await db.Fee.update(
            {
                feeStatus: 'đã thanh toán',
                feeUpdatedAt: new Date(),
                feeUpdatedBy: req.session.user.email
            },
            { where: { id: feeId } }
        );

        res.json({
            success: true,
            message: 'Cập nhật trạng thái thanh toán thành công'
        });
    } catch (error) {
        console.error('Error in updatePaymentStatus:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export default {
    getFeePage,
    payFee,
    checkPaymentStatus,
    updatePaymentStatus
};
