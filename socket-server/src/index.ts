import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

import { socketAuth } from './middleware/socketAuth';
import { handleConnection, handleDisconnect } from './handlers/socketHandlers';
import { setupChatHandlers } from './handlers/chatHandlers';
import { setupPresenceHandlers } from './handlers/presenceHandlers';
import { SocketUser } from './models/types';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'socket-server',
    timestamp: new Date().toISOString()
  });
});

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST']
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000,
    skipMiddlewares: true
  }
});

// Store active users by userId
const activeUsers = new Map<string, SocketUser>();

// Authentication middleware
io.use(socketAuth);

// Connection handler
io.on('connection', (socket) => {
  handleConnection(socket, activeUsers);
  setupChatHandlers(socket, io);
  setupPresenceHandlers(socket, activeUsers);
  
  socket.on('disconnect', handleDisconnect(socket, activeUsers));
  socket.on('error', (error) => {
    console.error(`Socket error ${socket.id}:`, error);
  });
});

// Get active users endpoint
app.get('/active-users', (req, res) => {
  const users = Array.from(activeUsers.values()).map(user => ({
    ...user,
    isOnline: true
  }));
  res.json({ success: true, data: users });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Socket.IO server is running',
    service: 'ai-hospital-socket',
    health: '/health'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', url: req.originalUrl });
});


// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`🌐 WebSocket URL: ws://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
  console.log(`👤 Active users endpoint: http://localhost:${PORT}/active-users`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  io.close(() => {
    console.log('Socket.IO server closed');
    process.exit(0);
  });
});