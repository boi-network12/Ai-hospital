import { Server, Socket } from 'socket.io';
import { Types } from 'mongoose';
import { Message } from '../models/ChatModel';
import User from '../models/UserModel';
import {
  SocketMessageEvent,
  SocketTypingEvent,
  SocketReadReceiptEvent,
  SocketReactionEvent,
  SocketMessageUpdateEvent,
  SocketMessageDeleteEvent
} from '../types/chat';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const registerChatHandlers = (io: Server, socket: AuthenticatedSocket) => {
  console.log(`🟢 Chat socket connected: ${socket.id} (User: ${socket.userId})`);

  // Join chat room
  socket.on('join_chat', (chatRoomId: string) => {
    socket.join(`chat:${chatRoomId}`);
    console.log(`User ${socket.userId} joined chat: ${chatRoomId}`);
    
    // Notify others in the room that user is online
    socket.to(`chat:${chatRoomId}`).emit('user_online', {
      userId: socket.userId,
      chatRoomId,
      timestamp: new Date().toISOString()
    });
  });

  // Leave chat room
  socket.on('leave_chat', (chatRoomId: string) => {
    socket.leave(`chat:${chatRoomId}`);
    console.log(`User ${socket.userId} left chat: ${chatRoomId}`);
  });

  // Send message
  socket.on('send_message', async (data: SocketMessageEvent) => {
    try {
      const { chatRoomId, content, messageType, fileUrl, fileName, fileSize, fileType, replyTo } = data;
      
      if (!socket.userId) {
        socket.emit('error', { message: 'User not authenticated' });
        return;
      }

      // Create message in database
      const message = await Message.create({
        chatRoomId: new Types.ObjectId(chatRoomId),
        senderId: new Types.ObjectId(socket.userId),
        content,
        messageType: messageType || 'text',
        fileUrl,
        fileName,
        fileSize,
        fileType,
        status: 'sent',
        readBy: [new Types.ObjectId(socket.userId)],
        replyTo: replyTo ? new Types.ObjectId(replyTo) : undefined,
        isEdited: false,
        isDeleted: false,
        reactions: []
      });

      // Populate sender info
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name email profile.avatar')
        .lean();

      // Emit to all in the chat room except sender
      socket.to(`chat:${chatRoomId}`).emit('receive_message', {
        ...populatedMessage,
        status: 'delivered' // For recipients, message is delivered
      });

      // Emit to sender with sent status
      socket.emit('message_sent', {
        ...populatedMessage,
        status: 'sent'
      });

      // Update chat room's last message
      io.to(`chat:${chatRoomId}`).emit('chat_updated', {
        chatRoomId,
        lastMessage: populatedMessage,
        lastMessageAt: new Date()
      });

    } catch (error: any) {
      console.error('Send message socket error:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing', (data: SocketTypingEvent) => {
    const { chatRoomId, isTyping } = data;
    
    socket.to(`chat:${chatRoomId}`).emit('user_typing', {
      userId: socket.userId,
      chatRoomId,
      isTyping,
      timestamp: new Date().toISOString()
    });
  });

  // Mark message as read
  socket.on('mark_read', async (data: SocketReadReceiptEvent) => {
    try {
      const { chatRoomId, messageId } = data;
      
      await Message.findByIdAndUpdate(messageId, {
        $addToSet: { readBy: new Types.ObjectId(socket.userId) },
        $set: { status: 'read' }
      });

      // Notify sender that message was read
      const message = await Message.findById(messageId);
      if (message) {
        io.to(`user:${message.senderId.toString()}`).emit('message_read', {
          messageId,
          chatRoomId,
          readBy: socket.userId,
          readAt: new Date().toISOString()
        });
      }

      // Update read status in chat room
      io.to(`chat:${chatRoomId}`).emit('message_read_update', {
        messageId,
        chatRoomId,
        readBy: socket.userId
      });

    } catch (error: any) {
      console.error('Mark read socket error:', error);
    }
  });

  // Add reaction
  socket.on('add_reaction', async (data: SocketReactionEvent) => {
    try {
      const { messageId, emoji, chatRoomId } = data;
      
      const message = await Message.findById(messageId);
      if (!message) return;

      // Remove existing reaction from this user
      message.reactions = message.reactions.filter(
        r => r.userId.toString() !== socket.userId
      );

      // Add new reaction
      message.reactions.push({
        userId: new Types.ObjectId(socket.userId!),
        emoji,
        createdAt: new Date()
      });

      await message.save();

      // Emit to chat room
      io.to(`chat:${chatRoomId}`).emit('reaction_added', {
        messageId,
        chatRoomId,
        userId: socket.userId,
        emoji,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Add reaction socket error:', error);
    }
  });

  // Remove reaction
  socket.on('remove_reaction', async (data: Omit<SocketReactionEvent, 'emoji'>) => {
    try {
      const { messageId, chatRoomId } = data;
      
      const message = await Message.findById(messageId);
      if (!message) return;

      message.reactions = message.reactions.filter(
        r => r.userId.toString() !== socket.userId
      );

      await message.save();

      // Emit to chat room
      io.to(`chat:${chatRoomId}`).emit('reaction_removed', {
        messageId,
        chatRoomId,
        userId: socket.userId,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Remove reaction socket error:', error);
    }
  });

  // Edit message
  socket.on('edit_message', async (data: SocketMessageUpdateEvent) => {
    try {
      const { messageId, content, chatRoomId } = data;
      
      const message = await Message.findById(messageId);
      if (!message || message.senderId.toString() !== socket.userId) {
        return;
      }

      message.content = content;
      message.isEdited = true;
      message.editedAt = new Date();
      await message.save();

      // Emit to chat room
      io.to(`chat:${chatRoomId}`).emit('message_edited', {
        messageId,
        chatRoomId,
        content,
        editedAt: new Date().toISOString(),
        editedBy: socket.userId
      });

    } catch (error: any) {
      console.error('Edit message socket error:', error);
    }
  });

  // Delete message
  socket.on('delete_message', async (data: SocketMessageDeleteEvent) => {
    try {
      const { messageId, chatRoomId, deleteForEveryone } = data;
      
      const message = await Message.findById(messageId);
      if (!message) return;

      // Check permissions
      const canDelete = message.senderId.toString() === socket.userId || deleteForEveryone;
      if (!canDelete) return;

      message.isDeleted = true;
      message.deletedAt = new Date();
      message.deletedBy = new Types.ObjectId(socket.userId!);
      await message.save();

      // Emit to chat room
      io.to(`chat:${chatRoomId}`).emit('message_deleted', {
        messageId,
        chatRoomId,
        deletedBy: socket.userId,
        deleteForEveryone,
        timestamp: new Date().toISOString()
      });

    } catch (error: any) {
      console.error('Delete message socket error:', error);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`🔴 Chat socket disconnected: ${socket.id} (User: ${socket.userId})`);
    
    // Notify all chat rooms that user is offline
    socket.rooms.forEach(room => {
      if (room.startsWith('chat:')) {
        socket.to(room).emit('user_offline', {
          userId: socket.userId,
          timestamp: new Date().toISOString()
        });
      }
    });
  });
};