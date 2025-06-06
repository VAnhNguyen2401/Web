import db from '../models/index.js';
import bcrypt from 'bcryptjs';

const getUserManagementPage = async (req, res) => {
    try {
        const users = await db.User.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.render('admin/manage-users.ejs', { users });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).send('Đã xảy ra lỗi khi tải danh sách người dùng');
    }
};

const createUser = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, phoneNumber } = req.body;

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            const users = await db.User.findAll({ order: [['createdAt', 'DESC']] });
            return res.render('admin/manage-users.ejs', {
                users,
                error: "Email đã tồn tại trong hệ thống"
            });
        }

        // Validate phone number format
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(phoneNumber)) {
            const users = await db.User.findAll({ order: [['createdAt', 'DESC']] });
            return res.render('admin/manage-users.ejs', {
                users,
                error: "Số điện thoại không hợp lệ. Vui lòng nhập 10-15 chữ số"
            });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(password, 10);

        // Tạo người dùng mới
        await db.User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role,
            phoneNumber
        });

        const users = await db.User.findAll({ order: [['createdAt', 'DESC']] });
        res.render('admin/manage-users.ejs', {
            users,
            success: "Thêm người dùng thành công"
        });
    } catch (error) {
        console.error('Error creating user:', error);
        const users = await db.User.findAll({ order: [['createdAt', 'DESC']] });
        res.render('admin/manage-users.ejs', {
            users,
            error: "Đã xảy ra lỗi khi thêm người dùng"
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Không cho phép xóa chính mình
        if (userId === req.session.user.id) {
            return res.status(400).json({ error: "Không thể xóa tài khoản của chính mình" });
        }

        // Find user and check if exists
        const user = await db.User.findByPk(userId, {
            include: [{ model: db.Fee }]
        });

        if (!user) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }

        // Check if user is admin
        if (user.role === 'admin') {
            // Count number of admin users
            const adminCount = await db.User.count({
                where: { role: 'admin' }
            });

            if (adminCount <= 1) {
                return res.status(400).json({ error: "Không thể xóa admin cuối cùng của hệ thống" });
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
            console.log(`Đã xóa ${userVehicles.length} phương tiện từ ${userApartments.length} căn hộ của user ${userId}`);
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
            const apartmentList = userApartments.map(apt => apt.ApartmentID).join(', ');
            console.log(`Đã hủy quyền sở hữu ${userApartments.length} căn hộ (${apartmentList}) của user ${userId}`);
        }

        // Delete related fees first
        if (user.Fees && user.Fees.length > 0) {
            await db.Fee.destroy({
                where: { userId: userId }
            });
        }

        await db.User.destroy({
            where: { id: userId }
        });

        res.json({ success: true, message: "Xóa người dùng thành công" });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: "Đã xảy ra lỗi khi xóa người dùng: " + error.message });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phoneNumber, role } = req.body;

        // Validate phone number format
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (phoneNumber && !phoneRegex.test(phoneNumber)) {
            req.flash('error', 'Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại từ 10-15 chữ số.');
            return res.redirect('/admin/users');
        }

        const user = await db.User.findByPk(id);
        if (!user) {
            req.flash('error', 'Không tìm thấy người dùng');
            return res.redirect('/admin/users');
        }

        await user.update({
            firstName,
            lastName,
            email,
            phoneNumber,
            role
        });

        req.flash('success', 'Cập nhật thông tin người dùng thành công');
        res.redirect('/admin/users');
    } catch (error) {
        console.error('Error updating user:', error);
        req.flash('error', 'Đã xảy ra lỗi khi cập nhật thông tin người dùng');
        res.redirect('/admin/users');
    }
};

export default {
    getUserManagementPage,
    createUser,
    deleteUser,
    updateUser
}; 