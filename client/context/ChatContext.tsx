import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/Hooks/authHook.d';
import { useUser } from '@/Hooks/userHooks.d';
import { useToast } from '@/Hooks/useToast.d';
import { apiFetch } from '@/Utils/api';
import { socketManager } from '@/Utils/socket';
import { ChatMessage, ChatRoom } from '@/types/chat';
import { SOCKET_URL } from '@/config/api';

// ============================================
// INTERFACES
// ============================================

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
  loadMessagesForChat: (chatRoomId: string, loadMore?: boolean) => Promise<ChatMessage[]>; 
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
  
  // Socket status
  isConnected: boolean;
  socketId: string | null;
}

// ============================================
// CONTEXT CREATION
// ============================================

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const removeDuplicates = <T extends { _id: string }>(items: T[]): T[] => {
  const seen = new Set();
  return items.filter(item => {
    const key = item._id.toString();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const sortMessages = (messages: ChatMessage[]): ChatMessage[] => {
  return [...messages].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Newest first
  });
};

// ============================================
// CHAT PROVIDER
// ============================================

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { auth } = useAuth();
  const { user } = useUser();
  const { showAlert } = useToast();
  
  // State
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [activeChat, setActiveChat] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState<string | null>(null);
  const [messageCache, setMessageCache] = useState<Map<string, ChatMessage[]>>(new Map());
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Refs for current values
  const activeChatRef = useRef(activeChat);
  const userRef = useRef(user);
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Update refs
  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // ============================================
  // SOCKET INITIALIZATION
  // ============================================

  const syncOnlineStatus = useCallback(async () => {
    try {
      // Use the correct endpoint from your backend
      const response = await fetch(`${SOCKET_URL}/active-users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth.accessToken}` // Add auth token if needed
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch active users: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        const onlineUsersSet = new Set(data.data.map((user: { userId: string }) => user.userId)); // Added type here
        
        setChats(prev => prev.map(chat => {
          if (chat.participantsData) {
            const updatedParticipants = chat.participantsData.map(participant => {
              const isOnline = onlineUsersSet.has(participant._id.toString());
              return {
                ...participant,
                isOnline,
                lastActive: isOnline ? new Date().toISOString() : participant.lastActive
              };
            });
            
            return { ...chat, participantsData: updatedParticipants };
          }
          return chat;
        }));
      }
    } catch (error) {
      console.error('Failed to sync online status:', error);
    }
  }, [auth.accessToken]); 

    useEffect(() => {
      // Only initialize once
      if (isInitialized || !auth.isAuth || !auth.accessToken) {
        return;
      }

      const initializeSocket = async () => {
        console.log('🔌 Initializing socket connection...');
        try {
          await connectSocket();
          await loadChats();
          await syncOnlineStatus();
          await loadUnreadCount();
          setIsInitialized(true);
        } catch (error) {
          console.error('Failed to initialize socket:', error);
        }
      };

      initializeSocket();

      return () => {
        // Don't disconnect socket when unmounting - keep connection alive
        console.log('ChatProvider unmounting - keeping socket alive');
      };
    }, [auth.isAuth, auth.accessToken]);


  // ============================================
  // SOCKET EVENT HANDLERS
  // ============================================

  useEffect(() => {
    // Connection Events
    const handleConnect = (data: any) => {
      console.log('✅ Socket connected:', data.socketId);
      setIsConnected(true);
      setSocketId(data.socketId);
      
      // Send presence update
      socketManager.updateUserPresence(true);
      
      // Rejoin active chat if exists
      if (activeChatRef.current) {
        socketManager.joinChat(activeChatRef.current._id.toString());
      }
    };

    const handleDisconnect = () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
      setSocketId(null);
      socketManager.updateUserPresence(false);
    };

    const handleConnectError = (error: any) => {
      console.error('🔌 Connection error:', error);
    };

    // Message Events
    const handleReceiveMessage = (message: ChatMessage) => {
      console.log('📨 Received message:', message._id);
      
      const currentActiveChat = activeChatRef.current;
      const currentUser = userRef.current;
      
      // Check if message is for active chat
      const isForActiveChat = currentActiveChat && 
        message.chatRoomId.toString() === currentActiveChat._id.toString();
      
      // 1. Update chat list with new message
      setChats(prev => prev.map(chat => {
        if (chat._id.toString() === message.chatRoomId.toString()) {
          const isOwnMessage = message.senderId.toString() === currentUser?._id;
          
          return {
            ...chat,
            lastMessageData: message,
            lastMessage: message.content,
            lastMessageAt: new Date(message.createdAt),
            updatedAt: new Date(),
            unreadCount: {
              ...chat.unreadCount,
              [currentUser?._id || '']: isOwnMessage ? 0 : (chat.unreadCount[currentUser?._id || ''] || 0) + 1
            }
          };
        }
        return chat;
      }));
      
      // 2. Add to active chat messages
      if (isForActiveChat) {
        setMessages(prev => {
          const exists = prev.some(m => m._id.toString() === message._id.toString());
          if (!exists) {
            return sortMessages([...prev, message]);
          }
          return prev;
        });
        
        // 3. Mark as read if not our own message
        if (currentUser && message.senderId.toString() !== currentUser._id) {
          socketManager.markAsRead(currentActiveChat!._id.toString(), message._id.toString());
        }
      }
      
      // 4. Update unread count
      if (currentUser && message.senderId.toString() !== currentUser._id) {
        setUnreadCount(prev => prev + 1);
      }
    };

    const handleMessageSent = (confirmedMessage: ChatMessage) => {
      console.log('✅ Message sent confirmed:', confirmedMessage._id);
      
      const currentUser = userRef.current;
      
      // Update messages list - replace temp message with confirmed
      setMessages(prev => {
        const filtered = prev.filter(m => !m._id.toString().startsWith('temp-'));
        const exists = filtered.some(m => m._id.toString() === confirmedMessage._id.toString());
        
        if (!exists) {
          return sortMessages([...filtered, confirmedMessage]);
        }
        return filtered;
      });
      
      // Update chat list
      setChats(prev => prev.map(chat => {
        if (chat._id.toString() === confirmedMessage.chatRoomId.toString()) {
          return {
            ...chat,
            lastMessageData: confirmedMessage,
            lastMessage: confirmedMessage.content,
            lastMessageAt: new Date(confirmedMessage.createdAt),
            updatedAt: new Date(),
            unreadCount: {
              ...chat.unreadCount,
              [currentUser?._id || '']: 0
            }
          };
        }
        return chat;
      }));
    };

    const handleUserTyping = (data: any) => {
      const currentActiveChat = activeChatRef.current;
      const currentUser = userRef.current;
      
      if (!currentActiveChat || 
          data.chatRoomId !== currentActiveChat._id ||
          data.userId === currentUser?._id) {
        return;
      }
      
      if (data.isTyping) {
        // Add typing user
        setTypingUsers(prev => new Set(prev).add(data.userId));
        
        // Clear after 3 seconds
        const timeoutId = setTimeout(() => {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }, 3000);
        
        // Store timeout for cleanup
        typingTimeoutsRef.current.set(data.userId, timeoutId);
        
      } else {
        // Remove typing user
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
        
        // Clear timeout
        const existingTimeout = typingTimeoutsRef.current.get(data.userId);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
          typingTimeoutsRef.current.delete(data.userId);
        }
      }
    };

    const handleMessageRead = (data: any) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id.toString() === data.messageId) {
          return {
            ...msg,
            status: 'read',
            readBy: [...new Set([...(msg.readBy || []), data.readBy])],
            readAt: data.readAt
          };
        }
        return msg;
      }));
    };

    const handleMessageEdited = (data: any) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id.toString() === data.messageId) {
          return {
            ...msg,
            content: data.content,
            isEdited: true,
            editedAt: data.editedAt,
            status: 'sent'
          };
        }
        return msg;
      }));
      
      // Update chat last message if needed
      setChats(prev => prev.map(chat => {
        if (chat._id.toString() === data.chatRoomId && 
            chat.lastMessageData?._id.toString() === data.messageId) {
          
          // Ensure lastMessageData exists before updating
          if (!chat.lastMessageData) return chat;
          
          return {
            ...chat,
            lastMessageData: {
              ...chat.lastMessageData,
              content: data.content,
              isEdited: true,
              editedAt: data.editedAt
            },
            lastMessage: data.content,
            updatedAt: new Date()
          };
        }
        return chat;
      }));
    };

    const handleMessageDeleted = (data: any) => {
      // const currentUser = userRef.current;
      
      // Remove message from state if deleteForEveryone or our own message
      if (data.deleteForEveryone) {
        setMessages(prev => prev.filter(msg => msg._id.toString() !== data.messageId));
        
        // Update chat last message if needed
        setChats(prev => prev.map(chat => {
          if (chat._id.toString() === data.chatRoomId && 
              chat.lastMessageData?._id.toString() === data.messageId) {
            return {
              ...chat,
              lastMessageData: undefined,
              lastMessage: '',
              lastMessageAt: chat.updatedAt
            };
          }
          return chat;
        }));
      }
    };

    const handleReactionAdded = (data: any) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id.toString() === data.messageId) {
          const existingIndex = msg.reactions.findIndex(
            r => r.userId.toString() === data.userId
          );
          
          if (existingIndex > -1) {
            const newReactions = [...msg.reactions];
            newReactions[existingIndex] = {
              ...newReactions[existingIndex],
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
      setChats(prev => prev.map(chat => {
        if (chat._id.toString() === data.chatRoomId) {
          return {
            ...chat,
            lastMessageData: data.lastMessage,
            lastMessageAt: data.lastMessageAt,
            updatedAt: new Date(data.timestamp)
          };
        }
        return chat;
      }));
    };

    const handleUserPresenceUpdate = (data: any) => {
      console.log('🟢 Presence update received:', data);
      
      setChats(prev => prev.map(chat => {
        // Update in all chats where this user is a participant
        if (chat.participantsData) {
          const updatedParticipants = chat.participantsData.map(participant => {
            if (participant._id.toString() === data.userId) {
              return {
                ...participant,
                isOnline: data.isOnline,
                lastActive: data.lastActive || participant.lastActive
              };
            }
            return participant;
          });
          
          return { ...chat, participantsData: updatedParticipants };
        }
        return chat;
      }));
    };

    // const handleOnlineStatusResponse = (data: any) => {
    //   console.log('📊 Online status response:', data);
      
    //   if (data.onlineUsers && Array.isArray(data.onlineUsers)) {
    //     setChats(prev => prev.map(chat => {
    //       if (chat.participantsData) {
    //         const updatedParticipants = chat.participantsData.map(participant => {
    //           const isOnline = data.onlineUsers.includes(participant._id.toString());
    //           return {
    //             ...participant,
    //             isOnline,
    //             // Keep existing lastActive if not online
    //             ...(isOnline && !participant.lastActive ? { lastActive: new Date().toISOString() } : {})
    //           };
    //         });
            
    //         return { ...chat, participantsData: updatedParticipants };
    //       }
    //       return chat;
    //     }));
    //   }
    // };

    // Register socket listeners
    socketManager.on('connect', handleConnect);
    socketManager.on('disconnect', handleDisconnect);
    socketManager.on('connect_error', handleConnectError);
    socketManager.on('receive_message', handleReceiveMessage);
    socketManager.on('message_sent', handleMessageSent);
    socketManager.on('user_typing', handleUserTyping);
    socketManager.on('message_read', handleMessageRead);
    socketManager.on('message_edited', handleMessageEdited);
    socketManager.on('message_deleted', handleMessageDeleted);
    socketManager.on('reaction_added', handleReactionAdded);
    socketManager.on('reaction_removed', handleReactionRemoved);
    socketManager.on('chat_updated', handleChatUpdated);
    socketManager.on('user_presence_update', handleUserPresenceUpdate);

    const currentTimeouts = typingTimeoutsRef.current; 

    return () => {
      currentTimeouts.forEach(timeout => clearTimeout(timeout));
      currentTimeouts.clear();
      
      // Remove socket listeners
      socketManager.off('connect', handleConnect);
      socketManager.off('disconnect', handleDisconnect);
      socketManager.off('connect_error', handleConnectError);
      socketManager.off('receive_message', handleReceiveMessage);
      socketManager.off('message_sent', handleMessageSent);
      socketManager.off('user_typing', handleUserTyping);
      socketManager.off('message_read', handleMessageRead);
      socketManager.off('message_edited', handleMessageEdited);
      socketManager.off('message_deleted', handleMessageDeleted);
      socketManager.off('reaction_added', handleReactionAdded);
      socketManager.off('reaction_removed', handleReactionRemoved);
      socketManager.off('chat_updated', handleChatUpdated);
      socketManager.off('user_presence_update', handleUserPresenceUpdate);
    };
  }, []);

  // ============================================
  // CORE FUNCTIONS
  // ============================================

  const connectSocket = async (): Promise<void> => {
    try {
      await socketManager.connect();
    } catch (error) {
      console.error('Failed to connect socket:', error);
      throw error;
    }
  };

  const disconnectSocket = (): void => {
    socketManager.disconnect();
    setIsConnected(false);
    setSocketId(null);
  };

  const loadChats = async (): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiFetch<{ data: { chats: ChatRoom[] } }>('/chat/rooms');
      
      // Sort chats by last message date (newest first)
      const sortedChats = response.data.chats.sort((a, b) => {
        const dateA = new Date(a.lastMessageAt || a.updatedAt).getTime();
        const dateB = new Date(b.lastMessageAt || b.updatedAt).getTime();
        return dateB - dateA;
      });
      
      setChats(sortedChats);
    } catch (error) {
      console.error('Failed to load chats:', error);
      showAlert({ message: 'Failed to load chats', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async (): Promise<void> => {
    try {
      const response = await apiFetch<{ data: { count: number } }>('/chat/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  // const loadMessages = async (chatRoomId: string, loadMore = false): Promise<void> => {
  //   try {
  //     if (!loadMore) {
  //       setLoading(true);
  //       setMessages([]);
  //     }

  //     const params = new URLSearchParams({
  //       limit: '50',
  //       sort: 'desc'
  //     });

  //     if (loadMore && messages.length > 0) {
  //       const lastMessage = messages[messages.length - 1];
  //       params.append('before', new Date(lastMessage.createdAt).toISOString());
  //     }

  //     const response = await apiFetch<{ data: { messages: ChatMessage[], hasMore: boolean } }>(
  //       `/chat/rooms/${chatRoomId}/messages?${params.toString()}`
  //     );

  //     // Remove duplicates and sort
  //     const allMessages = loadMore 
  //       ? [...messages, ...response.data.messages]
  //       : response.data.messages;
      
  //     const uniqueMessages = removeDuplicates(allMessages);
  //     const sortedMessages = sortMessages(uniqueMessages);

  //     setMessages(sortedMessages);
  //     setHasMoreMessages(response.data.hasMore);

  //     // Join chat room via socket
  //     if (!loadMore) {
  //       await socketManager.joinChat(chatRoomId);
  //     }

  //     // Mark all as read if we're loading for the first time
  //     if (!loadMore && user) {
  //       // You might want to call an API to mark all messages as read
  //     }

  //   } catch (error) {
  //     console.error('Failed to load messages:', error);
  //     showAlert({ message: 'Failed to load messages', type: 'error' });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const loadMessages = async (chatRoomId: string, loadMore = false): Promise<void> => {
    try {
      if (!loadMore) {
        setLoading(true);
      }

      // Check cache first
      const cachedMessages = messageCache.get(chatRoomId);
      if (cachedMessages && !loadMore) {
        setMessages(cachedMessages);
        setLoading(false);
        return;
      }

      const params = new URLSearchParams({
        limit: '50',
        sort: 'desc'
      });

      if (loadMore && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        params.append('before', new Date(lastMessage.createdAt).toISOString());
      }

      const response = await apiFetch<{ data: { messages: ChatMessage[], hasMore: boolean } }>(
        `/chat/rooms/${chatRoomId}/messages?${params.toString()}`
      );

      // Remove duplicates and sort
      const allMessages = loadMore 
        ? [...messages, ...response.data.messages]
        : response.data.messages;
      
      const uniqueMessages = removeDuplicates(allMessages);
      const sortedMessages = sortMessages(uniqueMessages);

      // Update cache
      setMessageCache(prev => new Map(prev).set(chatRoomId, sortedMessages));
      
      setMessages(sortedMessages);
      setHasMoreMessages(response.data.hasMore);

      // Join chat room via socket - only if not already joined
      if (!loadMore) {
        await joinChatOnce(chatRoomId);
      }

    } catch (error) {
      console.error('Failed to load messages:', error);
      showAlert({ message: 'Failed to load messages', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // JOIN CHAT ONCE (PREVENT DUPLICATE JOINS)
  // ============================================

  const joinedChatsRef = useRef<Set<string>>(new Set());

  const joinChatOnce = useCallback(async (chatRoomId: string): Promise<void> => {
    // Skip if already joined
    if (joinedChatsRef.current.has(chatRoomId)) {
      console.log(`Already joined chat: ${chatRoomId}, skipping...`);
      return;
    }

    try {
      await socketManager.joinChat(chatRoomId);
      joinedChatsRef.current.add(chatRoomId);
      console.log(`✅ Joined chat: ${chatRoomId}`);
    } catch (error) {
      console.error(`Failed to join chat ${chatRoomId}:`, error);
    }
  }, []);

  // ============================================
  // HANDLE SET ACTIVE CHAT (OPTIMIZED)
  // ============================================

  const handleSetActiveChat = useCallback((chat: ChatRoom | null) => {
    // Clear previous chat's typing indicators
    if (activeChatRef.current && chat?.id !== activeChatRef.current._id) {
      setTypingUsers(new Set());
    }
    
    setActiveChat(chat);
    
    if (chat) {
      // Load messages from cache if available
      const cachedMessages = messageCache.get(chat._id.toString());
      if (cachedMessages) {
        setMessages(cachedMessages);
        setLoading(false);
      } else {
        loadMessages(chat._id.toString());
      }
      
      // Clear typing indicators
      setTypingUsers(new Set());
      
      // Update unread count
      setChats(prev => prev.map(c => {
        if (c._id.toString() === chat._id.toString() && user) {
          return {
            ...c,
            unreadCount: {
              ...c.unreadCount,
              [user._id]: 0
            }
          };
        }
        return c;
      }));
      
      // Join chat room
      joinChatOnce(chat._id.toString());
    } else {
      setMessages([]);
      setTypingUsers(new Set());
    }
  }, [user, messageCache]);

  const sendMessage = async (content: string, replyTo?: string): Promise<void> => {
    const currentActiveChat = activeChatRef.current;
    const currentUser = userRef.current;
    
    if (!currentActiveChat || !content.trim() || !currentUser) {
      return;
    }

    try {
      setSending(true);
      
      // Create optimistic message
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const tempMessage: ChatMessage = {
        _id: tempId as any,
        chatRoomId: currentActiveChat._id,
        senderId: currentUser._id,
        sender: {
          _id: currentUser._id,
          name: currentUser.name,
          email: currentUser.email,
          profile: {
            avatar: currentUser.profile?.avatar,
          },
          isOnline: currentUser.isOnline,
          lastActive: currentUser.lastActive,
        },
        content,
        messageType: 'text',
        status: 'sending',
        readBy: [],
        isEdited: false,
        isDeleted: false,
        reactions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(replyTo && { replyTo })
      };
      
      // Add optimistic message
      setMessages(prev => sortMessages([...prev, tempMessage]));
      
      // Send via socket
      await socketManager.sendMessage({
        chatRoomId: currentActiveChat._id.toString(),
        content,
        ...(replyTo && { replyTo })
      });
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      showAlert({ message: error.message || 'Failed to send message', type: 'error' });
      
      // Mark as failed
      setMessages(prev => prev.map(msg => 
        msg._id.toString().startsWith('temp-') 
          ? { ...msg, status: 'failed' }
          : msg
      ));
    } finally {
      setSending(false);
    }
  };

  const sendFileMessage = async (file: any, type: 'image' | 'file' | 'audio' | 'video'): Promise<void> => {
    const currentActiveChat = activeChatRef.current;
    if (!currentActiveChat) return;

    try {
      setSending(true);

      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const uploadResponse = await apiFetch<{ 
        url: string; 
        fileName: string; 
        fileSize: number; 
        fileType: string;
        thumbnailUrl?: string;
      }>('/upload', {
        method: 'POST',
        body: formData,
      });

      // Send message
      await socketManager.sendMessage({
        chatRoomId: currentActiveChat._id.toString(),
        content: '',
        messageType: type,
        fileUrl: uploadResponse.url,
        fileName: uploadResponse.fileName,
        fileSize: uploadResponse.fileSize,
        fileType: uploadResponse.fileType,
        ...(uploadResponse.thumbnailUrl && { thumbnailUrl: uploadResponse.thumbnailUrl })
      });

    } catch (error: any) {
      console.error('Failed to send file:', error);
      showAlert({ message: error.message || 'Failed to send file', type: 'error' });
    } finally {
      setSending(false);
    }
  };

  const setTyping = useCallback((isTyping: boolean) => {
    const currentActiveChat = activeChatRef.current;
    if (currentActiveChat && socketManager.connected) {
      socketManager.setTyping(currentActiveChat._id.toString(), isTyping);
    }
  }, []);

  const markAsRead = useCallback((messageId: string) => {
    const currentActiveChat = activeChatRef.current;
    if (currentActiveChat) {
      socketManager.markAsRead(currentActiveChat._id.toString(), messageId);
    }
  }, []);

  const addReaction = useCallback((messageId: string, emoji: string) => {
    const currentActiveChat = activeChatRef.current;
    if (currentActiveChat) {
      socketManager.addReaction(messageId, currentActiveChat._id.toString(), emoji);
    }
  }, []);

  const removeReaction = useCallback((messageId: string) => {
    const currentActiveChat = activeChatRef.current;
    if (currentActiveChat) {
      socketManager.removeReaction(messageId, currentActiveChat._id.toString());
    }
  }, []);

  const editMessage = async (messageId: string, content: string): Promise<void> => {
    const currentActiveChat = activeChatRef.current;
    if (!currentActiveChat) return;

    try {
      // Optimistic update
      setMessages(prev => prev.map(msg => 
        msg._id.toString() === messageId 
          ? { ...msg, content, isEdited: true, status: 'updating' }
          : msg
      ));

      await socketManager.editMessage(messageId, currentActiveChat._id.toString(), content);
      
    } catch (error: any) {
      console.error('Failed to edit message:', error);
      showAlert({ message: error.message || 'Failed to edit message', type: 'error' });
      
      // Rollback
      setMessages(prev => prev.map(msg => 
        msg._id.toString() === messageId 
          ? { ...msg, status: 'failed' }
          : msg
      ));
    }
  };

  const deleteMessage = async (messageId: string, deleteForEveryone = false): Promise<void> => {
    const currentActiveChat = activeChatRef.current;
    if (!currentActiveChat) return;

    try {
      // Visual feedback
      setMessages(prev => prev.map(msg =>
        msg._id.toString() === messageId
          ? { ...msg, isDeleting: true }
          : msg
      ));

      // Call REST API first for persistence
      await apiFetch(`/chat/messages/${messageId}?deleteForEveryone=${deleteForEveryone}`, {
        method: 'DELETE',
      });

      // Notify via socket
      await socketManager.deleteMessage(messageId, currentActiveChat._id.toString(), deleteForEveryone);

      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 300));

      // Remove from state
      setMessages(prev => prev.filter(msg => msg._id.toString() !== messageId));

    } catch (error: any) {
      console.error('Failed to delete message:', error);
      showAlert({ message: error.message || 'Failed to delete message', type: 'error' });
      
      // Rollback
      setMessages(prev => prev.map(msg =>
        msg._id.toString() === messageId
          ? { ...msg, isDeleting: false }
          : msg
      ));
    }
  };

  const createChat = async (
    participantIds: string[],
    isGroup = false,
    groupName?: string
  ): Promise<ChatRoom> => {
    try {
      const response = await apiFetch<{ data: ChatRoom }>('/chat/rooms', {
        method: 'POST',
        body: { participantIds, isGroup, groupName },
      });

      // Add to beginning of chat list
      setChats(prev => [response.data, ...prev]);

      return response.data;
    } catch (error: any) {
      console.error('Failed to create chat:', error);
      showAlert({ message: error.message || 'Failed to create chat', type: 'error' });
      throw error;
    }
  };

  // const handleSetActiveChat = useCallback((chat: ChatRoom | null) => {
  //   setActiveChat(chat);
    
  //   if (chat) {
  //     // Load messages
  //     loadMessages(chat._id.toString());
      
  //     // Clear typing indicators
  //     setTypingUsers(new Set());
      
  //     // Update unread count
  //     setChats(prev => prev.map(c => {
  //       if (c._id.toString() === chat._id.toString() && user) {
  //         return {
  //           ...c,
  //           unreadCount: {
  //             ...c.unreadCount,
  //             [user._id]: 0
  //           }
  //         };
  //       }
  //       return c;
  //     }));
  //   } else {
  //     setMessages([]);
  //     setTypingUsers(new Set());
  //   }
  // }, [user]);

  const loadMessagesForChat = async (chatRoomId: string, loadMore = false): Promise<ChatMessage[]> => {
    try {
      if (!loadMore) {
        setLoading(true);
        setMessages([]);
      }

      const params = new URLSearchParams({
        limit: '50',
        sort: 'desc'
      });

      if (loadMore && messages.length > 0) {
        const lastMessage = messages[messages.length - 1];
        params.append('before', new Date(lastMessage.createdAt).toISOString());
      }

      const response = await apiFetch<{ data: { messages: ChatMessage[], hasMore: boolean } }>(
        `/chat/rooms/${chatRoomId}/messages?${params.toString()}`
      );

      // Remove duplicates and sort
      const allMessages = loadMore 
        ? [...messages, ...response.data.messages]
        : response.data.messages;
      
      const uniqueMessages = removeDuplicates(allMessages);
      const sortedMessages = sortMessages(uniqueMessages);

      setMessages(sortedMessages);
      setHasMoreMessages(response.data.hasMore);

      // Join chat room via socket
      if (!loadMore) {
        await socketManager.joinChat(chatRoomId);
      }

      return sortedMessages;
    } catch (error) {
      console.error('Failed to load messages:', error);
      showAlert({ message: 'Failed to load messages', type: 'error' });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loadChatRoom = async (chatId: string): Promise<ChatRoom> => {
    try {
      // Check existing chats first
      const existingChat = chats.find(chat => chat._id.toString() === chatId);
      if (existingChat) {
        setActiveChat(existingChat);
        await loadMessages(existingChat._id.toString());
        return existingChat;
      }
      
      // Fetch from API
      const response = await apiFetch<{ data: ChatRoom }>(`/chat/rooms/${chatId}`);
      
      // Add to chats
      setChats(prev => {
        const exists = prev.some(chat => chat._id.toString() === chatId);
        return exists ? prev : [response.data, ...prev];
      });
      
      // Set as active
      setActiveChat(response.data);
      await loadMessages(response.data._id.toString());
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to load chat room:', error);
      
      if (error.message?.includes('404')) {
        showAlert({ message: 'Chat room not found', type: 'error' });
      } else {
        showAlert({ message: 'Failed to load chat room', type: 'error' });
      }
      
      throw error;
    }
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================

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
    loadMessagesForChat,
    loadChatRoom,
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
    socketId,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// ============================================
// CUSTOM HOOK FOR EASY ACCESS
// ============================================

export const useChatActions = () => {
  const chat = useChat();
  
  return {
    sendMessage: chat.sendMessage,
    sendFileMessage: chat.sendFileMessage,
    setTyping: chat.setTyping,
    markAsRead: chat.markAsRead,
    addReaction: chat.addReaction,
    removeReaction: chat.removeReaction,
    editMessage: chat.editMessage,
    deleteMessage: chat.deleteMessage,
    createChat: chat.createChat,
    setActiveChat: chat.setActiveChat,
  };
};

export const useChatState = () => {
  const chat = useChat();
  
  return {
    chats: chat.chats,
    activeChat: chat.activeChat,
    messages: chat.messages,
    unreadCount: chat.unreadCount,
    loading: chat.loading,
    sending: chat.sending,
    hasMoreMessages: chat.hasMoreMessages,
    typingUsers: chat.typingUsers,
    isConnected: chat.isConnected,
    socketId: chat.socketId,
  };
};