import { Types } from 'mongoose';
import { Message, ChatRoom, ChatParticipant } from '../models/ChatModel';
import { ChatMessage, ChatRoom as IChatRoom } from '../types/chat';
import User from '../models/UserModel';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class ChatService {
  // Create or get existing chat room
  static async getOrCreateChatRoom(
    participantIds: string[],
    userId: string,
    isGroup: boolean = false,
    groupName?: string,
    groupDescription?: string,
    groupPhoto?: string
  ): Promise<IChatRoom> {
    if (!isGroup && participantIds.length !== 2) {
      throw new Error('One-on-one chat must have exactly 2 participants');
    }

    if (isGroup && participantIds.length < 2) {
      throw new Error('Group chat must have at least 2 participants');
    }

    // Check if all participants exist
    const participants = await User.find({
      _id: { $in: participantIds.map(id => new Types.ObjectId(id)) }
    }).select('_id name email profile.avatar');

    if (participants.length !== participantIds.length) {
      throw new NotFoundError('One or more participants not found');
    }

    // For one-on-one chat, check if room already exists
    if (!isGroup) {
      const existingRoom = await ChatRoom.findOne({
        isGroup: false,
        participants: {
          $all: participantIds.map(id => new Types.ObjectId(id)),
          $size: 2
        }
      })
        .populate('participantsData', 'name email profile.avatar')
        .populate({
          path: 'lastMessageData',
          populate: {
            path: 'sender',
            select: 'name profile.avatar'
          }
        });

      if (existingRoom) {
        return existingRoom.toObject();
      }
    }

    // Create new chat room
    const chatRoom = await ChatRoom.create({
      participants: participantIds.map(id => new Types.ObjectId(id)),
      isGroup,
      groupName: isGroup ? groupName : undefined,
      groupDescription: isGroup ? groupDescription : undefined,
      groupPhoto: isGroup ? groupPhoto : undefined,
      groupAdmins: isGroup ? [new Types.ObjectId(userId)] : [],
      unreadCount: new Map()
    });

    // Create participant entries
    const participantDocs = participantIds.map(participantId => ({
      userId: new Types.ObjectId(participantId),
      chatRoomId: chatRoom._id,
      role: isGroup && participantId === userId ? 'owner' : 'member',
      notifications: true,
      isArchived: false
    }));

    await ChatParticipant.insertMany(participantDocs);

    const populatedRoom = await ChatRoom.findById(chatRoom._id)
      .populate('participantsData', 'name email profile.avatar')
      .lean();

    return populatedRoom as unknown as IChatRoom;
  }

  // Send message
  static async sendMessage(
    chatRoomId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'image' | 'file' | 'audio' | 'video' = 'text',
    fileInfo?: {
      fileUrl?: string;
      fileName?: string;
      fileSize?: number;
      fileType?: string;
    },
    replyTo?: string
  ): Promise<ChatMessage> {
    // Verify chat room exists and user is a participant
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      throw new NotFoundError('Chat room not found');
    }

    const isParticipant = chatRoom.participants.some(
      p => p.toString() === senderId
    );
    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant in this chat');
    }

    // Create message
    const message = await Message.create({
      chatRoomId: new Types.ObjectId(chatRoomId),
      senderId: new Types.ObjectId(senderId),
      content,
      messageType,
      fileUrl: fileInfo?.fileUrl,
      fileName: fileInfo?.fileName,
      fileSize: fileInfo?.fileSize,
      fileType: fileInfo?.fileType,
      status: 'sent',
      readBy: [new Types.ObjectId(senderId)], // Sender has read their own message
      replyTo: replyTo ? new Types.ObjectId(replyTo) : undefined,
      isEdited: false,
      isDeleted: false,
      reactions: []
    });

    // Update chat room's last message
    chatRoom.lastMessage = message._id;
    chatRoom.lastMessageAt = new Date();
    
    // Increment unread count for all participants except sender
    chatRoom.participants.forEach(participantId => {
      if (participantId.toString() !== senderId) {
        const currentCount = chatRoom.unreadCount.get(participantId.toString()) || 0;
        chatRoom.unreadCount.set(participantId.toString(), currentCount + 1);
      }
    });

    await chatRoom.save();

    // Populate and return the message
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profile.avatar')
      .populate({
        path: 'replyToMessage',
        populate: {
          path: 'sender',
          select: 'name profile.avatar'
        }
      })
      .lean();

    return populatedMessage as ChatMessage;
  }

  // Get messages for a chat room
  static async getMessages(
    chatRoomId: string,
    userId: string,
    page: number = 1,
    limit: number = 50,
    before?: Date
  ): Promise<{
    messages: ChatMessage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  }> {
    // Verify user is a participant
    const chatRoom = await ChatRoom.findById(chatRoomId);
    if (!chatRoom) {
      throw new NotFoundError('Chat room not found');
    }

    const isParticipant = chatRoom.participants.some(
      p => p.toString() === userId
    );
    if (!isParticipant) {
      throw new ForbiddenError('You are not a participant in this chat');
    }

    // Build query
    const query: any = {
      chatRoomId: new Types.ObjectId(chatRoomId),
      isDeleted: false
    };

    if (before) {
      query.createdAt = { $lt: before };
    }

    const skip = (page - 1) * limit;

    // Get messages
    const messages = await Message.find(query)
      .populate('sender', 'name email profile.avatar')
      .populate({
        path: 'replyToMessage',
        populate: {
          path: 'sender',
          select: 'name profile.avatar'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Reverse to show oldest first
    messages.reverse();

    // Get total count
    const total = await Message.countDocuments(query);

    // Mark messages as read for this user
    await this.markMessagesAsRead(
      chatRoomId,
      userId,
      messages.map(m => m._id.toString())
    );

    return {
      messages: messages as ChatMessage[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasMore: skip + messages.length < total
    };
  }

  // Mark messages as read
  static async markMessagesAsRead(
    chatRoomId: string,
    userId: string,
    messageIds: string[]
  ): Promise<void> {
    if (messageIds.length === 0) return;

    const updateResult = await Message.updateMany(
      {
        _id: { $in: messageIds.map(id => new Types.ObjectId(id)) },
        chatRoomId: new Types.ObjectId(chatRoomId),
        senderId: { $ne: new Types.ObjectId(userId) }, // Don't mark sender's own messages
        readBy: { $ne: new Types.ObjectId(userId) } // Only if not already read
      },
      {
        $addToSet: { readBy: new Types.ObjectId(userId) },
        $set: { status: 'read' }
      }
    );

    if (updateResult.modifiedCount > 0) {
      // Reset unread count for this user in this chat room
      await ChatRoom.findByIdAndUpdate(chatRoomId, {
        $set: { [`unreadCount.${userId}`]: 0 }
      });

      // Update participant's last seen
      await ChatParticipant.findOneAndUpdate(
        {
          userId: new Types.ObjectId(userId),
          chatRoomId: new Types.ObjectId(chatRoomId)
        },
        {
          lastSeenAt: new Date(),
          lastSeenMessage: new Types.ObjectId(messageIds[messageIds.length - 1])
        }
      );
    }
  }

  // Edit message
  static async editMessage(
    messageId: string,
    userId: string,
    content: string
  ): Promise<ChatMessage> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.senderId.toString() !== userId) {
      throw new ForbiddenError('You can only edit your own messages');
    }

    if (message.isDeleted) {
      throw new Error('Cannot edit a deleted message');
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profile.avatar')
      .lean();

    return populatedMessage as ChatMessage;
  }

  // Delete message
  static async deleteMessage(
    messageId: string,
    userId: string,
    deleteForEveryone: boolean = false
  ): Promise<void> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (deleteForEveryone) {
      // Only allow delete for everyone if user is the sender or an admin
      if (message.senderId.toString() !== userId) {
        // Check if user is admin in a group chat
        const chatRoom = await ChatRoom.findById(message.chatRoomId);
        if (chatRoom?.isGroup && chatRoom.groupAdmins.includes(new Types.ObjectId(userId))) {
          // Admin can delete any message in group
          message.isDeleted = true;
          message.deletedAt = new Date();
          message.deletedBy = new Types.ObjectId(userId);
          await message.save();
        } else {
          throw new ForbiddenError('You can only delete your own messages');
        }
      } else {
        message.isDeleted = true;
        message.deletedAt = new Date();
        message.deletedBy = new Types.ObjectId(userId);
        await message.save();
      }
    } else {
      // Soft delete for user only (implemented differently - could use separate collection)
      // For simplicity, we'll mark as deleted for this implementation
      if (message.senderId.toString() !== userId) {
        throw new ForbiddenError('You can only delete your own messages');
      }
      message.isDeleted = true;
      message.deletedAt = new Date();
      message.deletedBy = new Types.ObjectId(userId);
      await message.save();
    }
  }

  // Add reaction to message
  static async addReaction(
    messageId: string,
    userId: string,
    emoji: string
  ): Promise<ChatMessage> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    if (message.isDeleted) {
      throw new Error('Cannot react to a deleted message');
    }

    // Remove existing reaction from this user
    message.reactions = message.reactions.filter(
      r => r.userId.toString() !== userId
    );

    // Add new reaction
    message.reactions.push({
      userId: new Types.ObjectId(userId),
      emoji,
      createdAt: new Date()
    });

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profile.avatar')
      .lean();

    return populatedMessage as ChatMessage;
  }

  // Remove reaction from message
  static async removeReaction(
    messageId: string,
    userId: string
  ): Promise<ChatMessage> {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new NotFoundError('Message not found');
    }

    message.reactions = message.reactions.filter(
      r => r.userId.toString() !== userId
    );

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email profile.avatar')
      .lean();

    return populatedMessage as ChatMessage;
  }

  // Get user's chat list
  static async getUserChats(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    chats: IChatRoom[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // First, find the chat rooms where user is a participant
    const chatRooms = await ChatRoom.find({
      participants: new Types.ObjectId(userId),
      isArchived: false
    })
      .populate({
        path: 'participantsData',
        select: 'name email profile.avatar isOnline lastActive'
      })
      .populate({
        path: 'lastMessageData',
        select: 'content messageType senderId fileUrl fileName createdAt',
        populate: {
          path: 'sender',
          select: 'name profile.avatar'
        }
      })
      .sort({ lastMessageAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await ChatRoom.countDocuments({
      participants: new Types.ObjectId(userId),
      isArchived: false
    });

    return {
      chats: chatRooms as IChatRoom[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }


  // Get unread message count
  static async getUnreadCount(userId: string): Promise<number> {
    const chatRooms = await ChatRoom.find({
      participants: new Types.ObjectId(userId)
    });

    let totalUnread = 0;
    chatRooms.forEach(room => {
      totalUnread += room.unreadCount.get(userId) || 0;
    });

    return totalUnread;
  }
}