import db from "../models";
const telegramService = require('../services/telegramService');

let getAdminFeePage = async (req, res) => {
    try {
        // Fetch all users with their fees
        const users = await db.User.findAll({
            include: [{
                model: db.Fee,
                attributes: ['feeType', 'feeAmount', 'feeDescription', 'feeStatus', 'feeCreatedAt']
            }],
            order: [
                [db.Fee, 'feeCreatedAt', 'DESC'],
                ['createdAt', 'DESC']
            ]
        });

        // Transform user data
        const transformedUsers = users.map(user => {
            const plainUser = user.get({ plain: true });
            return {
                ...plainUser,
                fullName: `${plainUser.firstName} ${plainUser.lastName}`,
                createdAt: new Date(plainUser.createdAt).toLocaleDateString('vi-VN'),
                updatedAt: new Date(plainUser.updatedAt).toLocaleDateString('vi-VN')
            };
        });

        return res.render("admin-fee.ejs", {
            users: transformedUsers
        });
    } catch (e) {
        console.log(e);
        return res.status(500).send("Có lỗi xảy ra khi tải dữ liệu.");
    }
}

let createFee = async (req, res) => {
    try {
        let { feeName, feeAmount, feeDescription, userId } = req.body;

        // Validate required fields
        if (!feeName || !feeAmount || !userId) {
            return res.status(400).send("Vui lòng điền đầy đủ thông tin");
        }

        // Tính deadline (ví dụ: 30 ngày từ ngày tạo)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Create new fee with user association
        const newFee = await db.Fee.create({
            feeType: feeName,
            feeAmount: parseFloat(feeAmount),
            feeDescription: feeDescription || '',
            feeDate: new Date(),
            feeStatus: 'chưa thanh toán',
            userId: userId,
            feeCreatedAt: new Date(),
            feeUpdatedAt: new Date(),
            feeCreatedBy: req.session.user.email,
            feeUpdatedBy: req.session.user.email,
            deadline: dueDate
        });

        // Gửi thông báo qua Telegram
        try {
            await telegramService.sendNewFeeNotification(userId, {
                feeType: feeName,
                feeAmount: parseFloat(feeAmount),
                dueDate: dueDate
            });
        } catch (telegramError) {
            console.error('Error sending Telegram notification:', telegramError);
        }

        return res.redirect('/admin/fee');
    } catch (e) {
        console.log(e);
        return res.status(500).send("Có lỗi xảy ra khi tạo phí.");
    }
}

let updateFeeStatus = async (req, res) => {
    try {
        const feeId = req.params.id;
        const fee = await db.Fee.findByPk(feeId);

        if (!fee) {
            return res.status(404).send("Không tìm thấy khoản thu.");
        }

        // Toggle the status
        const newStatus = fee.feeStatus === 'chưa thanh toán' ? 'đã thanh toán' : 'chưa thanh toán';

        await db.Fee.update(
            {
                feeStatus: newStatus,
                feeUpdatedAt: new Date(),
                feeUpdatedBy: req.session.user.email
            },
            { where: { id: feeId } }
        );

        return res.status(200).json({ message: "Cập nhật trạng thái thành công" });
    } catch (e) {
        console.log(e);
        return res.status(500).send("Có lỗi xảy ra khi cập nhật trạng thái.");
    }
}

module.exports = {
    getAdminFeePage,
    createFee,
    updateFeeStatus
};