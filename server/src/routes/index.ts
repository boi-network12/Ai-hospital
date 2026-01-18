// src/routes/index.ts
import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import HealthRoutes from './health';
import systemRoutes from './systemRoutes';
import adminRoutes from './adminRoutes';
import notificationRoutes from './notificationRoutes';
import healthcareRoutes from './healthcareRoutes';
import hydrationRoutes from './hydrationRoutes';
import careerRoutes from './careerRoutes';
import chatRoutes from './chatRoutes';
import uploadRoutes from './uploadRoutes';
import aiRoutes from "./aiRoutes";

const router = Router();

router.use('/v1/auth', authRoutes);
router.use('/v1/user', userRoutes);
router.use('/v1/health', HealthRoutes);
router.use('/v1/system', systemRoutes);
router.use('/v1/admin', adminRoutes);
router.use('/v1/notifications', notificationRoutes);
router.use('/v1/healthcare', healthcareRoutes);
router.use('/v1/hydration', hydrationRoutes); 
router.use('/v1/career', careerRoutes);
router.use('/v1/chat', chatRoutes);
router.use('/v1/upload', uploadRoutes);
router.use('/v1/ai', aiRoutes);

export default router;