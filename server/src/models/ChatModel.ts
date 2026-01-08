import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  chatRoomId: Types.ObjectId;
  senderId: Types.ObjectId;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  
  // Message status
  status: 'sent' | 'delivered' | 'read' | 'failed';
  readBy: Types.ObjectId[];
  readAt?: Date;
  
  // Message actions
  isEdited: boolean;
  editedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  
  // Reactions
  reactions: Array<{
    userId: Types.ObjectId;
    emoji: string;
    createdAt: Date;
  }>;
  
  // Reply reference
  replyTo?: Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatRoom extends Document {
  _id: Types.ObjectId;
  participants: Types.ObjectId[];
  isGroup: boolean;
  groupName?: string;
  groupDescription?: string;
  groupPhoto?: string;
  groupAdmins: Types.ObjectId[];
  
  // Last message reference
  lastMessage?: Types.ObjectId;
  lastMessageAt?: Date;
  unreadCount: Map<string, number>; // userId -> count
  
  // Settings
  isActive: boolean;
  isArchived: boolean;
  archivedBy?: Types.ObjectId;
  archivedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface IChatParticipant extends Document {
  userId: Types.ObjectId;
  chatRoomId: Types.ObjectId;
  role: 'member' | 'admin' | 'owner';
  
  // User settings for this chat
  notifications: boolean;
  mutedUntil?: Date;
  isArchived: boolean;
  
  // Last seen
  lastSeenAt?: Date;
  lastSeenMessage?: Types.ObjectId;
  
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  chatRoomId: {
    type: Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
    index: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  content: {
  type: String,
  required: function (this: IMessage): boolean {
    return this.messageType === 'text';
  },
},
  messageType: {
    type: String,
    enum: ['text', 'image', 'file', 'audio', 'video'],
    default: 'text',
  },
  fileUrl: String,
  fileName: String,
  fileSize: Number,
  fileType: String,
  
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent',
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  readAt: Date,
  
  isEdited: {
    type: Boolean,
    default: false,
  },
  editedAt: Date,
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: Date,
  deletedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  
  reactions: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    emoji: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  
  replyTo: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

MessageSchema.virtual('sender', {
  ref: 'User',
  localField: 'senderId',
  foreignField: '_id',
  justOne: true,
});

MessageSchema.virtual('replyToMessage', {
  ref: 'Message',
  localField: 'replyTo',
  foreignField: '_id',
  justOne: true,
});

const ChatRoomSchema = new Schema<IChatRoom>({
  participants: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  isGroup: {
    type: Boolean,
    default: false,
  },
  groupName: String,
  groupDescription: String,
  groupPhoto: String,
  groupAdmins: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  lastMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
  lastMessageAt: Date,
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map(),
  },
  
  isActive: {
    type: Boolean,
    default: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  archivedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  archivedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

ChatRoomSchema.virtual('participantsData', {
  ref: 'User',
  localField: 'participants',
  foreignField: '_id',
  justOne: false,
});

ChatRoomSchema.virtual('lastMessageData', {
  ref: 'Message',
  localField: 'lastMessage',
  foreignField: '_id',
  justOne: true,
});

const ChatParticipantSchema = new Schema<IChatParticipant>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  chatRoomId: {
    type: Schema.Types.ObjectId,
    ref: 'ChatRoom',
    required: true,
    index: true,
  },
  role: {
    type: String,
    enum: ['member', 'admin', 'owner'],
    default: 'member',
  },
  
  notifications: {
    type: Boolean,
    default: true,
  },
  mutedUntil: Date,
  isArchived: {
    type: Boolean,
    default: false,
  },
  
  lastSeenAt: Date,
  lastSeenMessage: {
    type: Schema.Types.ObjectId,
    ref: 'Message',
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes
MessageSchema.index({ chatRoomId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
ChatRoomSchema.index({ participants: 1 });
ChatRoomSchema.index({ lastMessageAt: -1 });
ChatParticipantSchema.index({ userId: 1, chatRoomId: 1 }, { unique: true });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
export const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);
export const ChatParticipant = mongoose.model<IChatParticipant>('ChatParticipant', ChatParticipantSchema);