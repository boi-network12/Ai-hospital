import { User } from "./auth.d";

// First, let's fix the types. Create a separate Sender type for messages
export interface Sender {
  _id: string;
  name: string;
  email: string;
  profile?: {
    avatar?: string;
    specialization?: string;
    location?: any;
  };
  isOnline?: boolean;
  lastActive?: string;
}

// Chat Message Types
export interface ChatMessage {
  _id: string;
  chatRoomId: string;
  senderId: string;
  sender: Sender;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  thumbnailUrl?: string;

   _hideTime?: boolean;
  
  // Message status
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'sending' | 'updating';
  readBy: string[];
  readAt?: string | Date;
  
  // Message actions
  isEdited: boolean;
   editedAt?: string | Date;
  deletedAt?: string | Date;
  isDeleted?: boolean;
  deletedBy?: string;
  
  isDeleting?: boolean;
  isRemoving?: boolean;
  // Reactions
  reactions: MessageReaction[];
  
  // Reply reference
  replyTo?: string;
  replyToMessage?: ChatMessage;
  
  // Timestamps
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
  createdAt: string;
}

// Chat Room Types
export interface ChatRoom {
  _id: string;
  id: string;
  participants: string[];
  participantsData?: User[];
  isGroup: boolean;
  groupName?: string;
  groupDescription?: string;
  groupPhoto?: string;
  groupAdmins: string[];
  
  // Last message reference
  lastMessage?: string;
  lastMessageData?: ChatMessage;
  lastMessageAt?: string | Date;
  unreadCount: Record<string, number>; // userId -> count
  
  // Settings
  isActive: boolean;
  isArchived: boolean;
  archivedBy?: string;
  archivedAt?: string | Date;
  
  // Metadata
   createdAt: string | Date;             // ← Better: allow both
   updatedAt: string | Date;             // ← Better: allow both
}

// Chat Participant Types
export interface ChatParticipant {
  userId: string;
  chatRoomId: string;
  role: 'member' | 'admin' | 'owner';
  
  // User settings for this chat
  notifications: boolean;
  mutedUntil?: string;
  isArchived: boolean;
  
  // Last seen
  lastSeenAt?: string;
  lastSeenMessage?: string;
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

export interface SocketUserPresenceEvent {
  userId: string;
  chatRoomId: string;
  isOnline: boolean;
  timestamp: string;
}

export interface SocketChatUpdatedEvent {
  chatRoomId: string;
  lastMessage: ChatMessage;
  lastMessageAt: string;
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

export interface AddReactionRequest {
  emoji: string;
}

export interface FileUploadResponse {
  url: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  thumbnailUrl?: string;
}

// Chat List Response
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

// Messages Response
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

// Unread Count Response
export interface UnreadCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}

// Chat State Types (for React Context/Redux)
export interface ChatState {
  chats: ChatRoom[];
  activeChat: ChatRoom | null;
  messages: ChatMessage[];
  unreadCount: number;
  loading: boolean;
  sending: boolean;
  hasMoreMessages: boolean;
  typingUsers: Set<string>;
  socketConnected: boolean;
  error: string | null;
}

// UI Component Props Types
export interface MessageBubbleProps {
  message: ChatMessage;
  isOwnMessage: boolean;
  showStatus?: boolean;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (message: ChatMessage) => void;
  onReaction?: (message: ChatMessage, emoji: string) => void;
  onPress?: (message: ChatMessage) => void;
  onLongPress?: (message: ChatMessage) => void;
}

export interface ChatListItemProps {
  chat: ChatRoom;
  unreadCount: number;
  onPress: (chat: ChatRoom) => void;
  onLongPress?: (chat: ChatRoom) => void;
  messages?: ChatMessage[];
}

export interface ReactionPickerProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  position?: { x: number; y: number };
}

export interface MessageMenuProps {
  visible: boolean;
  onClose: () => void;
  message: ChatMessage | null;
  isOwnMessage: boolean;
  onReply: (message: ChatMessage) => void;
  onEdit: (message: ChatMessage) => void;
  onDelete: (message: ChatMessage, deleteForEveryone: boolean) => void;
  onCopy: (text: string) => void;
  position?: { x: number; y: number };
}

// Hook Return Types
export interface UseChatReturn {
  // State
  chats: ChatRoom[];
  activeChat: ChatRoom | null;
  messages: ChatMessage[];
  unreadCount: number;
  loading: boolean;
  sending: boolean;
  hasMoreMessages: boolean;
  typingUsers: Set<string>;
  socketConnected: boolean;
  
  // Actions
  connectSocket: () => Promise<void>;
  disconnectSocket: () => void;
  loadChats: () => Promise<void>;
  loadMessages: (chatRoomId: string, loadMore?: boolean) => Promise<void>;
  sendMessage: (content: string, replyTo?: string) => Promise<void>;
  sendFileMessage: (file: any, type: 'image' | 'file' | 'audio' | 'video') => Promise<void>;
  setTyping: (isTyping: boolean) => void;
  markAsRead: (messageId: string) => void;
  addReaction: (messageId: string, emoji: string) => void;
  removeReaction: (messageId: string) => void;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string, deleteForEveryone?: boolean) => Promise<void>;
  createChat: (participantIds: string[], isGroup?: boolean, groupName?: string) => Promise<ChatRoom>;
  setActiveChat: (chat: ChatRoom | null) => void;
  searchChats: (query: string) => ChatRoom[];
}

// Navigation Types
export type ChatStackParamList = {
  ChatList: undefined;
  ChatRoom: { chatId: string; chat?: ChatRoom };
  NewChat: undefined;
  ChatSettings: { chatId: string };
  GroupInfo: { chatId: string };
};

// File Upload Types
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadTask {
  file: File | any;
  type: 'image' | 'file' | 'audio' | 'video';
  onProgress?: (progress: UploadProgress) => void;
  onComplete?: (response: FileUploadResponse) => void;
  onError?: (error: Error) => void;
}

// Notification Types for Chat
export interface ChatNotification {
  id: string;
  type: 'message' | 'reaction' | 'typing' | 'read_receipt';
  chatRoomId: string;
  messageId?: string;
  senderId: string;
  content?: string;
  emoji?: string;
  timestamp: string;
  read: boolean;
}

// Typing Indicator Types
export interface TypingIndicator {
  userId: string;
  chatRoomId: string;
  isTyping: boolean;
  timestamp: string;
}

// Search Types
export interface ChatSearchResult {
  chats: ChatRoom[];
  messages: ChatMessage[];
  users: User[];
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

// Cache Types for Optimization
export interface ChatCache {
  messages: Record<string, ChatMessage[]>; // chatRoomId -> messages
  chats: ChatRoom[];
  lastUpdated: Record<string, number>; // chatRoomId -> timestamp
}

// WebSocket Connection Types
export interface SocketConnectionState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
  lastConnectedAt: string | null;
  connectionAttempts: number;
}

// Message Draft Types
export interface MessageDraft {
  chatRoomId: string;
  content: string;
  replyTo?: string;
  files?: File[];
  createdAt: string;
  updatedAt: string;
}

// Voice Message Types
export interface VoiceMessage {
  id: string;
  url: string;
  duration: number;
  format: string;
  fileSize: number;
  recordedAt: string;
}

// Read Receipt Types
export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: string;
  user?: User;
}

// Group Chat Types
export interface GroupInvite {
  id: string;
  chatRoomId: string;
  inviteCode: string;
  createdBy: string;
  expiresAt: string;
  maxUses?: number;
  usedCount: number;
  isActive: boolean;
}

export interface GroupMember {
  userId: string;
  role: 'member' | 'admin' | 'owner';
  joinedAt: string;
  user?: User;
}

// Message Filter Types
export interface MessageFilter {
  dateRange?: {
    start: string;
    end: string;
  };
  messageType?: ('text' | 'image' | 'file' | 'audio' | 'video')[];
  hasReactions?: boolean;
  hasReplies?: boolean;
  fromUser?: string;
  searchText?: string;
}

// Chat Analytics Types
export interface ChatAnalytics {
  totalMessages: number;
  messagesByType: Record<string, number>;
  averageResponseTime: number;
  busiestHours: number[];
  mostActiveParticipants: {
    userId: string;
    messageCount: number;
    user?: User;
  }[];
    mostUsedEmojis: {
    emoji: string;
    count: number;
  }[];
}

// Export all types
export type {
  ChatMessage as IChatMessage,
  ChatRoom as IChatRoom,
  ChatParticipant as IChatParticipant,
  SocketMessageEvent as ISocketMessageEvent,
  SocketTypingEvent as ISocketTypingEvent,
  SocketReadReceiptEvent as ISocketReadReceiptEvent,
  SocketReactionEvent as ISocketReactionEvent,
  SocketMessageUpdateEvent as ISocketMessageUpdateEvent,
  SocketMessageDeleteEvent as ISocketMessageDeleteEvent,
  CreateChatRoomRequest as ICreateChatRoomRequest,
  SendMessageRequest as ISendMessageRequest,
  UpdateMessageRequest as IUpdateMessageRequest,
  MarkAsReadRequest as IMarkAsReadRequest,
  AddReactionRequest as IAddReactionRequest,
};