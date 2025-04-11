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
        const { firstName, lastName, email, password, role } = req.body;

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            const users = await db.User.findAll({ order: [['createdAt', 'DESC']] });
            return res.render('admin/manage-users.ejs', {
                users,
                error: "Email đã tồn tại trong hệ thống"
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
            role
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

        await db.User.destroy({
            where: { id: userId }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: "Đã xảy ra lỗi khi xóa người dùng" });
    }
};

export default {
    getUserManagementPage,
    createUser,
    deleteUser
}; 