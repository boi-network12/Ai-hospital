// src/Utils/socket.ts

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
  
  // Add flags to prevent infinite refresh loops
  private isRefreshingToken: boolean = false;
  private refreshTimeout: NodeJS.Timeout | null = null;
  private connectionInProgress: boolean = false;

  get isSocketConnected(): boolean {
    return this.isConnected;
  }

  async connect(): Promise<void> {
    // Prevent multiple simultaneous connection attempts
    if (this.connectionInProgress) {
      console.log('Connection already in progress...');
      return;
    }

    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.connectionInProgress = true;

    if (this.isRefreshingToken) {
      console.log('Waiting for token refresh to complete...');
      return;
    }


    this.connectionInProgress = true;

    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        console.error('No access token available');
        this.connectionInProgress = false;
        throw new Error('No access token available');
      }

      await this.createSocketConnection(token);
    } catch (error) {
      console.error('Failed to connect socket:', error);
      this.connectionInProgress = false;
      throw error;
    } finally {
      this.connectionInProgress = false;
    }
  }

  // Called when socket auth fails (e.g., invalid/expired token)
  async handleAuthErrorAndRefresh(): Promise<void> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshingToken) {
      console.log('Token refresh already in progress...');
      return;
    }

    console.log('Auth error detected - attempting token refresh via apiFetch interceptor...');
    this.isRefreshingToken = true;

    this.disconnect();

    try {
      // Clear any existing timeout
      if (this.refreshTimeout) {
        clearTimeout(this.refreshTimeout);
        this.refreshTimeout = null;
      }

      // Step 1: Try to refresh token by making a real API call
      // The apiFetch interceptor will handle the token refresh automatically
      console.log('Attempting to refresh token via API call...');
      
      await apiFetch('/auth/me', {
        method: 'GET',
        // Don't pass any Authorization header - let apiFetch handle it
        // It will use the stored token and refresh if needed
      });
      
      // If we reach here, token was refreshed successfully
      console.log('Token refreshed successfully via API interceptor');
      
      // Wait a moment for the new token to be securely stored
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Reconnect with the new token
      await this.connect();
      
    } catch (err: any) {
      console.log('Token refresh attempt failed:', err.message || err);
      
      // Check if this is a permanent error that requires logout
      const isPermanentError = err.message?.includes('No refresh token') || 
                               err.status === 400 ||
                               err.message?.includes('Refresh failed') ||
                               err.message?.includes('Invalid credentials');
      
      if (isPermanentError) {
        console.log('Permanent auth error - not retrying');
        this.emitToListeners('auth_error_failed', { error: err });
      } else {
        console.log('Temporary error - will retry after delay');
        // Wait longer before retrying (5 seconds for temporary errors)
        this.refreshTimeout = setTimeout(async () => {
          try {
            console.log('Attempting to reconnect after temporary error...');
            await this.connect();
          } catch (retryErr) {
            console.error('Failed to reconnect after refresh:', retryErr);
            this.emitToListeners('auth_error_failed', { error: retryErr });
          }
        }, 5000);
      }
    } finally {
      // Reset the flag after a delay to prevent rapid retries
      setTimeout(() => {
        this.isRefreshingToken = false;
      }, 2000);
    }
  }

  private async createSocketConnection(token: string): Promise<void> {
    this.disconnect(); // Clean any existing connection

    try {
      // Always get the latest token before connecting
      const latestToken = await SecureStore.getItemAsync('accessToken');
      if (!latestToken) {
        throw new Error('No access token available after refresh');
      }

      console.log('Creating socket connection with token...');
      
      this.socket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true,
        reconnection: false,
        reconnectionAttempts: 0,
        auth: {
          token: latestToken
        },
        // Add timeout for connection
        timeout: 10000,
        // Add extra options for better stability
        forceNew: true,
        multiplex: false,
        path: '/socket.io/', // Explicit path
        withCredentials: true,
      });

      this.setupEventListeners();
      
    } catch (error) {
      console.error('Failed to create socket connection:', error);
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Socket connected successfully, ID:', this.socket?.id);
      console.log('✅ Auth token used:', this.socket?.auth?.token);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emitToListeners('connect', {});
    });
    
    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      this.isConnected = false;
      this.emitToListeners('disconnect', { reason });
      
      // If disconnect was due to auth error, don't auto-reconnect
      // Let the auth error handler deal with it
      if (reason === 'io server disconnect' || 
          reason === 'io client disconnect' ||
          reason.includes('auth')) {
        console.log('Disconnect due to auth - will not auto-reconnect');
        return;
      }
      
      // For other disconnects, try to reconnect after a delay
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        
        setTimeout(async () => {
          try {
            await this.connect();
          } catch (err) {
            console.error('Reconnect attempt failed:', err);
          }
        }, 2000);
      } else {
        console.log('Max reconnection attempts reached');
        this.emitToListeners('reconnect_failed', {});
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('Socket connect_error:', error.message);

      if (
        error.message?.includes('Invalid token') ||
        error.message?.includes('Authentication error') ||
        error.message?.includes('jwt expired') ||
        error.message?.includes('unauthorized') ||
        error.message?.includes('auth')
      ) {
        console.log('Auth error detected in connect_error');
        // Don't call handleAuthErrorAndRefresh directly from here
        // Instead, emit an event that the ChatProvider can handle
        this.emitToListeners('auth_error', error);
      } else {
        // For non-auth errors, try to reconnect
        console.log('Non-auth connection error, will attempt reconnect');
        this.emitToListeners('connect_error', error);
        
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          setTimeout(async () => {
            try {
              await this.connect();
            } catch (err) {
              console.error('Reconnect after connect_error failed:', err);
            }
          }, 3000);
        }
      }
    });

    const chatEvents = [
      'receive_message',
      'message_sent',
      'message_read',
      'message_read_update',
      'message_edited',
      'message_deleted',
      'user_typing',
      'user_online',
      'user_offline',
      'reaction_added',
      'reaction_removed',
      'chat_updated',
      'error',
    ];

    chatEvents.forEach((event) => {
      this.socket!.on(event, (data: any) => {
        this.emitToListeners(event, data);
      });
    });
  }

  // === Chat Actions ===
  joinChat(chatRoomId: string): void {
    if (this.socket?.connected) {
      this.socket?.emit('join_chat', chatRoomId);
      console.log(`Joined chat room: ${chatRoomId}`);
    } else {
      console.warn('Socket not connected - cannot join chat');
    }
  }

  sendMessage(data: any): void {
    if (this.socket?.connected) {
      this.socket.emit('send_message', data);
    } else {
      console.warn('Socket not connected - cannot send message');
      throw new Error('Socket not connected');
    }
  }

  setTyping(chatRoomId: string, isTyping: boolean): void {
    if (this.socket?.connected) {
      this.socket?.emit('typing', { chatRoomId, isTyping });
    } else {
      console.warn('Socket not connected - cannot set typing status');
    }
  }

  markAsRead(chatRoomId: string, messageId: string): void {
    if (this.socket?.connected) {
      this.socket?.emit('mark_read', { chatRoomId, messageId });
    } else {
      console.warn('Socket not connected - cannot mark as read');
    }
  }

  addReaction(messageId: string, chatRoomId: string, emoji: string): void {
    if (this.socket?.connected) {
      this.socket?.emit('add_reaction', { messageId, chatRoomId, emoji });
    } else {
      console.warn('Socket not connected - cannot add reaction');
    }
  }

  removeReaction(messageId: string, chatRoomId: string): void {
    if (this.socket?.connected) {
      this.socket?.emit('remove_reaction', { messageId, chatRoomId });
    } else {
      console.warn('Socket not connected - cannot remove reaction');
    }
  }

  editMessage(messageId: string, chatRoomId: string, content: string): void {
    if (this.socket?.connected) {
      this.socket?.emit('edit_message', { messageId, chatRoomId, content });
    } else {
      console.warn('Socket not connected - cannot edit message');
    }
  }

  deleteMessage(messageId: string, chatRoomId: string, deleteForEveryone: boolean = false): void {
    if (this.socket?.connected) {
      this.socket?.emit('delete_message', { messageId, chatRoomId, deleteForEveryone });
    } else {
      console.warn('Socket not connected - cannot delete message');
    }
  }

  // === Listener Management ===
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) callbacks.splice(index, 1);
    }
  }

  private emitToListeners(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      // Use setTimeout to prevent blocking if a callback throws
      setTimeout(() => {
        callbacks.forEach((cb) => {
          try {
            cb(data);
          } catch (err) {
            console.error(`Error in socket listener for event "${event}":`, err);
          }
        });
      }, 0);
    }
  }

  // === Cleanup ===
  disconnect(): void {
    // Clear any pending refresh timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket disconnected and cleaned up');
    }
  }

  // === Utility Methods ===
  cleanup(): void {
    this.disconnect();
    this.listeners.clear();
    this.isRefreshingToken = false;
    this.connectionInProgress = false;
    this.reconnectAttempts = 0;
    
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = null;
    }
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }
}

export const socketManager = new SocketManager();