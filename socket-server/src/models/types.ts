export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface SocketUser {
  socketId: string;
  userId: string;
  user?: User;
  lastSeen: Date;
}

export interface Message {
  _id: string;
  chatRoomId: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  readBy: string[];
  isEdited: boolean;
  isDeleted: boolean;
  reactions: Reaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Reaction {
  emoji: string;
  userId: string;
  timestamp: Date;
}

export interface ChatRoom {
  _id: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}