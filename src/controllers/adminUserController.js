import db from '../models/index.js';
import bcrypt from 'bcryptjs';

// Hàm tạo tài khoản admin mặc định nếu chưa có
const createDefaultAdmin = async () => {
    try {
        // Kiểm tra xem đã có tài khoản admin chưa
        const adminCount = await db.User.count({ where: { role: 'admin' } });

        if (adminCount === 0) {
            // Chưa có admin, tạo tài khoản mặc định
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123456', salt);

            // Tạo admin mặc định bằng SQL query trực tiếp
            await db.sequelize.query(
                `INSERT INTO Users (firstName, lastName, email, password, role, phoneNumber)
                 VALUES ('Admin', 'System', 'admin@example.com', :password, 'admin', '0123456789')`,
                {
                    replacements: { password: hashedPassword },
                    type: db.Sequelize.QueryTypes.INSERT
                }
            );

            console.log('Đã tạo tài khoản admin mặc định với email: admin@example.com và mật khẩu: admin123456');
        }
    } catch (error) {
        console.error('Lỗi khi tạo tài khoản admin mặc định:', error);
    }
};

// Gọi hàm tạo admin mặc định khi khởi động
createDefaultAdmin();

let getAdminUserPage = async (req, res) => {
    try {
        // Lấy thông tin users cùng với căn hộ họ sở hữu
        const users = await db.sequelize.query(
            `SELECT 
                u.id,
                u.firstName, 
                u.lastName, 
                u.email, 
                u.role, 
                u.phoneNumber, 
                u.createdAt, 
                u.updatedAt,
                c.ApartmentID,
                c.Area as ApartmentArea,
                c.Floors,
                c.HouseNum,
                c.BuildingName,
                CASE 
                    WHEN RIGHT(c.HouseNum, 2) IN ('01', '10') THEN N'Căn góc'
                    WHEN RIGHT(c.HouseNum, 2) IN ('05', '06') THEN N'Căn giữa'
                    ELSE N'Căn thường'
                END as ApartmentType
             FROM Users u
             LEFT JOIN Canho c ON u.id = c.id
             ORDER BY u.role DESC, u.firstName, u.lastName`,
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        // Transform data before sending to view
        const transformedUsers = users.map(user => {
            return {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                fullName: `${user.firstName} ${user.lastName}`,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                apartment: user.ApartmentID ? {
                    id: user.ApartmentID,
                    area: user.ApartmentArea,
                    floors: user.Floors,
                    houseNum: user.HouseNum,
                    buildingName: user.BuildingName,
                    type: user.ApartmentType
                } : null,
                Fees: [] // Giữ để tương thích
            };
        });

        res.render("admin-user.ejs", {
            users: transformedUsers
        });
    } catch (err) {
        console.error("Lỗi khi load trang admin user:", err);
        res.status(500).send("Đã xảy ra lỗi khi tải dữ liệu người dùng.");
    }
};

let createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, phoneNumber } = req.body;

        // Validate input - yêu cầu mật khẩu bắt buộc
        if (!firstName || !lastName || !email || !password || !phoneNumber) {
            return res.status(400).send("Vui lòng điền đầy đủ thông tin, bao gồm cả mật khẩu");
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).send("Mật khẩu phải có ít nhất 6 ký tự");
        }

        // Validate phone number format
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).send("Số điện thoại không hợp lệ. Vui lòng nhập 10-15 chữ số");
        }

        // Check if email already exists
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).send("Email đã được sử dụng");
        }

        // Hash password with better error handling
        let hashedPassword;
        try {
            // Hash password với bcrypt
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
            console.log("Mật khẩu đã được mã hóa thành công");
        } catch (hashError) {
            console.error("Lỗi khi mã hóa mật khẩu:", hashError);
            return res.status(500).send("Đã xảy ra lỗi khi mã hóa mật khẩu");
        }

        // Create new user with the hashed password
        try {
            // Sử dụng SQL query trực tiếp để tránh lỗi định dạng ngày tháng
            const insertQuery = `
                INSERT INTO Users (
                    firstName, lastName, email, password, role, phoneNumber
                ) 
                OUTPUT INSERTED.id
                VALUES (
                    :firstName, :lastName, :email, :password, :role, :phoneNumber
                )
            `;

            const [result] = await db.sequelize.query(insertQuery, {
                replacements: {
                    firstName,
                    lastName,
                    email,
                    password: hashedPassword,
                    role: role || 'user',
                    phoneNumber
                },
                type: db.Sequelize.QueryTypes.INSERT
            });

            // Lấy ID của người dùng vừa tạo
            const userId = result[0].id;
            const newUser = await db.User.findByPk(userId);

            console.log("Người dùng mới đã được tạo:", {
                id: newUser.id,
                email: newUser.email,
                role: newUser.role,
                password: "Đã được mã hóa"
            });

            return res.status(201).json({
                message: "Tạo người dùng thành công",
                user: {
                    id: newUser.id,
                    firstName: newUser.firstName,
                    lastName: newUser.lastName,
                    email: newUser.email,
                    role: newUser.role
                }
            });
        } catch (dbError) {
            console.error("Lỗi khi lưu người dùng vào database:", dbError);
            return res.status(500).send("Đã xảy ra lỗi khi lưu người dùng vào hệ thống");
        }
    } catch (err) {
        console.error("Lỗi khi tạo người dùng:", err);
        return res.status(500).send("Đã xảy ra lỗi khi tạo người dùng");
    }
};

let updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { firstName, lastName, email, role, password, phoneNumber } = req.body;

        // Validate input
        if (!firstName || !lastName || !email) {
            return res.status(400).send("Vui lòng điền đầy đủ thông tin");
        }

        // Validate phone number format
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.status(400).send("Số điện thoại không hợp lệ. Vui lòng nhập 10-15 chữ số");
        }

        // Check if email already exists for other users
        const existingUser = await db.User.findOne({
            where: {
                email: email,
                id: { [db.Sequelize.Op.ne]: userId }
            }
        });

        if (existingUser) {
            return res.status(400).send("Email đã được sử dụng bởi người dùng khác");
        }

        // Find user and check if exists
        const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).send("Không tìm thấy người dùng");
        }

        // Prepare update query parts
        let updateFields = `
            firstName = :firstName, 
            lastName = :lastName, 
            email = :email, 
            role = :role, 
            phoneNumber = :phoneNumber
        `;

        let queryParams = {
            firstName,
            lastName,
            email,
            role: role || user.role,
            phoneNumber,
            userId
        };

        // Kiểm tra mật khẩu nếu được cung cấp
        if (password) {
            // Validate password length nếu được cung cấp
            if (password.length < 6) {
                return res.status(400).send("Mật khẩu phải có ít nhất 6 ký tự");
            }

            try {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(password, salt);
                updateFields += ", password = :password";
                queryParams.password = hashedPassword;
                console.log("Mật khẩu mới đã được mã hóa thành công");
            } catch (hashError) {
                console.error("Lỗi khi mã hóa mật khẩu mới:", hashError);
                return res.status(500).send("Đã xảy ra lỗi khi mã hóa mật khẩu mới");
            }
        }

        // Update user in database using raw query
        try {
            await db.sequelize.query(
                `UPDATE Users SET ${updateFields} WHERE id = :userId`,
                {
                    replacements: queryParams,
                    type: db.Sequelize.QueryTypes.UPDATE
                }
            );

            console.log("Người dùng đã được cập nhật:", {
                id: userId,
                email: email,
                role: queryParams.role,
                passwordChanged: password ? "Đã thay đổi" : "Không thay đổi"
            });

            return res.status(200).json({ message: "Cập nhật thông tin thành công" });
        } catch (dbError) {
            console.error("Lỗi khi cập nhật thông tin trong database:", dbError);
            return res.status(500).send("Đã xảy ra lỗi khi lưu thông tin vào hệ thống");
        }
    } catch (err) {
        console.error("Lỗi khi cập nhật thông tin người dùng:", err);
        return res.status(500).send("Đã xảy ra lỗi khi cập nhật thông tin người dùng");
    }
};

let deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Find user and check if exists
        const user = await db.User.findByPk(userId, {
            include: [{ model: db.Fee }]
        });

        if (!user) {
            return res.status(404).send("Không tìm thấy người dùng");
        }

        // Check if user is admin
        if (user.role === 'admin') {
            // Count number of admin users
            const adminCount = await db.User.count({
                where: { role: 'admin' }
            });

            if (adminCount <= 1) {
                return res.status(400).send("Không thể xóa admin cuối cùng của hệ thống");
            }
        }

        // Kiểm tra xem user có sở hữu căn hộ nào không
        const userApartment = await db.sequelize.query(
            `SELECT ApartmentID FROM Canho WHERE id = :userId`,
            {
                replacements: { userId: userId },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        // Kiểm tra và xử lý phương tiện của user
        const userVehicles = await db.sequelize.query(
            `SELECT VehicleID, LicensePlate, VehicleType FROM PhuongTien WHERE id = :userId`,
            {
                replacements: { userId: userId },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        // Nếu user có phương tiện, xóa hoặc gỡ quyền sở hữu
        if (userVehicles.length > 0) {
            // Option 1: Xóa tất cả phương tiện của user
            await db.sequelize.query(
                `DELETE FROM PhuongTien WHERE id = :userId`,
                {
                    replacements: { userId: userId },
                    type: db.Sequelize.QueryTypes.DELETE
                }
            );

            // Hoặc Option 2: Gỡ quyền sở hữu (set id về NULL)
            // await db.sequelize.query(
            //     `UPDATE PhuongTien SET id = NULL WHERE id = :userId`,
            //     {
            //         replacements: { userId: userId },
            //         type: db.Sequelize.QueryTypes.UPDATE
            //     }
            // );

            console.log(`Đã xóa ${userVehicles.length} phương tiện của user ${userId}`);
        }

        // Nếu user có căn hộ, set quyền sở hữu về NULL (làm cho căn hộ available lại)
        if (userApartment.length > 0) {
            await db.sequelize.query(
                `UPDATE Canho SET id = NULL WHERE id = :userId`,
                {
                    replacements: { userId: userId },
                    type: db.Sequelize.QueryTypes.UPDATE
                }
            );
            console.log(`Đã hủy quyền sở hữu căn hộ ${userApartment[0].ApartmentID} của user ${userId}`);
        }

        // Delete related fees first
        if (user.Fees && user.Fees.length > 0) {
            await db.Fee.destroy({
                where: { userId: userId }
            });
        }

        // Now delete the user
        await user.destroy();

        let message = "Xóa người dùng thành công";
        if (userApartment.length > 0) {
            message += `. Căn hộ ${userApartment[0].ApartmentID} đã được trả về trạng thái có sẵn`;
        }
        if (userVehicles.length > 0) {
            message += `. Đã xóa ${userVehicles.length} phương tiện liên quan`;
        }

        return res.status(200).json({ message: message });
    } catch (err) {
        console.error("Lỗi khi xóa người dùng:", err);
        return res.status(500).send("Đã xảy ra lỗi khi xóa người dùng: " + err.message);
    }
};

export default {
    getAdminUserPage,
    createUser,
    updateUser,
    deleteUser
};
