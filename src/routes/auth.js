import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

router.get('/login', authController.getLoginPage);
router.post('/login', authController.handleLogin);
router.post('/register', authController.handleRegister);
router.get('/logout', authController.logout);

export default router; 