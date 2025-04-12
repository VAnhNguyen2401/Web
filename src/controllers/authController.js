// controllers/authController.js
import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

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
    const { firstName, lastName, email, password, confirmPassword, phoneNumber } = req.body;

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

        // Kiểm tra định dạng số điện thoại
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(phoneNumber)) {
            return res.render('register.ejs', {
                error: 'Số điện thoại không hợp lệ. Vui lòng nhập 10-15 chữ số',
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
        const newUser = await db.User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phoneNumber,
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

const getForgotPasswordPage = (req, res) => {
    res.render('forgot-password.ejs', { error: null, success: null });
};

const handleForgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await db.User.findOne({ where: { email } });

        if (!user) {
            return res.render('forgot-password.ejs', {
                error: 'Email không tồn tại trong hệ thống',
                success: null
            });
        }

        // Tạo token đặt lại mật khẩu
        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 3600000; // 1 giờ

        // Lưu token vào database
        await user.update({
            resetPasswordToken: resetToken,
            resetPasswordExpires: resetTokenExpiry
        });

        // Tạo transporter để gửi email
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // Tạo nội dung email
        const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Đặt lại mật khẩu - Hệ thống thu phí chung cư',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2563eb;">Đặt lại mật khẩu</h2>
                    <p>Xin chào ${user.firstName} ${user.lastName},</p>
                    <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản của mình.</p>
                    <p>Vui lòng nhấp vào liên kết bên dưới để đặt lại mật khẩu:</p>
                    <a href="${resetUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                        Đặt lại mật khẩu
                    </a>
                    <p>Liên kết này sẽ hết hạn sau 1 giờ.</p>
                    <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
                    <p>Trân trọng,<br>Hệ thống thu phí chung cư</p>
                </div>
            `
        };

        // Gửi email
        await transporter.sendMail(mailOptions);

        return res.render('forgot-password.ejs', {
            error: null,
            success: 'Vui lòng kiểm tra email của bạn để đặt lại mật khẩu'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return res.render('forgot-password.ejs', {
            error: 'Đã xảy ra lỗi, vui lòng thử lại sau',
            success: null
        });
    }
};

const getResetPasswordPage = async (req, res) => {
    const { token } = req.params;

    try {
        const user = await db.User.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { [db.Sequelize.Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.render('reset-password.ejs', {
                error: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
                token: null
            });
        }

        return res.render('reset-password.ejs', {
            error: null,
            token
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return res.render('reset-password.ejs', {
            error: 'Đã xảy ra lỗi, vui lòng thử lại sau',
            token: null
        });
    }
};

const handleResetPassword = async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    try {
        if (password !== confirmPassword) {
            return res.render('reset-password.ejs', {
                error: 'Mật khẩu xác nhận không khớp',
                token
            });
        }

        const user = await db.User.findOne({
            where: {
                resetPasswordToken: token,
                resetPasswordExpires: { [db.Sequelize.Op.gt]: Date.now() }
            }
        });

        if (!user) {
            return res.render('reset-password.ejs', {
                error: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã hết hạn',
                token: null
            });
        }

        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Cập nhật mật khẩu và xóa token
        await user.update({
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
        });

        return res.redirect('/login?message=Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.');

    } catch (error) {
        console.error('Reset password error:', error);
        return res.render('reset-password.ejs', {
            error: 'Đã xảy ra lỗi, vui lòng thử lại sau',
            token
        });
    }
};

export default {
    getLoginPage,
    getRegisterPage,
    handleLogin,
    handleRegister,
    logout,
    getForgotPasswordPage,
    handleForgotPassword,
    getResetPasswordPage,
    handleResetPassword
};