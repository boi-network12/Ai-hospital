// src/context/AIContext.tsx - CORRECTED VERSION
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { apiFetch } from '@/Utils/api';
import { useToast } from '@/Hooks/useToast.d';

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'general' | 'drug_prescription' | 'doctor_recommendation' | 'first_aid' | 'health_tracking';
  timestamp: Date;
  confidence?: number;
  recommendations?: any[];
  followUpQuestions?: string[];
  disclaimer?: string;
  // For compatibility with old code
  text?: string;
  sender?: 'user' | 'ai';
}

export interface AIState {
  messages: AIMessage[];
  loading: boolean;
  isProcessing: boolean;
  conversationId: string;
  history: any[];
}

interface AIContextType {
  ai: AIState;
  sendMessage: (content: string) => Promise<void>;
  clearConversation: () => Promise<void>;
  getHealthSummary: () => Promise<any>;
  emergencyTriage: (symptoms: string[], severity?: string) => Promise<any>;
  isEmergency: (symptoms: string[]) => boolean;
  loading: boolean;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
};

export const AIProvider = ({ children }: { children: ReactNode }) => {
  const { showAlert } = useToast();
  
  const [state, setState] = useState<AIState>({
    messages: [],
    loading: false,
    isProcessing: false,
    conversationId: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    history: []
  });

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || state.isProcessing) return;

    try {
      setState(prev => ({
        ...prev,
        isProcessing: true
      }));

      // Add user message
      const userMessage: AIMessage = {
        id: `msg-${Date.now()}-user`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date()
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage]
      }));

      // Send to AI API - FIXED: Ensure proper request body format
      const response = await apiFetch('/ai/query', {
        method: 'POST',
        body: JSON.stringify({
          query: content.trim(),
          conversationId: state.conversationId,
          timestamp: new Date().toISOString()
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      });

      // Check if response is valid
      if (!response) {
        throw new Error('No response from server');
      }

      if (response.success && response.data) {
        const aiMessage: AIMessage = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: response.data.text || response.data.content || response.data.message || 'I apologize, I could not process your request.',
          type: response.data.type || 'general',
          timestamp: new Date(),
          confidence: response.data.confidence,
          recommendations: response.data.recommendations,
          followUpQuestions: response.data.followUpQuestions,
          disclaimer: response.data.disclaimer
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, aiMessage],
          history: [...prev.history, { user: content, ai: response.data }]
        }));

        // Check for emergency
        if (response.data.type === 'first_aid' && response.data.confidence > 0.9) {
          showAlert({
            message: 'URGENT: This may be a medical emergency. Please seek immediate professional help.',
            type: 'error',
            duration: 10000
          });
        }
      } else {
        // Handle API error response
        const errorMessage = response.message || 'Failed to get AI response';
        
        const errorAIMessage: AIMessage = {
          id: `msg-${Date.now()}-error`,
          role: 'assistant',
          content: `I apologize, but I encountered an error: ${errorMessage}. Please try again or consult a healthcare professional for urgent matters.`,
          type: 'general',
          timestamp: new Date()
        };

        setState(prev => ({
          ...prev,
          messages: [...prev.messages, errorAIMessage]
        }));

        throw new Error(errorMessage);
      }

    } catch (error: any) {
      console.error('AI Send Error Details:', error);
      
      // Create a fallback error message
      const errorMessage: AIMessage = {
        id: `msg-${Date.now()}-fallback`,
        role: 'assistant',
        content: "I apologize, but I'm having trouble processing your request. This could be due to network issues or server problems. Please try again in a moment.",
        timestamp: new Date(),
        type: 'general',
        disclaimer: 'AI service temporarily unavailable'
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage]
      }));

      showAlert({
        message: 'Failed to get AI response. Please check your connection.',
        type: 'error'
      });

    } finally {
      setState(prev => ({
        ...prev,
        isProcessing: false
      }));
    }
  }, [state.conversationId, state.isProcessing, showAlert]);

  // Other functions remain the same...
  const clearConversation = useCallback(async () => {
    try {
      await apiFetch('/ai/history', {
        method: 'DELETE'
      });

      setState(prev => ({
        ...prev,
        messages: [],
        conversationId: `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      }));

      showAlert({
        message: 'Conversation cleared',
        type: 'success'
      });

    } catch (error: any) {
      console.error('Clear Conversation Error:', error);
      showAlert({
        message: 'Failed to clear conversation',
        type: 'error'
      });
    }
  }, [showAlert]);

  const getHealthSummary = useCallback(async () => {
    try {
      const response = await apiFetch('/ai/health-summary');
      return response.data;
    } catch (error: any) {
      console.error('Health Summary Error:', error);
      showAlert({
        message: 'Failed to get health summary',
        type: 'error'
      });
      return null;
    }
  }, [showAlert]);

  const emergencyTriage = useCallback(async (symptoms: string[], severity = 'moderate') => {
    try {
      const response = await apiFetch('/ai/emergency-triage', {
        method: 'POST',
        body: JSON.stringify({ symptoms, severity })
      });

      if (response.success) {
        if (response.data.isEmergency) {
          showAlert({
            message: 'MEDICAL EMERGENCY DETECTED: ' + response.data.immediateAction,
            type: 'error',
            duration: 15000
          });
        }
        return response.data;
      }
      return null;
    } catch (error: any) {
      console.error('Emergency Triage Error:', error);
      showAlert({
        message: 'Emergency assessment failed',
        type: 'error'
      });
      return null;
    }
  }, [showAlert]);

  const isEmergency = useCallback((symptoms: string[]): boolean => {
    const emergencyKeywords = [
      'chest pain', 'heart attack', 'stroke', 'difficulty breathing', 'choking',
      'severe bleeding', 'unconscious', 'poison', 'suicide', 'anaphylaxis',
      'paralysis', 'severe burn', 'broken bone visible', 'head injury with loss of consciousness'
    ];

    return symptoms.some(symptom =>
      emergencyKeywords.some(keyword =>
        symptom.toLowerCase().includes(keyword.toLowerCase())
      )
    );
  }, []);

  return (
    <AIContext.Provider
      value={{
        ai: state,
        sendMessage,
        clearConversation,
        getHealthSummary,
        emergencyTriage,
        isEmergency,
        loading: state.loading || state.isProcessing
      }}
    >
      {children}
    </AIContext.Provider>
  );
};