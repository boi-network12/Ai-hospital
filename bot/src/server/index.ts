import { Server, Socket } from 'socket.io';
import express, { Application } from 'express';
import http from 'http';
import { MedicalAIService } from '../services/MedicalAiService';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';
import { MedicalQueryValidator } from '../validators/MedicalQueryValidator';
import { config } from '../config/env';

export class MedicalAIServer {
  private io: Server;
  private activeSessions: Map<string, SocketSession> = new Map();
  private medicalAIService: MedicalAIService;
  private databaseService: DatabaseService;

  constructor(app: Application, server: http.Server, medicalAIService: MedicalAIService) {
    this.medicalAIService = medicalAIService;
    this.databaseService = new DatabaseService();
    
    // Initialize Socket.IO
    this.io = new Server(server, {
      cors: {
        origin: config.server.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupSocketIO();
    this.setupRoutes(app);
  }

  private setupSocketIO() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify token and get user data
        const user = await this.databaseService.verifyToken(token);
        if (!user) {
          return next(new Error('Invalid token'));
        }

        socket.data.user = user;
        socket.data.userId = user._id;
        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handler
    this.io.on('connection', (socket: Socket) => {
      const userId = socket.data.userId;
      const sessionId = uuidv4();
      
      logger.info(`🔌 New AI session: ${sessionId} for user: ${userId}`);

      // Store session
      this.activeSessions.set(sessionId, {
        socketId: socket.id,
        userId,
        sessionId,
        user: socket.data.user,
        createdAt: new Date(),
        lastActivity: new Date()
      });

      // Join user's personal room
      socket.join(`user:${userId}`);

      // Setup event handlers
      this.setupSocketHandlers(socket, sessionId);

      // Send welcome message
      this.sendWelcomeMessage(socket, userId);

      // Handle disconnect
      socket.on('disconnect', () => {
        logger.info(`🔌 AI session disconnected: ${sessionId}`);
        this.activeSessions.delete(sessionId);
      });
    });
  }

  private setupSocketHandlers(socket: Socket, sessionId: string) {
    // Medical query handler
    socket.on('medical_query', async (data: any, callback: Function) => {
      try {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
          return callback({ error: 'Session not found' });
        }

        // Update last activity
        session.lastActivity = new Date();

        // Validate query
        const validation = MedicalQueryValidator.validate(data);
        if (!validation.valid) {
          return callback({ error: 'Invalid query', details: validation.errors });
        }

        // Send typing indicator
        socket.emit('ai_typing', { isTyping: true });

        // Process medical query
        const response = await this.medicalAIService.processMedicalQuery(
          data.query,
          session.user,
          data.context
        );

        // Save conversation
        await this.databaseService.saveConversation(
          session.userId,
          data.query,
          response,
          'medical_query'
        );

        // Send response
        socket.emit('ai_response', response);
        callback({ success: true, response });

      } catch (error: any) {
        logger.error('Medical query error:', error);
        callback({ error: 'Failed to process query', message: error.message });
      } finally {
        socket.emit('ai_typing', { isTyping: false });
      }
    });

    // Get conversation history
    socket.on('get_conversation_history', async (data: any, callback: Function) => {
      try {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
          return callback({ error: 'Session not found' });
        }

        const history = await this.databaseService.getConversationHistory(
          session.userId,
          data.limit || 50
        );

        callback({ success: true, history });
      } catch (error) {
        logger.error('Get history error:', error);
        callback({ error: 'Failed to get history' });
      }
    });

    // Clear conversation
    socket.on('clear_conversation', async (callback: Function) => {
      try {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
          return callback({ error: 'Session not found' });
        }

        await this.databaseService.clearConversation(session.userId);
        callback({ success: true });
      } catch (error) {
        logger.error('Clear conversation error:', error);
        callback({ error: 'Failed to clear conversation' });
      }
    });

    // Request medical professional recommendation
    socket.on('request_professional_recommendation', async (data: any, callback: Function) => {
      try {
        const session = this.activeSessions.get(sessionId);
        if (!session) {
          return callback({ error: 'Session not found' });
        }

        const recommendations = await this.medicalAIService.recommendMedicalProfessional(
          session.user,
          data.specialization,
          data.location
        );

        callback({ success: true, recommendations });
      } catch (error) {
        logger.error('Recommendation error:', error);
        callback({ error: 'Failed to get recommendations' });
      }
    });
  }

  private async sendWelcomeMessage(socket: Socket, userId: string) {
    try {
      const user = socket.data.user;
      const welcomeMessage = await this.medicalAIService.generateWelcomeMessage(user);
      
      socket.emit('ai_message', {
        type: 'welcome',
        message: welcomeMessage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Welcome message error:', error);
    }
  }

  private setupRoutes(app: express.Application) {
    // REST API for medical queries
    app.post('/api/medical/query', async (req, res) => {
      try {
        const { query, userId, context } = req.body;
        
        if (!query || !userId) {
          return res.status(400).json({ error: 'Query and userId are required' });
        }

        // Get user from database
        const user = await this.databaseService.getUser(userId);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Process query
        const response = await this.medicalAIService.processMedicalQuery(
          query,
          user,
          context
        );

        // Save to conversation history
        await this.databaseService.saveConversation(
          userId,
          query,
          response,
          'medical_query'
        );

        res.json({ success: true, response });
      } catch (error: any) {
        logger.error('REST medical query error:', error);
        res.status(500).json({ error: 'Failed to process query', message: error.message });
      }
    });

    // Get user's medical profile
    app.get('/api/medical/profile/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const profile = await this.databaseService.getUserMedicalProfile(userId);
        
        if (!profile) {
          return res.status(404).json({ error: 'Medical profile not found' });
        }

        res.json({ success: true, profile });
      } catch (error) {
        logger.error('Get medical profile error:', error);
        res.status(500).json({ error: 'Failed to get medical profile' });
      }
    });

    // Update user's medical conditions
    app.post('/api/medical/conditions/:userId', async (req, res) => {
      try {
        const { userId } = req.params;
        const { conditions } = req.body;

        const updated = await this.databaseService.updateMedicalConditions(userId, conditions);
        res.json({ success: true, updated });
      } catch (error) {
        logger.error('Update conditions error:', error);
        res.status(500).json({ error: 'Failed to update conditions' });
      }
    });
  }

  public cleanup() {
    this.io.close();
    this.activeSessions.clear();
    logger.info('Medical AI server cleaned up');
  }
}

interface SocketSession {
  socketId: string;
  userId: string;
  sessionId: string;
  user: any;
  createdAt: Date;
  lastActivity: Date;
}