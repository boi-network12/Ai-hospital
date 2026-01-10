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
    } catch (error) {
      console.error('API Error - sendMessage:', error);
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
    } catch (error) {
      console.error('API Error - editMessage:', error);
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
    } catch (error) {
      console.error('API Error - deleteMessage:', error);
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
    } catch (error) {
      console.error('API Error - addReaction:', error);
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
    } catch (error) {
      console.error('API Error - removeReaction:', error);
      throw error;
    }
  }
}

export const apiClient = new ApiClient();