// web.js
import express from "express";
import homeController from "../controllers/homeController.js";
import userFeeController from "../controllers/userFeeController.js";
import adminFeeController from "../controllers/adminFeeController.js";
import adminUserController from "../controllers/adminUserController.js";
import authController from "../controllers/authController.js";
import { isAuthenticated, isAdmin, isUser } from "../middleware/authMiddleware.js";

let router = express.Router();

let initWebRoute = (app) => {
    // Public routes
    router.get('/', (req, res) => {
        if (req.session.user) {
            return res.redirect('/homepage');
        }
        return res.redirect('/login');
    });

    router.get('/about', homeController.getAboutPage);
    router.get('/homepage', isAuthenticated, homeController.getHomePage);

    // Auth routes
    router.get('/login', authController.getLoginPage);
    router.post('/login', authController.handleLogin);
    router.get('/register', authController.getRegisterPage);
    router.post('/register', authController.handleRegister);
    router.get('/logout', authController.logout);

    // User routes
    router.get('/fee', isAuthenticated, isUser, userFeeController.getFeePage);
    router.post('/pay-fee/:id', isAuthenticated, isUser, userFeeController.payFee);

    // Admin routes
    router.get('/admin/user', isAuthenticated, isAdmin, adminUserController.getAdminUserPage);
    router.post('/admin/user', isAuthenticated, isAdmin, adminUserController.createUser);
    router.put('/admin/user/:id', isAuthenticated, isAdmin, adminUserController.updateUser);
    router.delete('/admin/user/:id', isAuthenticated, isAdmin, adminUserController.deleteUser);
    router.get('/admin/fee', isAuthenticated, isAdmin, adminFeeController.getAdminFeePage);
    router.post('/admin/fee', isAuthenticated, isAdmin, adminFeeController.createFee);
    router.post('/admin/fee/:id/update-status', isAuthenticated, isAdmin, adminFeeController.updateFeeStatus);

    // Quên mật khẩu routes
    router.get('/forgot-password', authController.getForgotPasswordPage);
    router.post('/forgot-password', authController.handleForgotPassword);
    router.get('/reset-password/:token', authController.getResetPasswordPage);
    router.post('/reset-password/:token', authController.handleResetPassword);

    app.use("/", router);
}

export default initWebRoute;
