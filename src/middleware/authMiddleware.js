const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    console.log('Chưa đăng nhập, chuyển hướng tới trang đăng nhập');
    return res.redirect('/login');
};

const isAdmin = (req, res, next) => {
    console.log('Kiểm tra quyền admin:', {
        session: req.session ? 'exists' : 'missing',
        user: req.session?.user ? 'exists' : 'missing',
        role: req.session?.user?.role || 'không có vai trò'
    });

    if (req.session?.user?.role === 'admin') {
        console.log('Xác nhận: Người dùng có quyền admin');
        return next();
    }

    console.log('Từ chối: Người dùng không có quyền admin');
    return res.status(403).send('Không có quyền truy cập admin');
};

const isUser = (req, res, next) => {
    console.log('Kiểm tra quyền user:', {
        session: req.session ? 'exists' : 'missing',
        user: req.session?.user ? 'exists' : 'missing',
        role: req.session?.user?.role || 'không có vai trò'
    });

    if (req.session?.user?.role === 'user') {
        console.log('Xác nhận: Người dùng có quyền user');
        return next();
    }

    console.log('Từ chối: Người dùng không phải user thông thường');
    return res.status(403).send('Không có quyền truy cập người dùng');
};

// Sử dụng cú pháp export của ES modules
export { isAuthenticated, isAdmin, isUser };
