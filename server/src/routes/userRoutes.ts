// src/routes/v1/userRoutes.ts
import { Router } from 'express';
import * as userCtrl from '../controllers/userController';
import { verifyToken } from '../middlewares/authMiddleware';
import { getUserProfile } from '../controllers/userController';

const router = Router();

/* Public */
router.get('/:id', getUserProfile);

/* Protected */
router.use(verifyToken);
router.get('/me/profile', userCtrl.getMyProfile);
router.patch('/me/profile', userCtrl.updateMyProfile);
router.get('/me/devices', userCtrl.getMyDevices);
router.post('/me/devices/revoke', userCtrl.revokeDevice);

export default router;