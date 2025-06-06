// web.js
import express from "express";
import homeController from "../controllers/homeController.js";
import userFeeController from "../controllers/userFeeController.js";
import adminFeeController from "../controllers/adminFeeController.js";
import adminUserController from "../controllers/adminUserController.js";
import authController from "../controllers/authController.js";
import { isAuthenticated, isAdmin, isUser } from "../middleware/authMiddleware.js";

const apartmentController = require("../controllers/apartmentController.js");
const vehicleController = require("../controllers/vehicleController.js");
const emailNotificationController = require("../controllers/emailNotificationController.js");

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
    router.post('/admin/fee/monthly-service', isAuthenticated, isAdmin, adminFeeController.createMonthlyServiceFee);
    router.post('/admin/fee/internet-for-all', isAuthenticated, isAdmin, adminFeeController.createInternetFeeForAll);
    router.get('/admin/fee/user-apartment/:userId', isAuthenticated, isAdmin, adminFeeController.getUserApartmentInfo);

    // Admin apartment routes
    router.get('/admin/apartment', isAuthenticated, isAdmin, apartmentController.getApartmentManagePage);
    router.post('/admin/apartment/create', isAuthenticated, isAdmin, apartmentController.createApartment);
    router.post('/admin/apartment/assign', isAuthenticated, isAdmin, apartmentController.assignApartment);
    router.post('/admin/apartment/remove-owner', isAuthenticated, isAdmin, apartmentController.removeOwner);
    router.put('/admin/apartment/update/:id', isAuthenticated, isAdmin, apartmentController.updateApartment);
    router.delete('/admin/apartment/delete/:id', isAuthenticated, isAdmin, apartmentController.deleteApartment);

    // Admin vehicle routes
    router.get('/admin/vehicle', isAuthenticated, isAdmin, vehicleController.getVehicleManagePage);
    router.post('/admin/vehicle', isAuthenticated, isAdmin, vehicleController.createVehicle);
    router.put('/admin/vehicle/:id', isAuthenticated, isAdmin, vehicleController.updateVehicle);
    router.delete('/admin/vehicle/:id', isAuthenticated, isAdmin, vehicleController.deleteVehicle);

    // Quên mật khẩu routes
    router.get('/forgot-password', authController.getForgotPasswordPage);
    router.post('/forgot-password', authController.handleForgotPassword);
    router.get('/reset-password/:token', authController.getResetPasswordPage);
    router.post('/reset-password/:token', authController.handleResetPassword);

    // Email notification routes (Admin only)
    router.post('/api/notification/fee/:feeId', isAuthenticated, isAdmin, emailNotificationController.sendFeeNotificationEmail);
    router.post('/api/notification/user/:userId/pending-fees', isAuthenticated, isAdmin, emailNotificationController.sendAllPendingFeesNotification);
    router.post('/api/notification/bulk-all-users', isAuthenticated, isAdmin, emailNotificationController.sendBulkNotificationToAllUsers);
    router.get('/api/notification/users-with-pending-fees', isAuthenticated, isAdmin, emailNotificationController.getUsersWithPendingFees);

    app.use("/", router);
}

export default initWebRoute;
