// services/HospitalService.ts - UPDATED VERSION


export interface Hospital {
  id: string;
  name: string;
  address: string;
  rating?: number;
  totalRatings?: number;
  types: string[];
  isOpen?: boolean;
  openingHours?: string[];
  phoneNumber?: string;
  website?: string;
  distance?: number; // in meters
  latitude: number;
  longitude: number;
  osmId?: string; // Changed from googlePlaceId
}

export interface HospitalFilters {
  radius?: number; // meters
  type?: 'hospital' | 'clinic' | 'pharmacy' | 'all';
  minRating?: number;
  openNow?: boolean;
}

class HospitalService {
  // REMOVED Google API key - No API key needed for OpenStreetMap!
  private readonly OVERPASS_API = 'https://overpass-api.de/api/interpreter';
  private readonly NOMINATIM_API = 'https://nominatim.openstreetmap.org';

  async getNearbyHospitals(
    location: { latitude: number; longitude: number },
    filters?: HospitalFilters
  ): Promise<Hospital[]> {
    try {
      const radius = filters?.radius || 5000; // 2km default
      const type = filters?.type || 'hospital';
      const { latitude: lat, longitude: lon } = location;

      
      // Overpass QL query to find healthcare facilities
      let overpassQuery = `
        [out:json][timeout:15];
        (
          node["amenity"="hospital"](around:${radius},${lat},${lon});
          node["healthcare"="hospital"](around:${radius},${lat},${lon});
        `;

        if (type === 'clinic' || type === 'all') {
          overpassQuery += `
          node["amenity"="clinic"](around:${radius},${lat},${lon});
          node["healthcare"="clinic"](around:${radius},${lat},${lon});
          `;
        }

        if (type === 'pharmacy' || type === 'all') {
          overpassQuery += `
          node["amenity"="pharmacy"](around:${radius},${lat},${lon});
          `;
        }

        overpassQuery += `);
        out body;`;


      const response = await fetch(this.OVERPASS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'NeuroMed/1.0.1 (+kamdilichukwu2020@gmail.com)',
          // 'Accept': 'application/json'
        },
        body: `data=${encodeURIComponent(overpassQuery)}`
      });

      if (!response.ok) {
        console.error('Overpass API error:', response.status, await response.text());
        return [];
      }

      const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
        const text = await response.text();

        // Overpass busy — not your fault
        if (text.includes('too busy') || text.includes('timeout')) {
          console.warn('Overpass API busy. Retrying later.');
          return [];
        }

        console.error('Unexpected Overpass response:', text.slice(0, 300));
        return [];
        
      }
      const data = await response.json();

      if (!data.elements || data.elements.length === 0) {
        return [];
      }

      // Transform OSM data to our Hospital interface
      const hospitals: Hospital[] = [];
      
      for (const element of data.elements) {
        const hospital = await this.transformOSMElement(element, location);
        if (hospital) {
          hospitals.push(hospital);
        }
      }

      // Apply additional filtering
      return this.applyAdditionalFilters(hospitals, filters);

    } catch (error) {
      console.error('Error fetching hospitals from OSM:', error);
      return [];
    }
  }

  private async transformOSMElement(element: any, userLocation: { latitude: number; longitude: number }): Promise<Hospital | null> {
    try {
      // Get coordinates
      const lat = element.lat || (element.center && element.center.lat);
      const lon = element.lon || (element.center && element.center.lng);
      
      if (!lat || !lon) return null;

      // Get details from element tags
      const tags = element.tags || {};
      const name = tags.name || 'Unnamed Facility';
      
      // Build address from available tags
      const addressParts = [
        tags['addr:housenumber'],
        tags['addr:street'],
        tags['addr:city'] || tags.city,
        tags['addr:state'] || tags.state,
        tags['addr:country'] || tags.country
      ].filter(Boolean);
      
      const address = addressParts.join(', ') || 'Address not available';

      // Calculate distance
      const distance = this.calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        lat,
        lon
      );

      return {
        id: `${element.type}-${element.id}`,
        name,
        address,
        types: this.getTypesFromTags(tags),
        latitude: lat,
        longitude: lon,
        osmId: `${element.type}/${element.id}`,
        distance,
        phoneNumber: tags.phone || undefined,
        website: tags.website || undefined,
        openingHours: tags.opening_hours ? [tags.opening_hours] : undefined,
        // Note: OSM doesn't have ratings - you'll need to implement your own rating system
        rating: 0,
        totalRatings: 0
      };
    } catch (error) {
      console.error('Error transforming OSM element:', error);
      return null;
    }
  }

  async getHospitalDetails(osmId: string): Promise<Hospital | null> {
    try {
      // Parse OSM ID (e.g., "node/123456789" or "way/987654321")
      const [type, id] = osmId.split('/');
      
      // Use Nominatim to get details
      const url = `${this.NOMINATIM_API}/lookup?format=json&osm_ids=${type[0].toUpperCase()}${id}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'NeuroMed-App/1.0' // Required by Nominatim
        }
      });
      
      const data = await response.json();
      
      if (!data || data.length === 0) {
        return null;
      }

      const place = data[0];
      return {
        id: osmId,
        name: place.display_name.split(',')[0] || 'Hospital',
        address: place.display_name,
        latitude: parseFloat(place.lat),
        longitude: parseFloat(place.lon),
        osmId: osmId,
        types: ['hospital'],
        // Note: Additional details would need custom database storage
      };
    } catch (error) {
      console.error('Error fetching hospital details:', error);
      return null;
    }
  }

  // UPDATED: Change to OpenStreetMap URLs
  getOpenStreetMapUrl(osmId: string): string {
    const [type, id] = osmId.split('/');
    return `https://www.openstreetmap.org/${type}/${id}`;
  }

  // UPDATED: Use OpenStreetMap search
  getSearchUrl(hospitalName: string, city?: string): string {
    const query = encodeURIComponent(`${hospitalName} ${city || ''}`);
    return `https://www.openstreetmap.org/search?query=${query}`;
  }

  // Helper methods
  private getTypesFromTags(tags: any): string[] {
    const types: string[] = [];
    if (tags.amenity === 'hospital') types.push('hospital');
    if (tags.amenity === 'clinic') types.push('clinic');
    if (tags.amenity === 'pharmacy') types.push('pharmacy');
    if (tags.healthcare) types.push(tags.healthcare);
    return types.length > 0 ? types : ['hospital'];
  }

  private applyAdditionalFilters(hospitals: Hospital[], filters?: HospitalFilters): Hospital[] {
    let filtered = [...hospitals];
    
    if (filters?.minRating && filters.minRating > 0) {
      // Note: OSM doesn't have ratings - this would require your own rating system
      filtered = filtered.filter(h => (h.rating || 0) >= filters.minRating!);
    }
    
    // Note: OpenNow filter won't work reliably with OSM
    // You'd need to parse opening_hours string format
    
    return filtered;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }
}

export default new HospitalService();