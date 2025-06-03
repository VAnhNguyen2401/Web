import db from "../models";

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
        console.log("Đang xử lý yêu cầu tạo khoản phí mới...");
        let { feeName, feeAmount, feeDescription, userId } = req.body;
        console.log("Dữ liệu nhận được:", { feeName, feeAmount, feeDescription, userId });

        // Validate required fields
        if (!feeName || !feeAmount || !userId) {
            console.log("Thiếu dữ liệu bắt buộc:", { feeName, feeAmount, userId });
            return res.status(400).send("Vui lòng điền đầy đủ thông tin");
        }

        // Đảm bảo feeAmount là số
        feeAmount = parseFloat(feeAmount);
        if (isNaN(feeAmount) || feeAmount <= 0) {
            console.log("Số tiền không hợp lệ:", feeAmount);
            return res.status(400).send("Số tiền không hợp lệ");
        }

        // Kiểm tra giới hạn số tiền để tránh overflow
        if (feeAmount > 999999999) {
            console.log("Số tiền quá lớn:", feeAmount);
            return res.status(400).send("Số tiền quá lớn, vui lòng nhập giá trị nhỏ hơn 1 tỷ");
        }

        try {
            // Tạo ngày hiện tại và ngày hạn chót (15 ngày sau)
            const currentDate = new Date();
            const deadlineDate = new Date(currentDate);
            deadlineDate.setDate(deadlineDate.getDate() + 15);

            // Format ngày thành chuỗi SQL Server có thể hiểu được: YYYY-MM-DD
            const formattedCurrentDate = currentDate.toISOString().split('T')[0];
            const formattedDeadlineDate = deadlineDate.toISOString().split('T')[0];

            console.log("Dữ liệu ngày tháng:", {
                currentDate: formattedCurrentDate,
                deadlineDate: formattedDeadlineDate
            });

            // Sử dụng SQL query với tham số được đặt tên rõ ràng
            const insertQuery = `
                INSERT INTO Fees (
                    feeType, feeAmount, feeDescription, feeStatus, 
                    userId, feeCreatedBy, feeUpdatedBy, feeDate,
                    feeCreatedAt, feeUpdatedAt, deadline, lateFee, isOverdue
                ) 
                VALUES (
                    :feeType, :feeAmount, :feeDescription, :feeStatus, 
                    :userId, :feeCreatedBy, :feeUpdatedBy, GETDATE(),
                    GETDATE(), GETDATE(), DATEADD(day, 15, GETDATE()), :lateFee, :isOverdue
                );
                SELECT SCOPE_IDENTITY() AS id;
            `;

            // Thực hiện truy vấn với tham số
            const [results] = await db.sequelize.query(insertQuery, {
                replacements: {
                    feeType: feeName,
                    feeAmount: feeAmount.toString(), // Chuyển đổi thành chuỗi để tránh lỗi số học
                    feeDescription: feeDescription || '',
                    feeStatus: 'chưa thanh toán',
                    userId: userId,
                    feeCreatedBy: req.session.user.email,
                    feeUpdatedBy: req.session.user.email,
                    lateFee: '0', // Chuyển đổi thành chuỗi
                    isOverdue: 0  // SQL Server sử dụng 0/1 cho boolean
                },
                type: db.sequelize.QueryTypes.INSERT,
                logging: console.log // Log câu SQL để debug
            });

            // Lấy ID của khoản phí vừa tạo
            const feeId = results[0]?.id || results;
            console.log("Khoản phí mới đã được tạo thành công với ID:", feeId);

            return res.redirect('/admin/fee');
        } catch (dbError) {
            console.error("Lỗi khi lưu khoản phí vào database:", dbError);
            return res.status(500).send("Có lỗi xảy ra khi tạo phí. Lỗi cơ sở dữ liệu: " + dbError.message);
        }
    } catch (e) {
        console.error("Lỗi tổng thể khi tạo phí:", e);
        return res.status(500).send("Có lỗi xảy ra khi tạo phí: " + e.message);
    }
}

let updateFeeStatus = async (req, res) => {
    try {
        const feeId = req.params.id;
        const fee = await db.Fee.findByPk(feeId);

        if (!fee) {
            return res.status(404).send("Không tìm thấy khoản thu.");
        }

        // Thay đổi status và cập nhật thông tin
        const newStatus = fee.feeStatus === 'chưa thanh toán' ? 'đã thanh toán' : 'chưa thanh toán';

        // Sử dụng SQL query trực tiếp thay vì update ORM
        await db.sequelize.query(
            `UPDATE Fees 
             SET feeStatus = :newStatus, feeUpdatedBy = :updatedBy 
             WHERE id = :feeId`,
            {
                replacements: {
                    newStatus: newStatus,
                    updatedBy: req.session.user.email,
                    feeId: feeId
                },
                type: db.Sequelize.QueryTypes.UPDATE
            }
        );

        return res.status(200).json({ message: "Cập nhật trạng thái thành công" });
    } catch (e) {
        console.error("Lỗi khi cập nhật trạng thái:", e);
        return res.status(500).send("Có lỗi xảy ra khi cập nhật trạng thái.");
    }
}

module.exports = {
    getAdminFeePage,
    createFee,
    updateFeeStatus
};