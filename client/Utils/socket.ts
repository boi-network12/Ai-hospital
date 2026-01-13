import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from './api';
import { SOCKET_URL } from '@/config/api';

// ============================================
// INTERFACES
// ============================================

interface PendingMessage {
  type: string;
  data: any;
  callback?: Function;
  timestamp: number;
}

interface Listener {
  callback: Function;
  once: boolean;
}

interface ConnectionState {
  connected: boolean;
  socketId: string | null;
  joinedRooms: Set<string>;
  pendingMessages: number;
  reconnectAttempts: number;
  lastConnection: Date | null;
}

// ============================================
// SOCKET MANAGER CLASS
// ============================================

class SocketManager {
  // Core Properties
  private socket: Socket | null = null;
  private listeners: Map<string, Listener[]> = new Map();
  private joinedRooms: Set<string> = new Set();
  
  // State Management
  private isConnected: boolean = false;
  private isConnecting: boolean = false;
  private isRefreshingToken: boolean = false;
  
  // Reconnection Logic
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  
  // Message Management
  private pendingMessages: PendingMessage[] = [];
  private messageQueue: Map<string, { message: any; timestamp: number }> = new Map();
  private lastMessageTimestamps: Map<string, number> = new Map();
  
  // Timeouts & Intervals
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private presenceInterval: NodeJS.Timeout | null = null;
  private flushInterval: NodeJS.Timeout | null = null;
  
  // Constants
  private readonly MESSAGE_DEBOUNCE_MS = 100;
  private readonly PRESENCE_UPDATE_INTERVAL = 30000; // 30 seconds
  private readonly QUEUE_FLUSH_INTERVAL = 5000; // 5 seconds
  private readonly MAX_PENDING_MESSAGES = 50;

  // ============================================
  // PUBLIC PROPERTIES
  // ============================================

  get socketId(): string | null {
    return this.socket?.id || null;
  }

  get connected(): boolean {
    return this.isConnected && !!this.socket?.connected;
  }

  get status(): ConnectionState {
    return {
      connected: this.isConnected,
      socketId: this.socketId,
      joinedRooms: this.joinedRooms,
      pendingMessages: this.pendingMessages.length,
      reconnectAttempts: this.reconnectAttempts,
      lastConnection: this.socket ? new Date() : null
    };
  }

  // ============================================
  // CORE CONNECTION MANAGEMENT
  // ============================================

  async connect(): Promise<void> {
    if (this.isConnecting || this.connected) {
      console.log(this.isConnecting ? 'Connection in progress...' : 'Already connected');
      return;
    }

    this.isConnecting = true;
    
    try {
      const token = await this.getValidToken();
      await this.createSocketConnection(token);
      await this.waitForConnection();
      
      console.log('✅ Socket connected successfully');
      this.startMaintenanceTasks();
      
    } catch (error: any) {
      console.error('❌ Failed to connect:', error.message);
      await this.handleConnectError(error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  private async createSocketConnection(token: string): Promise<void> {
    this.disconnect(); // Clean up any existing connection

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 5000,
      auth: { token },
      timeout: 15000,
      forceNew: true,
      withCredentials: true,
      query: {
        platform: 'mobile',
        version: '1.0.0',
        timestamp: Date.now().toString()
      }
    });

    this.setupEventListeners();
  }

  private async waitForConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 15000);

      const onConnect = () => {
        clearTimeout(timeout);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        resolve();
      };

      const onError = (error: any) => {
        clearTimeout(timeout);
        reject(error);
      };

      this.socket.once('connect', onConnect);
      this.socket.once('connect_error', onError);
    });
  }

  // ============================================
  // EVENT LISTENERS SETUP
  // ============================================

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection Events
    this.socket.on('connect', this.handleConnect.bind(this));
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('connect_error', this.handleConnectError.bind(this));

    // Chat Events
    const chatEvents = [
      'receive_message',
      'message_sent',
      'message_delivered',
      'message_read',
      'message_edited',
      'message_deleted',
      'user_typing',
      'user_online_status',
      'user_presence_update',
      'user_joined_chat',
      'user_left_chat',
      'reaction_added',
      'reaction_removed',
      'chat_updated',
      'chat_seen',
      'message_error',
      'error'
    ];

    chatEvents.forEach(event => {
      this.socket!.on(event, (data: any) => {
        this.emitToListeners(event, data);
      });
    });

    // Auth Events
    this.socket.on('auth_error', this.handleAuthError.bind(this));
    this.socket.on('unauthorized', this.handleAuthError.bind(this));
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  private handleConnect(): void {
    console.log('✅✅✅ Socket connected:', this.socketId);
    
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    // Update presence
    this.updateUserPresence(true);

    // Request online status of users in joined rooms
    this.requestOnlineStatus();
    
    // Rejoin rooms
    this.rejoinRooms();
    
    // Flush pending messages
    this.flushPendingMessages();
    
    // Emit connection event to listeners
    this.emitToListeners('connect', { socketId: this.socketId });
  }

  private requestOnlineStatus(): void {
    if (this.connected && this.joinedRooms.size > 0) {
      this.socket?.emit('get_online_status', {
        rooms: Array.from(this.joinedRooms)
      });
    }
  }

  private handleDisconnect(reason: string): void {
    console.log('❌ Socket disconnected:', reason);
    this.isConnected = false;
    
    // Update presence
    this.updateUserPresence(false);
    
    // Emit disconnect event
    this.emitToListeners('disconnect', { reason });
    
    // Attempt reconnect for non-intentional disconnects
    if (!['io client disconnect', 'io server disconnect'].includes(reason)) {
      this.scheduleReconnect();
    }
  }

  private async handleConnectError(error: any): Promise<void> {
    console.error('🔌 Connection error:', error.message);
    
    // Check for auth errors
    const isAuthError = /auth|jwt|token|invalid|expired|unauthorized/i.test(error.message);
    
    if (isAuthError) {
      await this.handleAuthErrorAndRefresh();
    } else {
      this.emitToListeners('connect_error', error);
      this.scheduleReconnect();
    }
  }

  private async handleAuthError(error: any): Promise<void> {
    console.error('🔐 Auth error:', error);
    this.emitToListeners('auth_error', error);
    await this.handleAuthErrorAndRefresh();
  }

  // ============================================
  // AUTH & TOKEN MANAGEMENT
  // ============================================

  private async getValidToken(): Promise<string> {
    let token = await SecureStore.getItemAsync('accessToken');
    
    if (!token) {
      throw new Error('No access token available');
    }

    // Check token expiry (optional)
    try {
      const decoded: any = JSON.parse(atob(token.split('.')[1]));
      const expiry = decoded.exp * 1000;
      
      if (Date.now() >= expiry - 60000) { // Refresh if expires in 1 minute
        token = await this.refreshAccessToken();
      }
    } catch (error) {
      console.warn('Token validation failed, using as-is:', error);
    }

    return token;
  }

  private async refreshAccessToken(): Promise<string> {
    if (this.isRefreshingToken) {
      throw new Error('Token refresh already in progress');
    }

    this.isRefreshingToken = true;
    
    try {
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await apiFetch('/auth/refresh', {
        method: 'POST',
        body: { refreshToken }
      });

      if (response.accessToken) {
        await SecureStore.setItemAsync('accessToken', response.accessToken);
        console.log('✅ Token refreshed');
        return response.accessToken;
      }

      throw new Error('Invalid refresh response');
      
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error.message);
      
      // Clear tokens on failure
      await SecureStore.deleteItemAsync('accessToken');
      await SecureStore.deleteItemAsync('refreshToken');
      
      throw error;
    } finally {
      this.isRefreshingToken = false;
    }
  }

  private async handleAuthErrorAndRefresh(): Promise<void> {
    try {
      await this.refreshAccessToken();
      
      // Reconnect with new token
      setTimeout(() => {
        this.connect().catch(console.error);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Auth recovery failed');
      this.emitToListeners('auth_failed', { error });
    }
  }

  // ============================================
  // RECONNECTION LOGIC
  // ============================================

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      this.emitToListeners('reconnect_failed', { attempts: this.reconnectAttempts });
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts), 30000);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        console.error('Reconnect failed:', error);
      }
    }, delay);
  }

  // ============================================
  // ROOM MANAGEMENT
  // ============================================

  private rejoinRooms(): void {
    if (!this.connected || this.joinedRooms.size === 0) return;
    
    console.log(`🔄 Rejoining ${this.joinedRooms.size} rooms...`);
    this.joinedRooms.forEach(roomId => {
      this.socket?.emit('join_chat', roomId);
    });
  }

  async joinChat(chatRoomId: string): Promise<void> {
    this.joinedRooms.add(chatRoomId);
    
    if (!this.connected) {
      console.log('📝 Queuing room join for when connected');
      return;
    }

    return new Promise((resolve, reject) => {
      if (!this.socket) {
        reject(new Error('Socket not initialized'));
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Join chat timeout'));
      }, 10000);

      this.socket.emit('join_chat', chatRoomId, (response: any) => {
        clearTimeout(timeout);
        
        if (response?.success) {
          console.log(`✅ Joined chat: ${chatRoomId}`);
          resolve();
        } else {
          this.joinedRooms.delete(chatRoomId);
          reject(new Error(response?.error || 'Failed to join chat'));
        }
      });
    });
  }

  leaveChat(chatRoomId: string): void {
    this.joinedRooms.delete(chatRoomId);
    
    if (this.connected) {
      this.socket?.emit('leave_chat', chatRoomId);
    }
    
    console.log(`📤 Left chat: ${chatRoomId}`);
  }

  // ============================================
  // MESSAGE MANAGEMENT
  // ============================================

  private flushPendingMessages(): void {
    if (!this.connected || this.pendingMessages.length === 0) return;
    
    console.log(`📤 Flushing ${this.pendingMessages.length} pending messages...`);
    
    // Process messages in order
    const messagesToSend = [...this.pendingMessages];
    this.pendingMessages = [];
    
    messagesToSend.forEach(({ type, data, callback }) => {
      try {
        if (callback) {
          this.socket?.emit(type, data, callback);
        } else {
          this.socket?.emit(type, data);
        }
      } catch (error) {
        console.error(`Error sending pending ${type}:`, error);
      }
    });
  }

  sendMessage(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        // Queue message for later
        this.queueMessage('send_message', data, resolve, reject);
        return;
      }

      const timeout = setTimeout(() => {
        reject(new Error('Message send timeout'));
      }, 10000);

      console.log(`📤 Sending message to chat: ${data.chatRoomId}`);
      
      this.socket?.emit('send_message', data, (response: any) => {
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

  private queueMessage(type: string, data: any, resolve: Function, reject: Function): void {
    if (this.pendingMessages.length >= this.MAX_PENDING_MESSAGES) {
      reject(new Error('Message queue full'));
      return;
    }

    this.pendingMessages.push({
      type,
      data,
      callback: (response: any) => {
        if (response?.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Queue send failed'));
        }
      },
      timestamp: Date.now()
    });

    console.log(`📥 Queued ${type} (${this.pendingMessages.length} pending)`);
  }

  // ============================================
  // PRESENCE & TYPING
  // ============================================

  updateUserPresence(isOnline: boolean, lastActive?: string): void {
    if (this.connected) {
      this.socket?.emit('user_presence', {
        isOnline,
        lastActive: lastActive || new Date().toISOString()
      });
    }
  }

  setTyping(chatRoomId: string, isTyping: boolean): void {
    if (!this.connected) return;
    
    // Debounce typing events
    const key = `typing_${chatRoomId}`;
    const now = Date.now();
    const lastTime = this.lastMessageTimestamps.get(key) || 0;
    
    if (now - lastTime < this.MESSAGE_DEBOUNCE_MS) {
      return;
    }
    
    this.lastMessageTimestamps.set(key, now);
    this.socket?.emit('typing', { chatRoomId, isTyping });
  }

  markAsRead(chatRoomId: string, messageId: string): void {
    if (this.connected) {
      this.socket?.emit('mark_read', { chatRoomId, messageId });
    }
  }

  // ============================================
  // MESSAGE ACTIONS
  // ============================================

  addReaction(messageId: string, chatRoomId: string, emoji: string): Promise<void> {
    return this.emitWithCallback('add_reaction', { messageId, chatRoomId, emoji });
  }

  removeReaction(messageId: string, chatRoomId: string): Promise<void> {
    return this.emitWithCallback('remove_reaction', { messageId, chatRoomId });
  }

  editMessage(messageId: string, chatRoomId: string, content: string): Promise<void> {
    return this.emitWithCallback('edit_message', { messageId, chatRoomId, content });
  }

  deleteMessage(messageId: string, chatRoomId: string, deleteForEveryone: boolean = false): Promise<void> {
    return this.emitWithCallback('delete_message', { 
      messageId, 
      chatRoomId, 
      deleteForEveryone 
    });
  }

  private emitWithCallback(event: string, data: any): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket?.emit(event, data, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  // ============================================
  // LISTENER MANAGEMENT
  // ============================================

  on(event: string, callback: Function, once: boolean = false): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }

    const listeners = this.listeners.get(event)!;
    
    // Check for duplicates
    const exists = listeners.some(l => l.callback === callback && l.once === once);
    if (!exists) {
      listeners.push({ callback, once });
    }
  }

  once(event: string, callback: Function): void {
    this.on(event, callback, true);
  }

  off(event: string, callback: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.findIndex(l => l.callback === callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emitToListeners(event: string, data: any): void {
    const listeners = this.listeners.get(event);
    
    if (listeners && listeners.length > 0) {
      // Filter out 'once' listeners after execution
      const remainingListeners: Listener[] = [];
      
      listeners.forEach(listener => {
        try {
          listener.callback(data);
          if (!listener.once) {
            remainingListeners.push(listener);
          }
        } catch (error) {
          console.error(`Error in listener for "${event}":`, error);
          if (!listener.once) {
            remainingListeners.push(listener);
          }
        }
      });
      
      this.listeners.set(event, remainingListeners);
    }
  }

  // ============================================
  // MAINTENANCE & CLEANUP
  // ============================================

  private startHeartbeat(): void {
    // Send heartbeat every 30 seconds to keep presence updated
    setInterval(() => {
      if (this.connected) {
        this.socket?.emit('heartbeat', {
          timestamp: Date.now()
        });
      }
    }, 30000);
  }

  private startMaintenanceTasks(): void {
    this.startHeartbeat()
    
    // Regular presence updates
    this.presenceInterval = setInterval(() => {
      if (this.connected) {
        this.updateUserPresence(true);
      }
    }, this.PRESENCE_UPDATE_INTERVAL);

    // Queue cleanup
    this.flushInterval = setInterval(() => {
      this.cleanupOldMessages();
    }, this.QUEUE_FLUSH_INTERVAL);
  }

  private cleanupOldMessages(): void {
    const now = Date.now();
    const cutoff = now - 300000; // 5 minutes
    
    this.pendingMessages = this.pendingMessages.filter(msg => msg.timestamp > cutoff);
    
    // Cleanup old timestamps
    this.lastMessageTimestamps.forEach((timestamp, key) => {
      if (now - timestamp > 60000) { // 1 minute
        this.lastMessageTimestamps.delete(key);
      }
    });
  }

  disconnect(): void {
    console.log('🔌 Disconnecting socket...');
    
    // Clear intervals
    if (this.presenceInterval) clearInterval(this.presenceInterval);
    if (this.flushInterval) clearInterval(this.flushInterval);
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    
    // Update presence
    this.updateUserPresence(false);
    
    // Disconnect socket
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
    }
    
    // Reset state
    this.isConnected = false;
    this.isConnecting = false;
    this.joinedRooms.clear();
    
    console.log('✅ Socket disconnected');
  }

  cleanup(): void {
    console.log('🧹 Cleaning up socket manager...');
    
    this.disconnect();
    this.listeners.clear();
    this.pendingMessages = [];
    this.messageQueue.clear();
    this.lastMessageTimestamps.clear();
    
    console.log('✅ Socket manager cleaned up');
  }

  // ============================================
  // DEBUG & UTILITIES
  // ============================================

  debug(): void {
    console.log('=== SOCKET DEBUG INFO ===');
    console.log('Connected:', this.connected);
    console.log('Socket ID:', this.socketId);
    console.log('Joined Rooms:', Array.from(this.joinedRooms));
    console.log('Pending Messages:', this.pendingMessages.length);
    console.log('Listeners:', 
      Array.from(this.listeners.entries()).map(([event, listeners]) => 
        `${event}: ${listeners.length}`
      )
    );
    console.log('Reconnect Attempts:', this.reconnectAttempts);
    console.log('=========================');
  }

  ping(): Promise<number> {
    return new Promise((resolve) => {
      if (!this.connected) {
        resolve(-1);
        return;
      }

      const start = Date.now();
      this.socket?.emit('ping', {}, () => {
        resolve(Date.now() - start);
      });
    });
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const socketManager = new SocketManager();

// Optional: Global access for debugging
if (typeof window !== 'undefined') {
  (window as any).socketManager = socketManager;
}