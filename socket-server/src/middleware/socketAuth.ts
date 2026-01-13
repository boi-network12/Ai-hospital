import jwt from 'jsonwebtoken';
import { Socket } from 'socket.io';
import { apiClient } from '../services/apiClient';

export const socketAuth = async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      console.log('No token provided');
      return next(new Error('Authentication error: No token provided'));
    }
    
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    socket.data.userId = decoded.sub || decoded._id || decoded.userId;
    
    // Fetch full user data from database
    try {
      const userResponse = await apiClient.getUser(token, socket.data.userId);
      socket.data.user = userResponse.data || userResponse;
    } catch (error) {
      console.warn('Failed to fetch user details:', error);
      // Use decoded data as fallback
      socket.data.user = decoded;
    }
    
    console.log(`✅ Authenticated socket: ${socket.id}, User: ${socket.data.userId}`);
    next();
  } catch (error) {
    console.error('Socket auth error:', error);
    next(new Error('Authentication error'));
  }
};