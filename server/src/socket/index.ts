import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import registerChatHandlers from './chatHandlers';

export const initSocket = (server: HttpServer): void => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN?.split(',') || '*',
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`🟢 Socket connected: ${socket.id}`);
    registerChatHandlers(io, socket);
  });
};
// server/socket/index.ts