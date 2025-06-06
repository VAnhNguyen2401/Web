import db from "../models";
const emailService = require('../services/emailService');

let getAdminFeePage = async (req, res) => {
    try {
        // Fetch all users with their fees and apartment information
        const users = await db.sequelize.query(
            `SELECT 
                u.id, u.firstName, u.lastName, u.email, u.role, u.phoneNumber,
                u.createdAt, u.updatedAt,
                c.ApartmentID, c.Area, c.Use_Status,
                f.id as feeId, f.feeType, f.feeAmount, f.feeDescription, 
                f.feeStatus, f.feeCreatedAt
             FROM Users u
             LEFT JOIN Canho c ON u.id = c.id
             LEFT JOIN Fees f ON u.id = f.userId
             WHERE u.role = 'user' AND c.ApartmentID IS NOT NULL
             ORDER BY u.firstName, u.lastName, f.feeCreatedAt DESC`,
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        // Group fees by user
        const userMap = new Map();

        users.forEach(row => {
            const userId = row.id;

            if (!userMap.has(userId)) {
                userMap.set(userId, {
                    id: row.id,
                    firstName: row.firstName,
                    lastName: row.lastName,
                    fullName: `${row.firstName} ${row.lastName}`,
                    email: row.email,
                    role: row.role,
                    phoneNumber: row.phoneNumber,
                    createdAt: new Date(row.createdAt).toLocaleDateString('vi-VN'),
                    updatedAt: new Date(row.updatedAt).toLocaleDateString('vi-VN'),
                    apartment: {
                        id: row.ApartmentID,
                        area: row.Area,
                        useStatus: row.Use_Status
                    },
                    Fees: []
                });
            }

            // Add fee if exists
            if (row.feeId) {
                userMap.get(userId).Fees.push({
                    id: row.feeId,
                    feeType: row.feeType,
                    feeAmount: row.feeAmount,
                    feeDescription: row.feeDescription,
                    feeStatus: row.feeStatus,
                    feeCreatedAt: row.feeCreatedAt
                });
            }
        });

        const transformedUsers = Array.from(userMap.values());

        return res.render("admin/fee-management.ejs", {
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

            // Gửi email thông báo cho người dùng
            try {
                // Lấy thông tin người dùng
                const user = await db.User.findByPk(userId);
                if (user && user.email) {
                    const userInfo = {
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email
                    };

                    const feeInfo = {
                        feeType: feeName,
                        feeAmount: feeAmount,
                        feeDescription: feeDescription,
                        deadline: deadlineDate
                    };

                    // Gửi email thông báo
                    const emailResult = await emailService.sendFeeNotification(userInfo, feeInfo);
                    if (emailResult.success) {
                        console.log(` Email thông báo khoản thu đã được gửi tới ${user.email}`);
                    } else {
                        console.log(` Không thể gửi email thông báo tới ${user.email}:`, emailResult.error);
                    }
                }
            } catch (emailError) {
                console.error("Lỗi khi gửi email thông báo:", emailError);
                // Không return error vì khoản thu đã được tạo thành công
            }

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

// Hàm tạo phí dịch vụ hàng tháng cho tất cả căn hộ đang ở
let createMonthlyServiceFee = async (req, res) => {
    try {
        const { pricePerSqm, feeDescription } = req.body;

        if (!pricePerSqm || parseFloat(pricePerSqm) <= 0) {
            return res.status(400).json({ error: "Vui lòng nhập giá dịch vụ hợp lệ (VNĐ/m²)" });
        }

        const price = parseFloat(pricePerSqm);

        // Lấy danh sách tất cả căn hộ đang ở có chủ sở hữu
        const occupiedApartments = await db.sequelize.query(
            `SELECT 
                c.ApartmentID, c.Area, c.id as userId,
                u.firstName, u.lastName, u.email
             FROM Canho c
             INNER JOIN Users u ON c.id = u.id
             WHERE c.Use_Status = N'Đang ở' AND c.id IS NOT NULL`,
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (occupiedApartments.length === 0) {
            return res.status(400).json({ error: "Không có căn hộ nào đang ở để tạo phí dịch vụ" });
        }

        // Tạo phí dịch vụ cho từng căn hộ
        const results = [];
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        for (const apartment of occupiedApartments) {
            const serviceAmount = Math.round(apartment.Area * price);
            const description = feeDescription ||
                `Phí dịch vụ tháng ${currentMonth}/${currentYear} - ${apartment.ApartmentID} (${apartment.Area}m² × ${price.toLocaleString('vi-VN')} VNĐ/m²)`;

            try {
                const insertQuery = `
                    INSERT INTO Fees (
                        feeType, feeAmount, feeDescription, feeStatus, 
                        userId, feeCreatedBy, feeUpdatedBy, feeDate,
                        feeCreatedAt, feeUpdatedAt, deadline, lateFee, isOverdue
                    ) 
                    VALUES (
                        N'Phí dịch vụ', :feeAmount, :feeDescription, N'chưa thanh toán', 
                        :userId, :feeCreatedBy, :feeUpdatedBy, GETDATE(),
                        GETDATE(), GETDATE(), DATEADD(day, 15, GETDATE()), 0, 0
                    )
                `;

                await db.sequelize.query(insertQuery, {
                    replacements: {
                        feeAmount: serviceAmount,
                        feeDescription: description,
                        userId: apartment.userId,
                        feeCreatedBy: req.session.user.email,
                        feeUpdatedBy: req.session.user.email
                    },
                    type: db.sequelize.QueryTypes.INSERT
                });

                results.push({
                    apartmentId: apartment.ApartmentID,
                    userName: `${apartment.firstName} ${apartment.lastName}`,
                    area: apartment.Area,
                    amount: serviceAmount,
                    userInfo: {
                        id: apartment.userId,
                        firstName: apartment.firstName,
                        lastName: apartment.lastName,
                        email: apartment.email
                    },
                    feeInfo: {
                        feeType: 'Phí dịch vụ',
                        feeAmount: serviceAmount,
                        feeDescription: description,
                        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 ngày sau
                    }
                });

            } catch (error) {
                console.error(`Lỗi tạo phí cho căn hộ ${apartment.ApartmentID}:`, error);
            }
        }

        // Gửi email thông báo cho tất cả người dùng
        try {
            const notifications = results.map(result => ({
                userInfo: result.userInfo,
                feeInfo: result.feeInfo
            }));

            const emailResults = await emailService.sendBulkFeeNotifications(notifications);
            const emailSuccessCount = emailResults.filter(r => r.success).length;

            console.log(`✅ Đã gửi ${emailSuccessCount}/${emailResults.length} email thông báo phí dịch vụ`);
        } catch (emailError) {
            console.error("Lỗi khi gửi email thông báo phí dịch vụ:", emailError);
        }

        return res.status(200).json({
            message: `Đã tạo phí dịch vụ thành công cho ${results.length} căn hộ đang ở`,
            details: results.map(r => ({
                apartmentId: r.apartmentId,
                userName: r.userName,
                area: r.area,
                amount: r.amount
            })),
            summary: {
                totalApartments: results.length,
                totalAmount: results.reduce((sum, item) => sum + item.amount, 0),
                pricePerSqm: price
            }
        });

    } catch (error) {
        console.error("Lỗi khi tạo phí dịch vụ hàng tháng:", error);
        return res.status(500).json({ error: "Có lỗi xảy ra khi tạo phí dịch vụ: " + error.message });
    }
};

// Lấy thông tin căn hộ của user để tính phí dịch vụ
let getUserApartmentInfo = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ error: "Thiếu userId" });
        }

        // Lấy thông tin căn hộ của user
        const apartmentInfo = await db.sequelize.query(
            `SELECT 
                c.ApartmentID, c.Area, c.Use_Status,
                u.firstName, u.lastName, u.email
             FROM Users u
             LEFT JOIN Canho c ON u.id = c.id
             WHERE u.id = :userId`,
            {
                replacements: { userId: userId },
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (apartmentInfo.length === 0) {
            return res.status(404).json({ error: "Không tìm thấy user" });
        }

        const user = apartmentInfo[0];

        if (!user.ApartmentID) {
            return res.status(400).json({
                error: "User này chưa có căn hộ",
                hasApartment: false
            });
        }

        // Tính phí dịch vụ: diện tích × 16,500 VNĐ/m²
        const SERVICE_PRICE_PER_SQM = 16500;
        const serviceFee = Math.round(user.Area * SERVICE_PRICE_PER_SQM);

        return res.status(200).json({
            success: true,
            user: {
                id: userId,
                name: `${user.firstName} ${user.lastName}`,
                email: user.email
            },
            apartment: {
                id: user.ApartmentID,
                area: user.Area,
                useStatus: user.Use_Status
            },
            serviceFee: {
                amount: serviceFee,
                pricePerSqm: SERVICE_PRICE_PER_SQM,
                calculation: `${user.Area}m² × ${SERVICE_PRICE_PER_SQM.toLocaleString('vi-VN')} VNĐ/m²`
            }
        });

    } catch (error) {
        console.error("Lỗi khi lấy thông tin căn hộ:", error);
        return res.status(500).json({ error: "Có lỗi xảy ra khi lấy thông tin căn hộ: " + error.message });
    }
};

// Tạo phí internet cho tất cả căn hộ
let createInternetFeeForAll = async (req, res) => {
    try {
        console.log("Đang tạo phí internet cho tất cả căn hộ...");

        const INTERNET_FEE = 150000; // 150,000 VNĐ cố định

        // Lấy danh sách tất cả user có căn hộ
        const usersWithApartments = await db.sequelize.query(
            `SELECT 
                u.id as userId, u.firstName, u.lastName, u.email,
                c.ApartmentID, c.Area, c.Use_Status
             FROM Users u
             INNER JOIN Canho c ON u.id = c.id
             WHERE u.role = 'user' AND c.ApartmentID IS NOT NULL`,
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (usersWithApartments.length === 0) {
            return res.status(400).json({
                error: "Không có căn hộ nào để tạo phí internet",
                success: false
            });
        }

        // Tạo phí internet cho từng user
        const results = [];
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        for (const user of usersWithApartments) {
            const description = `Phí internet tháng ${currentMonth}/${currentYear} - Căn hộ ${user.ApartmentID} - 150,000 VNĐ`;

            try {
                const insertQuery = `
                    INSERT INTO Fees (
                        feeType, feeAmount, feeDescription, feeStatus, 
                        userId, feeCreatedBy, feeUpdatedBy, feeDate,
                        feeCreatedAt, feeUpdatedAt, deadline, lateFee, isOverdue
                    ) 
                    VALUES (
                        N'Phí internet', :feeAmount, :feeDescription, N'chưa thanh toán', 
                        :userId, :feeCreatedBy, :feeUpdatedBy, GETDATE(),
                        GETDATE(), GETDATE(), DATEADD(day, 15, GETDATE()), 0, 0
                    )
                `;

                await db.sequelize.query(insertQuery, {
                    replacements: {
                        feeAmount: INTERNET_FEE,
                        feeDescription: description,
                        userId: user.userId,
                        feeCreatedBy: req.session.user.email,
                        feeUpdatedBy: req.session.user.email
                    },
                    type: db.sequelize.QueryTypes.INSERT
                });

                results.push({
                    userId: user.userId,
                    userName: `${user.firstName} ${user.lastName}`,
                    apartmentId: user.ApartmentID,
                    amount: INTERNET_FEE,
                    userInfo: {
                        id: user.userId,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email
                    },
                    feeInfo: {
                        feeType: 'Phí internet',
                        feeAmount: INTERNET_FEE,
                        feeDescription: description,
                        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 ngày sau
                    }
                });

            } catch (error) {
                console.error(`Lỗi tạo phí internet cho user ${user.userId}:`, error);
            }
        }

        // Gửi email thông báo cho tất cả người dùng
        try {
            const notifications = results.map(result => ({
                userInfo: result.userInfo,
                feeInfo: result.feeInfo
            }));

            const emailResults = await emailService.sendBulkFeeNotifications(notifications);
            const emailSuccessCount = emailResults.filter(r => r.success).length;

            console.log(`✅ Đã gửi ${emailSuccessCount}/${emailResults.length} email thông báo phí internet`);
        } catch (emailError) {
            console.error("Lỗi khi gửi email thông báo phí internet:", emailError);
        }

        return res.status(200).json({
            success: true,
            message: `Đã tạo phí internet thành công cho ${results.length} căn hộ`,
            details: results,
            summary: {
                totalApartments: results.length,
                totalAmount: results.length * INTERNET_FEE,
                feePerApartment: INTERNET_FEE
            }
        });

    } catch (error) {
        console.error("Lỗi khi tạo phí internet hàng loạt:", error);
        return res.status(500).json({
            error: "Có lỗi xảy ra khi tạo phí internet: " + error.message,
            success: false
        });
    }
};

module.exports = {
    getAdminFeePage,
    createFee,
    updateFeeStatus,
    createMonthlyServiceFee,
    getUserApartmentInfo,
    createInternetFeeForAll
};