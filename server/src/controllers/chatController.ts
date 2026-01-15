import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { ChatService } from '../services/chatService';
import {
  CreateChatRoomRequest,
  SendMessageRequest,
  UpdateMessageRequest,
  MarkAsReadRequest,
  ChatListResponse,
  MessagesResponse
} from '../types/chat';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import { ChatRoom } from '../models/ChatModel';

const paramsStr = (userId: string | string[]): string => {
  if (Array.isArray(userId)) {
    return userId[0];
  }
  return userId;
};

// Create or get chat room
export const createChatRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { participantIds, isGroup, groupName, groupDescription, groupPhoto }: CreateChatRoomRequest = req.body;
    const userId = req.user._id.toString();

    // Include current user in participants if not already included
    const allParticipants = [...new Set([...participantIds, userId])];

    const chatRoom = await ChatService.getOrCreateChatRoom(
      allParticipants,
      userId,
      isGroup,
      groupName,
      groupDescription,
      groupPhoto
    );

    res.status(200).json({
      success: true,
      data: chatRoom,
      message: isGroup ? 'Group chat created successfully' : 'Chat room created/retrieved successfully'
    });
  } catch (error: any) {
    console.error('Create chat room error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create chat room'
    });
  }
};

// Send message
export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { chatRoomId, content, messageType, fileUrl, fileName, fileSize, fileType, replyTo }: SendMessageRequest = req.body;
    const userId = req.user._id.toString();

    const fileInfo = fileUrl ? { fileUrl, fileName, fileSize, fileType } : undefined;

    const message = await ChatService.sendMessage(
      chatRoomId,
      userId,
      content,
      messageType || 'text',
      fileInfo,
      replyTo
    );

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully',
      socketEvent: 'receive_message'
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to send message'
    });
  }
};

// Get messages for a chat room
export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const chatRoomIdStr = paramsStr(chatRoomId);
    const userId = req.user._id.toString();
    const { page = 1, limit = 50, before } = req.query;

    const messages = await ChatService.getMessages(
      chatRoomIdStr,
      userId,
      Number(page),
      Number(limit),
      before ? new Date(before as string) : undefined
    );

    const response: MessagesResponse = {
      success: true,
      data: messages
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get messages error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get messages'
    });
  }
};

// Mark messages as read
export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const chatRoomIdStr = paramsStr(chatRoomId)
    const { messageIds }: MarkAsReadRequest = req.body;
    const userId = req.user._id.toString();

    await ChatService.markMessagesAsRead(chatRoomIdStr, userId, messageIds);

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error: any) {
    console.error('Mark as read error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to mark messages as read'
    });
  }
};

// Edit message
export const editMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const messageIdStr = paramsStr(messageId)
    const { content }: UpdateMessageRequest = req.body;
    const userId = req.user._id.toString();

    const message = await ChatService.editMessage(messageIdStr, userId, content);

    res.status(200).json({
      success: true,
      data: message,
      message: 'Message updated successfully'
    });
  } catch (error: any) {
    console.error('Edit message error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to edit message'
    });
  }
};

// Delete message
export const deleteMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const messageIdStr = paramsStr(messageId)
    const { deleteForEveryone } = req.query;
    const userId = req.user._id.toString();

    await ChatService.deleteMessage(
      messageIdStr,
      userId,
      deleteForEveryone === 'true'
    );

    res.status(200).json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete message error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to delete message'
    });
  }
};

// Add reaction to message
export const addReaction = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const messageIdStr = paramsStr(messageId)
    const { emoji } = req.body;
    const userId = req.user._id.toString();

    const message = await ChatService.addReaction(messageIdStr, userId, emoji);

    res.status(200).json({
      success: true,
      data: message,
      message: 'Reaction added'
    });
  } catch (error: any) {
    console.error('Add reaction error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to add reaction'
    });
  }
};

// Remove reaction from message
export const removeReaction = async (req: AuthRequest, res: Response) => {
  try {
    const { messageId } = req.params;
    const messageIdStr = paramsStr(messageId)
    const userId = req.user._id.toString();

    const message = await ChatService.removeReaction(messageIdStr, userId);

    res.status(200).json({
      success: true,
      data: message,
      message: 'Reaction removed'
    });
  } catch (error: any) {
    console.error('Remove reaction error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to remove reaction'
    });
  }
};

// Get user's chat list
export const getChats = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const { page = 1, limit = 20 } = req.query;

    const chats = await ChatService.getUserChats(
      userId,
      Number(page),
      Number(limit)
    );

    const response: ChatListResponse = {
      success: true,
      data: chats
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get chats error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get chats'
    });
  }
};

// Add this function
export const getChatRoom = async (req: AuthRequest, res: Response) => {
  try {
    const { chatRoomId } = req.params;
    const userId = req.user._id.toString();

    // Check if user is a participant
    const chatRoom = await ChatRoom.findById(chatRoomId)
      .populate('participantsData', 'name email profile.avatar isOnline lastActive')
      .populate({
        path: 'lastMessageData',
        populate: {
          path: 'sender',
          select: 'name profile.avatar'
        }
      });

    if (!chatRoom) {
      throw new NotFoundError('Chat room not found');
    }

    const isParticipant = chatRoom.participants.some(
      p => p.toString() === userId
    );
    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant in this chat');
    }

    res.status(200).json({
      success: true,
      data: chatRoom
    });
  } catch (error: any) {
    console.error('Get chat room error:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get chat room'
    });
  }
};

// Get unread message count
export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user._id.toString();
    const count = await ChatService.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      data: { count }
    });
  } catch (error: any) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count'
    });
  }
};