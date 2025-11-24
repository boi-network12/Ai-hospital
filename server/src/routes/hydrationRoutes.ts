import { Router } from 'express';
import { 
  logIntake, 
  setGoal, 
  getTodayStats, 
  getLogs, 
  generateRecommendation, 
  getRecommendation, 
  deleteLog 
} from '../controllers/hydrationController';
import { verifyToken } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(verifyToken);

// Log water intake
router.post('/log', logIntake);

// Set hydration goal
router.post('/goal', setGoal);

// Get today's stats
router.get('/stats/today', getTodayStats);

// Get hydration logs with pagination
router.get('/logs', getLogs);

// Generate personalized recommendation
router.post('/recommendation', generateRecommendation);

// Get current recommendation
router.get('/recommendation', getRecommendation);

// Delete hydration log
router.delete('/log/:logId', deleteLog);

export default router;