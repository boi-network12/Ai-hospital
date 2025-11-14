// src/routes/v1/userRoutes.ts
import { Router } from 'express';
import * as userCtrl from '../controllers/userController';
import { verifyToken } from '../middlewares/authMiddleware';
import { getUserProfile } from '../controllers/userController';
import { uploadAvatar } from '../middlewares/uploadMiddleware';

const router = Router();

/* Public */
router.get('/:id', getUserProfile);

/* Protected */
router.use(verifyToken);
router.get('/me/profile', userCtrl.getMyProfile);
router.patch('/me/profile', userCtrl.updateMyProfile);
router.patch('/me/avatar', uploadAvatar, userCtrl.updateAvatar);

router.get('/me/devices', userCtrl.getMyDevices);
router.post('/me/devices/revoke', userCtrl.revokeDevice);

/* Email */
router.patch('/me/email', userCtrl.updateEmail);

/* Password */
router.patch('/me/password', userCtrl.updatePassword);

/* Notifications */
router.patch('/me/notifications', userCtrl.updateNotifications);

/* Devices */
router.get('/me/devices', userCtrl.getMyDevices);
router.delete('/me/devices/revoke', userCtrl.revokeDevice);

export default router;