// src/services/AIService.ts
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import User from '../models/UserModel';
import mongoose from 'mongoose';

export interface AIResponse {
  text: string;
  type: 'general' | 'drug_prescription' | 'doctor_recommendation' | 'first_aid' | 'health_tracking';
  confidence: number;
  recommendations?: any[];
  followUpQuestions?: string[];
  disclaimer?: string;
  timestamp: Date;
}

export interface PrescriptionRequest {
  symptoms: string[];
  duration: string;
  severity: 'mild' | 'moderate' | 'severe';
  age: number;
  weight?: number;
  allergies?: string[];
  existingConditions?: string[];
  currentMedications?: string[];
  hasUlcer?: boolean;
  hasKidneyProblems?: boolean;
  hasLiverProblems?: boolean;
  isPregnant?: boolean;
  isBreastfeeding?: boolean;
}

export interface DoctorRecommendation {
  professionalId: mongoose.Types.ObjectId;
  name: string;
  specialization: string;
  rating: number;
  distance?: number;
  matchScore: number;
  reason: string;
}

export class AIService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private conversationHistory: Map<string, any[]> = new Map();

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        { 
            category: HarmCategory.HARM_CATEGORY_HARASSMENT, 
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE 
        },
        { 
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, 
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE 
        },
        { 
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, 
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE 
        },
        { 
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, 
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE 
        },
        ]
    });
  }

  private async getMedicalContext(): Promise<string> {
    return `You are NeuroMed AI - a professional medical assistant with 85%+ accuracy.
    
IMPORTANT GUIDELINES:
1. For serious symptoms (chest pain, difficulty breathing, severe bleeding, loss of consciousness), ALWAYS recommend immediate medical attention
2. Only suggest OTC medications for mild symptoms
3. Always ask about contraindications (ulcer, pregnancy, allergies) before recommending medications
4. Include disclaimers about consulting healthcare professionals
5. Be empathetic and clear
6. For drug prescriptions, specify dosage, frequency, duration, and precautions
7. Accuracy: 85% - acknowledge limitations
8. When recommending doctors, consider specialization, ratings, and availability
9. Track health patterns when users provide ongoing information
10. NEVER diagnose serious conditions without recommending professional consultation

FORMAT RESPONSES:
- Start with empathy
- Provide clear advice
- List recommendations
- Include follow-up questions
- Add disclaimer
- End with encouragement`;
  }

  async processMedicalQuery(
    userId: string,
    query: string,
    context?: {
      location?: { latitude: number; longitude: number };
      userHealthData?: any;
      conversationId?: string;
    }
  ): Promise<AIResponse> {
    try {
      // Get conversation history
      const conversationId = context?.conversationId || userId;
      const history = this.conversationHistory.get(conversationId) || [];
      
      // Classify query type
      const queryType = await this.classifyQuery(query);
      
      // Get user info for personalized response
      const user = await User.findById(userId).select('profile age medicalHistory');
      
      // Prepare prompt based on query type
      let response: AIResponse;
      
      switch (queryType) {
        case 'drug_prescription':
          response = await this.handlePrescriptionRequest(userId, query, user);
          break;
          
        case 'doctor_recommendation':
          response = await this.handleDoctorRecommendation(query, context?.location);
          break;
          
        case 'first_aid':
          response = await this.handleFirstAid(query);
          break;
          
        case 'health_tracking':
          response = await this.handleHealthTracking(userId, query, user?.profile);
          break;
          
        default:
          response = await this.handleGeneralMedicalQuery(query, user);
      }
      
      // Update conversation history
      history.push({
        role: 'user',
        content: query,
        timestamp: new Date()
      });
      history.push({
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
        type: response.type
      });
      
      // Keep only last 20 messages
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }
      
      this.conversationHistory.set(conversationId, history);
      
      return response;
      
    } catch (error) {
      console.error('AI Service Error:', error);
      return {
        text: "I apologize, but I'm experiencing technical difficulties. Please try again or contact a healthcare professional directly for urgent matters.",
        type: 'general',
        confidence: 0,
        timestamp: new Date()
      };
    }
  }

  private async classifyQuery(query: string): Promise<string> {
    const prompt = `Classify this medical query into one category:
    - drug_prescription: Asking about medications, prescriptions, or treatment
    - doctor_recommendation: Looking for doctors, specialists, or hospitals
    - first_aid: Emergency, injury, or immediate care needed
    - health_tracking: Monitoring symptoms, chronic conditions, or health patterns
    - general: General medical advice, information, or questions
    
    Query: "${query}"
    
    Return ONLY the category name.`;
    
    try {
      const result = await this.model.generateContent(prompt);
      const category = result.response.text().toLowerCase().trim();
      
      // Validate category
      const validCategories = ['drug_prescription', 'doctor_recommendation', 'first_aid', 'health_tracking', 'general'];
      return validCategories.includes(category) ? category : 'general';
    } catch {
      return 'general';
    }
  }

  private async handlePrescriptionRequest(
    userId: string,
    query: string,
    user: any
  ): Promise<AIResponse> {
    // Extract information from query
    const prompt = `${await this.getMedicalContext()}
    
    USER QUERY: ${query}
    
    USER CONTEXT:
    - Age: ${user?.profile?.age || 'Not specified'}
    - Known conditions: ${user?.medicalHistory?.conditions?.join(', ') || 'None provided'}
    - Allergies: ${user?.medicalHistory?.allergies?.join(', ') || 'None provided'}
    
    ADDITIONAL QUESTIONS TO ASK BEFORE PRESCRIBING:
    1. Do you have stomach ulcers or gastrointestinal problems?
    2. Are you pregnant or breastfeeding?
    3. Do you have kidney or liver problems?
    4. Are you allergic to any medications?
    5. Are you currently taking any other medications?
    
    If information is missing, ask follow-up questions.
    If sufficient information is provided, suggest appropriate OTC medications with:
    - Drug name
    - Dosage (based on age/weight)
    - Frequency
    - Duration
    - Precautions
    - When to seek immediate help
    
    CONFIDENCE: 85% - always include disclaimer.
    
    Response format:
    [EMPATHETIC GREETING]
    [ANALYSIS]
    [RECOMMENDATIONS if sufficient info, otherwise QUESTIONS]
    [DISCLAIMER]
    [ENCOURAGEMENT]`;
    
    const result = await this.model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Analyze if we need more information
    const needsMoreInfo = this.checkIfNeedsMoreInfo(responseText);
    const recommendations = this.extractRecommendations(responseText);
    
    return {
      text: responseText,
      type: 'drug_prescription',
      confidence: needsMoreInfo ? 0.7 : 0.85,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      followUpQuestions: needsMoreInfo ? this.generateFollowUpQuestions(query, user) : undefined,
      disclaimer: "This is AI-generated advice with 85% accuracy. Always consult a healthcare professional before taking any medication.",
      timestamp: new Date()
    };
  }

  private async handleDoctorRecommendation(
    query: string,
    location?: { latitude: number; longitude: number }
  ): Promise<AIResponse> {
    // Find matching doctors from database
    let doctors: DoctorRecommendation[] = [];
    
    try {
      doctors = await this.findMatchingDoctors(query, location);
    } catch (error) {
      console.error('Error finding doctors:', error);
    }
    
    // Generate AI response with doctor recommendations
    const prompt = `${await this.getMedicalContext()}
    
    USER QUERY: "${query}"
    
    AVAILABLE DOCTORS: ${doctors.length > 0 ? JSON.stringify(doctors.slice(0, 3)) : 'No specific doctors found in database'}
    
    Provide:
    1. Analysis of what type of specialist might be needed
    2. If doctors found: List top 3 recommendations with why they're good matches
    3. If no doctors found: General advice on how to find appropriate care
    4. Emergency guidance if symptoms sound urgent
    5. Questions to help refine search if needed
    
    CONFIDENCE: 85%
    
    Format with clear sections.`;
    
    const result = await this.model.generateContent(prompt);
    const responseText = result.response.text();
    
    return {
      text: responseText,
      type: 'doctor_recommendation',
      confidence: doctors.length > 0 ? 0.9 : 0.8,
      recommendations: doctors.slice(0, 3),
      disclaimer: "Doctor recommendations are based on available data and AI matching. Verify credentials and availability before booking.",
      timestamp: new Date()
    };
  }

  private async findMatchingDoctors(
    query: string,
    location?: { latitude: number; longitude: number }
  ): Promise<DoctorRecommendation[]> {
    const searchTerms = this.extractSearchTerms(query);
    
    // Build query for database
    let dbQuery: any = {
      role: { $in: ['doctor', 'nurse'] },
      'roleStatus.isActive': true,
      'roleStatus.approvedByAdmin': true,
      'healthcareProfile.availability.isAvailable': true
    };
    
    // Add specialization search
    if (searchTerms.specializations.length > 0) {
      dbQuery['profile.specialization'] = {
        $in: searchTerms.specializations.map(s => new RegExp(s, 'i'))
      };
    }
    
    // Add symptom-based search
    if (searchTerms.symptoms.length > 0) {
      dbQuery['healthcareProfile.services'] = {
        $in: searchTerms.symptoms.map(s => new RegExp(s, 'i'))
      };
    }
    
    // Execute query
    const professionals = await User.find(dbQuery)
      .select('name profile.specialization profile.department healthcareProfile.stats location')
      .limit(20);
    
    // Calculate match scores
    const recommendations: DoctorRecommendation[] = professionals.map(prof => {
      let matchScore = 0;
      let reasons: string[] = [];

    const specialization = prof.profile?.specialization || '';
    const services = prof.healthcareProfile?.services || [];
    const rating = prof.healthcareProfile?.stats?.averageRating || 0;
    const locationCoords = prof.profile?.location?.coordinates;
      
      // Specialization match
      if (specialization) {
      const specializationMatch = searchTerms.specializations.some(term =>
        specialization.toLowerCase().includes(term.toLowerCase())
      );
      if (specializationMatch) {
        matchScore += 40;
        reasons.push(`Specializes in ${specialization}`);
      }
    }
      
      // Service match
      if (services.length > 0) {
      const serviceMatches = searchTerms.symptoms.filter(symptom =>
        services.some((service: string) =>
          service.toLowerCase().includes(symptom.toLowerCase())
        )
      );
      if (serviceMatches.length > 0) {
        matchScore += 30;
        reasons.push(`Treats: ${serviceMatches.join(', ')}`);
      }
    }
      
      // Rating bonus
    if (rating > 0) {
      matchScore += rating * 5;
      reasons.push(`High rating: ${rating}/5`);
    }
    
    // Availability bonus
    if (prof.healthcareProfile?.availability?.isAvailable) {
      matchScore += 10;
      reasons.push('Currently available');
    }
      
      // Calculate distance if location provided
    let distance: number | undefined;
    if (location && locationCoords) {
      // Fix: Access coordinates properly - they're in [longitude, latitude] order
      const [longitude, latitude] = locationCoords.coordinates;
      distance = this.calculateDistance(
        location.latitude,
        location.longitude,
        latitude,
        longitude
      );
      if (distance < 50) { // Within 50km
        matchScore += 15;
        reasons.push(`Nearby: ${distance.toFixed(1)}km away`);
      }
    }
      
      return {
        professionalId: prof._id,
        name: prof.name,
        specialization: specialization || 'General Practitioner',
        rating: rating,
        distance,
        matchScore: Math.min(matchScore, 100),
        reason: reasons.join(' • ')
        };
    });
    
    // Sort by match score
    return recommendations.sort((a, b) => b.matchScore - a.matchScore);
  }

  private async handleFirstAid(query: string): Promise<AIResponse> {
    const prompt = `${await this.getMedicalContext()}
    
    FIRST AID QUERY: "${query}"
    
    Provide:
    1. Immediate steps to take
    2. What NOT to do
    3. When to call emergency services
    4. Signs to watch for
    5. Follow-up care
    
    For serious injuries/conditions, EMPHASIZE seeking immediate professional help.
    
    Format as numbered steps with clear headings.`;
    
    const result = await this.model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Check if emergency services are needed
    const isEmergency = this.detectEmergencyKeywords(query);
    
    return {
      text: responseText,
      type: 'first_aid',
      confidence: isEmergency ? 0.95 : 0.85,
      disclaimer: isEmergency 
        ? "THIS IS AN EMERGENCY. CALL LOCAL EMERGENCY SERVICES IMMEDIATELY."
        : "First aid advice only. Seek professional medical attention for proper treatment.",
      timestamp: new Date()
    };
  }

  private async handleHealthTracking(
    userId: string,
    query: string,
    userProfile: any
  ): Promise<AIResponse> {
    // Store health data for tracking
    await this.storeHealthData(userId, query);
    
    const prompt = `${await this.getMedicalContext()}
    
    HEALTH TRACKING QUERY: "${query}"
    
    USER PROFILE: ${userProfile ? JSON.stringify(userProfile) : 'No profile information'}
    
    Analyze:
    1. Patterns or trends
    2. Potential concerns
    3. Recommended monitoring
    4. When to seek help
    5. Lifestyle suggestions
    
    Provide tracking advice and ask relevant follow-up questions.`;
    
    const result = await this.model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Generate health insights
    const insights = await this.generateHealthInsights(userId);
    
    return {
      text: responseText + (insights ? `\n\nHEALTH INSIGHTS:\n${insights}` : ''),
      type: 'health_tracking',
      confidence: 0.8,
      followUpQuestions: this.generateHealthTrackingQuestions(query),
      timestamp: new Date()
    };
  }

  private async handleGeneralMedicalQuery(query: string, user: any): Promise<AIResponse> {
    const prompt = `${await this.getMedicalContext()}
    
    GENERAL MEDICAL QUERY: "${query}"
    
    USER CONTEXT: ${user ? `Age: ${user.profile?.age || 'Unknown'}, Known conditions: ${user.medicalHistory?.conditions?.join(', ') || 'None'}` : 'No user context'}
    
    Provide:
    1. Clear, accurate medical information
    2. Relevant precautions
    3. When to seek professional help
    4. Follow-up questions if needed
    5. Empathetic tone
    
    CONFIDENCE: 85% - include disclaimer.`;
    
    const result = await this.model.generateContent(prompt);
    const responseText = result.response.text();
    
    return {
      text: responseText,
      type: 'general',
      confidence: 0.85,
      disclaimer: "This is AI-generated medical information with 85% accuracy. Consult healthcare professionals for diagnosis and treatment.",
      timestamp: new Date()
    };
  }

  // Helper methods
  private checkIfNeedsMoreInfo(response: string): boolean {
    const questionPatterns = [
      /do you have/i,
      /are you/i,
      /have you/i,
      /any allergies/i,
      /taking any medications/i,
      /pregnant or breastfeeding/i,
      /ulcer/i,
      /kidney/i,
      /liver/i
    ];
    
    return questionPatterns.some(pattern => pattern.test(response));
  }

  private extractSearchTerms(query: string): { specializations: string[]; symptoms: string[] } {
    // Medical specializations dictionary
    const specializations = [
      'cardiologist', 'dermatologist', 'neurologist', 'pediatrician', 'psychiatrist',
      'orthopedic', 'gastroenterologist', 'endocrinologist', 'oncologist', 'urologist',
      'gynecologist', 'ophthalmologist', 'dentist', 'ent', 'general practitioner'
    ];
    
    // Common symptoms
    const symptoms = [
      'headache', 'fever', 'cough', 'pain', 'rash', 'nausea', 'dizziness',
      'fatigue', 'bleeding', 'swelling', 'infection', 'allergy', 'anxiety',
      'depression', 'insomnia', 'digestion', 'breathing', 'heart', 'stomach'
    ];
    
    const words = query.toLowerCase().split(/\s+/);
    
    return {
      specializations: specializations.filter(spec => 
        words.some(word => word.includes(spec) || spec.includes(word))
      ),
      symptoms: symptoms.filter(symptom => 
        words.some(word => word.includes(symptom) || symptom.includes(word))
      )
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private detectEmergencyKeywords(query: string): boolean {
    const emergencies = [
      'chest pain', 'heart attack', 'stroke', 'difficulty breathing', 'choking',
      'severe bleeding', 'unconscious', 'poison', 'burn', 'fracture', 'seizure',
      'suicide', 'allergic reaction', 'anaphylaxis', 'head injury', 'paralysis'
    ];
    
    return emergencies.some(emergency => 
      query.toLowerCase().includes(emergency.toLowerCase())
    );
  }

  private extractRecommendations(response: string): any[] {
    const recommendations = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      if (line.match(/\d+\.\s*(?:take|use|apply)\s+/i) || line.includes('mg') || line.includes('dose')) {
        recommendations.push(line.trim());
      }
    }
    
    return recommendations;
  }

  private generateFollowUpQuestions(query: string, user: any): string[] {
    const questions = [
      "Do you have any known allergies to medications?",
      "Are you currently taking any other medications or supplements?",
      "Do you have stomach ulcers or gastrointestinal problems?",
      "Are you pregnant or breastfeeding?",
      "Do you have kidney or liver problems?",
      "How long have you been experiencing these symptoms?",
      "What is your age and approximate weight?"
    ];
    
    // Filter based on what we might already know
    if (user?.medicalHistory?.allergies?.length > 0) {
      questions.splice(0, 1); // Remove allergies question
    }
    
    if (user?.profile?.age) {
      questions.splice(6, 1); // Remove age question
    }
    
    return questions.slice(0, 3); // Return top 3 most relevant
  }

  private generateHealthTrackingQuestions(query: string): string[] {
    return [
      "How frequently are you experiencing this?",
      "Has it been getting better or worse?",
      "Are there any triggers that make it better or worse?",
      "Have you tried any treatments already?"
    ];
  }

  private async storeHealthData(userId: string, query: string): Promise<void> {
    // Implementation for storing health data
    // This would typically save to a health tracking collection
    console.log(`Storing health data for user ${userId}: ${query.substring(0, 50)}...`);
  }

  private async generateHealthInsights(userId: string): Promise<string | null> {
    // Generate insights from stored health data
    // This would analyze patterns from previously stored data
    return null; // Implement based on your data storage
  }

  // Clear conversation history
  clearConversationHistory(userId: string): void {
    this.conversationHistory.delete(userId);
  }

  // Get conversation history
  getConversationHistory(userId: string): any[] {
    return this.conversationHistory.get(userId) || [];
  }
}

export const aiService = new AIService();