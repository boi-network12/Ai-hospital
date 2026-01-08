// helper/ChatHelper.ts
import { User } from "@/types/auth";
import { ChatMessage, ChatRoom } from "@/types/chat";


// Type guards
export const isTextMessage = (message: ChatMessage): boolean => 
  message.messageType === 'text';

export const isMediaMessage = (message: ChatMessage): boolean =>
  ['image', 'audio', 'video'].includes(message.messageType);

export const isFileMessage = (message: ChatMessage): boolean =>
  message.messageType === 'file';

export const isGroupChat = (chat: ChatRoom): boolean =>
  chat.isGroup;

export const isOneOnOneChat = (chat: ChatRoom): boolean =>
  !chat.isGroup && chat.participants.length === 2;

// Message status helpers
export const isMessageSent = (message: ChatMessage): boolean =>
  message.status === 'sent';

export const isMessageDelivered = (message: ChatMessage): boolean =>
  message.status === 'delivered';

export const isMessageRead = (message: ChatMessage): boolean =>
  message.status === 'read';

export const isMessageFailed = (message: ChatMessage): boolean =>
  message.status === 'failed';

// Message action helpers
export const canEditMessage = (message: ChatMessage, userId: string): boolean =>
  message.senderId === userId && !message.isDeleted && message.messageType === 'text';

export const canDeleteMessage = (message: ChatMessage, userId: string, isAdmin: boolean = false): boolean =>
  (message.senderId === userId || isAdmin) && !message.isDeleted;

export const hasReactionFromUser = (message: ChatMessage, userId: string, emoji?: string): boolean =>
  message.reactions.some(reaction => 
    reaction.userId === userId && (!emoji || reaction.emoji === emoji)
  );

// Chat helpers
export const getOtherParticipant = (chat: ChatRoom, userId: string): User | undefined => {
  if (isOneOnOneChat(chat)) {
    return chat.participantsData?.find(p => p._id !== userId);
  }
  return undefined;
};

export const getChatDisplayName = (chat: ChatRoom, userId: string): string => {
  if (isGroupChat(chat)) {
    return chat.groupName || 'Group Chat';
  }
  
  const otherParticipant = getOtherParticipant(chat, userId);
  return otherParticipant?.name || 'Unknown User';
};

export const getChatAvatar = (chat: ChatRoom, userId: string): string | undefined => {
  if (isGroupChat(chat)) {
    return chat.groupPhoto;
  }
  
  const otherParticipant = getOtherParticipant(chat, userId);
  return otherParticipant?.profile?.avatar;
};

export const getUnreadCount = (chat: ChatRoom, userId: string): number =>
  chat.unreadCount[userId] || 0;

// Time helpers for chat
export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
};

export const formatChatTime = (dateString?: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date >= today) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (date >= yesterday) {
    return 'Yesterday';
  } else if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } else {
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }
};

// Message content helpers
export const getMessagePreview = (message: ChatMessage): string => {
  switch (message.messageType) {
    case 'image':
      return '📷 Image';
    case 'video':
      return '🎬 Video';
    case 'audio':
      return '🎤 Audio';
    case 'file':
      return `📎 ${message.fileName || 'File'}`;
    default:
      return message.content;
  }
};

// File size formatting
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Socket event type guards
export const isMessageEvent = (event: any): event is { type: 'message'; data: ChatMessage } =>
  event?.type === 'message' && event.data && typeof event.data === 'object';

export const isTypingEvent = (event: any): event is { type: 'typing'; data: { userId: string; isTyping: boolean } } =>
  event?.type === 'typing' && event.data && typeof event.data.userId === 'string';

export const isReactionEvent = (event: any): event is { type: 'reaction'; data: { messageId: string; userId: string; emoji: string } } =>
  event?.type === 'reaction' && event.data && typeof event.data.messageId === 'string';

// Validation helpers
export const isValidMessageContent = (content: string): boolean =>
  content.trim().length > 0 && content.length <= 5000;

export const isValidFileType = (fileType: string, allowedTypes: string[]): boolean =>
  allowedTypes.includes(fileType.toLowerCase());

export const isValidFileSize = (fileSize: number, maxSize: number): boolean =>
  fileSize <= maxSize;

// Message grouping helper for UI
export interface MessageGroup {
  senderId: string;
  messages: ChatMessage[];
  showAvatar: boolean;
  showTime: boolean;
  isConsecutive: boolean;
}

export const groupMessages = (messages: ChatMessage[]): MessageGroup[] => {
  if (messages.length === 0) return [];
  
  const groups: MessageGroup[] = [];
  let currentGroup: MessageGroup = {
    senderId: messages[0].senderId,
    messages: [messages[0]],
    showAvatar: true,
    showTime: true,
    isConsecutive: false,
  };
  
  for (let i = 1; i < messages.length; i++) {
    const currentMessage = messages[i];
    const previousMessage = messages[i - 1];
    
    const timeDiff = new Date(currentMessage.createdAt).getTime() - 
                     new Date(previousMessage.createdAt).getTime();
    const isSameSender = currentMessage.senderId === previousMessage.senderId;
    const isWithinTimeLimit = timeDiff < 5 * 60 * 1000; // 5 minutes
    
    if (isSameSender && isWithinTimeLimit) {
      currentGroup.messages.push(currentMessage);
      currentGroup.isConsecutive = true;
    } else {
      groups.push(currentGroup);
      currentGroup = {
        senderId: currentMessage.senderId,
        messages: [currentMessage],
        showAvatar: true,
        showTime: true,
        isConsecutive: false,
      };
    }
  }
  
  groups.push(currentGroup);
  
  // Adjust avatar and time visibility
  groups.forEach((group, index) => {
    if (index > 0 && groups[index - 1].senderId === group.senderId) {
      group.showAvatar = false;
    }
    
    if (group.messages.length > 1) {
      group.messages.forEach((msg, msgIndex) => {
        if (msgIndex < group.messages.length - 1) {
          // Only show time on last message of group
          group.messages[msgIndex] = { ...msg, _hideTime: true };
        }
      });
    }
  });
  
  return groups;
};

// Export all helpers
export {
  isTextMessage as isText,
  isMediaMessage as isMedia,
  isFileMessage as isFile,
  isGroupChat as isGroup,
  isOneOnOneChat as isOneOnOne,
  formatMessageTime as formatTime,
  formatChatTime as formatDate,
  getMessagePreview as getPreview,
  formatFileSize as formatSize,
};