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

export default {
    getAdminUserPage
};
