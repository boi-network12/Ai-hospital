// src/context/ChatContext.tsx
import { useAuth } from '@/Hooks/authHook.d';
import { useUser } from '@/Hooks/userHooks.d';
import { useToast } from '@/Hooks/useToast.d';
// import { User } from '@/types/auth';
import { ChatMessage, ChatRoom } from '@/types/chat';
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
  const typingTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map())
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

  useEffect(() => {
    const cleanup = () => {
      typingTimeoutsRef.current.forEach(t => clearTimeout(t));
      typingTimeoutsRef.current.clear();
    };

    return cleanup;
  }, []);

  // Connect to socket on mount
  useEffect(() => {
  const initializeSocket = async () => {
    if (auth.isAuth && auth.accessToken) {
      console.log('ChatProvider: Auth detected, connecting socket...');
      try {
        await connectSocket();
        await loadChats();
        await loadUnreadCount();
      } catch (error) {
        console.error('ChatProvider: Failed to initialize socket:', error);
      }
    }
  };

  initializeSocket();

  return () => {
    console.log('ChatProvider: Cleaning up socket connection');
    disconnectSocket();
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
      socketManager.updateUserPresence(true);
      loadChats();
      loadUnreadCount();
    };

    const handleDisconnect = () => {
      console.log('ChatProvider: Socket disconnected');
      setIsConnected(false);
      socketManager.updateUserPresence(false);
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
              return [...prev, message];
            }
            return prev;
        });
      
        
        // Mark as read if it's not our own message
        if (currentUser && message.senderId.toString() !== currentUser._id) {
          socketManager.markAsRead(currentActiveChat._id.toString(), message._id.toString());
        }
      }

      // Update chat list with new last message
      setChats(prev => prev.map(chat => {
        if (chat._id.toString() === message.chatRoomId.toString()) {
          return {
            ...chat,
            lastMessageData: message,
            lastMessage: message.content,
            lastMessageAt: new Date(message.createdAt),
            updatedAt: new Date(message.createdAt),
            unreadCount: {
              ...chat.unreadCount,
              [currentUser?._id || '']: message.senderId.toString() === currentUser?._id
                ? 0
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

    const handleMessageSent = (confirmedMessage: ChatMessage) => {
    console.log('ChatProvider: Message sent confirmed', confirmedMessage._id);
    
    const currentUser = userRef.current;
    
    // 1. Update messages list
    setMessages(prev => {
      // Remove any temporary messages
      const filtered = prev.filter(m => !m._id.toString().startsWith('temp-'));
      
      // Check if message already exists
      const exists = filtered.some(m => m._id.toString() === confirmedMessage._id.toString());
      if (!exists) {
        return [...filtered, confirmedMessage];
      }
      return filtered;
    });
    
    // 2. CRITICAL: Update chat list with new last message
    setChats(prev => prev.map(chat => {
      if (chat._id.toString() === confirmedMessage.chatRoomId.toString()) {
        return {
          ...chat,
          lastMessageData: confirmedMessage, // This should be populated
          lastMessage: confirmedMessage.content, // Fallback for old format
          lastMessageAt: new Date(confirmedMessage.createdAt),
          updatedAt: new Date(confirmedMessage.createdAt),
          unreadCount: {
            ...chat.unreadCount,
            [currentUser?._id || '']: 0 // Reset our own unread count
          }
        };
      }
      return chat;
    }));
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
      const currentUser = userRef.current;
      
      if (currentActiveChat && 
          data.chatRoomId === currentActiveChat._id && 
          data.userId !== currentUser?._id) {

        console.log(`👀 ${data.userId} is typing in active chat`);
        
        if (data.isTyping) {
          // Add user to typing set
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            newSet.add(data.userId);
            return newSet;
          });
          
          // Clear typing indicator after 3 seconds
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
          // Clear existing timeout if any
          const existingTimeout = typingTimeoutsRef.current.get(data.userId);
          if (existingTimeout) {
            clearTimeout(existingTimeout);
            typingTimeoutsRef.current.delete(data.userId);
          }
          
          // Remove user from typing set
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
            editedAt: data.editedAt,
            status: 'sent'
          };
        }
        return msg;
      }));

      // Update chat if this was the last message
      setChats(prev => prev.map(chat => {
        if (chat._id.toString() === data.chatRoomId && 
            chat.lastMessageData?._id?.toString() === data.messageId) {
          
          // Option 1: Most readable & safe (recommended)
          if (!chat.lastMessageData) return chat;
          
          return {
            ...chat,
            lastMessageData: {
              ...chat.lastMessageData,
              content: data.content,
              isEdited: true,
              editedAt: data.editedAt,
              // Explicitly keep _id (TypeScript will be happy)
              _id: chat.lastMessageData._id
            }
          };
        }
        return chat;
      }));
    };

     const handleMessageDeleted = (data: any) => {
      console.log('ChatProvider: Message deleted', data);
      
      const currentUser = userRef.current;
      const isOurMessage = messages.find(msg =>
        msg._id.toString() === data.messageId
      )?.senderId.toString() === currentUser?._id;
      
      // Remove message if deleteForEveryone is true OR it's our own message
      if (data.deleteForEveryone || isOurMessage) {
        setMessages(prev => prev.filter(msg => msg._id.toString() !== data.messageId));
      }
      
      // Update chat list if this was the last message
      setChats(prev => prev.map(chat => {
        if (chat._id.toString() === data.chatRoomId && 
            chat.lastMessageData?._id.toString() === data.messageId) {
          // Find a new last message or set to null
          return {
            ...chat,
            lastMessageData: undefined,
            lastMessageAt: chat.lastMessageAt // Keep same or adjust
          };
        }
        return chat;
      }));
    };

    const handleUserOnlineStatus = (data: any) => {
      console.log('ChatProvider: User online status', data);
      
      // Update user online status in chats
      setChats(prev => prev.map(chat => {
        if (chat.participantsData) {
          const updatedParticipants = chat.participantsData.map(participant => {
            if (participant._id === data.userId) {
              return {
                ...participant,
                isOnline: data.isOnline,
                lastActive: data.lastActive || participant.lastActive
              };
            }
            return participant;
          });
          
          return {
            ...chat,
            participantsData: updatedParticipants
          };
        }
        return chat;
      }));
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

     const handleChatUpdated = (data: any) => {
        console.log('ChatProvider: Chat updated', data);
        
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


    // Register socket event listeners
    socketManager.on('connect', handleConnect);
    socketManager.on('disconnect', handleDisconnect);
    socketManager.on('receive_message', handleReceiveMessage);
    socketManager.on('message_sent', handleMessageSent);
    socketManager.on('user_typing', handleUserTyping);
    socketManager.on('user_online_status', handleUserOnlineStatus);
    socketManager.on('message_read', handleMessageRead);
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
      socketManager.off('user_online_status', handleUserOnlineStatus);
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

      const before = loadMore && messages.length > 0 ? messages[messages.length - 1].createdAt : undefined;
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

      // API returns oldest first, but we need newest first in state
      const sortedMessages = [...response.data.messages].reverse();

      if (loadMore) {
        setMessages(prev => [...prev, ...sortedMessages]);
      } else {
        setMessages(sortedMessages);
      }

      setHasMoreMessages(response.data.hasMore);

      // Join chat room via socket ONLY if not already joined
      const isAlreadyJoined = activeChatRef.current?._id.toString() === chatRoomId;
      if (!isAlreadyJoined) {
        socketManager.joinChat(chatRoomId);
      }
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
      return;
    }

    try {
      setSending(true);
      
      // Create temporary message with proper _id as string
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
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Add temporary message at the END (since messages are newest-first)
      setMessages(prev => [...prev, tempMessage]);
      
      // Send via socket
      await socketManager.sendMessage({
        chatRoomId: currentActiveChat._id.toString(),
        content,
        replyTo
      });
      
    } catch (error) {
      console.error('Failed to send message:', error);
      showAlert({ message: 'Failed to send message', type: "error" });
      
      // Update status of temporary message
      setMessages(prev => prev.map(msg => 
        msg._id.toString().startsWith('temp-') 
          ? { ...msg, status: 'failed' }
          : msg
      ));
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
    if (currentActiveChat && socketManager.isSocketConnected) {
      console.log(`✍️ ${isTyping ? 'START' : 'STOP'} typing in chat: ${currentActiveChat._id}`);
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

 // Fix the editMessage function in ChatContext.tsx
  const editMessage = async (messageId: string, content: string) => {
    const currentActiveChat = activeChatRef.current;
    if (!currentActiveChat) return;

    try {
      // Optimistic update
      setMessages(prev => prev.map(msg => 
        msg._id.toString() === messageId 
          ? { ...msg, content, isEdited: true, status: 'updating' }
          : msg
      ));

      // Send edit via socket
      await socketManager.editMessage(messageId, currentActiveChat._id.toString(), content);
      
      // Optimistic update success (socket will confirm)
    } catch (error) {
      console.error('ChatProvider: Failed to edit message:', error);
      showAlert({message: 'Failed to edit message', type: "error"});
      
      // Rollback optimistic update
      setMessages(prev => prev.map(msg => 
        msg._id.toString() === messageId 
          ? { ...msg, status: 'failed' }
          : msg
      ));
    }
  };

  // Delete message
    const deleteMessage = async (messageId: string, deleteForEveryone = false) => {
    const currentActiveChat = activeChatRef.current;
    if (!currentActiveChat) return;

    try {
      // 1. Find message index for optimistic update
      const messageIndex = messages.findIndex(m => m._id.toString() === messageId);
      if (messageIndex === -1) return;

      // 2. Optimistic update - mark message as deleting (visual feedback)
      setMessages(prev =>
        prev.map(msg =>
          msg._id.toString() === messageId
            ? { ...msg, isRemoving: true }
            : msg
        )
      );

      // 3. Call backend (REST + Socket)
      // First REST call (important for persistence)
      await apiFetch(`/chat/messages/${messageId}?deleteForEveryone=${deleteForEveryone}`, {
        method: 'DELETE',
      });

      // Then notify everyone via socket
      socketManager.deleteMessage(messageId, currentActiveChat._id.toString(), deleteForEveryone);

      // 4. Visual feedback delay - let user see the "deleting" state for a tiny moment
      await new Promise(resolve => setTimeout(resolve, 400));

      // 5. Smooth removal with animation class
      setMessages(prev =>
        prev.map((msg, idx) =>
          idx === messageIndex
            ? { ...msg, isRemoving: true }
            : msg
        )
      );

      // 6. Actually remove after animation time
      setTimeout(() => {
        setMessages(prev => prev.filter(m => m._id.toString() !== messageId));
      }, 600); // should match your CSS animation duration

    } catch (error) {
      console.error('Failed to delete message:', error);
      showAlert({ message: 'Failed to delete message', type: 'error' });

      // Rollback optimistic update on error
      setMessages(prev =>
        prev.map(msg =>
          msg._id.toString() === messageId
            ? { ...msg, isDeleting: false, status: 'sent' } // or whatever it was
            : msg
        )
      );
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

    const before = loadMore && messages.length > 0 ? messages[messages.length - 1].createdAt : undefined;
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

    // API returns oldest first, but we need newest first in state
    const sortedMessages = [...response.data.messages].reverse();

    // Remove duplicates before setting state
    const uniqueMessages = removeDuplicates(
      loadMore ? [...messages, ...sortedMessages] : sortedMessages
    );

    if (loadMore) {
      setMessages(prev => {
        const combined = [...prev, ...sortedMessages];
        return removeDuplicates(combined);
      });
    } else {
      setMessages(removeDuplicates(sortedMessages));
    }

    setHasMoreMessages(response.data.hasMore);

    // Join chat room via socket - ONLY if not already joined
    const isAlreadyJoined = activeChatRef.current?._id.toString() === chatRoomId;
    if (!isAlreadyJoined) {
      socketManager.joinChat(chatRoomId);
      console.log(`Joined chat room: ${chatRoomId} (first time)`);
    } else {
      console.log(`Already joined chat room: ${chatRoomId}, skipping...`);
    }

    // Clear typing indicators
    setTypingUsers(new Set());
    
    return uniqueMessages;
  } catch (error) {
    console.error('ChatProvider: Failed to load messages:', error);
    showAlert({message: 'Failed to load message', type: "error"})
    throw error;
  } finally {
    setLoading(false);
  }
};

// Helper function to remove duplicate messages
const removeDuplicates = (messages: ChatMessage[]): ChatMessage[] => {
  const seen = new Set();
  return messages.filter(message => {
    const key = message._id.toString();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
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