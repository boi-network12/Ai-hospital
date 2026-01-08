import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { registerChatHandlers } from './chatHandlers';
import { verifyAccess } from '../utils/jwt';
import User from '../models/UserModel';
import { IUser } from '../types/usersDetails';
import { HydratedDocument } from 'mongoose';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const initSocket = (server: HttpServer): Server => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN?.split(',') || '*',
      credentials: true,
      optionsSuccessStatus: 200,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      console.log('🔍 Socket auth attempt, token present:', !!token);
      console.log('🔍 Token first 50 chars:', token ? token.substring(0, 50) + '...' : 'none');
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const payload = verifyAccess(token);

      const user = await User.findById(payload.sub)
          .select('_id name email isOnline lastActive') as any;
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.userId = user._id.toString();
      
      // Update user's online status
      user.isOnline = true;
      user.lastActive = new Date();
      await user.save();

      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`🟢 Socket connected: ${socket.id} (User: ${socket.userId})`);

    // Join user's personal room for direct notifications
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    // Register chat handlers
    registerChatHandlers(io, socket);

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`🔴 Socket disconnected: ${socket.id} (User: ${socket.userId})`);
      
      if (socket.userId) {
        // Update user's offline status after a delay (could be reconnection)
        setTimeout(async () => {
          const user = await User.findById(socket.userId);
          if (user && user.isOnline) {
            // Check if user has any other active connections
            const sockets = await io.in(`user:${socket.userId}`).fetchSockets();
            if (sockets.length === 0) {
              user.isOnline = false;
              user.lastActive = new Date();
              await user.save();
              
              // Notify chat rooms that user went offline
              socket.rooms.forEach(room => {
                if (room.startsWith('chat:')) {
                  io.to(room).emit('user_offline', {
                    userId: socket.userId,
                    timestamp: new Date().toISOString()
                  });
                }
              });
            }
          }
        }, 5000); // 5 second delay to handle quick reconnections
      }
    });

    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  // Optional: store globally if needed
  setIoInstance(io);

  return io;
};

// Optional global access
export let io: Server | undefined;
export const setIoInstance = (instance: Server) => {
  io = instance;
};