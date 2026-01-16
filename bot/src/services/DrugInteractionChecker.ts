import { logger } from '../utils/logger';
import axios from 'axios';

interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'minor' | 'moderate' | 'major' | 'contraindicated';
  description: string;
  mechanism?: string;
  recommendation: string;
}

export class DrugInteractionChecker {
  private interactions: Map<string, DrugInteraction[]> = new Map();
  private drugAliases: Map<string, string[]> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeDrugAliases();
  }

  async initialize(): Promise<void> {
    try {
      // Load common drug interactions
      await this.loadCommonInteractions();
      
      // Optionally load from external API
      await this.loadFromExternalAPI();
      
      this.isInitialized = true;
      logger.info('Drug Interaction Checker initialized');
    } catch (error) {
      logger.error('Failed to initialize Drug Interaction Checker:', error);
      // Continue with basic functionality
      this.isInitialized = true;
    }
  }

  private initializeDrugAliases(): void {
    // Common drug aliases and brand names
    const aliases: Record<string, string[]> = {
      'ibuprofen': ['Advil', 'Motrin', 'Nurofen'],
      'paracetamol': ['acetaminophen', 'Tylenol', 'Panadol'],
      'amoxicillin': ['Amoxil', 'Trimox'],
      'atorvastatin': ['Lipitor'],
      'omeprazole': ['Prilosec'],
      'metformin': ['Glucophage'],
      'lisinopril': ['Zestril', 'Prinivil'],
      'levothyroxine': ['Synthroid', 'Levoxyl'],
      'sertraline': ['Zoloft'],
      'fluoxetine': ['Prozac'],
      'warfarin': ['Coumadin', 'Jantoven'],
      'insulin': ['Humulin', 'Novolin', 'Lantus']
    };

    for (const [generic, brands] of Object.entries(aliases)) {
      this.drugAliases.set(generic.toLowerCase(), [generic, ...brands].map(d => d.toLowerCase()));
    }
  }

  async checkInteractions(
    responseText: string,
    userMedications: string[]
  ): Promise<string[]> {
    const warnings: string[] = [];
    
    if (!this.isInitialized || userMedications.length === 0) {
      return warnings;
    }

    try {
      // Extract drug mentions from response
      const mentionedDrugs = this.extractDrugMentions(responseText);
      
      if (mentionedDrugs.length === 0) {
        return warnings;
      }

      // Check interactions between user's medications and mentioned drugs
      for (const userDrug of userMedications) {
        const normalizedUserDrug = this.normalizeDrugName(userDrug);
        
        for (const mentionedDrug of mentionedDrugs) {
          const normalizedMentionedDrug = this.normalizeDrugName(mentionedDrug);
          
          // Skip if it's the same drug
          if (normalizedUserDrug === normalizedMentionedDrug) {
            continue;
          }
          
          const interaction = await this.checkInteraction(
            normalizedUserDrug,
            normalizedMentionedDrug
          );
          
          if (interaction) {
            warnings.push(this.formatInteractionWarning(interaction));
          }
        }
      }
      
      // Check for drug-disease contraindications
      warnings.push(...await this.checkDiseaseContraindications(responseText));
      
      return warnings;
    } catch (error) {
      logger.error('Drug interaction check error:', error);
      return warnings;
    }
  }

  private extractDrugMentions(text: string): string[] {
    const drugMentions: string[] = [];
    const lowerText = text.toLowerCase();
    
    // Check for drug names
    for (const [generic, aliases] of this.drugAliases.entries()) {
      if (aliases.some(alias => lowerText.includes(alias))) {
        drugMentions.push(generic);
      }
    }
    
    // Look for drug class mentions
    const drugClasses = [
      'nsaid', 'antibiotic', 'antidepressant', 'antihypertensive',
      'statin', 'diuretic', 'beta blocker', 'ace inhibitor',
      'opioid', 'benzodiazepine', 'steroid', 'anticoagulant'
    ];
    
    drugClasses.forEach(drugClass => {
      if (lowerText.includes(drugClass)) {
        drugMentions.push(drugClass);
      }
    });
    
    return [...new Set(drugMentions)];
  }

  private normalizeDrugName(drug: string): string {
    const lowerDrug = drug.toLowerCase();
    
    // Check if it's a known alias
    for (const [generic, aliases] of this.drugAliases.entries()) {
      if (aliases.includes(lowerDrug)) {
        return generic;
      }
    }
    
    return lowerDrug;
  }

  private async checkInteraction(drug1: string, drug2: string): Promise<DrugInteraction | null> {
    // Check local database first
    const localInteraction = this.checkLocalInteraction(drug1, drug2);
    if (localInteraction) {
      return localInteraction;
    }
    
    // Try external API if available
    try {
      return await this.checkExternalInteraction(drug1, drug2);
    } catch (error) {
      logger.debug(`External interaction check failed for ${drug1} and ${drug2}:`, error);
    }
    
    return null;
  }

  private checkLocalInteraction(drug1: string, drug2: string): DrugInteraction | null {
    // Common known interactions
    const commonInteractions: DrugInteraction[] = [
      {
        drug1: 'warfarin',
        drug2: 'nsaid',
        severity: 'major',
        description: 'Increased risk of bleeding',
        mechanism: 'NSAIDs inhibit platelet function and may cause gastric erosion',
        recommendation: 'Avoid concurrent use. Use alternative pain relief.'
      },
      {
        drug1: 'warfarin',
        drug2: 'antibiotic',
        severity: 'moderate',
        description: 'Altered anticoagulant effect',
        mechanism: 'Antibiotics may alter gut flora affecting vitamin K production',
        recommendation: 'Monitor INR closely during and after antibiotic therapy'
      },
      {
        drug1: 'statin',
        drug2: 'antibiotic',
        severity: 'major',
        description: 'Increased risk of muscle toxicity (rhabdomyolysis)',
        mechanism: 'Some antibiotics inhibit statin metabolism',
        recommendation: 'Consider temporary statin discontinuation or dose reduction'
      },
      {
        drug1: 'ace inhibitor',
        drug2: 'nsaid',
        severity: 'moderate',
        description: 'Reduced antihypertensive effect and risk of kidney impairment',
        mechanism: 'NSAIDs inhibit prostaglandin synthesis affecting renal blood flow',
        recommendation: 'Monitor blood pressure and renal function'
      },
      {
        drug1: 'ssri',
        drug2: 'nsaid',
        severity: 'moderate',
        description: 'Increased risk of gastrointestinal bleeding',
        mechanism: 'Both drugs increase bleeding risk through different mechanisms',
        recommendation: 'Use with caution, consider gastroprotective agents'
      },
      {
        drug1: 'diuretic',
        drug2: 'nsaid',
        severity: 'moderate',
        description: 'Reduced diuretic effect and risk of kidney impairment',
        mechanism: 'NSAIDs promote sodium and water retention',
        recommendation: 'Monitor for edema and renal function'
      }
    ];

    const normalizedDrug1 = this.normalizeDrugName(drug1);
    const normalizedDrug2 = this.normalizeDrugName(drug2);
    
    // Check for exact matches
    const exactMatch = commonInteractions.find(
      interaction => 
        (interaction.drug1 === normalizedDrug1 && interaction.drug2 === normalizedDrug2) ||
        (interaction.drug1 === normalizedDrug2 && interaction.drug2 === normalizedDrug1)
    );
    
    if (exactMatch) {
      return exactMatch;
    }
    
    // Check for drug class matches
    const drug1Class = this.getDrugClass(normalizedDrug1);
    const drug2Class = this.getDrugClass(normalizedDrug2);
    
    if (drug1Class && drug2Class) {
      const classMatch = commonInteractions.find(
        interaction => 
          (interaction.drug1 === drug1Class && interaction.drug2 === drug2Class) ||
          (interaction.drug1 === drug2Class && interaction.drug2 === drug1Class)
      );
      
      if (classMatch) {
        return {
          ...classMatch,
          drug1: normalizedDrug1,
          drug2: normalizedDrug2
        };
      }
    }
    
    return null;
  }

  private async checkExternalInteraction(drug1: string, drug2: string): Promise<DrugInteraction | null> {
    // Example using OpenFDA API (you would need an API key)
    try {
      const response = await axios.get(
        `https://api.fda.gov/drug/label.json?search=drug_interactions:"${drug1}"+AND+"${drug2}"&limit=1`
      );
      
      if (response.data.results && response.data.results.length > 0) {
        const data = response.data.results[0];
        return {
          drug1,
          drug2,
          severity: 'moderate', // Would parse from actual data
          description: data.description || 'Drug interaction detected',
          recommendation: 'Consult healthcare provider before use'
        };
      }
    } catch (error) {
      // API may not have data or require authentication
    }
    
    return null;
  }

  private async checkDiseaseContraindications(responseText: string): Promise<string[]> {
    const warnings: string[] = [];
    const lowerText = responseText.toLowerCase();
    
    // Common disease-drug contraindications
    const contraindications = [
      {
        condition: 'peptic ulcer',
        drugs: ['nsaid', 'aspirin', 'corticosteroid'],
        warning: 'Contraindicated in patients with active peptic ulcer disease'
      },
      {
        condition: 'renal impairment',
        drugs: ['nsaid', 'aminoglycoside', 'contrast dye'],
        warning: 'Use with caution in renal impairment - monitor renal function'
      },
      {
        condition: 'hepatic impairment',
        drugs: ['paracetamol', 'statins', 'certain antibiotics'],
        warning: 'Dose adjustment or avoidance required in hepatic impairment'
      },
      {
        condition: 'pregnancy',
        drugs: ['warfarin', 'retinoid', 'certain antibiotics', 'nsaid'],
        warning: 'Contraindicated or use with extreme caution during pregnancy'
      },
      {
        condition: 'asthma',
        drugs: ['beta blocker', 'aspirin', 'nsaid'],
        warning: 'May precipitate bronchospasm in susceptible individuals'
      }
    ];
    
    // This would ideally check against user's actual conditions
    // For now, we just check if these warnings are mentioned
    contraindications.forEach(contra => {
      const hasDrugMention = contra.drugs.some(drug => lowerText.includes(drug));
      const hasConditionMention = lowerText.includes(contra.condition);
      
      if (hasDrugMention && hasConditionMention) {
        warnings.push(contra.warning);
      }
    });
    
    return warnings;
  }

  private getDrugClass(drug: string): string | null {
    const drugClasses: Record<string, string[]> = {
      'nsaid': ['ibuprofen', 'naproxen', 'diclofenac', 'celecoxib'],
      'antibiotic': ['amoxicillin', 'azithromycin', 'doxycycline', 'ciprofloxacin'],
      'statin': ['atorvastatin', 'simvastatin', 'rosuvastatin', 'pravastatin'],
      'ace inhibitor': ['lisinopril', 'enalapril', 'ramipril', 'captopril'],
      'ssri': ['sertraline', 'fluoxetine', 'paroxetine', 'citalopram'],
      'diuretic': ['furosemide', 'hydrochlorothiazide', 'spironolactone'],
      'beta blocker': ['metoprolol', 'atenolol', 'propranolol', 'bisoprolol']
    };
    
    for (const [drugClass, drugs] of Object.entries(drugClasses)) {
      if (drugs.includes(drug.toLowerCase())) {
        return drugClass;
      }
    }
    
    return null;
  }

  private formatInteractionWarning(interaction: DrugInteraction): string {
    const severityEmoji = {
      'minor': '⚠️',
      'moderate': '⚠️⚠️',
      'major': '🚨',
      'contraindicated': '🚫'
    };
    
    return `${severityEmoji[interaction.severity]} **DRUG INTERACTION WARNING**: ${interaction.drug1} + ${interaction.drug2}
    
    **Severity:** ${interaction.severity.toUpperCase()}
    **Description:** ${interaction.description}
    ${interaction.mechanism ? `**Mechanism:** ${interaction.mechanism}` : ''}
    **Recommendation:** ${interaction.recommendation}
    
    *Always consult your healthcare provider or pharmacist before starting, stopping, or changing any medication.*`;
  }

  private async loadCommonInteractions(): Promise<void> {
    // In production, this would load from a database
    // For now, we have them hardcoded in checkLocalInteraction
  }

  private async loadFromExternalAPI(): Promise<void> {
    // Optional: Load interactions from external APIs
    // This could be DrugBank API, OpenFDA, or other medical databases
  }
}