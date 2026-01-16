import { logger } from '../utils/logger';
import axios from 'axios';
import geoip from 'geoip-lite';

interface LocationMedicalInfo {
  country: string;
  city?: string;
  emergencyNumber: string;
  commonDiseases: string[];
  vaccinationRequirements: string[];
  healthcareSystemInfo: string;
  drugRegulations: string[];
  climateConsiderations: string[];
}

interface CountryMedicalData {
  [countryCode: string]: {
    emergencyNumber: string;
    commonDiseases: string[];
    vaccinationRequirements: string[];
    healthcareSystem: string;
    drugRegulations: string[];
    climateConsiderations: string[];
    language: string;
  };
}

export class LocationBasedMedicalInfo {
  private countryData: CountryMedicalData;
  private isInitialized: boolean = false;

  constructor() {
    // Initialize with default data
    this.countryData = this.getDefaultCountryData();
  }

  async initialize(): Promise<void> {
    try {
      // Could load from external API or database
      await this.loadCountryData();
      this.isInitialized = true;
      logger.info('LocationBasedMedicalInfo initialized');
    } catch (error) {
      logger.error('Failed to initialize LocationBasedMedicalInfo:', error);
      // Continue with default data
      this.isInitialized = true;
    }
  }

  async getMedicalContext(countryCode: string, city?: string): Promise<LocationMedicalInfo> {
    try {
      const country = countryCode.toUpperCase();
      const baseData = this.countryData[country] || this.countryData['US']; // Default to US
      
      // Get localized information based on city if available
      const localizedInfo = city ? await this.getCitySpecificInfo(city, country) : {};
      
      return {
        country: this.getCountryName(country),
        city,
        emergencyNumber: baseData.emergencyNumber,
        commonDiseases: [...baseData.commonDiseases, ...(localizedInfo.commonDiseases || [])],
        vaccinationRequirements: baseData.vaccinationRequirements,
        healthcareSystemInfo: baseData.healthcareSystem,
        drugRegulations: baseData.drugRegulations,
        climateConsiderations: [...baseData.climateConsiderations, ...(localizedInfo.climateConsiderations || [])]
      };
    } catch (error) {
      logger.error('Error getting medical context:', error);
      return this.getDefaultMedicalContext();
    }
  }

  async getLocationFromIP(ip: string): Promise<{ country: string; city?: string }> {
    try {
      const geo = geoip.lookup(ip);
      if (geo) {
        return {
          country: geo.country,
          city: geo.city
        };
      }
      
      // Fallback to geolocation API
      const response = await axios.get(`https://ipapi.co/${ip}/json/`);
      return {
        country: response.data.country_code,
        city: response.data.city
      };
    } catch (error) {
      logger.error('Error getting location from IP:', error);
      return { country: 'US' };
    }
  }

  getEmergencyNumber(countryCode: string): string {
    const country = countryCode.toUpperCase();
    return this.countryData[country]?.emergencyNumber || '112';
  }

  getCountrySpecificDrugInfo(drugName: string, countryCode: string): {
    availability: 'otc' | 'prescription' | 'restricted' | 'unavailable';
    brandNames: string[];
    regulations: string;
  } {
    const country = countryCode.toUpperCase();
    const countryInfo = this.countryData[country] || this.countryData['US'];
    
    // Default response
    const defaultInfo = {
      availability: 'prescription' as const,
      brandNames: [],
      regulations: 'Consult local healthcare provider for availability'
    };
    
    // Country-specific drug information
    const drugInfo: Record<string, Record<string, any>> = {
      'US': {
        'ibuprofen': { availability: 'otc', brandNames: ['Advil', 'Motrin'] },
        'amoxicillin': { availability: 'prescription', brandNames: ['Amoxil'] },
        'atorvastatin': { availability: 'prescription', brandNames: ['Lipitor'] }
      },
      'UK': {
        'ibuprofen': { availability: 'otc', brandNames: ['Nurofen'] },
        'paracetamol': { availability: 'otc', brandNames: ['Panadol'] }
      },
      'NG': { // Nigeria
        'ibuprofen': { availability: 'otc', brandNames: ['Ibufem'] },
        'artemether': { availability: 'prescription', brandNames: ['Coartem'] }
      },
      'IN': { // India
        'ibuprofen': { availability: 'otc', brandNames: ['Ibugesic'] },
        'paracetamol': { availability: 'otc', brandNames: ['Crocin', 'Calpol'] }
      }
    };
    
    return drugInfo[country]?.[drugName.toLowerCase()] || defaultInfo;
  }

  private async getCitySpecificInfo(city: string, countryCode: string): Promise<Partial<LocationMedicalInfo>> {
    try {
      // This could query a database of city-specific health information
      // For now, return empty
      return {};
    } catch (error) {
      return {};
    }
  }

  private getDefaultCountryData(): CountryMedicalData {
    return {
      'US': {
        emergencyNumber: '911',
        commonDiseases: ['Heart disease', 'Diabetes', 'Cancer', 'Obesity', 'Hypertension'],
        vaccinationRequirements: ['COVID-19', 'Influenza', 'Tetanus', 'MMR'],
        healthcareSystem: 'Mixed public-private system with insurance-based care',
        drugRegulations: ['FDA regulated', 'Prescription required for many drugs', 'Insurance coverage varies'],
        climateConsiderations: ['Varies by region - consider local climate'],
        language: 'English'
      },
      'UK': {
        emergencyNumber: '999',
        commonDiseases: ['Heart disease', 'Cancer', 'Stroke', 'Respiratory diseases'],
        vaccinationRequirements: ['COVID-19', 'Influenza', 'MMR', 'HPV'],
        healthcareSystem: 'National Health Service (NHS) providing free healthcare',
        drugRegulations: ['MHRA regulated', 'Some drugs available OTC', 'Prescription charges apply'],
        climateConsiderations: ['Temperate climate with seasonal variations'],
        language: 'English'
      },
      'NG': { // Nigeria
        emergencyNumber: '112',
        commonDiseases: ['Malaria', 'Typhoid', 'Cholera', 'HIV/AIDS', 'Lassa fever'],
        vaccinationRequirements: ['Yellow fever', 'Hepatitis A & B', 'Typhoid', 'Malaria prophylaxis'],
        healthcareSystem: 'Mixed system with public and private providers',
        drugRegulations: ['NAFDAC regulated', 'Many drugs available OTC', 'Counterfeit drug risk'],
        climateConsiderations: ['Tropical climate with rainy season'],
        language: 'English'
      },
      'IN': { // India
        emergencyNumber: '112',
        commonDiseases: ['Cardiovascular diseases', 'Diabetes', 'Respiratory infections', 'Tuberculosis'],
        vaccinationRequirements: ['COVID-19', 'Hepatitis B', 'Typhoid', 'Rabies'],
        healthcareSystem: 'Mixed public-private system with significant out-of-pocket expenses',
        drugRegulations: ['CDSCO regulated', 'Many drugs available OTC', 'Generic drugs widely available'],
        climateConsiderations: ['Tropical and subtropical climate with monsoon season'],
        language: 'Hindi, English'
      },
      'CA': { // Canada
        emergencyNumber: '911',
        commonDiseases: ['Cancer', 'Heart disease', 'Diabetes', 'Mental health disorders'],
        vaccinationRequirements: ['COVID-19', 'Influenza', 'HPV', 'Shingles'],
        healthcareSystem: 'Publicly funded healthcare system (Medicare)',
        drugRegulations: ['Health Canada regulated', 'Prescription drug coverage varies by province'],
        climateConsiderations: ['Cold winters in many regions'],
        language: 'English, French'
      },
      'AU': { // Australia
        emergencyNumber: '000',
        commonDiseases: ['Cancer', 'Heart disease', 'Mental health disorders', 'Diabetes'],
        vaccinationRequirements: ['COVID-19', 'Influenza', 'MMR', 'Hepatitis B'],
        healthcareSystem: 'Medicare provides public healthcare with private insurance options',
        drugRegulations: ['TGA regulated', 'Pharmaceutical Benefits Scheme subsidizes many drugs'],
        climateConsiderations: ['High UV index, skin cancer risk'],
        language: 'English'
      }
    };
  }

  private getDefaultMedicalContext(): LocationMedicalInfo {
    return {
      country: 'Unknown',
      emergencyNumber: '112',
      commonDiseases: [],
      vaccinationRequirements: [],
      healthcareSystemInfo: 'Consult local healthcare providers',
      drugRegulations: ['Verify local regulations'],
      climateConsiderations: []
    };
  }

  private getCountryName(countryCode: string): string {
    const countryNames: Record<string, string> = {
      'US': 'United States',
      'UK': 'United Kingdom',
      'NG': 'Nigeria',
      'IN': 'India',
      'CA': 'Canada',
      'AU': 'Australia',
      'DE': 'Germany',
      'FR': 'France',
      'JP': 'Japan',
      'CN': 'China',
      'BR': 'Brazil',
      'ZA': 'South Africa'
    };
    
    return countryNames[countryCode] || countryCode;
  }

  private async loadCountryData(): Promise<void> {
    // Could load from database or external API
    // For now, using default data
  }
}