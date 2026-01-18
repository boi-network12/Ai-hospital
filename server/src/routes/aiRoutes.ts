// src/routes/aiRoutes.ts - UPDATED VERSION
import { Router } from 'express';
import { aiController } from '../controllers/AIController';
import { verifyToken } from '../middlewares/authMiddleware';
import { 
  aiRateLimiter, 
  validateEmergencyRequest,
  validateConversation 
} from '../middlewares/aiMiddleware'; 
import { body } from 'express-validator';

const router = Router();

// Apply authentication to all AI routes
router.use(verifyToken);

// Apply rate limiting to all AI routes
router.use(aiRateLimiter);

// Process medical query - with conversation validation
router.post(
  '/query',
  [
    body('query')
      .trim()
      .notEmpty()
      .withMessage('Medical query is required')
      .isLength({ max: 1000 })
      .withMessage('Query too long (max 1000 characters)'),
    body('conversationId')
      .optional()
      .isString()
      .withMessage('Conversation ID must be a string'),
    body('location')
      .optional()
      .isObject()
      .withMessage('Location must be an object')
  ],
  validateConversation, // Add conversation validation middleware
  aiController.processQuery
);

// Get conversation history
router.get('/history', aiController.getConversationHistory);

// Clear conversation history
router.delete('/history', aiController.clearHistory);

// Get health summary
router.get('/health-summary', aiController.getHealthSummary);

// Emergency triage - with emergency validation
router.post(
  '/emergency-triage',
  [
    body('symptoms')
      .isArray()
      .withMessage('Symptoms must be an array')
      .notEmpty()
      .withMessage('At least one symptom is required'),
    body('severity')
      .optional()
      .isIn(['mild', 'moderate', 'severe'])
      .withMessage('Severity must be mild, moderate, or severe'),
    body('location')
      .optional()
      .isObject()
      .withMessage('Location must be an object')
  ],
  validateEmergencyRequest, // Add emergency validation middleware
  aiController.emergencyTriage
);

export default router;