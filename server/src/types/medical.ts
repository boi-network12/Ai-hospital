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