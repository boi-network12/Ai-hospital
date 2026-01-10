import { Types } from 'mongoose';

export interface ChatUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  profile?: {
    avatar?: string;
  };
  isOnline?: boolean;
  lastActive?: Date;
}

export interface ChatMessage {
  _id: Types.ObjectId | string;
  chatRoomId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  
  status: 'sent' | 'delivered' | 'read' | 'failed';
  readBy: Types.ObjectId[];
  readAt?: Date;
  
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  
  reactions: Array<{
    userId: Types.ObjectId;
    emoji: string;
    createdAt: Date;
  }>;
  
  replyTo?: Types.ObjectId;
  replyToMessage?: ChatMessage;
  
  sender?: ChatUser;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatRoom {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  participantsData?: ChatUser[];
  isGroup: boolean;
  groupName?: string;
  groupDescription?: string;
  groupPhoto?: string;
  groupAdmins: Types.ObjectId[];
  
  lastMessage?: Types.ObjectId;
  lastMessageData?: ChatMessage;
  lastMessageAt?: Date;
  unreadCount: Map<string, number> | Record<string, number>; 
  
  isActive: boolean;
  isArchived: boolean;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatParticipant {
  userId: Types.ObjectId;
  chatRoomId: Types.ObjectId;
  role: 'member' | 'admin' | 'owner';
  
  notifications: boolean;
  mutedUntil?: Date;
  isArchived: boolean;
  
  lastSeenAt?: Date;
  lastSeenMessage?: Types.ObjectId;
}

// Socket Event Types
export interface SocketMessageEvent {
  chatRoomId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'audio' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  replyTo?: string;
}

export interface SocketTypingEvent {
  chatRoomId: string;
  isTyping: boolean;
}

export interface SocketReadReceiptEvent {
  chatRoomId: string;
  messageId: string;
}

export interface SocketReactionEvent {
  messageId: string;
  emoji: string;
  chatRoomId: string;
}

export interface SocketMessageUpdateEvent {
  messageId: string;
  content: string;
  chatRoomId: string;
}

export interface SocketMessageDeleteEvent {
  messageId: string;
  chatRoomId: string;
  deleteForEveryone?: boolean;
}

// API Request/Response Types
export interface CreateChatRoomRequest {
  participantIds: string[];
  isGroup?: boolean;
  groupName?: string;
  groupDescription?: string;
  groupPhoto?: string;
}

export interface SendMessageRequest {
  chatRoomId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'audio' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  replyTo?: string;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface MarkAsReadRequest {
  messageIds: string[];
}

export interface ChatListResponse {
  success: boolean;
  data: {
    chats: ChatRoom[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MessagesResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
}