const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.redirect('/login');
};

const isAdmin = (req, res, next) => {
    if (req.session?.user?.role === 'admin') {
        return next();
    }
    return res.status(403).send('Không có quyền truy cập admin');
};

const isUser = (req, res, next) => {
    if (req.session?.user?.role === 'user') {
        return next();
    }
    return res.status(403).send('Không có quyền truy cập người dùng');
};

// 👉 Đây là cách export đúng trong CommonJS
module.exports = {
    isAuthenticated,
    isAdmin,
    isUser
};
