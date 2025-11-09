import { Server, Socket } from 'socket.io';

export default function registerChatHandlers(io: Server, socket: Socket) {
  socket.on('chat_message', (msg) => {
    io.emit('chat_message', msg);
  });

  socket.on('disconnect', () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
}
