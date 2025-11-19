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

// ============ ADD THESE PROFESSIONAL ROUTES ============
router.get('/me/professional-profile', userCtrl.getProfessionalProfile);
router.patch('/me/professional-profile', userCtrl.updateProfessionalProfile);
router.get('/me/certifications', userCtrl.getMyCertifications);
router.post('/me/certifications', userCtrl.addCertification);
router.patch('/me/certifications/:certificationId', userCtrl.updateCertification);
router.get('/me/professional-stats', userCtrl.getProfessionalStats);
router.patch('/me/availability', userCtrl.updateAvailability);
router.patch('/me/online-status', userCtrl.updateOnlineStatus);
router.get('/me/ratings', userCtrl.getMyRatings);
router.get('/me/tips', userCtrl.getMyTips);
router.get('/me/earnings-report', userCtrl.getEarningsReport);
// ============ END PROFESSIONAL ROUTES ============ //

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