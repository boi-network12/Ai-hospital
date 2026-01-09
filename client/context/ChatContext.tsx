// src/context/ChatContext.tsx
import { useAuth } from '@/Hooks/authHook.d';
import { useUser } from '@/Hooks/userHooks.d';
import { useToast } from '@/Hooks/useToast.d';
// import { User } from '@/types/auth';
import { ChatMessage, ChatRoom, Sender } from '@/types/chat';
import { apiFetch } from '@/Utils/api';
import { socketManager } from '@/Utils/socket';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';


interface ChatContextType {
  // State
  chats: ChatRoom[];
  activeChat: ChatRoom | null;
  messages: ChatMessage[];
  unreadCount: number;
  loading: boolean;
  sending: boolean;
  hasMoreMessages: boolean;
  typingUsers: Set<string>;
  
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
  loadChatRoom: (chatId: string) => Promise<ChatRoom>;
  loadMessagesForChat: (chatRoomId: string, loadMore?: boolean) => Promise<ChatMessage[]>;
  
  // Socket status
  isConnected: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth, refreshAccessToken, logout } = useAuth();
  const { user } = useUser();
  const { showAlert } = useToast();
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  
  // Use refs to track current values without re-running effects
  const activeChatRef = useRef(activeChat);
  const userRef = useRef(user);
  const authRef = useRef(auth);

  // Update refs when values change
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    authRef.current = auth;
  }, [auth]);

  // Connect to socket on mount
  useEffect(() => {
    if (auth.isAuth && auth.accessToken) {
      console.log('ChatProvider: Auth detected, connecting socket...');
      socketManager.connect();
    } else {
      console.log('ChatProvider: No auth, not connecting socket');
    }

    return () => {
      console.log('ChatProvider: Cleaning up socket connection');
      socketManager.disconnect();
    };
  }, [auth.isAuth, auth.accessToken]);

  // Mark message as read
  const markAsRead = useCallback((messageId: string) => {
    const currentActiveChat = activeChatRef.current;
    if (currentActiveChat) {
      socketManager.markAsRead(currentActiveChat._id.toString(), messageId);
    }
  }, []);

  // Load user's chats
 const loadChats = useCallback(async () => {
  try {
    setLoading(true);
    const response = await apiFetch<{ data: { chats: ChatRoom[] } }>('/chat/rooms');
    
    // Debug: Log what we're getting from API
    // console.log('API Response - Chats:', response.data.chats.map(chat => ({
    //   id: chat._id,
    //   lastMessage: chat.lastMessage,
    //   lastMessageData: chat.lastMessageData,
    //   hasLastMessage: !!chat.lastMessageData,
    //   participants: chat.participantsData?.length
    // })));
    
    setChats(response.data.chats);
  } catch (error) {
    console.error('ChatProvider: Failed to load chats:', error);
    showAlert({ message: 'Failed to load chats', type: 'error' });
  } finally {
    setLoading(false);
  }
}, [setChats, setLoading, showAlert]);

  // Socket event listeners
  useEffect(() => {
    console.log('ChatProvider: Setting up socket listeners');
    
    const handleConnect = () => {
      console.log('ChatProvider: Socket connected');
      setIsConnected(true);
      loadChats();
      loadUnreadCount();
    };

    const handleDisconnect = () => {
      console.log('ChatProvider: Socket disconnected');
      setIsConnected(false);
    };

    const handleReceiveMessage = (message: ChatMessage) => {
      console.log('ChatProvider: Received message', message._id);
      
      const currentActiveChat = activeChatRef.current;
      const currentUser = userRef.current;
      
      // If message is for active chat, add to messages
      if (currentActiveChat && message.chatRoomId === currentActiveChat._id) {
        console.log('ChatProvider: Adding message to active chat');
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(m => m._id === message._id);
          if (!exists) {
            return [message, ...prev];
          }
          return prev;
        });
        
        // Mark as read if it's not our own message
        if (currentUser && message.senderId.toString() !== currentUser._id) {
          console.log('ChatProvider: Marking message as read');
          markAsRead(message._id.toString());
        }
      }

      // Update chat list with new last message
      setChats(prev => prev.map(chat => {
        if (chat._id.toString() === message.chatRoomId.toString()) {
          return {
            ...chat,
            lastMessageData: message,
            lastMessageAt: new Date(message.createdAt),
            unreadCount: {
              ...chat.unreadCount,
              [currentUser?._id || '']: message.senderId.toString() === currentUser?._id 
                ? chat.unreadCount[currentUser?._id || ''] || 0
                : (chat.unreadCount[currentUser?._id || ''] || 0) + 1
            }
          };
        }
        return chat;
      }));

      // Update unread count if message is not from current user
      if (currentUser && message.senderId.toString() !== currentUser._id) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleMessageSent = (message: ChatMessage) => {
      console.log('ChatProvider: Message sent', message._id);
      const currentActiveChat = activeChatRef.current;
      
      if (currentActiveChat && message.chatRoomId.toString() === currentActiveChat._id.toString()) {
        // Replace temporary message with actual message
        setMessages(prev => {
          const filtered = prev.filter(m => !m._id.startsWith('temp-'));
          return [message, ...filtered];
        });
      }
    };

    const handleMessageRead = (data: any) => {
      console.log('ChatProvider: Message read', data);
      setMessages(prev => prev.map(msg => {
        if (msg._id.toString() === data.messageId) {
          return {
            ...msg,
            status: 'read',
            readBy: [...(msg.readBy || []), data.readBy],
            readAt: data.readAt
          };
        }
        return msg;
      }));
    };

    const handleUserTyping = (data: any) => {
      console.log('ChatProvider: User typing', data);
      const currentActiveChat = activeChatRef.current;
      
      if (currentActiveChat && data.chatRoomId === currentActiveChat._id) {
        if (data.isTyping) {
          setTypingUsers(prev => new Set(prev).add(data.userId));
        } else {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }
      }
    };

    const handleMessageEdited = (data: any) => {
      console.log('ChatProvider: Message edited', data);
      setMessages(prev => prev.map(msg => {
        if (msg._id.toString() === data.messageId) {
          return {
            ...msg,
            content: data.content,
            isEdited: true,
            editedAt: data.editedAt
          };
        }
        return msg;
      }));
    };

    const handleMessageDeleted = (data: any) => {
      console.log('ChatProvider: Message deleted', data);
      setMessages(prev => prev.filter(msg => msg._id.toString() !== data.messageId));
    };

    const handleReactionAdded = (data: any) => {
      console.log('ChatProvider: Reaction added', data);
      setMessages(prev => prev.map(msg => {
        if (msg._id.toString() === data.messageId) {
          const existingReactionIndex = msg.reactions.findIndex(
            r => r.userId.toString() === data.userId
          );
          
          if (existingReactionIndex > -1) {
            const newReactions = [...msg.reactions];
            newReactions[existingReactionIndex] = {
              ...newReactions[existingReactionIndex],
              emoji: data.emoji,
              createdAt: data.timestamp
            };
            return { ...msg, reactions: newReactions };
          } else {
            return {
              ...msg,
              reactions: [
                ...msg.reactions,
                {
                  userId: data.userId,
                  emoji: data.emoji,
                  createdAt: data.timestamp
                }
              ]
            };
          }
        }
        return msg;
      }));
    };

    const handleReactionRemoved = (data: any) => {
      console.log('ChatProvider: Reaction removed', data);
      setMessages(prev => prev.map(msg => {
        if (msg._id.toString() === data.messageId) {
          return {
            ...msg,
            reactions: msg.reactions.filter(r => r.userId.toString() !== data.userId)
          };
        }
        return msg;
      }));
    };

    const handleChatUpdated = (data: any) => {
      console.log('ChatProvider: Chat updated', data);
      setChats(prev => prev.map(chat => {
        if (chat._id.toString() === data.chatRoomId) {
          return {
            ...chat,
            lastMessageData: data.lastMessage,
            lastMessageAt: data.lastMessageAt
          };
        }
        return chat;
      }));
    };

    const handleAuthError = async (error: any) => {
      console.log('ChatProvider: Auth error detected', error);
      try {
        await refreshAccessToken();
        // After token refresh, reconnect socket
        setTimeout(() => {
          socketManager.connect();
        }, 1000);
      } catch (err) {
        console.error('ChatProvider: Auth refresh failed, logging out', err);
        await logout();
      }
    };

    // Register socket event listeners
    socketManager.on('connect', handleConnect);
    socketManager.on('disconnect', handleDisconnect);
    socketManager.on('receive_message', handleReceiveMessage);
    socketManager.on('message_sent', handleMessageSent);
    socketManager.on('message_read', handleMessageRead);
    socketManager.on('user_typing', handleUserTyping);
    socketManager.on('message_edited', handleMessageEdited);
    socketManager.on('message_deleted', handleMessageDeleted);
    socketManager.on('reaction_added', handleReactionAdded);
    socketManager.on('reaction_removed', handleReactionRemoved);
    socketManager.on('chat_updated', handleChatUpdated);
    socketManager.on('auth_error', handleAuthError);

    return () => {
      console.log('ChatProvider: Removing socket listeners');
      socketManager.off('connect', handleConnect);
      socketManager.off('disconnect', handleDisconnect);
      socketManager.off('receive_message', handleReceiveMessage);
      socketManager.off('message_sent', handleMessageSent);
      socketManager.off('message_read', handleMessageRead);
      socketManager.off('user_typing', handleUserTyping);
      socketManager.off('message_edited', handleMessageEdited);
      socketManager.off('message_deleted', handleMessageDeleted);
      socketManager.off('reaction_added', handleReactionAdded);
      socketManager.off('reaction_removed', handleReactionRemoved);
      socketManager.off('chat_updated', handleChatUpdated);
      socketManager.off('auth_error', handleAuthError);
    };
  }, [refreshAccessToken, logout, markAsRead, loadChats]);

  // Connect to socket
  const connectSocket = async () => {
    if (!auth.accessToken) {
      console.warn('ChatProvider: No access token, cannot connect socket');
      return;
    }

    try {
      await socketManager.connect();
    } catch (error) {
      console.error('ChatProvider: Failed to connect socket:', error);
    }
  };

  // Disconnect socket
  const disconnectSocket = () => {
    socketManager.disconnect();
  };


  // Load messages for a chat
  const loadMessages = async (chatRoomId: string, loadMore = false) => {
    try {
      if (!loadMore) {
        setLoading(true);
      }

      const before = loadMore && messages.length > 0 ? messages[0].createdAt : undefined;
      const params = new URLSearchParams();
      params.append('limit', '50');
      if (before) {
        let isoString: string;
        if (typeof before === 'string') {
          isoString = before;
        } else if (before instanceof Date) {
          isoString = before.toISOString();
        } else {
          isoString = new Date(before).toISOString();
        }
        params.append('before', isoString);
      }

      const response = await apiFetch<{ data: { messages: ChatMessage[], hasMore: boolean } }>(
        `/chat/rooms/${chatRoomId}/messages?${params.toString()}`
      );

      if (loadMore) {
        setMessages(prev => [...response.data.messages, ...prev]);
      } else {
        setMessages(response.data.messages);
      }

      setHasMoreMessages(response.data.hasMore);

      // Join chat room via socket
      socketManager.joinChat(chatRoomId);

      // Clear typing indicators
      setTypingUsers(new Set());
    } catch (error) {
      console.error('ChatProvider: Failed to load messages:', error);
      showAlert({message: 'Failed to load messages', type: "error"})
    } finally {
      setLoading(false);
    }
  };

  // Load unread message count
  const loadUnreadCount = async () => {
    try {
      const response = await apiFetch<{ data: { count: number } }>('/chat/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('ChatProvider: Failed to load unread count:', error);
    }
  };

  // Send message with optimistic UI
  const sendMessage = async (content: string, replyTo?: string) => {
  const currentActiveChat = activeChatRef.current;
  const currentUser = userRef.current;
  
  if (!currentActiveChat || !content.trim() || !currentUser) {
    console.warn('ChatProvider: Cannot send message - missing chat, content, or user');
    return;
  }

  try {
    setSending(true);
    
    // Create a proper sender object that matches the Sender interface
    const tempSender: Sender = {
      _id: currentUser._id,
      name: currentUser.name,
      email: currentUser.email,
      profile: {
        avatar: currentUser.profile?.avatar,
        specialization: currentUser.profile?.specialization,
        location: currentUser.profile?.location,
      },
      isOnline: currentUser.isOnline,
      lastActive: currentUser.lastActive,
    };
    
    // Create temporary message for optimistic UI
    const tempMessage: ChatMessage = {
      _id: `temp-${Date.now()}`,
      chatRoomId: currentActiveChat._id,
      senderId: currentUser._id,
      sender: tempSender, // Use the properly typed sender
      content,
      messageType: 'text',
      status: 'sent',
      readBy: [currentUser._id],
      isEdited: false,
      isDeleted: false,
      reactions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      replyTo: replyTo
    };
    
    // Add temporary message immediately for optimistic UI
    setMessages(prev => [tempMessage, ...prev]);
    
    // Send via socket
    await socketManager.sendMessage({
      chatRoomId: currentActiveChat._id.toString(),
      content,
      replyTo
    });
    
    // Clear typing indicator
    socketManager.setTyping(currentActiveChat._id.toString(), false);
    
  } catch (error) {
    console.error('ChatProvider: Failed to send message:', error);
    showAlert({message: 'Failed to send message', type: "error"})
    
    // Remove temporary message on error
    setMessages(prev => prev.filter(m => !m._id.startsWith('temp-')));
  } finally {
    setSending(false);
  }
};

  // Send file message
  const sendFileMessage = async (file: any, type: 'image' | 'file' | 'audio' | 'video') => {
    const currentActiveChat = activeChatRef.current;
    if (!currentActiveChat) return;

    try {
      setSending(true);

      // Upload file first
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await apiFetch<{ url: string; fileName: string; fileSize: number; fileType: string }>(
        '/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      // Send message with file
      await socketManager.sendMessage({
        chatRoomId: currentActiveChat._id.toString(),
        content: '',
        messageType: type,
        fileUrl: uploadResponse.url,
        fileName: uploadResponse.fileName,
        fileSize: uploadResponse.fileSize,
        fileType: uploadResponse.fileType,
      });
    } catch (error) {
      console.error('ChatProvider: Failed to send file message:', error);
      showAlert({message: 'Failed to send file', type: "error"})
    } finally {
      setSending(false);
    }
  };

  // Set typing indicator
  const setTyping = useCallback((isTyping: boolean) => {
    const currentActiveChat = activeChatRef.current;
    if (currentActiveChat) {
      socketManager.setTyping(currentActiveChat._id.toString(), isTyping);
    }
  }, []);

  

  // Add reaction to message
  const addReaction = useCallback((messageId: string, emoji: string) => {
    const currentActiveChat = activeChatRef.current;
    if (currentActiveChat) {
      socketManager.addReaction(messageId, currentActiveChat._id.toString(), emoji);
    }
  }, []);

  // Remove reaction from message
  const removeReaction = useCallback((messageId: string) => {
    const currentActiveChat = activeChatRef.current;
    if (currentActiveChat) {
      socketManager.removeReaction(messageId, currentActiveChat._id.toString());
    }
  }, []);

  // Edit message
  const editMessage = async (messageId: string, content: string) => {
    const currentActiveChat = activeChatRef.current;
    if (!currentActiveChat) return;

    try {
      await socketManager.editMessage(messageId, currentActiveChat._id.toString(), content);
    } catch (error) {
      console.error('ChatProvider: Failed to edit message:', error);
      showAlert({message: 'Failed to edit messages', type: "error"})
    }
  };

  // Delete message
  const deleteMessage = async (messageId: string, deleteForEveryone = false) => {
    const currentActiveChat = activeChatRef.current;
    if (!currentActiveChat) return;

    try {
      await socketManager.deleteMessage(messageId, currentActiveChat._id.toString(), deleteForEveryone);
    } catch (error) {
      console.error('ChatProvider: Failed to delete message:', error);
      showAlert({message: 'Failed to delete messages', type: "error"})
    }
  };

  // Create new chat
  const createChat = async (
    participantIds: string[],
    isGroup = false,
    groupName?: string
  ): Promise<ChatRoom> => {
    try {
      const response = await apiFetch<{ data: ChatRoom }>('/chat/rooms', {
        method: 'POST',
        body: {
          participantIds,
          isGroup,
          groupName,
        },
      });

      // Add to chat list
      setChats(prev => [response.data, ...prev]);

      return response.data;
    } catch (error) {
      console.error('ChatProvider: Failed to create chat:', error);
      throw error;
    }
  };

  // Set active chat
  const handleSetActiveChat = (chat: ChatRoom | null) => {
    setActiveChat(chat);
    if (chat) {
      loadMessages(chat._id.toString());

      // Reset unread count for this chat
      setChats(prev => prev.map(c => {
        if (c._id.toString() === chat._id.toString()) {
          return {
            ...c,
            unreadCount: {
              ...c.unreadCount,
              [user?._id || '']: 0
            }
          };
        }
        return c;
      }));
    } else {
      setMessages([]);
      setTypingUsers(new Set());
    }
  };

  const loadChatRoom = async (chatId: string) => {
  try {
    console.log('ChatProvider: Loading chat room...', chatId);
    
    // Try to get the chat room from existing chats first
    const existingChat = chats.find(chat => chat._id.toString() === chatId);
    if (existingChat) {
      console.log('ChatProvider: Found chat in existing list');
      handleSetActiveChat(existingChat);
      return existingChat;
    }
    
    // If not found, fetch from API
    const response = await apiFetch<{ data: ChatRoom }>(`/chat/rooms/${chatId}`);
    console.log('ChatProvider: Chat room loaded:', response.data);
    
    // Add to chats list if not already there
    setChats(prev => {
      const exists = prev.some(chat => chat._id.toString() === chatId);
      if (!exists) {
        return [response.data, ...prev];
      }
      return prev;
    });
    
    // Set as active chat
    handleSetActiveChat(response.data);
    
    return response.data;
  } catch (error: any) {
    console.error('ChatProvider: Failed to load chat room:', error);
    
    // Handle 404 specifically
    if (error.message?.includes('HTTP 404')) {
      showAlert({message: 'Chat room not found. It may have been deleted or you may not have permission to access it.', type: "error"})
    } else {
     showAlert({message: 'Failed to load chat room', type: "error"})
    }
    
    throw error;
  }
};

const loadMessagesForChat = async (chatRoomId: string, loadMore = false) => {
  try {
    if (!loadMore) {
      setLoading(true);
    }

    const before = loadMore && messages.length > 0 ? messages[0].createdAt : undefined;
    const params = new URLSearchParams();
    params.append('limit', '50');
    if (before) {
      let isoString: string;
      if (typeof before === 'string') {
        isoString = before;
      } else if (before instanceof Date) {
        isoString = before.toISOString();
      } else {
        isoString = new Date(before).toISOString();
      }
      params.append('before', isoString);
    }

    const response = await apiFetch<{ data: { messages: ChatMessage[], hasMore: boolean } }>(
      `/chat/rooms/${chatRoomId}/messages?${params.toString()}`
    );

    if (loadMore) {
      setMessages(prev => [...response.data.messages, ...prev]);
    } else {
      setMessages(response.data.messages);
    }

    setHasMoreMessages(response.data.hasMore);

    // Join chat room via socket
    socketManager.joinChat(chatRoomId);

    // Clear typing indicators
    setTypingUsers(new Set());
    
    return response.data.messages;
  } catch (error) {
    console.error('ChatProvider: Failed to load messages:', error);
    showAlert({message: 'Failed to load message', type: "error"})
    throw error;
  } finally {
    setLoading(false);
  }
};

  const value: ChatContextType = {
    // State
    chats,
    activeChat,
    messages,
    unreadCount,
    loading,
    sending,
    hasMoreMessages,
    typingUsers,
    
    // Actions
    connectSocket,
    disconnectSocket,
    loadChats,
    loadMessages,
    sendMessage,
    sendFileMessage,
    setTyping,
    markAsRead,
    addReaction,
    removeReaction,
    editMessage,
    deleteMessage,
    createChat,
    setActiveChat: handleSetActiveChat,
    
    // Socket status
    isConnected,
    loadChatRoom,
    loadMessagesForChat,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};