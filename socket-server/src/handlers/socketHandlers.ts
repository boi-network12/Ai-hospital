import { Socket } from 'socket.io';
import { SocketUser } from '../models/types';

export const handleConnection = (socket: Socket, activeUsers: Map<string, SocketUser>) => {
  const userId = socket.data.userId;
  console.log(`✅ Socket connected: ${socket.id} (User: ${userId})`);
  
  // Store user as active
  activeUsers.set(userId, {
    socketId: socket.id,
    userId,
    user: socket.data.user,
    lastSeen: new Date()
  });
  
  // Join user's personal room
  if (userId && userId !== 'unknown') {
    socket.join(`user:${userId}`);
    
    // Emit to all connected clients
    socket.broadcast.emit('user_online_status', {
      userId,
      isOnline: true,
      timestamp: new Date().toISOString()
    });
    
    // Update presence
    socket.broadcast.emit('user_presence_update', {
      userId,
      isOnline: true,
      lastActive: new Date().toISOString(),
      timestamp: new Date().toISOString()
    });
  }
};

export const handleDisconnect = (socket: Socket, activeUsers: Map<string, SocketUser>) => {
  const userId = socket.data.userId;
  
  return (reason: string) => {
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
  };
};