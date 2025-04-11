// controllers/authController.js
import db from '../models/index.js';
import bcrypt from 'bcryptjs';

const getLoginPage = (req, res) => {
    res.render('login.ejs', { error: null });
};

const getRegisterPage = (req, res) => {
    res.render('register.ejs', { error: null, success: null });
};

const handleLogin = async (req, res) => {
    const { email, password } = req.body;
    console.log('Attempting login with:', email);

    try {
        // Find user
        const user = await db.User.findOne({
            where: { email }
        });

        if (!user) {
            console.log('User not found');
            return res.render('login.ejs', {
                error: 'Email hoặc mật khẩu không đúng'
            });
        }

        console.log('User found:', {
            email: user.email,
            role: user.role,
            storedHash: user.password
        });

        // Direct password comparison with bcrypt
        const isValid = await bcrypt.compare(password, user.password);
        console.log('Password comparison result:', isValid);

        if (!isValid) {
            return res.render('login.ejs', {
                error: 'Email hoặc mật khẩu không đúng'
            });
        }

        // Set up session
        req.session.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: `${user.firstName} ${user.lastName}`
        };

        console.log('Login successful, redirecting to homepage');
        return res.redirect('/homepage');

    } catch (error) {
        console.error('Login error:', error);
        return res.render('login.ejs', {
            error: 'Đã xảy ra lỗi, vui lòng thử lại sau'
        });
    }
};

const handleRegister = async (req, res) => {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    try {
        // Kiểm tra mật khẩu xác nhận
        if (password !== confirmPassword) {
            return res.render('register.ejs', {
                error: 'Mật khẩu xác nhận không khớp',
                success: null
            });
        }

        // Kiểm tra độ dài mật khẩu
        if (password.length < 6) {
            return res.render('register.ejs', {
                error: 'Mật khẩu phải có ít nhất 6 ký tự',
                success: null
            });
        }

        // Kiểm tra email đã tồn tại
        const existingUser = await db.User.findOne({
            where: { email }
        });

        if (existingUser) {
            return res.render('register.ejs', {
                error: 'Email đã được sử dụng',
                success: null
            });
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo người dùng mới
        await db.User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: 'user'
        });

        return res.render('register.ejs', {
            error: null,
            success: 'Đăng ký thành công! Vui lòng đăng nhập'
        });

    } catch (error) {
        console.error('Register error:', error);
        return res.render('register.ejs', {
            error: 'Đã xảy ra lỗi, vui lòng thử lại sau',
            success: null
        });
    }
};

const logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
};

// Function to create a test user with a known password
const createTestUser = async () => {
    try {
        // Delete existing test user if exists
        await db.User.destroy({
            where: { email: 'vietanh@gmail.com' }
        });

        // Create new test user with known password hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        await db.User.create({
            firstName: 'Viet',
            lastName: 'Anh',
            email: 'vietanh@gmail.com',
            password: hashedPassword,
            role: 'admin'
        });

        console.log('Test user created with hash:', hashedPassword);
    } catch (error) {
        console.error('Error creating test user:', error);
    }
};

// Create test user on startup
createTestUser();

export default {
    getLoginPage,
    getRegisterPage,
    handleLogin,
    handleRegister,
    logout
};