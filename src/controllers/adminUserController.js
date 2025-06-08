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
        }
    } catch (error) {
        // Xử lý lỗi một cách im lặng
    }
};

// Gọi hàm tạo admin mặc định khi khởi động
createDefaultAdmin();

let getAdminUserPage = async (req, res) => {
    try {
        // Lấy thông tin users cùng với TẤT CẢ căn hộ họ sở hữu
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
                c.Use_Status,
                CASE 
                    WHEN RIGHT(c.HouseNum, 2) IN ('01', '10') THEN N'Căn góc'
                    WHEN RIGHT(c.HouseNum, 2) IN ('05', '06') THEN N'Căn giữa'
                    ELSE N'Căn thường'
                END as ApartmentType
             FROM Users u
             LEFT JOIN Canho c ON u.id = c.id
             ORDER BY u.role DESC, u.firstName, u.lastName, c.ApartmentID`,
            {
                type: db.sequelize.QueryTypes.SELECT
            }
        );

        // Group apartments by user để hiển thị TẤT CẢ căn hộ của mỗi user
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
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                    apartments: [] // Mảng chứa TẤT CẢ căn hộ
                });
            }

            // Thêm căn hộ nếu có
            if (row.ApartmentID) {
                userMap.get(userId).apartments.push({
                    id: row.ApartmentID,
                    area: row.ApartmentArea,
                    floors: row.Floors,
                    houseNum: row.HouseNum,
                    buildingName: row.BuildingName,
                    useStatus: row.Use_Status,
                    type: row.ApartmentType
                });
            }
        });

        const transformedUsers = Array.from(userMap.values());

        res.render("admin/user-management.ejs", {
            users: transformedUsers
        });
    } catch (err) {
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

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user with the hashed password
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
    } catch (err) {
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

            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            updateFields += ", password = :password";
            queryParams.password = hashedPassword;
        }

        // Update user in database using raw query
        await db.sequelize.query(
            `UPDATE Users SET ${updateFields} WHERE id = :userId`,
            {
                replacements: queryParams,
                type: db.Sequelize.QueryTypes.UPDATE
            }
        );

        return res.status(200).json({ message: "Cập nhật thông tin thành công" });
    } catch (err) {
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

        // Kiểm tra xem user có sở hữu căn hộ nào không (có thể nhiều căn hộ)
        const userApartments = await db.sequelize.query(
            `SELECT ApartmentID FROM Canho WHERE id = :userId`,
            {
                replacements: { userId: userId },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        // Kiểm tra và xử lý phương tiện liên quan đến tất cả căn hộ của user
        const userVehicles = await db.sequelize.query(
            `SELECT p.VehicleID, p.LicensePlate, p.VehicleType, p.ApartmentID 
             FROM PhuongTien p
             INNER JOIN Canho c ON p.ApartmentID = c.ApartmentID
             WHERE c.id = :userId`,
            {
                replacements: { userId: userId },
                type: db.Sequelize.QueryTypes.SELECT
            }
        );

        // Nếu user có phương tiện (thông qua căn hộ), xóa tất cả
        if (userVehicles.length > 0) {
            await db.sequelize.query(
                `DELETE FROM PhuongTien WHERE ApartmentID IN (
                    SELECT ApartmentID FROM Canho WHERE id = :userId
                )`,
                {
                    replacements: { userId: userId },
                    type: db.Sequelize.QueryTypes.DELETE
                }
            );
        }

        // Nếu user có căn hộ, set quyền sở hữu về NULL cho TẤT CẢ căn hộ
        if (userApartments.length > 0) {
            await db.sequelize.query(
                `UPDATE Canho SET id = NULL WHERE id = :userId`,
                {
                    replacements: { userId: userId },
                    type: db.Sequelize.QueryTypes.UPDATE
                }
            );
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
        if (userApartments.length > 0) {
            const apartmentList = userApartments.map(apt => apt.ApartmentID).join(', ');
            message += `. ${userApartments.length} căn hộ (${apartmentList}) đã được trả về trạng thái có sẵn`;
        }
        if (userVehicles.length > 0) {
            message += `. Đã xóa ${userVehicles.length} phương tiện liên quan`;
        }

        return res.status(200).json({ message: message });
    } catch (err) {
        return res.status(500).send("Đã xảy ra lỗi khi xóa người dùng");
    }
};

export default {
    getAdminUserPage,
    createUser,
    updateUser,
    deleteUser
};
