import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { MedicalAIServer } from './server';
import { MedicalAIService } from './services/MedicalAiService';
import { DatabaseService } from './services/DatabaseService';
import { SafetyGuardrail } from './services/SafetyGuardrail';
import { logger } from './utils/logger';
import { validateEnv } from './config/env';

// Validate environment variables
validateEnv();

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '100'),
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Initialize services
const databaseService = new DatabaseService();
const safetyGuardrail = new SafetyGuardrail();
const medicalAIService = new MedicalAIService();
const medicalAIServer = new MedicalAIServer(app, server, medicalAIService);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'medical-ai-bot',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Initialize and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await databaseService.connect();
    logger.info('Database connected successfully');

    // Initialize AI service
    await medicalAIService.initialize();
    logger.info('Medical AI service initialized');

    // Start server
    const PORT = process.env.BOT_PORT || 3002;
    server.listen(PORT, () => {
      logger.info(`🚀 Medical AI Bot running on port ${PORT}`);
      logger.info(`🌐 WebSocket URL: ws://localhost:${PORT}`);
      logger.info(`📊 REST API: http://localhost:${PORT}/api`);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  
  await databaseService.disconnect();
  medicalAIServer.cleanup();
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

// Start the server
startServer();