// src/controllers/AIController.ts
import { Request, Response } from 'express';
import { AuthRequest } from '../middlewares/authMiddleware';
import { aiService, AIResponse } from '../services/AIService';
import { validationResult } from 'express-validator';

export class AIController {
  // Process medical query
  async processQuery(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { query, conversationId, location } = req.body;
      
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ 
          message: 'Medical query is required' 
        });
      }

      // Rate limiting check (optional)
      // Implement rate limiting based on your needs

      const response = await aiService.processMedicalQuery(
        req.user._id.toString(),
        query,
        {
          location,
          conversationId,
          userHealthData: req.user.profile // Pass user health data
        }
      );

      res.json({
        success: true,
        data: response,
        message: 'AI response generated successfully'
      });

    } catch (error: any) {
      console.error('AI Controller Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process medical query',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // Get conversation history
  async getConversationHistory(req: AuthRequest, res: Response) {
    try {
      // Get limit parameter with proper type checking
      let limitValue = 50; // default
      const limitParam = req.query.limit;
      
      if (limitParam) {
        if (typeof limitParam === 'string') {
          const parsed = parseInt(limitParam, 10);
          if (!isNaN(parsed) && parsed > 0) {
            limitValue = parsed;
          }
        } else if (Array.isArray(limitParam) && typeof limitParam[0] === 'string') {
          const parsed = parseInt(limitParam[0], 10);
          if (!isNaN(parsed) && parsed > 0) {
            limitValue = parsed;
          }
        }
      }

      const history = aiService.getConversationHistory(req.user._id.toString());
      
      const limitedHistory = history.slice(0, limitValue);

      res.json({
        success: true,
        data: {
          history: limitedHistory,
          total: history.length,
          limit: limitValue
        }
      });

    } catch (error: any) {
      console.error('Get Conversation History Error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch conversation history'
      });
    }
  }

  // Clear conversation history
  async clearHistory(req: AuthRequest, res: Response) {
    try {
      aiService.clearConversationHistory(req.user._id.toString());
      
      res.json({
        success: true,
        message: 'Conversation history cleared successfully'
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to clear conversation history'
      });
    }
  }

  // Get AI health summary
  async getHealthSummary(req: AuthRequest, res: Response) {
    try {
      // This would generate a summary based on conversation history
      // and stored health data
      const history = aiService.getConversationHistory(req.user._id.toString());
      
      const medicalQueries = history.filter(item => 
        item.role === 'user' && 
          item.content.toLowerCase().includes('pain') ||
          item.content.toLowerCase().includes('symptom') ||
          item.content.toLowerCase().includes('feel') ||
          item.content.toLowerCase().includes('hurt') ||
          item.content.toLowerCase().includes('ache') ||
          item.content.toLowerCase().includes('fever') ||
          item.content.toLowerCase().includes('cough')
      );

      const summary = {
        totalQueries: history.length,
        medicalQueries: medicalQueries.length,
        lastActive: history.length > 0 ? history[history.length - 1].timestamp : null,
        commonTopics: this.extractCommonTopics(history),
        recommendations: this.generateSummaryRecommendations(medicalQueries)
      };

      res.json({
        success: true,
        data: summary
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate health summary'
      });
    }
  }

  // Emergency triage endpoint
  async emergencyTriage(req: AuthRequest, res: Response) {
    try {
      const { symptoms, severity, location } = req.body;

      if (!symptoms || !Array.isArray(symptoms)) {
        return res.status(400).json({
          success: false,
          message: 'Symptoms array is required'
        });
      }

      // Check for emergency symptoms
      const emergencySymptoms = this.checkEmergencySymptoms(symptoms);
      
      let response;
      if (emergencySymptoms.isEmergency) {
        response = {
          isEmergency: true,
          immediateAction: 'CALL EMERGENCY SERVICES IMMEDIATELY',
          symptoms: emergencySymptoms.emergencySymptoms,
          instructions: 'Do not wait. Call your local emergency number now.',
          locationTips: location ? `Nearest hospital to ${location}` : 'Get to the nearest hospital'
        };
      } else {
        response = {
          isEmergency: false,
          severity: severity || 'moderate',
          recommendedAction: 'Schedule appointment with healthcare provider',
          timeline: 'Within 24-48 hours',
          selfCareTips: this.generateSelfCareTips(symptoms)
        };
      }

      res.json({
        success: true,
        data: response
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Emergency triage failed'
      });
    }
  }

  // Private helper methods
  private extractCommonTopics(history: any[]): string[] {
    const topics = new Map<string, number>();
    
    history.forEach(item => {
      if (item.role === 'user') {
        const text = item.content.toLowerCase();
        
        if (text.includes('headache')) topics.set('headache', (topics.get('headache') || 0) + 1);
        if (text.includes('fever')) topics.set('fever', (topics.get('fever') || 0) + 1);
        if (text.includes('pain')) topics.set('pain', (topics.get('pain') || 0) + 1);
        if (text.includes('stomach')) topics.set('digestive', (topics.get('digestive') || 0) + 1);
        if (text.includes('sleep')) topics.set('sleep', (topics.get('sleep') || 0) + 1);
        if (text.includes('anxiety')) topics.set('mental health', (topics.get('mental health') || 0) + 1);
      }
    });

    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);
  }

  private generateSummaryRecommendations(queries: any[]): string[] {
    const recommendations = [];
    
    if (queries.length >= 3) {
      recommendations.push('Consider keeping a health journal for tracking symptoms');
    }
    
    if (queries.some(q => q.content.toLowerCase().includes('chronic'))) {
      recommendations.push('Schedule regular check-ups with your primary care physician');
    }
    
    if (queries.some(q => q.content.toLowerCase().includes('stress'))) {
      recommendations.push('Explore stress management techniques like meditation or yoga');
    }
    
    return recommendations.length > 0 ? recommendations : [
      'Continue monitoring your health and reach out when needed'
    ];
  }

  private checkEmergencySymptoms(symptoms: string[]): { 
    isEmergency: boolean; 
    emergencySymptoms: string[] 
  } {
    const emergencyKeywords = [
      'chest pain', 'difficulty breathing', 'severe bleeding', 'unconscious',
      'sudden numbness', 'severe headache', 'poisoning', 'suicidal thoughts',
      'severe burn', 'broken bone', 'seizure', 'anaphylaxis'
    ];
    
    const emergencySymptoms = symptoms.filter(symptom =>
      emergencyKeywords.some(keyword => 
        symptom.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    return {
      isEmergency: emergencySymptoms.length > 0,
      emergencySymptoms
    };
  }

  private generateSelfCareTips(symptoms: string[]): string[] {
    const tips = [];
    
    if (symptoms.some(s => s.toLowerCase().includes('fever'))) {
      tips.push('Rest and stay hydrated');
      tips.push('Use fever-reducing medication as directed');
    }
    
    if (symptoms.some(s => s.toLowerCase().includes('pain'))) {
      tips.push('Apply cold or warm compress as appropriate');
      tips.push('Consider OTC pain relief if no contraindications');
    }
    
    if (symptoms.some(s => s.toLowerCase().includes('cough'))) {
      tips.push('Stay hydrated with warm liquids');
      tips.push('Use cough drops or honey for throat irritation');
    }
    
    return tips.length > 0 ? tips : ['Rest and monitor symptoms'];
  }
}

export const aiController = new AIController();