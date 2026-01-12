import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from './api';
import { SOCKET_URL } from '@/config/api';

class SocketManager {
  private socket: Socket | null = null;
  private isConnected: boolean = false;
  private listeners: Map<string, Function[]> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private isRefreshingToken: boolean = false;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private connectionInProgress: boolean = false;
  private joinedRooms: Set<string> = new Set();
  private shouldReconnect = true;
  private connectionPromise: Promise<void> | null = null;
  private pendingMessages: {
    type: string;
    data: any;
    callback?: Function;
  }[] = [];

  // Track message timeouts to prevent duplicate sends
  private messageTimeouts: Map<string, NodeJS.Timeout> = new Map();

  get isSocketConnected(): boolean {
    return this.isConnected && !!this.socket?.connected;
  }

  async connect(): Promise<void> {
     if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    if (this.connectionInProgress) {
      console.log('Connection already in progress...');
      return;
    }

    if (this.socket?.connected) {
      console.log('Socket already connected');
      return Promise.resolve();
    }

    this.connectionInProgress = true;

    this.connectionPromise = new Promise(async (resolve, reject) => {
       try {
        const token = await SecureStore.getItemAsync('accessToken');
        if (!token) {
          throw new Error('No access token available');
        }

        console.log('🔌 Connecting to socket server...');
        await this.createSocketConnection(token);
        
        // Wait for connection to be established
        const waitForConnection = new Promise<void>((innerResolve, innerReject) => {
          const timeout = setTimeout(() => {
            innerReject(new Error('Connection timeout'));
          }, 10000);

          const onConnect = () => {
            clearTimeout(timeout);
            innerResolve();
          };

          const onConnectError = (error: any) => {
            clearTimeout(timeout);
            innerReject(error);
          };

          if (this.socket) {
            this.socket.once('connect', onConnect);
            this.socket.once('connect_error', onConnectError);
          }
        });

        await waitForConnection;
        console.log('✅ Socket connected successfully');
        resolve();
      } catch (error) {
        console.error('Failed to connect socket:', error);
        reject(error);
      } finally {
        this.connectionPromise = null;
      }
    });

    return this.connectionPromise;
  }

  private async createSocketConnection(token: string): Promise<void> {
    // Clean up existing connection
    this.disconnect();

    try {
      const latestToken = await SecureStore.getItemAsync('accessToken');
      if (!latestToken) {
        throw new Error('No access token available after refresh');
      }

      console.log('Creating socket connection with token...');

      // Create new socket connection
      this.socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        auth: {
          token: latestToken
        },
        timeout: 15000,
        forceNew: false,
        multiplex: false,
        withCredentials: true,
        query: {
          platform: 'mobile',
          timestamp: Date.now().toString()
        }
      });

      this.setupEventListeners();

      // Manually connect
      this.socket.connect();

    } catch (error) {
      console.error('Failed to create socket connection:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅✅✅ SOCKET CONNECTED SUCCESSFULLY, ID:', this.socket?.id);
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      
      // Emit connection event
      this.emitToListeners('connect', { socketId: this.socket.id });
      
      // Send presence update immediately
      this.socket.emit('user_presence', {
        isOnline: true,
        lastActive: new Date().toISOString()
      });
      
      // Rejoin previously joined rooms
      this.rejoinRooms();
      
      // Send any pending messages
      this.flushPendingMessages();
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      this.emitToListeners('disconnect', { reason });
      
      // For non-auth disconnects, attempt reconnect
      if (reason !== 'io client disconnect' && 
          reason !== 'io server disconnect') {
        this.attemptReconnect();
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('🔌 Socket connect_error:', error.message);
      
      // Check for auth errors
      const isAuthError = error.message?.includes('auth') || 
                         error.message?.includes('jwt') || 
                         error.message?.includes('token') ||
                         error.message?.includes('invalid') ||
                         error.message?.includes('expired') ||
                         error.message?.includes('unauthorized');
      
      if (isAuthError) {
        console.log('🔐 Auth error detected in connect_error');
        this.handleAuthErrorAndRefresh();
      } else {
        console.log('🌐 Network/connection error, will attempt reconnect');
        this.emitToListeners('connect_error', error);
        this.attemptReconnect();
      }
    });

    // Listen for all chat events - MATCHING BACKEND EVENTS
    const chatEvents = [
      'receive_message',      // New message from anyone in chat
      'message_sent',         // Confirmation of sent message
      'message_read',         // Message read receipt
      'message_edited',       // Message edited
      'message_deleted',      // Message deleted
      'user_typing',          // User typing indicator
      'user_online_status',   // User online/offline status
      'user_presence_update', // User presence update
      'user_joined_chat',     // User joined chat room
      'user_left_chat',       // User left chat room
      'reaction_added',       // Reaction added to message
      'reaction_removed',     // Reaction removed from message
      'chat_updated',         // Chat metadata updated
      'message_error',        // Message sending error
      'error'                 // General socket error
    ];

    chatEvents.forEach((event) => {
      this.socket!.on(event, (data: any) => {
        console.log(`📡 Received socket event: ${event}`, data);
        this.emitToListeners(event, data);
      });
    });

    // Handle auth error from server
    this.socket.on('auth_error', (error: any) => {
      console.error('🔐 Socket auth_error:', error);
      this.emitToListeners('auth_error', error);
      this.handleAuthErrorAndRefresh();
    });
  }

  private async handleAuthErrorAndRefresh(): Promise<void> {
    if (this.isRefreshingToken) {
      console.log('Token refresh already in progress...');
      return;
    }

    console.log('🔐 Auth error detected - attempting token refresh...');
    this.isRefreshingToken = true;
    
    // Disconnect socket first
    this.disconnect();

    try {
      // Get refresh token
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Call refresh endpoint
      const response = await apiFetch('/auth/refresh', {
        method: 'POST',
        body: { refreshToken }
      });

      if (response.accessToken) {
        await SecureStore.setItemAsync('accessToken', response.accessToken);
        console.log('✅ Token refreshed successfully');
        
        // Reconnect with new token
        await this.connect();
      } else {
        throw new Error('Invalid refresh response');
      }
      
    } catch (err: any) {
      console.error('❌ Token refresh failed:', err.message || err);
      this.emitToListeners('auth_error_failed', { error: err });
      
      // Clear tokens on complete failure
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
    } finally {
      this.isRefreshingToken = false;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
      
      setTimeout(async () => {
        try {
          await this.connect();
        } catch (err) {
          console.error('Reconnect attempt failed:', err);
        }
      }, delay);
    } else {
      console.log('❌ Max reconnection attempts reached');
      this.emitToListeners('reconnect_failed', { attempts: this.reconnectAttempts });
    }
  }

  private rejoinRooms(): void {
    if (!this.socket?.connected) return;
    
    console.log(`🔄 Rejoining ${this.joinedRooms.size} rooms...`);
    this.joinedRooms.forEach(roomId => {
      this.socket?.emit('join_chat', roomId);
      console.log(`Rejoined room: ${roomId}`);
    });
  }

  private flushPendingMessages(): void {
    if (!this.socket?.connected || this.pendingMessages.length === 0) return;
    
    console.log(`Flushing ${this.pendingMessages.length} pending messages...`);
    
    this.pendingMessages.forEach(({ type, data, callback }) => {
      try {
        if (this.socket?.connected) {
          if (callback) {
            this.socket.emit(type, data, callback);
          } else {
            this.socket.emit(type, data);
          }
        }
      } catch (error) {
        console.error(`Error flushing pending message ${type}:`, error);
      }
    });
    
    this.pendingMessages = [];
  }

  // === CHAT ACTIONS ===

  async joinChat(chatRoomId: string): Promise<void> {
    if (!this.socket?.connected) {
      console.warn('Socket not connected, will join when connected');
      this.joinedRooms.add(chatRoomId);
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Join chat timeout'));
      }, 5000);

      this.socket.emit('join_chat', chatRoomId, (response: any) => {
        clearTimeout(timeout);
        
        if (response?.success) {
          this.joinedRooms.add(chatRoomId);
          console.log(`✅ Successfully joined chat room: ${chatRoomId}`);
          resolve();
        } else {
          reject(new Error(response?.error || 'Failed to join chat'));
        }
      });
    });
  }


  leaveChat(chatRoomId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('leave_chat', chatRoomId);
    }
    this.joinedRooms.delete(chatRoomId);
    console.log(`Left chat room: ${chatRoomId}`);
  }

  // sendMessage(data: any): Promise<any> {
  //   return new Promise((resolve, reject) => {
  //     if (!this.socket?.connected) {
  //       console.warn('⚠️ Socket not connected - message queued');
        
  //       // Queue message for when socket reconnects
  //       this.pendingMessages.push({
  //         type: 'send_message',
  //         data,
  //         callback: (response: any) => {
  //           if (response?.error) {
  //             reject(new Error(response.error));
  //           } else {
  //             resolve(response);
  //           }
  //         }
  //       });
        
  //       // Attempt to reconnect
  //       this.connect().catch(() => {
  //         reject(new Error('Socket not connected and reconnection failed'));
  //       });
        
  //       return;
  //     }

  //     // Clear any existing timeout for this message (if retrying)
  //     const messageKey = `${data.chatRoomId}-${Date.now()}`;
  //     const existingTimeout = this.messageTimeouts.get(messageKey);
  //     if (existingTimeout) {
  //       clearTimeout(existingTimeout);
  //     }

  //     // Add timeout for send operation
  //     const timeout = setTimeout(() => {
  //       this.messageTimeouts.delete(messageKey);
  //       reject(new Error('Message send timeout (15s)'));
  //     }, 15000);

  //     this.messageTimeouts.set(messageKey, timeout);

  //     console.log(`📤 Sending message to chat: ${data.chatRoomId}`);
      
  //     this.socket.emit('send_message', data, (response: any) => {
  //       // Clear timeout
  //       const currentTimeout = this.messageTimeouts.get(messageKey);
  //       if (currentTimeout) {
  //         clearTimeout(currentTimeout);
  //         this.messageTimeouts.delete(messageKey);
  //       }
        
  //       if (response?.error) {
  //         console.error('❌ Message send error:', response.error);
  //         reject(new Error(response.error));
  //       } else {
  //         console.log('✅ Message sent successfully, response:', response);
  //         resolve(response);
  //       }
  //     });
  //   });
  // }

   sendMessage(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Message send timeout'));
      }, 10000);

      console.log(`📤 Sending message to chat: ${data.chatRoomId}`);
      
      this.socket.emit('send_message', data, (response: any) => {
        clearTimeout(timeout);
        
        if (response?.success) {
          console.log('✅ Message sent successfully');
          resolve(response.data);
        } else {
          console.error('❌ Message send failed:', response?.error);
          reject(new Error(response?.error || 'Failed to send message'));
        }
      });
    });
  }
  
  setTyping(chatRoomId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket.emit('typing', { chatRoomId, isTyping });
      console.log(`✍️ Typing ${isTyping ? 'started' : 'stopped'} in chat: ${chatRoomId}`);
    } else {
      console.warn('Socket not connected - skipping typing event');
    }
  }

  updateUserPresence(isOnline: boolean, lastActive?: string): void {
    if (this.socket?.connected) {
      this.socket.emit('user_presence', {
        isOnline,
        lastActive: lastActive || new Date().toISOString()
      });
      console.log(`👤 User presence updated: ${isOnline ? 'online' : 'offline'}`);
    }
  }

  markAsRead(chatRoomId: string, messageId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('mark_read', { chatRoomId, messageId });
      console.log(`📖 Marked message as read: ${messageId} in chat: ${chatRoomId}`);
    } else {
      console.warn('Socket not connected - cannot mark as read');
    }
  }

  addReaction(messageId: string, chatRoomId: string, emoji: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('add_reaction', { messageId, chatRoomId, emoji }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  removeReaction(messageId: string, chatRoomId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('remove_reaction', { messageId, chatRoomId }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  editMessage(messageId: string, chatRoomId: string, content: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('edit_message', { messageId, chatRoomId, content }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  deleteMessage(messageId: string, chatRoomId: string, deleteForEveryone: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('delete_message', { 
        messageId, 
        chatRoomId, 
        deleteForEveryone 
      }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  // === LISTENER MANAGEMENT ===

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    const callbacks = this.listeners.get(event)!;
    
    // Avoid duplicate listeners
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
      console.log(`📞 Listener added for event: ${event}, total: ${callbacks.length}`);
    }
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
        console.log(`📞 Listener removed for event: ${event}, remaining: ${callbacks.length}`);
        
        if (callbacks.length === 0) {
          this.listeners.delete(event);
        }
      }
    }
  }

  private emitToListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    
    if (callbacks && callbacks.length > 0) {
      console.log(`📢 Emitting to ${callbacks.length} listeners for event: ${event}`);
      
      // Use setTimeout to prevent blocking
      setTimeout(() => {
        callbacks.forEach((cb, index) => {
          try {
            cb(data);
          } catch (err) {
            console.error(`Error in socket listener #${index} for event "${event}":`, err);
          }
        });
      }, 0);
    } else {
      console.log(`ℹ️ No listeners for event: ${event}`);
    }
  }

  // === UTILITY METHODS ===

  disconnect(): void {
    console.log('🔌 Disconnecting socket...');
    
    // Clear any pending timeouts
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    
    // Clear message timeouts
    this.messageTimeouts.forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.messageTimeouts.clear();
    
    // Update presence if connected
    if (this.socket?.connected) {
      this.updateUserPresence(false);
    }
    
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
      console.log('✅ Socket disconnected');
    }
    
    this.isConnected = false;
    this.connectionInProgress = false;
  }

  cleanup(): void {
    console.log('🧹 Cleaning up socket manager...');
    
    this.disconnect();
    this.listeners.clear();
    this.joinedRooms.clear();
    this.pendingMessages = [];
    this.isRefreshingToken = false;
    this.reconnectAttempts = 0;
    
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    
    console.log('✅ Socket manager cleaned up');
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  getConnectionStatus(): {
    connected: boolean;
    socketId: string | null;
    joinedRooms: Set<string>;
    pendingMessages: number;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      socketId: this.getSocketId(),
      joinedRooms: this.joinedRooms,
      pendingMessages: this.pendingMessages.length,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  // === DEBUG METHODS ===
  
  debugLogStatus(): void {
    console.log('=== SOCKET DEBUG INFO ===');
    console.log('Connected:', this.isConnected);
    console.log('Socket ID:', this.getSocketId());
    console.log('Joined Rooms:', Array.from(this.joinedRooms));
    console.log('Pending Messages:', this.pendingMessages.length);
    console.log('Listeners:', 
      Array.from(this.listeners.entries()).map(([event, cbs]) => `${event}: ${cbs.length}`)
    );
    console.log('Reconnect Attempts:', this.reconnectAttempts);
    console.log('=========================');
  }
}



// Create singleton instance
export const socketManager = new SocketManager();

// Optional: Export for debugging
if (typeof window !== 'undefined') {
  // @ts-ignore - For debugging in browser
  window.socketManager = socketManager;
}