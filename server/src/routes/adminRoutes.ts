import { Router } from 'express';
import * as adminCtrl from '../controllers/adminController';
import { verifyToken } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/adminMiddleware';

const router = Router();

router.use(verifyToken, requireAdmin);

/* Users CRUD */
router.post('/users', adminCtrl.createUser);
router.patch('/users/:userId/role', adminCtrl.updateUserRole);
router.patch('/users/:userId/restrict', adminCtrl.toggleRestrict);
router.delete('/users/:userId', adminCtrl.deleteUser);
router.get('/users', adminCtrl.listUsers);
router.get('/users/:userId', adminCtrl.getAnyProfile);

/* Role request handling */
router.post('/role-requests/:userId', adminCtrl.handleRoleRequest);

/* Analytics */
router.get('/analytics', adminCtrl.analytics);


// src/routes/adminRoutes.ts
router.patch('/users/:userId/certifications', adminCtrl.updateHealthcareCertifications);
router.patch('/users/:userId/certifications/:certificationId/verify', adminCtrl.verifyCertification);
router.patch('/users/:userId/professional-details', adminCtrl.updateProfessionalDetails);

// Add this line with your other admin routes
router.patch('/users/:userId/profile', adminCtrl.updateUserProfile);

export default router;