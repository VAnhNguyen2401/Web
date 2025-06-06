import db from "../models";
const emailService = require('../services/emailService');

// Test database connection and table names
let testDatabaseConnection = async () => {
    try {
        // Test basic connection
        await db.sequelize.authenticate();

        // Test Users table
        const userCount = await db.sequelize.query("SELECT COUNT(*) as count FROM Users", {
            type: db.sequelize.QueryTypes.SELECT
        });

        // Test Canho table
        try {
            const apartmentCount = await db.sequelize.query("SELECT COUNT(*) as count FROM Canho", {
                type: db.sequelize.QueryTypes.SELECT
            });
        } catch (e) {
            // Canho table might not exist
        }

        // Test Fees table
        try {
            const feeCount = await db.sequelize.query("SELECT COUNT(*) as count FROM Fees", {
                type: db.sequelize.QueryTypes.SELECT
            });
        } catch (e) {
            // Fees table might not exist
        }

        return true;
    } catch (error) {
        console.error("Database connection test failed:", error);
        return false;
    }
};

let getAdminFeePage = async (req, res) => {
    try {
        // Test database connection first
        const dbOk = await testDatabaseConnection();
        if (!dbOk) {
            throw new Error("Database connection failed");
        }

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
             WHERE u.role != 'admin'
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
                // Chỉ tạo apartment object nếu user có căn hộ
                const apartmentInfo = row.ApartmentID ? {
                    id: row.ApartmentID,
                    area: row.Area,
                    useStatus: row.Use_Status
                } : null;

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
                    apartment: apartmentInfo,
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
        console.error("Lỗi khi tải trang quản lý khoản thu:", e);

        return res.status(500).send(`
            <h2>Lỗi khi tải trang quản lý khoản thu</h2>
            <p><strong>Lỗi:</strong> ${e.message}</p>
            <p><a href="/admin/user">← Quay lại trang quản lý user</a></p>
            <p><a href="/homepage">← Về trang chủ</a></p>
        `);
    }
}

let createFee = async (req, res) => {
    try {
        let { feeName, feeAmount, feeDescription, userId } = req.body;

        // Validate required fields
        if (!feeName || !feeAmount || !userId) {
            return res.status(400).send("Vui lòng điền đầy đủ thông tin");
        }

        // Tìm thông tin user và căn hộ của user đó
        const userInfo = await db.sequelize.query(
            `SELECT 
                u.id, u.firstName, u.lastName, u.email,
                c.ApartmentID, c.Area, c.Use_Status
             FROM Users u
             LEFT JOIN Canho c ON u.id = c.id
             WHERE u.id = :userId`,
            {
                replacements: { userId: userId },
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (userInfo.length === 0) {
            return res.status(400).send("User không tồn tại");
        }

        const user = userInfo[0];

        // Đảm bảo feeAmount là số
        feeAmount = parseFloat(feeAmount);
        if (isNaN(feeAmount) || feeAmount <= 0) {
            return res.status(400).send("Số tiền không hợp lệ");
        }

        // Kiểm tra giới hạn số tiền để tránh overflow
        if (feeAmount > 999999999) {
            return res.status(400).send("Số tiền quá lớn, vui lòng nhập giá trị nhỏ hơn 1 tỷ");
        }

        try {
            // Tạo ngày hiện tại và ngày hạn chót (15 ngày sau)
            const currentDate = new Date();
            const deadlineDate = new Date(currentDate);
            deadlineDate.setDate(deadlineDate.getDate() + 15);



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
                    feeAmount: feeAmount.toString(),
                    feeDescription: feeDescription || '',
                    feeStatus: 'chưa thanh toán',
                    userId: userId,
                    feeCreatedBy: req.session.user.email,
                    feeUpdatedBy: req.session.user.email,
                    lateFee: '0',
                    isOverdue: 0
                },
                type: db.sequelize.QueryTypes.INSERT
            });

            // Lấy ID của khoản phí vừa tạo
            const feeId = results[0]?.id || results;

            // Gửi email thông báo cho user
            try {
                const userEmailInfo = {
                    id: user.id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email
                };

                const feeInfo = {
                    feeType: feeName,
                    feeAmount: feeAmount,
                    feeDescription: feeDescription,
                    deadline: deadlineDate,
                    apartmentId: user.ApartmentID,
                    apartmentArea: user.Area
                };

                // Gửi email thông báo
                const emailResult = await emailService.sendFeeNotification(userEmailInfo, feeInfo);
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

        // Sử dụng giá mặc định 16,500 VNĐ/m² nếu không được cung cấp
        const price = pricePerSqm ? parseFloat(pricePerSqm) : 16500;

        if (price <= 0) {
            return res.status(400).json({ error: "Giá dịch vụ phải lớn hơn 0" });
        }

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


        } catch (emailError) {
            console.error("Lỗi khi gửi email thông báo phí dịch vụ:", emailError);
        }

        return res.status(200).json({
            success: true,
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
        return res.status(500).json({
            success: false,
            error: "Có lỗi xảy ra khi tạo phí dịch vụ: " + error.message
        });
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

        const INTERNET_FEE = 150000; // 150,000 VNĐ cố định

        // Lấy danh sách tất cả user có căn hộ ĐANG Ở
        const usersWithApartments = await db.sequelize.query(
            `SELECT 
                u.id as userId, u.firstName, u.lastName, u.email,
                c.ApartmentID, c.Area, c.Use_Status
             FROM Users u
             INNER JOIN Canho c ON u.id = c.id
             WHERE u.role = 'user' AND c.ApartmentID IS NOT NULL AND c.Use_Status = N'Đang ở'`,
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (usersWithApartments.length === 0) {
            return res.status(400).json({
                error: "Không có căn hộ nào đang ở để tạo phí internet",
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


        } catch (emailError) {
            console.error("Lỗi khi gửi email thông báo phí internet:", emailError);
        }

        return res.status(200).json({
            success: true,
            message: `Đã tạo phí internet thành công cho ${results.length} căn hộ đang ở`,
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

// Tạo phí gửi xe cho tất cả căn hộ có phương tiện
let createVehicleFeeForAll = async (req, res) => {
    try {

        // Lấy danh sách căn hộ có phương tiện cùng với thông tin user
        const apartmentsWithVehicles = await db.sequelize.query(
            `SELECT DISTINCT
                c.ApartmentID, c.id as userId,
                u.firstName, u.lastName, u.email,
                COUNT(CASE WHEN p.VehicleType LIKE '%máy%' OR p.VehicleType LIKE '%motor%' THEN 1 END) as motorcycleCount,
                COUNT(CASE WHEN p.VehicleType LIKE '%điện%' OR p.VehicleType LIKE '%electric%' THEN 1 END) as electricCount,
                COUNT(CASE WHEN p.VehicleType LIKE '%tô%' OR p.VehicleType LIKE '%car%' OR p.VehicleType LIKE '%ô tô%' THEN 1 END) as carCount,
                COUNT(p.VehicleID) as totalVehicles
             FROM Canho c
             INNER JOIN Users u ON c.id = u.id
             INNER JOIN PhuongTien p ON c.ApartmentID = p.ApartmentID
             WHERE u.role = 'user'
             GROUP BY c.ApartmentID, c.id, u.firstName, u.lastName, u.email
             HAVING COUNT(p.VehicleID) > 0`,
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        if (apartmentsWithVehicles.length === 0) {
            return res.status(400).json({
                error: "Không có căn hộ nào có phương tiện để tạo phí gửi xe",
                success: false
            });
        }



        // Giá phí gửi xe
        const MOTORCYCLE_FEE = 100000; // 100,000 VNĐ
        const ELECTRIC_FEE = 50000; // 50,000 VNĐ
        const CAR_FEE = 1000000; // 1,000,000 VNĐ


        const results = [];
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();

        let totalMotorcycles = 0;
        let totalElectricVehicles = 0;
        let totalCars = 0;

        for (const apartment of apartmentsWithVehicles) {
            // Tính phí cho căn hộ này
            const motorcycleFee = (apartment.motorcycleCount || 0) * MOTORCYCLE_FEE;
            const electricFee = (apartment.electricCount || 0) * ELECTRIC_FEE;
            const carFee = (apartment.carCount || 0) * CAR_FEE;
            const totalFee = motorcycleFee + electricFee + carFee;

            totalMotorcycles += (apartment.motorcycleCount || 0);
            totalElectricVehicles += (apartment.electricCount || 0);
            totalCars += (apartment.carCount || 0);

            // Tạo mô tả chi tiết
            let feeDetails = [];
            if (apartment.motorcycleCount > 0) {
                feeDetails.push(`${apartment.motorcycleCount} xe máy × ${MOTORCYCLE_FEE.toLocaleString('vi-VN')} = ${motorcycleFee.toLocaleString('vi-VN')} VNĐ`);
            }
            if (apartment.electricCount > 0) {
                feeDetails.push(`${apartment.electricCount} xe điện × ${ELECTRIC_FEE.toLocaleString('vi-VN')} = ${electricFee.toLocaleString('vi-VN')} VNĐ`);
            }
            if (apartment.carCount > 0) {
                feeDetails.push(`${apartment.carCount} ô tô × ${CAR_FEE.toLocaleString('vi-VN')} = ${carFee.toLocaleString('vi-VN')} VNĐ`);
            }

            const description = `Phí gửi xe tháng ${currentMonth}/${currentYear} - Căn hộ ${apartment.ApartmentID}: ${feeDetails.join(' + ')} = ${totalFee.toLocaleString('vi-VN')} VNĐ`;

            try {
                const insertQuery = `
                    INSERT INTO Fees (
                        feeType, feeAmount, feeDescription, feeStatus, 
                        userId, feeCreatedBy, feeUpdatedBy, feeDate,
                        feeCreatedAt, feeUpdatedAt, deadline, lateFee, isOverdue
                    ) 
                    VALUES (
                        N'Phí gửi xe', :feeAmount, :feeDescription, N'chưa thanh toán', 
                        :userId, :feeCreatedBy, :feeUpdatedBy, GETDATE(),
                        GETDATE(), GETDATE(), DATEADD(day, 15, GETDATE()), 0, 0
                    )
                `;

                await db.sequelize.query(insertQuery, {
                    replacements: {
                        feeAmount: totalFee,
                        feeDescription: description,
                        userId: apartment.userId,
                        feeCreatedBy: req.session.user.email,
                        feeUpdatedBy: req.session.user.email
                    },
                    type: db.sequelize.QueryTypes.INSERT
                });

                results.push({
                    userId: apartment.userId,
                    userName: `${apartment.firstName} ${apartment.lastName}`,
                    apartmentId: apartment.ApartmentID,
                    motorcycles: apartment.motorcycleCount,
                    cars: apartment.carCount,
                    totalVehicles: apartment.totalVehicles,
                    amount: totalFee,
                    userInfo: {
                        id: apartment.userId,
                        firstName: apartment.firstName,
                        lastName: apartment.lastName,
                        email: apartment.email
                    },
                    feeInfo: {
                        feeType: 'Phí gửi xe',
                        feeAmount: totalFee,
                        feeDescription: description,
                        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
                    }
                });



            } catch (error) {
                console.error(`Lỗi tạo phí gửi xe cho căn hộ ${apartment.ApartmentID}:`, error);
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


        } catch (emailError) {
            console.error("Lỗi khi gửi email thông báo phí gửi xe:", emailError);
        }

        return res.status(200).json({
            success: true,
            message: `Đã tạo phí gửi xe thành công cho ${results.length} căn hộ có phương tiện`,
            details: results,
            summary: {
                totalApartments: results.length,
                totalMotorcycles: totalMotorcycles,
                totalElectricVehicles: totalElectricVehicles,
                totalCars: totalCars,
                totalVehicles: totalMotorcycles + totalElectricVehicles + totalCars,
                totalAmount: results.reduce((sum, item) => sum + item.amount, 0)
            }
        });

    } catch (error) {
        console.error("Lỗi khi tạo phí gửi xe hàng loạt:", error);
        return res.status(500).json({
            error: "Có lỗi xảy ra khi tạo phí gửi xe: " + error.message,
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
    createInternetFeeForAll,
    createVehicleFeeForAll
};