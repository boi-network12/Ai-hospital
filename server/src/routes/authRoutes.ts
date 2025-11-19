// src/routes/v1/authRoutes.ts
import { Router } from 'express';
import * as authCtrl from '../controllers/authController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

router.post('/register/otp', authCtrl.requestRegisterOtp);
router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);
router.post('/refresh', authCtrl.refresh);
router.post('/logout', verifyToken, authCtrl.logout);

router.post('/forgot-password', authCtrl.forgotPassword);
router.post('/reset-password', authCtrl.resetPassword);

router.delete('/me', verifyToken, authCtrl.deleteAccount);

export default router;