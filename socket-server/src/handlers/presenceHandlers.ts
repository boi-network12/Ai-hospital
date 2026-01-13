import { Socket } from 'socket.io';
import { SocketUser } from '../models/types';

export const setupPresenceHandlers = (socket: Socket, activeUsers: Map<string, SocketUser>) => {
  const userId = socket.data.userId;
  
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
};