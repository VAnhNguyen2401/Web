// web.js
import express from "express";
import homeController from "../controllers/homeController.js"; // nhớ thêm .js nếu dùng "type": "module"
import userFeeController from "../controllers/userFeeController.js"; // nhớ thêm .js nếu dùng "type": "module"
import adminFeeController from "../controllers/adminFeeController.js"; // nhớ thêm .js nếu dùng "type": "module"
import adminUserController from "../controllers/adminUserController.js";
import authController from "../controllers/authController.js"; // nhớ thêm .js nếu dùng "type": "module"
import { isAuthenticated, isAdmin, isUser } from "../middleware/authMiddleware.js"; // nhớ thêm .js nếu dùng "type": "module"

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
    router.get('/logout', authController.logout);

    // User routes
    router.get('/fee', isAuthenticated, isUser, userFeeController.getFeePage);
    router.post('/pay-fee/:id', isAuthenticated, isUser, userFeeController.payFee);

    // Admin routes
    router.get('/admin/user', isAuthenticated, isAdmin, adminUserController.getAdminUserPage);
    router.get('/admin/fee', isAuthenticated, isAdmin, adminFeeController.getAdminFeePage);
    router.post('/admin/fee', isAuthenticated, isAdmin, adminFeeController.createFee);
    router.post('/admin/fee/:id/update-status', isAuthenticated, isAdmin, adminFeeController.updateFeeStatus);

    app.use("/", router);
}

export default initWebRoute; // ✅ Dùng export ES6 đúng cách
