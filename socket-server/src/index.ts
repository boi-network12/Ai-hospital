import dotenv from 'dotenv';
import jwt from "jsonwebtoken";
dotenv.config();

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
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
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true
  }
});

// Authentication middleware (simplified - you can call your main API to verify)
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('No token provided');
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const JWT_SECRET = process.env.JWT_SECRET || '8bc54b3f415d679a36567169f0168110434e69205880e0044eb01b70336c8e4c';
    
    const decoded = jwt.verify(token, JWT_SECRET) as { sub: string; role: string; iat: number; exp: number };
    
    if (!decoded.sub) {
      return next(new Error('Invalid token: No user ID found'));
    }

    // Set user data on socket
    socket.data.userId = decoded.sub;
    socket.data.role = decoded.role;
    
    console.log(`Authenticated socket: ${socket.id}, User: ${socket.data.userId}`);
    next();
    
  } catch (error: any) {
    console.error('Socket auth error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Token expired'));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new Error('Invalid token'));
    }
    
    next(new Error('Authentication error'));
  }
});

// Connection handler
io.on('connection', (socket) => {
  console.log(`✅ Socket connected: ${socket.id} (User: ${socket.data.userId})`);
  
  // Join user's personal room
  if (socket.data.userId && socket.data.userId !== 'unknown') {
    socket.join(`user:${socket.data.userId}`);
    console.log(`User ${socket.data.userId} joined personal room`);
  }
  
  // Chat room handlers
  socket.on('join_chat', (chatRoomId: string) => {
    socket.join(`chat:${chatRoomId}`);
    console.log(`User ${socket.data.userId} joined chat: ${chatRoomId}`);
    
    // Notify others
    socket.to(`chat:${chatRoomId}`).emit('user_online', {
      userId: socket.data.userId,
      chatRoomId,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('leave_chat', (chatRoomId: string) => {
    socket.leave(`chat:${chatRoomId}`);
    console.log(`User ${socket.data.userId} left chat: ${chatRoomId}`);
  });
  
  socket.on('send_message', (data: any) => {
    const { chatRoomId, ...messageData } = data;
    
    // Broadcast to chat room (excluding sender)
    socket.to(`chat:${chatRoomId}`).emit('receive_message', {
      ...messageData,
      chatRoomId,
      senderId: socket.data.userId,
      timestamp: new Date().toISOString()
    });
    
    // Send confirmation to sender
    socket.emit('message_sent', {
      ...messageData,
      chatRoomId,
      status: 'sent',
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('typing', (data: any) => {
    const { chatRoomId, isTyping } = data;
    
    socket.to(`chat:${chatRoomId}`).emit('user_typing', {
      userId: socket.data.userId,
      chatRoomId,
      isTyping,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ Socket disconnected: ${socket.id} (User: ${socket.data.userId}), Reason: ${reason}`);
    
    // Notify all rooms user was in
    socket.rooms.forEach(room => {
      if (room.startsWith('chat:')) {
        socket.to(room).emit('user_offline', {
          userId: socket.data.userId,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
  
  socket.on('error', (error) => {
    console.error(`Socket error ${socket.id}:`, error);
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO server running on port ${PORT}`);
  console.log(`🌐 WebSocket URL: ws://localhost:${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  io.close(() => {
    console.log('Socket.IO server closed');
    process.exit(0);
  });
});