let getHomePage = (req, res) => {
    // Kiểm tra xem người dùng đã đăng nhập chưa
    if (!req.session.user) {
        return res.redirect('/login');
    }

    // Lấy thông tin người dùng từ session
    const user = req.session.user;

    // Render trang chủ với thông tin người dùng
    return res.render("homepage.ejs", {
        user: user
    });
};

let getAboutPage = (req, res) => {
    return res.send("Trang giới thiệu");
};

export default {
    getHomePage,
    getAboutPage
};
