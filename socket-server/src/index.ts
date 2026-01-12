import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
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

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'socket-server',
    timestamp: new Date().toISOString()
  });
});

// Initialize Socket.IO with proper settings
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
const activeUsers = new Map<string, { socketId: string, userId: string, lastSeen: Date }>();

// Authentication middleware
io.use(async (socket: Socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('No token provided');
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    socket.data.userId = decoded.sub || decoded._id || decoded.userId;
    socket.data.user = decoded;
    
    console.log(`✅ Authenticated socket: ${socket.id}, User: ${socket.data.userId}`);
    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication error'));
  }
});

// Connection handler
io.on('connection', (socket: Socket) => {
  const userId = socket.data.userId;
  console.log(`✅ Socket connected: ${socket.id} (User: ${userId})`);
  
  // Store user as active
  activeUsers.set(userId, {
    socketId: socket.id,
    userId,
    lastSeen: new Date()
  });
  
  // Join user's personal room
  if (userId && userId !== 'unknown') {
    socket.join(`user:${userId}`);
    
    // Emit to all connected clients
    io.emit('user_online_status', {
      userId,
      isOnline: true,
      timestamp: new Date().toISOString()
    });
    
    // Update presence
    io.emit('user_presence_update', {
      userId,
      isOnline: true,
      lastActive: new Date().toISOString(),
      timestamp: new Date().toISOString()
    });
  }
    
  // Chat room handlers
  socket.on('join_chat', (chatRoomId: string) => {
    socket.join(`chat:${chatRoomId}`);
    console.log(`User ${userId} joined chat: ${chatRoomId}`);
    
    // Notify others in this chat that user joined
    socket.to(`chat:${chatRoomId}`).emit('user_joined_chat', {
      userId,
      chatRoomId,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('leave_chat', (chatRoomId: string) => {
    socket.leave(`chat:${chatRoomId}`);
    console.log(`User ${userId} left chat: ${chatRoomId}`);
    
    socket.to(`chat:${chatRoomId}`).emit('user_left_chat', {
      userId,
      chatRoomId,
      timestamp: new Date().toISOString()
    });
  });
  
  // In socket-server/index.ts, update the send_message handler:

  socket.on('send_message', async (data: any, callback: Function) => {
    try {
      const { chatRoomId, ...messageData } = data;
      const token = socket.handshake.auth.token;
      
      console.log(`📨 Sending message to chat: ${chatRoomId} from user: ${userId}`);
      
      // 1. Save to database via REST API
      const savedMessage = await apiClient.sendMessage(token, {
        chatRoomId,
        ...messageData
      });
      
      const completeMessage = {
        ...savedMessage.data,
        _id: savedMessage.data._id || savedMessage.data.id,
        chatRoomId,
        senderId: userId,
        timestamp: new Date().toISOString(),
        status: 'sent',
        readBy: [userId],
        isEdited: false,
        isDeleted: false,
        reactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // 2. Broadcast to ENTIRE chat room (including sender)
      io.to(`chat:${chatRoomId}`).emit('receive_message', completeMessage);
      
      // 3. Also emit chat_updated event to update chat list
      io.to(`chat:${chatRoomId}`).emit('chat_updated', {
        chatRoomId,
        lastMessage: completeMessage,
        lastMessageAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
      
      // 4. Send confirmation to sender ONLY via callback (not via broadcast)
      if (callback) {
        callback({
          success: true,
          data: completeMessage,
          message: 'Message sent successfully'
        });
      }
      
      // 5. Also emit message_sent event for the sender (optional, for consistency)
      socket.emit('message_sent', completeMessage);
      
      console.log(`✅ Message broadcasted to chat: ${chatRoomId}`);
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Send error via callback
      if (callback) {
        callback({
          success: false,
          error: 'Failed to send message',
          // message: error.message
        });
      }
      
      // Also emit error event
      socket.emit('message_error', {
        error: 'Failed to send message',
        originalData: data
      });
    }
  });
    
  socket.on('typing', (data: any) => {
    const { chatRoomId, isTyping } = data;
    
    // Broadcast typing status to everyone in chat EXCEPT sender
    socket.to(`chat:${chatRoomId}`).emit('user_typing', {
      userId,
      chatRoomId,
      isTyping,
      timestamp: new Date().toISOString(),
      userName: socket.data.user?.name || 'User'
    });
    
    console.log(`✍️ User ${userId} ${isTyping ? 'started' : 'stopped'} typing in chat: ${chatRoomId}`);
  });
  
  socket.on('mark_read', (data: any) => {
    const { chatRoomId, messageId } = data;
    
    // Broadcast read receipt to everyone in chat
    socket.to(`chat:${chatRoomId}`).emit('message_read', {
      messageId,
      readBy: userId,
      readAt: new Date().toISOString(),
      chatRoomId
    });
  });

  socket.on('rejoin_rooms', (rooms: string[]) => {
    rooms.forEach(room => {
      if (room.startsWith('chat:')) {
        socket.join(room);
        console.log(`🔄 User ${userId} rejoined room: ${room}`);
      }
    });
  });
  
  socket.on('add_reaction', async (data: any) => {
    try {
      const { messageId, chatRoomId, emoji } = data;
      const token = socket.handshake.auth.token;
      
      console.log(`🎭 Adding reaction to message: ${messageId} in chat: ${chatRoomId}`);
      
      // 1. Add reaction in database
      await apiClient.addReaction(token, messageId, { emoji });
      
      // 2. Broadcast to ENTIRE chat room
      io.to(`chat:${chatRoomId}`).emit('reaction_added', {
        messageId,
        emoji,
        userId,
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
      
      // 2. Broadcast to ENTIRE chat room
      io.to(`chat:${chatRoomId}`).emit('reaction_removed', {
        messageId,
        userId,
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
      
      console.log(`✏️ Editing message: ${messageId} in chat: ${chatRoomId}`);
      
      // 1. Update in database
      const updatedMessage = await apiClient.editMessage(token, messageId, { content });
      
      // 2. Broadcast to ENTIRE chat room (including sender)
      io.to(`chat:${chatRoomId}`).emit('message_edited', {
        messageId,
        content,
        userId,
        editedAt: new Date().toISOString(),
        chatRoomId
      });
      
      // 3. Also update chat if this is the last message
      io.to(`chat:${chatRoomId}`).emit('chat_updated', {
        chatRoomId,
        lastMessage: {
          ...updatedMessage.data,
          content,
          isEdited: true,
          editedAt: new Date().toISOString()
        },
        lastMessageAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
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
      const { messageId, chatRoomId, deleteForEveryone = false } = data;
      const token = socket.handshake.auth.token;
      
      console.log(`🗑️ Deleting message: ${messageId} from chat: ${chatRoomId}`);
      
      // 1. Delete from database
      await apiClient.deleteMessage(token, messageId, {
        deleteForEveryone: deleteForEveryone ? 'true' : 'false'
      });
      
      // 2. Broadcast to ENTIRE chat room
      io.to(`chat:${chatRoomId}`).emit('message_deleted', {
        messageId,
        deleteForEveryone,
        userId,
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
  
  // New: User presence events
  socket.on('user_presence', (data: any) => {
    const { isOnline, lastActive } = data;
    
    // Update user's presence
    if (activeUsers.has(userId)) {
      activeUsers.set(userId, {
        ...activeUsers.get(userId)!,
        lastSeen: lastActive ? new Date(lastActive) : new Date()
      });
    }
    
    // Broadcast presence to all connected clients
    socket.broadcast.emit('user_presence_update', {
      userId,
      isOnline,
      lastActive: lastActive || new Date().toISOString(),
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('disconnect', (reason) => {
    console.log(`❌ Socket disconnected: ${socket.id} (User: ${userId}), Reason: ${reason}`);
    
    // Remove from active users
    activeUsers.delete(userId);
    
    // Notify all rooms user was in
    socket.rooms.forEach(room => {
      if (room.startsWith('chat:')) {
        socket.to(room).emit('user_offline', {
          userId,
          timestamp: new Date().toISOString()
        });
      }
    });
    
    // Broadcast global offline status
    socket.broadcast.emit('user_online_status', {
      userId,
      isOnline: false,
      timestamp: new Date().toISOString()
    });
  });
  
  socket.on('error', (error) => {
    console.error(`Socket error ${socket.id}:`, error);
  });
});

// Get active users
app.get('/active-users', (req, res) => {
  const users = Array.from(activeUsers.values()).map(user => ({
    ...user,
    isOnline: true
  }));
  res.json({ success: true, data: users });
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