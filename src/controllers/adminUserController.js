import db from '../models';

let getAdminUserPage = async (req, res) => {
    try {
        const users = await db.User.findAll({
            include: [{ model: db.Fee }],
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
        const { firstName, lastName, email, password, role } = req.body;

        // Validate input
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).send("Vui lòng điền đầy đủ thông tin");
        }

        // Check if email already exists
        const existingUser = await db.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).send("Email đã được sử dụng");
        }

        // Create new user
        const newUser = await db.User.create({
            firstName,
            lastName,
            email,
            password,
            role: role || 'user'
        });

        return res.status(201).json({ message: "Tạo người dùng thành công", user: newUser });
    } catch (err) {
        console.error("Lỗi khi tạo người dùng:", err);
        return res.status(500).send("Đã xảy ra lỗi khi tạo người dùng");
    }
};

let updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { firstName, lastName, email, role, password } = req.body;

        // Validate input
        if (!firstName || !lastName || !email) {
            return res.status(400).send("Vui lòng điền đầy đủ thông tin");
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

        // Update user
        const user = await db.User.findByPk(userId);
        if (!user) {
            return res.status(404).send("Không tìm thấy người dùng");
        }

        // Prepare update data
        const updateData = {
            firstName,
            lastName,
            email,
            role: role || user.role // Keep existing role if not provided
        };

        // Add password to update data if provided
        if (password) {
            updateData.password = password;
        }

        await user.update(updateData);

        return res.status(200).json({ message: "Cập nhật thông tin thành công" });
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

        // Delete related fees first
        if (user.Fees && user.Fees.length > 0) {
            await db.Fee.destroy({
                where: { userId: userId }
            });
        }

        // Now delete the user
        await user.destroy();

        return res.status(200).json({ message: "Xóa người dùng thành công" });
    } catch (err) {
        console.error("Lỗi khi xóa người dùng:", err);
        return res.status(500).send("Đã xảy ra lỗi khi xóa người dùng");
    }
};

export default {
    getAdminUserPage,
    createUser,
    updateUser,
    deleteUser
};
