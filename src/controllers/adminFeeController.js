import db from "../models";

let getAdminFeePage = async (req, res) => {
    try {
        // Fetch all users with their associated fees
        const users = await db.User.findAll({
            include: [{
                model: db.Fee,
                where: { userId: db.Sequelize.col('User.id') }, // Only include fees belonging to each user
                required: false // LEFT JOIN to show users even if they have no fees
            }],
            attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'createdAt', 'updatedAt']
        });

        // Transform data before sending to view
        const transformedUsers = users.map(user => {
            const plainUser = user.get({ plain: true });
            return {
                ...plainUser,
                fullName: `${plainUser.firstName} ${plainUser.lastName}`,
                Fees: plainUser.Fees || []
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

        // Create new fee with user association
        await db.Fee.create({
            feeType: feeName,
            feeAmount: parseFloat(feeAmount),
            feeDescription: feeDescription || '',
            feeDate: new Date(),
            feeStatus: 'chưa thanh toán',
            userId: userId, // Associate with user
            feeCreatedAt: new Date(),
            feeUpdatedAt: new Date(),
            feeCreatedBy: req.session.user.email, // Track who created the fee
            feeUpdatedBy: req.session.user.email
        });

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