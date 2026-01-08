// src/services/cacheService.ts
import { createClient } from 'redis';
import { ChatMessage, ChatRoom } from '../types/chat';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class CacheService {
  private client;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: REDIS_URL
    });

    this.client.on('error', (err) => {
      console.error('Redis Client Error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      console.log('✅ Redis connected');
      this.isConnected = true;
    });

    // Connect but don't block startup
    this.connect();
  }

  private async connect() {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  // Cache chat messages
  async cacheMessages(chatRoomId: string, messages: ChatMessage[]): Promise<void> {
    await this.connect();
    const key = `chat:${chatRoomId}:messages`;
    
    // Cache for 5 minutes
    await this.client.setEx(
      key,
      300, // 5 minutes in seconds
      JSON.stringify(messages)
    );
  }

  // Get cached messages
  async getCachedMessages(chatRoomId: string): Promise<ChatMessage[] | null> {
    await this.connect();
    const key = `chat:${chatRoomId}:messages`;
    const cached = await this.client.get(key);
    
    return cached ? JSON.parse(cached) : null;
  }

  // Cache chat room info
  async cacheChatRoom(chatRoomId: string, chatRoom: ChatRoom): Promise<void> {
    await this.connect();
    const key = `chat:room:${chatRoomId}`;
    
    await this.client.setEx(
      key,
      600, // 10 minutes
      JSON.stringify(chatRoom)
    );
  }

  // Get cached chat room
  async getCachedChatRoom(chatRoomId: string): Promise<ChatRoom | null> {
    await this.connect();
    const key = `chat:room:${chatRoomId}`;
    const cached = await this.client.get(key);
    
    return cached ? JSON.parse(cached) : null;
  }

  // Cache user's chat list
  async cacheUserChats(userId: string, chats: ChatRoom[]): Promise<void> {
    await this.connect();
    const key = `user:${userId}:chats`;
    
    await this.client.setEx(
      key,
      300, // 5 minutes
      JSON.stringify(chats)
    );
  }

  // Get cached user chats
  async getCachedUserChats(userId: string): Promise<ChatRoom[] | null> {
    await this.connect();
    const key = `user:${userId}:chats`;
    const cached = await this.client.get(key);
    
    return cached ? JSON.parse(cached) : null;
  }

  // Invalidate cache when new messages arrive
  async invalidateChatCache(chatRoomId: string): Promise<void> {
    await this.connect();
    const keys = [
      `chat:${chatRoomId}:messages`,
      `user:*:chats` // Invalidate all user chat lists
    ];
    
    for (const key of keys) {
      // Delete pattern - be careful with this in production
      // For now, we'll use a simpler approach
      if (key.includes('*')) {
        // You might need SCAN command for pattern deletion
        // For simplicity, we'll handle user cache separately
        continue;
      }
      await this.client.del(key);
    }
  }

  // Clear user's chat cache
  async clearUserChatCache(userId: string): Promise<void> {
    await this.connect();
    await this.client.del(`user:${userId}:chats`);
  }
}

export const cacheService = new CacheService();