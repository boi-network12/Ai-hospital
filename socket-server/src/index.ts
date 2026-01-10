import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { apiClient } from './services/apiClient';

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    socket.data.userId = decoded.sub || decoded._id;
    socket.data.user = decoded;
    
    console.log(`Authenticated socket: ${socket.id}, User: ${socket.data.userId}`);
    next();
  } catch (error) {
    console.error('Socket auth error:', error);
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
  
  socket.on('send_message', async (data: any) => {
    try {
      const { chatRoomId, ...messageData } = data;
      const token = socket.handshake.auth.token;

      // 1. First save to database via REST API
      const savedMessage = await apiClient.sendMessage(token, {
        chatRoomId,
        ...messageData
      });

      const completeMessage = {
        ...savedMessage.data,
        chatRoomId,
        senderId: socket.data.userId,
        timestamp: new Date().toISOString(),
        status: 'sent',
        readBy: [],
        isEdited: false,
        isDeleted: false,
        reactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 2. Broadcast to chat room
      socket.to(`chat:${chatRoomId}`).emit('receive_message', completeMessage);
      
      // 3. Send confirmation to sender
      socket.emit('message_sent', {
        ...savedMessage.data,
        status: 'sent',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('message_error', {
        error: 'Failed to send message',
        originalData: data
      });
    }
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

  socket.on('mark_read', (data: any) => {
    const { chatRoomId, messageId } = data;
    
    socket.to(`chat:${chatRoomId}`).emit('message_read', {
      messageId,
      readBy: socket.data.userId,
      readAt: new Date().toISOString(),
      chatRoomId
    });
  });
  
  socket.on('add_reaction', async (data: any) => {
    try {
      const { messageId, chatRoomId, emoji } = data;
      const token = socket.handshake.auth.token;

      // 1. Add reaction in database
      await apiClient.addReaction(token, messageId, { emoji });
      
      // 2. Broadcast to chat room
      socket.to(`chat:${chatRoomId}`).emit('reaction_added', {
        messageId,
        emoji,
        userId: socket.data.userId,
        timestamp: new Date().toISOString(),
        chatRoomId
      });
      
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  });

  socket.on('remove_reaction', async (data: any) => {
    try {
      const { messageId, chatRoomId } = data;
      const token = socket.handshake.auth.token;

      // 1. Remove reaction from database
      await apiClient.removeReaction(token, messageId);
      
      // 2. Broadcast to chat room
      socket.to(`chat:${chatRoomId}`).emit('reaction_removed', {
        messageId,
        userId: socket.data.userId,
        timestamp: new Date().toISOString(),
        chatRoomId
      });
      
    } catch (error) {
      console.error('Error removing reaction:', error);
    }
  });
  
  socket.on('edit_message', async (data: any) => {
    try {
      const { messageId, chatRoomId, content } = data;
      const token = socket.handshake.auth.token;

      // 1. Update in database
      const updatedMessage = await apiClient.editMessage(token, messageId, { content });
      
      // 2. Broadcast to entire chat room (including sender)
      io.to(`chat:${chatRoomId}`).emit('message_edited', {
        messageId,
        content,
        userId: socket.data.userId,
        editedAt: new Date().toISOString(),
        chatRoomId
      });
      
    } catch (error) {
      console.error('Error editing message:', error);
      socket.emit('message_error', {
        error: 'Failed to edit message',
        originalData: data
      });
    }
  });

  socket.on('delete_message', async (data: any) => {
  try {
      const { messageId, chatRoomId, deleteForEveryone = false } = data; // Get from data, not params
      const token = socket.handshake.auth.token;

      // 1. Delete from database
      await apiClient.deleteMessage(token, messageId, {
        deleteForEveryone: deleteForEveryone ? 'true' : 'false'
      });
      
      // 2. Broadcast to chat room
      io.to(`chat:${chatRoomId}`).emit('message_deleted', { // Use io.to instead of socket.to
        messageId,
        deleteForEveryone,
        userId: socket.data.userId,
        timestamp: new Date().toISOString(),
        chatRoomId
      });
      
    } catch (error) {
      console.error('Error deleting message:', error);
      socket.emit('message_error', {
        error: 'Failed to delete message',
        originalData: data
      });
    }
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