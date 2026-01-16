import { logger } from '../utils/logger';

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

export class MedicalContextBuilder {
  private medicalTerminology: Map<string, string> = new Map();
  private symptomPatterns: Map<string, string[]> = new Map();
  private drugClasses: Map<string, string[]> = new Map();

  constructor() {
    this.initializeMedicalData();
  }

  private initializeMedicalData(): void {
    // Common medical terminology
    this.medicalTerminology.set('hypertension', 'High blood pressure');
    this.medicalTerminology.set('hyperglycemia', 'High blood sugar');
    this.medicalTerminology.set('hypotension', 'Low blood pressure');
    this.medicalTerminology.set('tachycardia', 'Rapid heart rate');
    this.medicalTerminology.set('bradycardia', 'Slow heart rate');
    this.medicalTerminology.set('dyspnea', 'Shortness of breath');
    this.medicalTerminology.set('edema', 'Swelling');
    this.medicalTerminology.set('pruritus', 'Itching');
    this.medicalTerminology.set('erythema', 'Redness');

    // Symptom patterns for common conditions
    this.symptomPatterns.set('flu', ['fever', 'cough', 'sore throat', 'body aches', 'fatigue']);
    this.symptomPatterns.set('common cold', ['runny nose', 'sneezing', 'congestion', 'mild cough']);
    this.symptomPatterns.set('migraine', ['severe headache', 'sensitivity to light', 'nausea']);
    this.symptomPatterns.set('uti', ['burning urination', 'frequent urination', 'pelvic pain']);
    this.symptomPatterns.set('gastroenteritis', ['diarrhea', 'vomiting', 'abdominal pain']);

    // Drug classes
    this.drugClasses.set('nsaid', ['ibuprofen', 'naproxen', 'aspirin', 'diclofenac']);
    this.drugClasses.set('antibiotic', ['amoxicillin', 'azithromycin', 'doxycycline', 'ciprofloxacin']);
    this.drugClasses.set('antihypertensive', ['lisinopril', 'amlodipine', 'losartan', 'metoprolol']);
    this.drugClasses.set('antidepressant', ['sertraline', 'fluoxetine', 'venlafaxine', 'bupropion']);
  }

  async buildPrompt(
    query: string,
    userProfile: UserMedicalProfile,
    context?: any
  ): Promise<string> {
    try {
      // 1. Analyze query for medical terminology
      const terminology = this.extractMedicalTerminology(query);
      
      // 2. Identify potential conditions from symptoms
      const potentialConditions = this.identifyPotentialConditions(query, userProfile);
      
      // 3. Check for drug mentions
      const drugMentions = this.extractDrugMentions(query);
      
      // 4. Build comprehensive context
      const contextPrompt = `
        USER QUERY: ${query}
        
        USER MEDICAL PROFILE:
        - Age: ${userProfile.age} years
        - Gender: ${userProfile.gender}
        - Blood Group: ${userProfile.bloodGroup || 'Not specified'}
        - Genotype: ${userProfile.genotype || 'Not specified'}
        - Location: ${userProfile.location.country}${userProfile.location.city ? `, ${userProfile.location.city}` : ''}
        - Medical Conditions: ${userProfile.conditions.length > 0 ? userProfile.conditions.join(', ') : 'None recorded'}
        - Allergies: ${userProfile.allergies.length > 0 ? userProfile.allergies.join(', ') : 'None recorded'}
        - Current Medications: ${userProfile.medications.length > 0 ? userProfile.medications.join(', ') : 'None recorded'}
        
        QUERY ANALYSIS:
        - Medical Terminology Detected: ${terminology.length > 0 ? terminology.join(', ') : 'None'}
        - Drug Mentions: ${drugMentions.length > 0 ? drugMentions.join(', ') : 'None'}
        - Potential Related Conditions: ${potentialConditions.length > 0 ? potentialConditions.join(', ') : 'None'}
        
        ADDITIONAL CONTEXT: ${context ? JSON.stringify(context) : 'None provided'}
        
        RESPONSE GUIDELINES:
        1. Consider the user's specific medical conditions and allergies
        2. Account for potential drug interactions with current medications
        3. Provide age-appropriate advice
        4. Consider gender-specific health concerns if relevant
        5. Be mindful of the user's location for relevant healthcare resources
        6. Use simplified explanations for complex medical terms
        7. Always emphasize when professional medical consultation is needed
        8. Include specific warnings based on user's medical profile
        
        IMPORTANT SAFETY NOTES:
        ${this.generateSafetyNotes(userProfile, drugMentions)}
      `;

      return contextPrompt;
    } catch (error) {
      logger.error('Error building medical context:', error);
      return query; // Fallback to original query
    }
  }

  private extractMedicalTerminology(query: string): string[] {
    const terms: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    for (const [term, explanation] of this.medicalTerminology.entries()) {
      if (lowerQuery.includes(term.toLowerCase())) {
        terms.push(`${term} (${explanation})`);
      }
    }
    
    return terms;
  }

  private identifyPotentialConditions(query: string, userProfile: UserMedicalProfile): string[] {
    const conditions: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Check symptom patterns
    for (const [condition, symptoms] of this.symptomPatterns.entries()) {
      const matchingSymptoms = symptoms.filter(symptom => 
        lowerQuery.includes(symptom.toLowerCase())
      );
      
      if (matchingSymptoms.length >= 2) {
        conditions.push(condition);
      }
    }
    
    // Consider user's existing conditions
    if (userProfile.conditions.length > 0) {
      userProfile.conditions.forEach(condition => {
        const lowerCondition = condition.toLowerCase();
        if (lowerQuery.includes(lowerCondition) && !conditions.includes(condition)) {
          conditions.push(condition);
        }
      });
    }
    
    return conditions;
  }

  private extractDrugMentions(query: string): string[] {
    const drugs: string[] = [];
    const lowerQuery = query.toLowerCase();
    
    // Check for drug class mentions
    for (const [drugClass, examples] of this.drugClasses.entries()) {
      if (lowerQuery.includes(drugClass)) {
        drugs.push(drugClass);
      }
      
      // Check for specific drug names
      examples.forEach(drug => {
        if (lowerQuery.includes(drug.toLowerCase())) {
          drugs.push(drug);
        }
      });
    }
    
    // Common medication patterns
    const medicationPatterns = [
      /(?:take|using|on) (?:a |an )?(.+?) (?:for|to treat|medication)/i,
      /(?:prescribed|recommended) (?:me )?(.+?) (?:for)/i,
      /(?:side effects|interactions) (?:of|with) (.+?)(?: |$)/i
    ];
    
    medicationPatterns.forEach(pattern => {
      const match = query.match(pattern);
      if (match && match[1]) {
        const potentialDrug = match[1].trim();
        if (!drugs.includes(potentialDrug)) {
          drugs.push(potentialDrug);
        }
      }
    });
    
    return [...new Set(drugs)]; // Remove duplicates
  }

  private generateSafetyNotes(userProfile: UserMedicalProfile, drugMentions: string[]): string {
    const notes: string[] = [];
    
    // Age-related warnings
    if (userProfile.age < 18) {
      notes.push('User is a minor - pediatric considerations required');
    } else if (userProfile.age > 65) {
      notes.push('User is elderly - consider age-related metabolism changes and polypharmacy risks');
    }
    
    // Condition-specific warnings
    if (userProfile.conditions.includes('pregnancy') || userProfile.conditions.includes('breastfeeding')) {
      notes.push('User may be pregnant or breastfeeding - teratogenic risks must be considered');
    }
    
    if (userProfile.conditions.includes('kidney disease') || userProfile.conditions.includes('renal')) {
      notes.push('User has kidney disease - dose adjustments may be needed for renally cleared drugs');
    }
    
    if (userProfile.conditions.includes('liver disease') || userProfile.conditions.includes('hepatic')) {
      notes.push('User has liver disease - hepatotoxic drugs should be avoided or monitored');
    }
    
    // Allergy warnings
    if (userProfile.allergies.length > 0) {
      notes.push(`User has allergies: ${userProfile.allergies.join(', ')} - avoid cross-reactive substances`);
    }
    
    // Drug interaction warnings
    if (userProfile.medications.length > 0 && drugMentions.length > 0) {
      notes.push('Potential drug interactions must be checked against current medications');
    }
    
    return notes.length > 0 ? notes.join('\n') : 'No specific safety notes based on profile';
  }

  simplifyMedicalTerm(term: string): string {
    return this.medicalTerminology.get(term.toLowerCase()) || term;
  }

  getDrugClass(drugName: string): string | undefined {
    for (const [drugClass, drugs] of this.drugClasses.entries()) {
      if (drugs.some(d => d.toLowerCase() === drugName.toLowerCase())) {
        return drugClass;
      }
    }
    return undefined;
  }
}