/**
 * CollectiveAccess API Client
 * Handles syncing garment data from CollectiveAccess CMS
 */

export interface CollectiveAccessConfig {
  baseUrl: string;
  apiKey?: string;
  username?: string;
  password?: string;
}

export interface CAObject {
  object_id: string;
  idno: string;
  type_id: string;
  [key: string]: any;
}

export interface CAImage {
  media_id: string;
  url: string;
  thumbnail_url?: string;
  caption?: string;
}

class CollectiveAccessClient {
  private config: CollectiveAccessConfig;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(config: CollectiveAccessConfig) {
    this.config = config;
  }

  /**
   * Fetch objects from CollectiveAccess
   */
  async fetchObjects(params: {
    type?: string;
    limit?: number;
    start?: number;
    search?: string;
  }): Promise<CAObject[]> {
    const cacheKey = `objects_${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const queryParams = new URLSearchParams();
      if (params.type) queryParams.set('type', params.type);
      if (params.limit) queryParams.set('limit', params.limit.toString());
      if (params.start) queryParams.set('start', params.start.toString());
      if (params.search) queryParams.set('search', params.search);

      const url = `${this.config.baseUrl}/find/ca_objects?${queryParams.toString()}`;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        throw new Error(`CollectiveAccess API error: ${response.statusText}`);
      }

      const data = await response.json();
      const objects = data.results || [];

      this.cache.set(cacheKey, { data: objects, timestamp: Date.now() });
      return objects;
    } catch (error) {
      console.error('Error fetching from CollectiveAccess:', error);
      throw error;
    }
  }

  /**
   * Fetch a single object by ID
   */
  async fetchObjectById(objectId: string): Promise<CAObject | null> {
    const cacheKey = `object_${objectId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const url = `${this.config.baseUrl}/get/ca_objects/${objectId}`;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error(`CollectiveAccess API error: ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('Error fetching object from CollectiveAccess:', error);
      throw error;
    }
  }

  /**
   * Fetch images for an object
   */
  async fetchObjectImages(objectId: string): Promise<CAImage[]> {
    try {
      const url = `${this.config.baseUrl}/get/ca_objects/${objectId}/media`;
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (this.config.apiKey) {
        headers['Authorization'] = `Bearer ${this.config.apiKey}`;
      }

      const response = await fetch(url, { headers });
      
      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (data.media || []).map((item: any) => ({
        media_id: item.media_id,
        url: item.url || item.urls?.original,
        thumbnail_url: item.urls?.thumbnail || item.thumbnail_url,
        caption: item.caption || item.captions?.[0],
      }));
    } catch (error) {
      console.error('Error fetching images from CollectiveAccess:', error);
      return [];
    }
  }

  /**
   * Convert CA object to Garment format
   */
  convertToGarment(caObject: CAObject, images: CAImage[] = []): any {
    return {
      id: caObject.object_id || caObject.idno,
      slug: this.generateSlug(caObject.idno || caObject.object_id),
      label: caObject.preferred_labels?.name || caObject.idno,
      name: caObject.preferred_labels?.name,
      decade: this.extractDecade(caObject),
      date: caObject.dates?.date || caObject.date,
      era: this.extractEra(caObject),
      work_type: caObject.type,
      colors: this.extractColors(caObject),
      materials: this.extractMaterials(caObject),
      description: caObject.description || caObject.descriptions?.[0],
      images: images.map(img => img.url).filter(Boolean),
      thumbnailUrl: images[0]?.thumbnail_url || images[0]?.url,
      accessionNumber: caObject.idno,
      collection: caObject.collection || 'UVA Historic Clothing Collection',
      dimensions: caObject.dimensions,
      condition: caObject.condition,
    };
  }

  private generateSlug(idno: string): string {
    return idno.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  }

  private extractDecade(caObject: CAObject): string | undefined {
    const date = caObject.dates?.date || caObject.date;
    if (!date) return undefined;
    const year = parseInt(date.substring(0, 4), 10);
    if (isNaN(year)) return undefined;
    return `${Math.floor(year / 10) * 10}s`;
  }

  private extractEra(caObject: CAObject): string | undefined {
    const decade = this.extractDecade(caObject);
    if (!decade) return undefined;
    const year = parseInt(decade, 10);
    if (year < 1920) return 'pre-1920';
    if (year < 1950) return '1920-1950';
    if (year < 1980) return '1950-1980';
    return '1980+';
  }

  private extractColors(caObject: CAObject): string[] {
    return caObject.colors || caObject.color || [];
  }

  private extractMaterials(caObject: CAObject): string[] {
    return caObject.materials || caObject.material || [];
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Singleton instance
let clientInstance: CollectiveAccessClient | null = null;

export function getCollectiveAccessClient(config?: CollectiveAccessConfig): CollectiveAccessClient {
  if (!clientInstance) {
    const defaultConfig: CollectiveAccessConfig = {
      baseUrl: process.env.NEXT_PUBLIC_CA_BASE_URL || '',
      apiKey: process.env.NEXT_PUBLIC_CA_API_KEY,
      username: process.env.NEXT_PUBLIC_CA_USERNAME,
      password: process.env.NEXT_PUBLIC_CA_PASSWORD,
    };
    clientInstance = new CollectiveAccessClient(config || defaultConfig);
  }
  return clientInstance;
}

/**
 * Sync garments from CollectiveAccess
 */
export async function syncGarmentsFromCA(limit: number = 100): Promise<any[]> {
  const client = getCollectiveAccessClient();
  const objects = await client.fetchObjects({ 
    type: 'clothing', // Adjust based on your CA setup
    limit 
  });
  
  const garments = await Promise.all(
    objects.map(async (obj) => {
      const images = await client.fetchObjectImages(obj.object_id);
      return client.convertToGarment(obj, images);
    })
  );
  
  return garments;
}
