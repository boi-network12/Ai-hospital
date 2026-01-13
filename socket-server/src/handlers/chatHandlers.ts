import { Socket } from 'socket.io';
import { apiClient } from '../services/apiClient';

export const setupChatHandlers = (socket: Socket, io: any) => {
  const userId = socket.data.userId;
  
  socket.on('join_chat', (chatRoomId: string, callback: Function) => {
    try {
      const userId = socket.data.userId;
      
      socket.join(`chat:${chatRoomId}`);
      console.log(`User ${userId} joined chat: ${chatRoomId}`);
      
      // IMPORTANT: Send callback response
      if (typeof callback === 'function') {
        callback({
          success: true,
          chatRoomId,
          message: 'Successfully joined chat'
        });
      }
      
      // Notify others in the room
      socket.to(`chat:${chatRoomId}`).emit('user_joined_chat', {
        userId,
        chatRoomId,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error joining chat:', error);
      
      // Send error callback if provided
      if (typeof callback === 'function') {
        callback({
          success: false,
          error: 'Failed to join chat'
        });
      }
    }
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
  
  socket.on('send_message', async (data: any, callback: Function) => {
    try {
      const { chatRoomId, ...messageData } = data;
      const token = socket.handshake.auth.token;
      
      console.log(`📨 Sending message to chat: ${chatRoomId} from user: ${userId}`);
      
      // Save to database
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
      
      // Broadcast to ENTIRE chat room
      io.to(`chat:${chatRoomId}`).emit('receive_message', completeMessage);
      
      // Emit chat_updated event
      io.to(`chat:${chatRoomId}`).emit('chat_updated', {
        chatRoomId,
        lastMessage: completeMessage,
        lastMessageAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      });
      
      // Send confirmation to sender
      if (callback) {
        callback({
          success: true,
          data: completeMessage,
          message: 'Message sent successfully'
        });
      }
      
      socket.emit('message_sent', completeMessage);
      
    } catch (error: any) {
      console.error('❌ Error sending message:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (callback) {
        callback({
          success: false,
          error: 'Failed to send message',
          message
        });
      }
      
      socket.emit('message_error', {
        error: 'Failed to send message',
        originalData: data
      });
    }
  });
  
  socket.on('typing', (data: any) => {
    const { chatRoomId, isTyping } = data;
    const userName = socket.data.user?.name || 'User';
    
    console.log(`✍️ User ${userId} (${userName}) ${isTyping ? 'started' : 'stopped'} typing in chat: ${chatRoomId}`);
    
    socket.to(`chat:${chatRoomId}`).emit('user_typing', {
      userId,
      chatRoomId,
      isTyping,
      timestamp: new Date().toISOString(),
      userName
    });
  });
  
  socket.on('mark_read', (data: any) => {
    const { chatRoomId, messageId } = data;
    
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
      
      await apiClient.addReaction(token, messageId, { emoji });
      
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
      
      await apiClient.removeReaction(token, messageId);
      
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
      
      const updatedMessage = await apiClient.editMessage(token, messageId, { content });
      
      io.to(`chat:${chatRoomId}`).emit('message_edited', {
        messageId,
        content,
        userId,
        editedAt: new Date().toISOString(),
        chatRoomId
      });
      
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
      
      await apiClient.deleteMessage(token, messageId, {
        deleteForEveryone: deleteForEveryone ? 'true' : 'false'
      });
      
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
};