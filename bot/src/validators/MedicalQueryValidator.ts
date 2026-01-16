export class MedicalQueryValidator {
  static validate(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.query || typeof data.query !== 'string') {
      errors.push('Query is required and must be a string');
    } else if (data.query.trim().length === 0) {
      errors.push('Query cannot be empty');
    } else if (data.query.length > 1000) {
      errors.push('Query is too long (max 1000 characters)');
    }

    if (data.context) {
      if (typeof data.context !== 'object') {
        errors.push('Context must be an object');
      } else {
        if (data.context.symptoms && !Array.isArray(data.context.symptoms)) {
          errors.push('Symptoms must be an array');
        }
        
        if (data.context.duration && typeof data.context.duration !== 'string') {
          errors.push('Duration must be a string');
        }
        
        if (data.context.severity && !['mild', 'moderate', 'severe'].includes(data.context.severity)) {
          errors.push('Severity must be one of: mild, moderate, severe');
        }
      }
    }

    // Check for malicious content
    const maliciousPatterns = [
      /<script.*?>.*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /data:/i,
      /vbscript:/i
    ];

    if (maliciousPatterns.some(pattern => pattern.test(data.query))) {
      errors.push('Query contains potentially malicious content');
    }

    // Check for excessive personal information
    const sensitivePatterns = [
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, // Phone numbers
      /\b\d{3}[-.]?\d{2}[-.]?\d{4}\b/, // SSN pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{16}\b/, // Credit card
      /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/ // Credit card with spaces
    ];

    if (sensitivePatterns.some(pattern => pattern.test(data.query))) {
      errors.push('Query contains potentially sensitive personal information');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static sanitizeQuery(query: string): string {
    let sanitized = query;
    
    // Remove HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // Remove potential script content
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/data:/gi, '');
    sanitized = sanitized.replace(/vbscript:/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/on\w+\s*=\s*"[^"]*"/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*'[^']*'/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=\s*[^ >]+/gi, '');
    
    // Trim and limit length
    sanitized = sanitized.trim().substring(0, 1000);
    
    return sanitized;
  }

  static validateMedicalTerminology(query: string): {
    hasMedicalTerms: boolean;
    terms: string[];
    complexity: 'low' | 'medium' | 'high';
  } {
    const medicalTerms = [
      // Common medical terms
      'symptom', 'diagnosis', 'treatment', 'therapy', 'medication', 'prescription',
      'dose', 'dosage', 'side effect', 'contraindication', 'allergy', 'reaction',
      'infection', 'inflammation', 'fever', 'pain', 'swelling', 'rash',
      
      // Body systems
      'cardiovascular', 'respiratory', 'gastrointestinal', 'neurological',
      'musculoskeletal', 'endocrine', 'immune', 'renal', 'hepatic',
      
      // Conditions
      'hypertension', 'diabetes', 'arthritis', 'asthma', 'migraine',
      'depression', 'anxiety', 'infection', 'ulcer', 'anemia'
    ];

    const lowerQuery = query.toLowerCase();
    const foundTerms = medicalTerms.filter(term => lowerQuery.includes(term.toLowerCase()));
    
    let complexity: 'low' | 'medium' | 'high' = 'low';
    
    if (foundTerms.length > 5) {
      complexity = 'high';
    } else if (foundTerms.length > 2) {
      complexity = 'medium';
    }

    return {
      hasMedicalTerms: foundTerms.length > 0,
      terms: foundTerms,
      complexity
    };
  }
}