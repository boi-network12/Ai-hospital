// src/middlewares/aiMiddleware.ts - UPDATED
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';
import rateLimit from 'express-rate-limit';

// Rate limiting for AI endpoints - FIXED VERSION
export const aiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many AI requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Fixed keyGenerator - properly handles both IPv4 and IPv6
  keyGenerator: (req: AuthRequest) => {
    // Use user ID if authenticated, otherwise use IP
    if (req.user?._id) {
      return req.user._id.toString();
    }
    
    // For non-authenticated requests, use the request IP
    // express-rate-limit will handle IPv4/IPv6 properly
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
});

// Emergency request validator
export const validateEmergencyRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { symptoms } = req.body;
  
  if (!symptoms || !Array.isArray(symptoms) || symptoms.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Symptoms array is required for emergency assessment'
    });
  }

  // Check for obvious emergencies
  const emergencyKeywords = [
    'chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious',
    'suicide', 'heart attack', 'stroke', 'choking'
  ];

  const hasEmergency = symptoms.some(symptom =>
    emergencyKeywords.some(keyword =>
      symptom.toLowerCase().includes(keyword.toLowerCase())
    )
  );

  if (hasEmergency) {
    // Log emergency for monitoring
    console.warn(`EMERGENCY DETECTED: ${symptoms.join(', ')}`);
    
    // You could trigger notifications here
    // notifyEmergencyServices(req.user, symptoms);
  }

  next();
};

// Conversation validation
export const validateConversation = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const { conversationId } = req.body;
  
  if (conversationId && !/^[a-zA-Z0-9-_.]+$/.test(conversationId)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid conversation ID format'
    });
  }

  next();
};

// Alternative: If you want to use the built-in IP handler, simplify to:
export const simpleAIRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many AI requests. Please try again later.'
  },
  // Let express-rate-limit handle IP detection automatically
  // keyGenerator will default to req.ip
});