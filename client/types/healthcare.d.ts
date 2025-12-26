// Add these types
export interface HealthcareInstitution {
  id: string;
  name: string;
  type: 'hospital' | 'clinic' | 'pharmacy' | 'diagnostic-center';
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  contact: {
    phone: string;
    email?: string;
    website?: string;
  };
  services: string[];
  rating?: number;
  totalReviews?: number;
  distance?: number; // in kilometers
  googlePlaceId?: string;
  openingHours?: string;
  emergencyServices?: boolean;
  insuranceAccepted?: string[];
}

export interface HealthcareResponse {
  professionals: HealthcareProfessional[];
  institutions: HealthcareInstitution[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  location: {
    city: string;
    state: string;
    country: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
}