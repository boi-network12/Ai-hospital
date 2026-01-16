import { config } from '../config/env';
import { logger } from '../utils/logger';
import { DatabaseService } from './DatabaseService';
import { v4 as uuidv4 } from 'uuid';

interface SafetyValidation {
  isSafe: boolean;
  reason?: string;
  warnings: string[];
  requiresProfessionalReview: boolean;
  emergencyLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
}

interface EmergencyCheck {
  isEmergency: boolean;
  condition: string;
  triggerKeywords: string[];
  emergencyNumber?: string;
  countryCode?: string;
  requiredAction: string;
}

export class SafetyGuardrail {
  private restrictedTopics: Set<string>;
  private emergencyKeywords: Map<string, EmergencyConfig>;
  private drugBlacklist: Set<string>;
  private databaseService: DatabaseService;
  private countryEmergencyNumbers: Map<string, string>;

  constructor() {
    this.restrictedTopics = new Set(config.medical.restrictedDrugs);
    this.emergencyKeywords = new Map();
    this.drugBlacklist = new Set();
    this.databaseService = new DatabaseService();
    this.countryEmergencyNumbers = new Map([
      ['US', '911'],
      ['UK', '999'],
      ['EU', '112'],
      ['NG', '112'],
      ['IN', '112'],
      ['CA', '911'],
      ['AU', '000'],
      ['JP', '119'],
      ['KR', '119'],
      ['CN', '120']
    ]);
  }

  async initialize(): Promise<void> {
    try {
      // Load emergency keywords with severity levels
      config.medical.emergencyKeywords.forEach(keyword => {
        this.emergencyKeywords.set(keyword.toLowerCase(), {
          severity: 'critical',
          condition: this.mapKeywordToCondition(keyword),
          responseTemplate: 'emergency'
        });
      });

      // Load red flag symptoms
      config.medical.redFlagSymptoms.forEach(symptom => {
        this.emergencyKeywords.set(symptom.toLowerCase(), {
          severity: 'high',
          condition: 'Red flag symptom requiring immediate evaluation',
          responseTemplate: 'urgent'
        });
      });

      // Load restricted drugs from database
      await this.loadRestrictedDrugs();
      
      logger.info('Safety Guardrail initialized');
    } catch (error) {
      logger.error('Failed to initialize Safety Guardrail:', error);
      throw error;
    }
  }

  async validateQuery(query: string, userProfile: any): Promise<SafetyValidation> {
    const validationId = uuidv4();
    const warnings: string[] = [];
    let isSafe = true;
    let reason = '';
    let emergencyLevel: SafetyValidation['emergencyLevel'] = 'none';
    let requiresProfessionalReview = false;

    try {
      // 1. Check for emergency situations
      const emergencyCheck = this.checkForEmergency(query);
      if (emergencyCheck.isEmergency) {
        return {
          isSafe: false,
          reason: `Emergency situation detected: ${emergencyCheck.condition}`,
          warnings: ['EMERGENCY - IMMEDIATE ACTION REQUIRED'],
          requiresProfessionalReview: true,
          emergencyLevel: 'critical'
        };
      }

      // 2. Check for restricted topics
      const restrictedCheck = this.checkRestrictedTopics(query);
      if (!restrictedCheck.isAllowed) {
        isSafe = false;
        reason = restrictedCheck.reason;
        warnings.push(...restrictedCheck.warnings);
      }

      // 3. Check for self-harm or harm to others
      const selfHarmCheck = this.checkForSelfHarm(query);
      if (selfHarmCheck.detected) {
        isSafe = false;
        reason = 'Content related to self-harm or harm to others detected';
        warnings.push('CRISIS SUPPORT REQUIRED');
        emergencyLevel = 'high';
        requiresProfessionalReview = true;
      }

      // 4. Check for medication requests without prescription context
      const medicationCheck = this.checkMedicationRequests(query, userProfile);
      if (medicationCheck.requiresPrescription) {
        warnings.push('Medication information requires professional prescription');
        requiresProfessionalReview = true;
      }

      // 5. Validate against user's medical conditions
      const conditionCheck = await this.checkAgainstUserConditions(query, userProfile);
      if (conditionCheck.conflicts) {
        warnings.push(`Potential conflict with user's condition: ${conditionCheck.conflictingCondition}`);
        requiresProfessionalReview = true;
      }

      // 6. Log safety check for audit
      await this.logSafetyCheck(validationId, query, {
        isSafe,
        warnings,
        emergencyLevel,
        userProfileId: userProfile.userId
      });

      return {
        isSafe,
        reason,
        warnings,
        requiresProfessionalReview,
        emergencyLevel
      };

    } catch (error) {
      logger.error(`Safety validation error ${validationId}:`, error);
      
      // Default to unsafe on error
      return {
        isSafe: false,
        reason: 'Safety validation system error',
        warnings: ['System error - defaulting to restricted mode'],
        requiresProfessionalReview: true,
        emergencyLevel: 'medium'
      };
    }
  }

  checkForEmergency(query: string): EmergencyCheck {
    const lowerQuery = query.toLowerCase();
    const triggerKeywords: string[] = [];
    let isEmergency = false;
    let condition = '';
    let requiredAction = '';

    // Check each emergency keyword
    for (const [keyword, config] of this.emergencyKeywords.entries()) {
      if (lowerQuery.includes(keyword)) {
        isEmergency = true;
        triggerKeywords.push(keyword);
        
        if (!condition) {
          condition = config.condition;
          requiredAction = this.getEmergencyAction(keyword, config.severity);
        }
      }
    }

    // Check for combined symptom patterns
    if (this.checkEmergencyPatterns(lowerQuery)) {
      isEmergency = true;
      triggerKeywords.push('complex_emergency_pattern');
      condition = 'Multiple emergency symptoms detected';
      requiredAction = 'Seek immediate medical attention';
    }

    return {
      isEmergency,
      condition,
      triggerKeywords,
      requiredAction,
      // These would be populated based on user's location
      emergencyNumber: undefined,
      countryCode: undefined
    };
  }

  private checkRestrictedTopics(query: string): {
    isAllowed: boolean;
    reason: string;
    warnings: string[];
  } {
    const lowerQuery = query.toLowerCase();
    const warnings: string[] = [];
    
    for (const topic of this.restrictedTopics) {
      if (lowerQuery.includes(topic.toLowerCase())) {
        return {
          isAllowed: false,
          reason: `Restricted topic: ${topic}`,
          warnings: [`Information about ${topic} requires professional consultation`]
        };
      }
    }

    // Check for drug seeking behavior
    const drugSeekingPatterns = [
      /prescribe me/i,
      /give me .* (pill|medication|drug)/i,
      /how to get .* without prescription/i,
      /buy .* online/i
    ];

    for (const pattern of drugSeekingPatterns) {
      if (pattern.test(query)) {
        warnings.push('Potential drug-seeking behavior detected');
        return {
          isAllowed: false,
          reason: 'Medication requests require proper medical consultation',
          warnings
        };
      }
    }

    return {
      isAllowed: true,
      reason: '',
      warnings
    };
  }

  private checkForSelfHarm(query: string): {
    detected: boolean;
    severity: 'low' | 'medium' | 'high';
    keywords: string[];
  } {
    const selfHarmKeywords = [
      'suicide', 'kill myself', 'end my life', 'want to die',
      'harm myself', 'self harm', 'cutting', 'overdose',
      'hurt someone', 'kill someone', 'violent thoughts'
    ];

    const lowerQuery = query.toLowerCase();
    const detectedKeywords: string[] = [];

    selfHarmKeywords.forEach(keyword => {
      if (lowerQuery.includes(keyword)) {
        detectedKeywords.push(keyword);
      }
    });

    return {
      detected: detectedKeywords.length > 0,
      severity: detectedKeywords.length > 0 ? 'high' : 'low',
      keywords: detectedKeywords
    };
  }

  private checkMedicationRequests(query: string, userProfile: any): {
    requiresPrescription: boolean;
    medications: string[];
  } {
    const medicationPatterns = [
      /(take|use|prescribe|recommend) (?:me )?(.+?) (?:for|to treat)/i,
      /what (?:pill|medication|drug) (?:should|can) i take/i,
      /(?:over the counter|otc) (?:for|medication)/i
    ];

    const medications: string[] = [];
    let requiresPrescription = false;

    medicationPatterns.forEach(pattern => {
      const match = query.match(pattern);
      if (match && match[2]) {
        const medication = match[2].trim();
        medications.push(medication);
        
        // Check if this is a prescription medication
        if (this.isPrescriptionMedication(medication)) {
          requiresPrescription = true;
        }
      }
    });

    // Also check if user is asking about changing medications
    if (query.toLowerCase().includes('change my medication') || 
        query.toLowerCase().includes('stop taking')) {
      requiresPrescription = true;
      warnings: ['Medication changes require doctor consultation']
    }

    return { requiresPrescription, medications };
  }

  private async checkAgainstUserConditions(query: string, userProfile: any): Promise<{
    conflicts: boolean;
    conflictingCondition?: string;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    let conflicts = false;
    let conflictingCondition = '';

    if (!userProfile.conditions || userProfile.conditions.length === 0) {
      return { conflicts: false, warnings };
    }

    // Keywords that might conflict with specific conditions
    const conditionConflicts: Record<string, string[]> = {
      'ulcer': ['nsaid', 'ibuprofen', 'aspirin', 'naproxen', 'anti-inflammatory'],
      'hypertension': ['decongestant', 'pseudoephedrine', 'stimulant', 'salt'],
      'diabetes': ['steroid', 'prednisone', 'sugar', 'certain antibiotics'],
      'kidney disease': ['nsaid', 'contrast dye', 'certain antibiotics'],
      'liver disease': ['acetaminophen', 'paracetamol', 'alcohol', 'certain medications'],
      'asthma': ['beta blocker', 'aspirin', 'nsaid'],
      'pregnancy': ['certain antibiotics', 'retinoid', 'warfarin', 'live vaccines']
    };

    const lowerQuery = query.toLowerCase();
    
    // Check each user condition
    for (const condition of userProfile.conditions) {
      const conflictsForCondition = conditionConflicts[condition.toLowerCase()];
      
      if (conflictsForCondition) {
        for (const conflict of conflictsForCondition) {
          if (lowerQuery.includes(conflict)) {
            conflicts = true;
            conflictingCondition = condition;
            warnings.push(`Query mentions "${conflict}" which may conflict with your condition: ${condition}`);
            break;
          }
        }
      }
      
      if (conflicts) break;
    }

    return { conflicts, conflictingCondition, warnings };
  }

  private isPrescriptionMedication(medication: string): boolean {
    const prescriptionDrugs = [
      'antibiotic', 'opioid', 'benzodiazepine', 'antidepressant', 'antipsychotic',
      'chemotherapy', 'insulin', 'warfarin', 'digoxin', 'lithium', 'methotrexate'
    ];

    return prescriptionDrugs.some(drug => 
      medication.toLowerCase().includes(drug.toLowerCase())
    );
  }

  private checkEmergencyPatterns(query: string): boolean {
    const emergencyPatterns = [
      // Chest pain + shortness of breath
      /chest pain.*shortness of breath|shortness of breath.*chest pain/i,
      
      // Headache + vomiting + stiff neck (meningitis signs)
      /headache.*vomit.*stiff neck/i,
      
      // Sudden weakness + confusion (stroke signs)
      /sudden weakness.*confusion|confusion.*sudden weakness/i,
      
      // Severe abdominal pain + fever
      /severe abdominal pain.*fever|fever.*severe abdominal pain/i,
      
      // Multiple emergency keywords
      new RegExp(`(${Array.from(this.emergencyKeywords.keys()).slice(0, 5).join('|')}).*(${Array.from(this.emergencyKeywords.keys()).slice(5, 10).join('|')})`, 'i')
    ];

    return emergencyPatterns.some(pattern => pattern.test(query));
  }

  private mapKeywordToCondition(keyword: string): string {
    const conditionMap: Record<string, string> = {
      'chest pain': 'Possible heart attack or angina',
      'heart attack': 'Myocardial infarction',
      'stroke': 'Cerebrovascular accident',
      'difficulty breathing': 'Respiratory distress',
      'severe bleeding': 'Hemorrhage',
      'unconscious': 'Loss of consciousness',
      'suicidal': 'Suicidal ideation',
      'homicidal': 'Homicidal ideation',
      'severe allergic reaction': 'Anaphylaxis',
      'overdose': 'Drug overdose',
      'seizure': 'Convulsive episode'
    };

    return conditionMap[keyword] || 'Medical emergency';
  }

  private getEmergencyAction(keyword: string, severity: string): string {
    if (severity === 'critical') {
      return 'Call emergency services immediately';
    } else if (severity === 'high') {
      return 'Seek emergency medical attention within 1 hour';
    }
    return 'Consult a healthcare professional soon';
  }

  private async loadRestrictedDrugs(): Promise<void> {
    try {
      // Load from database or external API
      const restrictedDrugs = await this.databaseService.getRestrictedDrugs();
      restrictedDrugs.forEach((drug: any) => {
        this.drugBlacklist.add(drug.toLowerCase());
      });
    } catch (error) {
      logger.error('Failed to load restricted drugs:', error);
    }
  }

  private async logSafetyCheck(
    validationId: string,
    query: string,
    result: any
  ): Promise<void> {
    try {
      await this.databaseService.logSafetyCheck({
        validationId,
        query: query.substring(0, 500), // Limit length
        result,
        timestamp: new Date()
      });
    } catch (error) {
      logger.error('Failed to log safety check:', error);
    }
  }

  getEmergencyNumber(countryCode: string): string {
    return this.countryEmergencyNumbers.get(countryCode.toUpperCase()) || '112';
  }
}

interface EmergencyConfig {
  severity: 'low' | 'medium' | 'high' | 'critical';
  condition: string;
  responseTemplate: string;
}