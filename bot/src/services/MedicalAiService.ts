import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { config } from '../config/env';
import { SafetyGuardrail } from './SafetyGuardrail';
import { DatabaseService } from './DatabaseService';
import { MedicalContextBuilder } from './MedicalContextBuilder';
import { DrugInteractionChecker } from './DrugInteractionChecker';
import { LocationBasedMedicalInfo } from './LocationBasedMedicalInfo';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

interface MedicalQuery {
  query: string;
  userId: string;
  context?: {
    symptoms?: string[];
    duration?: string;
    severity?: 'mild' | 'moderate' | 'severe';
    previousConditions?: string[];
  };
}

interface MedicalResponse {
  response: string;
  type: 'general_info' | 'symptom_analysis' | 'drug_info' | 'emergency' | 'referral';
  confidence: number;
  safetyWarnings: string[];
  recommendations: string[];
  disclaimer: string;
  metadata: {
    queryId: string;
    processedAt: string;
    responseTime: number;
    modelUsed: string;
  };
}

interface UserMedicalProfile {
  conditions: string[];
  allergies: string[];
  medications: string[];
  bloodGroup: string;
  genotype: string;
  age: number;
  gender: string;
  location: {
    country: string;
    city?: string;
  };
}

export class MedicalAIService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private safetyGuardrail: SafetyGuardrail;
  private databaseService: DatabaseService;
  private contextBuilder: MedicalContextBuilder;
  private drugChecker: DrugInteractionChecker;
  private locationInfo: LocationBasedMedicalInfo;
  private isInitialized: boolean = false;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.gemini.apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: config.gemini.model,
      generationConfig: {
        temperature: config.gemini.temperature,
        maxOutputTokens: config.gemini.maxOutputTokens,
      }
    });
    
    this.safetyGuardrail = new SafetyGuardrail();
    this.databaseService = new DatabaseService();
    this.contextBuilder = new MedicalContextBuilder();
    this.drugChecker = new DrugInteractionChecker();
    this.locationInfo = new LocationBasedMedicalInfo();
  }

  async initialize(): Promise<void> {
    try {
      // Load safety guidelines
      await this.safetyGuardrail.initialize();
      
      // Load location-based medical data
      await this.locationInfo.initialize();
      
      // Load drug database
      await this.drugChecker.initialize();
      
      this.isInitialized = true;
      logger.info('Medical AI Service initialized');
    } catch (error) {
      logger.error('Failed to initialize Medical AI Service:', error);
      throw error;
    }
  }

  async processMedicalQuery(
    query: string, 
    user: any, 
    context?: any
  ): Promise<MedicalResponse> {
    const startTime = Date.now();
    const queryId = uuidv4();

    try {
      if (!this.isInitialized) {
        throw new Error('Medical AI Service not initialized');
      }

      logger.info(`Processing medical query: ${queryId}`, { userId: user._id });

      // 1. Check for emergencies
      const emergencyCheck = this.safetyGuardrail.checkForEmergency(query);
      if (emergencyCheck.isEmergency) {
        return this.generateEmergencyResponse(emergencyCheck, queryId, startTime);
      }

      // 2. Get user's medical profile
      const medicalProfile = await this.getUserMedicalProfile(user._id);

      // 3. Build context-aware prompt
      const contextPrompt = await this.contextBuilder.buildPrompt(
        query,
        medicalProfile,
        context
      );

      // 4. Apply safety guardrails
      const safetyCheck = await this.safetyGuardrail.validateQuery(query, medicalProfile);
      if (!safetyCheck.isSafe) {
        return this.generateSafetyBlockedResponse(safetyCheck, queryId, startTime);
      }

      // 5. Get location-specific medical context
      const locationContext = await this.locationInfo.getMedicalContext(
        medicalProfile.location.country,
        medicalProfile.location.city
      );

      // 6. Generate AI response
      const aiResponse = await this.generateMedicalResponse(
        contextPrompt,
        locationContext,
        medicalProfile
      );

      // 7. Check for drug interactions if medications mentioned
      const drugWarnings = await this.drugChecker.checkInteractions(
        aiResponse.response,
        medicalProfile.medications
      );

      // 8. Build final response
      const response: MedicalResponse = {
        response: this.formatMedicalResponse(aiResponse.response, drugWarnings),
        type: this.classifyResponseType(query),
        confidence: this.calculateConfidence(aiResponse),
        safetyWarnings: [...safetyCheck.warnings, ...drugWarnings],
        recommendations: this.generateRecommendations(aiResponse, medicalProfile),
        disclaimer: this.generateDisclaimer(medicalProfile),
        metadata: {
          queryId,
          processedAt: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          modelUsed: config.gemini.model
        }
      };

      logger.info(`Medical query processed successfully: ${queryId}`, {
        responseTime: response.metadata.responseTime,
        type: response.type
      });

      return response;

    } catch (error: any) {
      logger.error(`Error processing medical query ${queryId}:`, error);
      
      return {
        response: this.generateErrorResponse(error),
        type: 'general_info',
        confidence: 0,
        safetyWarnings: ['System error occurred'],
        recommendations: ['Please try again or contact support'],
        disclaimer: 'This response was generated due to a system error. Please verify with a healthcare professional.',
        metadata: {
          queryId,
          processedAt: new Date().toISOString(),
          responseTime: Date.now() - startTime,
          modelUsed: 'error'
        }
      };
    }
  }

  private async generateMedicalResponse(
    prompt: string,
    locationContext: any,
    medicalProfile: UserMedicalProfile
  ): Promise<any> {
    try {
      const fullPrompt = `
        You are a specialized medical AI assistant. Your responses MUST:
        1. Be medically accurate and evidence-based
        2. Consider the user's medical profile: ${JSON.stringify(medicalProfile)}
        3. Consider location-specific guidelines: ${JSON.stringify(locationContext)}
        4. Never prescribe medications
        5. Always recommend consulting healthcare professionals
        6. Include relevant warnings and disclaimers
        7. Use clear, professional medical terminology

        Medical Query Context: ${prompt}

        Provide a structured response with:
        - Analysis of the query
        - Possible considerations
        - When to seek immediate medical attention
        - General recommendations
        - Location-specific advice if applicable
      `;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();

      return {
        response: text,
        safetyChecked: true,
        locationAware: true
      };
    } catch (error) {
      logger.error('Error generating medical response:', error);
      throw error;
    }
  }

  async recommendMedicalProfessional(
    user: any,
    specialization?: string,
    location?: string
  ): Promise<any[]> {
    try {
      const medicalProfile = await this.getUserMedicalProfile(user._id);
      const userLocation = location || medicalProfile.location.city;

      // Query database for healthcare professionals
      const professionals = await this.databaseService.findHealthcareProfessionals({
        specialization,
        location: userLocation,
        availability: true,
        minRating: 4.0
      });

      // Sort by relevance (rating, distance, availability)
      const sortedProfessionals = professionals
        .sort((a: any, b: any) => {
          const ratingDiff = (b.healthcareProfile?.stats?.averageRating || 0) - 
                           (a.healthcareProfile?.stats?.averageRating || 0);
          
          if (ratingDiff !== 0) return ratingDiff;
          
          return (a.healthcareProfile?.stats?.responseTime || 0) - 
                 (b.healthcareProfile?.stats?.responseTime || 0);
        })
        .slice(0, 5); // Return top 5 recommendations

      return sortedProfessionals.map((prof: any) => ({
        id: prof._id,
        name: prof.name,
        specialization: prof.profile?.specialization,
        rating: prof.healthcareProfile?.stats?.averageRating,
        totalRatings: prof.healthcareProfile?.stats?.totalRatings,
        responseTime: prof.healthcareProfile?.stats?.responseTime,
        availability: prof.healthcareProfile?.availability?.isAvailable,
        location: prof.profile?.location
      }));
    } catch (error) {
      logger.error('Error recommending medical professionals:', error);
      return [];
    }
  }

  async generateWelcomeMessage(user: any): Promise<string> {
    const medicalProfile = await this.getUserMedicalProfile(user._id);
    
    return `
Hello ${user.name}! 👋

I'm your AI Health Assistant, powered by advanced medical AI technology.

I can help you with:
• Symptom analysis and explanation
• Medication information and interactions
• General health guidance
• Healthcare professional recommendations
• Medical terminology explanations

⚠️ **Important Disclaimer:**
I am an AI assistant and cannot replace professional medical advice. 
Always consult with a qualified healthcare provider for diagnosis and treatment.

Your medical profile indicates:
• ${medicalProfile.conditions.length > 0 ? `Conditions: ${medicalProfile.conditions.join(', ')}` : 'No specific conditions recorded'}
• ${medicalProfile.allergies.length > 0 ? `Allergies: ${medicalProfile.allergies.join(', ')}` : 'No known allergies'}
• Location: ${medicalProfile.location.country}${medicalProfile.location.city ? `, ${medicalProfile.location.city}` : ''}

How can I assist you with your health concerns today?
    `.trim();
  }

  private async getUserMedicalProfile(userId: string): Promise<UserMedicalProfile> {
    try {
      const profile = await this.databaseService.getUserMedicalProfile(userId);
      
      if (!profile) {
        return {
          conditions: [],
          allergies: [],
          medications: [],
          bloodGroup: '',
          genotype: '',
          age: 0,
          gender: '',
          location: { country: 'Unknown' }
        };
      }

      return profile;
    } catch (error) {
      logger.error('Error getting medical profile:', error);
      return {
        conditions: [],
        allergies: [],
        medications: [],
        bloodGroup: '',
        genotype: '',
        age: 0,
        gender: '',
        location: { country: 'Unknown' }
      };
    }
  }

  private generateEmergencyResponse(
    emergencyCheck: any, 
    queryId: string, 
    startTime: number
  ): MedicalResponse {
    return {
      response: `
🚨 **EMERGENCY ALERT**

Your query mentions "${emergencyCheck.triggerKeywords.join(', ')}" which may indicate a medical emergency.

**IMMEDIATE ACTION REQUIRED:**

1. **Call Emergency Services Now:**
   - ${emergencyCheck.countryCode ? `Dial ${emergencyCheck.emergencyNumber} (${emergencyCheck.countryCode})` : 'Dial your local emergency number'}
   - Or go to the nearest emergency room immediately

2. **Do NOT wait:**
   - ${emergencyCheck.condition} requires immediate medical attention
   - Do not attempt to self-treat

3. **While waiting for help:**
   - Stay calm and follow dispatcher instructions
   - Have someone stay with you if possible
   - Prepare your ID and insurance information

**This is NOT a drill. Your health and safety are the top priority.**
      `.trim(),
      type: 'emergency',
      confidence: 1.0,
      safetyWarnings: [
        'EMERGENCY SITUATION DETECTED',
        'IMMEDIATE PROFESSIONAL HELP REQUIRED',
        'DO NOT DELAY SEEKING MEDICAL ATTENTION'
      ],
      recommendations: [
        'Call emergency services immediately',
        'Go to the nearest hospital emergency room',
        'Do not attempt to drive yourself'
      ],
      disclaimer: 'This is an automated emergency alert. Actual emergency protocols may vary by location.',
      metadata: {
        queryId,
        processedAt: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        modelUsed: 'emergency_alert'
      }
    };
  }

  private formatMedicalResponse(
    response: string,
    drugWarnings: string[]
  ): string {
    let formatted = response;
    
    if (drugWarnings.length > 0) {
      formatted += '\n\n⚠️ **DRUG INTERACTION WARNINGS:**\n';
      drugWarnings.forEach(warning => {
        formatted += `• ${warning}\n`;
      });
    }

    return formatted;
  }

  private classifyResponseType(query: string): MedicalResponse['type'] {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('symptom') || lowerQuery.includes('pain') || lowerQuery.includes('feel')) {
      return 'symptom_analysis';
    } else if (lowerQuery.includes('drug') || lowerQuery.includes('medication') || lowerQuery.includes('pill')) {
      return 'drug_info';
    } else if (lowerQuery.includes('doctor') || lowerQuery.includes('specialist') || lowerQuery.includes('refer')) {
      return 'referral';
    }
    
    return 'general_info';
  }

  private calculateConfidence(aiResponse: any): number {
    // Implement confidence scoring based on:
    // - Response completeness
    // - Medical terminology usage
    // - Safety checks passed
    // - Evidence citations
    
    let confidence = 0.8; // Base confidence
    
    if (aiResponse.safetyChecked) confidence += 0.1;
    if (aiResponse.locationAware) confidence += 0.05;
    
    return Math.min(confidence, 0.95); // Cap at 95%
  }

  private generateRecommendations(aiResponse: any, profile: UserMedicalProfile): string[] {
    const recommendations: string[] = [];
    
    recommendations.push('Consult with a qualified healthcare professional for personalized advice');
    
    if (profile.conditions.length > 0) {
      recommendations.push('Discuss with your regular healthcare provider who knows your medical history');
    }
    
    if (profile.medications.length > 0) {
      recommendations.push('Review all medications with a pharmacist for interactions');
    }
    
    return recommendations;
  }

  private generateDisclaimer(profile: UserMedicalProfile): string {
    return `
This information is provided for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.

Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.

Location: ${profile.location.country}${profile.location.city ? `, ${profile.location.city}` : ''}
User Conditions: ${profile.conditions.length > 0 ? profile.conditions.join(', ') : 'None specified'}
User Allergies: ${profile.allergies.length > 0 ? profile.allergies.join(', ') : 'None specified'}
    `.trim();
  }

  private generateErrorResponse(error: Error): string {
    return `
I apologize, but I encountered an error while processing your medical query.

**Error Details:**
${error.message}

**What you can do:**
1. Try rephrasing your question
2. Contact our support team
3. Consult directly with a healthcare professional

⚠️ **Important:** For urgent medical concerns, please contact emergency services or visit the nearest healthcare facility immediately.
    `.trim();
  }

  private generateSafetyBlockedResponse(
    safetyCheck: any,
    queryId: string,
    startTime: number
  ): MedicalResponse {
    return {
      response: `
⚠️ **QUERY BLOCKED FOR SAFETY REASONS**

I cannot provide information on this topic due to safety restrictions.

**Reason:** ${safetyCheck.reason}

**Alternative Actions:**
1. Consult with a licensed healthcare professional
2. Contact emergency services if this is urgent
3. Speak with a pharmacist for medication questions

**Remember:** Your safety is our top priority.
      `.trim(),
      type: 'general_info',
      confidence: 0,
      safetyWarnings: safetyCheck.warnings,
      recommendations: [
        'Consult a licensed healthcare professional',
        'Do not self-diagnose or self-treat'
      ],
      disclaimer: 'This response was blocked by safety protocols to prevent potential harm.',
      metadata: {
        queryId,
        processedAt: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        modelUsed: 'safety_filter'
      }
    };
  }
}