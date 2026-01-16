import axios from 'axios';
import { BASE_URL } from '../config/baseApi';

class ApiClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = `${BASE_URL}/api`;
  }
  
  async sendMessage(token: string, data: any) {
    try {
      const response = await axios.post(`${this.baseURL}/v1/chat/messages`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error - sendMessage:', error.response?.data || error.message);
      throw error;
    }
  }

  async uploadFile(token: string, formData: FormData) {
    try {
      const response = await axios.post(`${this.baseURL}/v1/upload/media`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        timeout: 60000, // 60 seconds timeout for large files
        maxContentLength: 50 * 1024 * 1024, // 50MB max
        maxBodyLength: 50 * 1024 * 1024
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error - uploadFile:', error.response?.data || error.message);
      throw error;
    }
  }

  async getMessages(token: string, chatRoomId: string, params?: any) {
    try {
      const response = await axios.get(`${this.baseURL}/v1/chat/rooms/${chatRoomId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error - getMessages:', error.response?.data || error.message);
      throw error;
    }
  }

  async markAsRead(token: string, chatRoomId: string, data: any) {
    try {
      const response = await axios.post(`${this.baseURL}/v1/chat/rooms/${chatRoomId}/read`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error - markAsRead:', error.response?.data || error.message);
      throw error;
    }
  }

  async editMessage(token: string, messageId: string, data: any) {
    try {
      const response = await axios.put(`${this.baseURL}/v1/chat/messages/${messageId}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error - editMessage:', error.response?.data || error.message);
      throw error;
    }
  }

  async deleteMessage(token: string, messageId: string, params?: any) {
    try {
      const response = await axios.delete(`${this.baseURL}/v1/chat/messages/${messageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error - deleteMessage:', error.response?.data || error.message);
      throw error;
    }
  }

  async addReaction(token: string, messageId: string, data: any) {
    try {
      const response = await axios.post(`${this.baseURL}/v1/chat/messages/${messageId}/reactions`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error - addReaction:', error.response?.data || error.message);
      throw error;
    }
  }

  async removeReaction(token: string, messageId: string) {
    try {
      const response = await axios.delete(`${this.baseURL}/v1/chat/messages/${messageId}/reactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error - removeReaction:', error.response?.data || error.message);
      throw error;
    }
  }

  async getChatParticipants(token: string, chatRoomId: string) {
    try {
      const response = await axios.get(`${this.baseURL}/v1/chat/rooms/${chatRoomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error - getChatParticipants:', error.response?.data || error.message);
      throw error;
    }
  }

  async getUser(token: string, userId: string) {
    try {
      const response = await axios.get(`${this.baseURL}/v1/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('API Error - getUser:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();