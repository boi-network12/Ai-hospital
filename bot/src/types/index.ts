

export interface User {
  _id: string;
  name: string;
  email: string;
  profile: {
    avatar?: string;
    location?: {
      city?: string;
      state?: string;
      country: string;
    };
    dateOfBirth?: Date;
    gender: string;
    bloodGroup?: string;
    genotype?: string;
  };
  role: string;
  isOnline: boolean;
  lastActive: Date;
}

export interface MedicalQuery {
  query: string;
  userId: string;
  context?: {
    symptoms?: string[];
    duration?: string;
    severity?: 'mild' | 'moderate' | 'severe';
    previousConditions?: string[];
    location?: {
      country: string;
      city?: string;
    };
  };
  timestamp: Date;
}

export interface MedicalResponse {
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

export interface Conversation {
  _id?: string;
  userId: string;
  query: string;
  response: MedicalResponse;
  type: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface SafetyCheck {
  validationId: string;
  query: string;
  result: {
    isSafe: boolean;
    reason?: string;
    warnings: string[];
    requiresProfessionalReview: boolean;
    emergencyLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  };
  timestamp: Date;
}

export interface HealthcareProfessional {
  _id: string;
  name: string;
  email: string;
  profile: {
    specialization?: string;
    department?: string;
    avatar?: string;
    location?: {
      city?: string;
      state?: string;
      country: string;
    };
  };
  healthcareProfile?: {
    stats: {
      averageRating: number;
      totalRatings: number;
      totalConsultations: number;
      responseTime: number;
    };
    availability: {
      isAvailable: boolean;
    };
  };
  isOnline: boolean;
  lastActive: Date;
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  mechanism?: string;
  recommendation: string;
}