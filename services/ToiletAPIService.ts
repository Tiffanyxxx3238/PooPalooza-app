// services/ToiletAPIService.ts

import { API_CONFIG } from '@/constants/API';
import { FUNNY_QUOTES } from '@/constants/quotes'; // 你的搞笑語錄
import { isGovernmentFacility, isInTaiwan, calculateDistance } from '@/utils/helpers'; // 你的工具函數

export interface APIToilet {
  toilet_id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  toilet_type?: string;
  type2?: string;
  administration?: string;
  grade?: string;
}

export interface Bathroom {
  id: string;
  name: string;
  distance: number;
  rating: number;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  source: 'gov' | 'commercial' | 'international';
  hidden?: boolean;
  reviews?: any[];
  funnyQuote?: string;
  city?: string;
  administration?: string;
  grade?: string;
}

export class ToiletAPIService {
  static async fetchWithTimeout(url: string, options: RequestInit = {}, timeout = API_CONFIG.TIMEOUT) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 獲取附近廁所
  static async getNearbyToilets(latitude: number, longitude: number, radius = 1000, limit = 100): Promise<Bathroom[]> {
    const url = new URL(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.NEARBY_TOILETS}`);
    
    url.searchParams.append('lat', latitude.toString());
    url.searchParams.append('lng', longitude.toString());
    url.searchParams.append('radius', radius.toString());
    url.searchParams.append('limit', limit.toString());
    
    try {
      console.log('🔍 API 請求:', url.toString());
      const toilets: APIToilet[] = await this.fetchWithTimeout(url.toString());
      return this.transformToiletData(toilets);
    } catch (error) {
      console.error('獲取附近廁所失敗:', error);
      return [];
    }
  }

  // 分頁獲取所有廁所
  static async getAllToilets(page = 1, pageSize = API_CONFIG.PAGE_SIZE) {
    const url = new URL(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TOILETS}`);
    url.searchParams.append('page', page.toString());
    url.searchParams.append('limit', pageSize.toString());
    
    try {
      const response = await this.fetchWithTimeout(url.toString());
      return {
        toilets: this.transformToiletData(response.data || response),
        hasMore: response.hasMore || false,
        totalCount: response.totalCount || 0,
      };
    } catch (error) {
      console.error('獲取廁所資料失敗:', error);
      return { toilets: [], hasMore: false, totalCount: 0 };
    }
  }

  // 搜尋廁所
  static async searchToilets(query: string, latitude?: number, longitude?: number): Promise<Bathroom[]> {
    const url = new URL(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TOILETS}`);
    url.searchParams.append('search', query);
    if (latitude && longitude) {
      url.searchParams.append('lat', latitude.toString());
      url.searchParams.append('lng', longitude.toString());
    }
    
    try {
      const toilets: APIToilet[] = await this.fetchWithTimeout(url.toString());
      return this.transformToiletData(toilets);
    } catch (error) {
      console.error('搜尋廁所失敗:', error);
      return [];
    }
  }

  // 轉換資料格式
  static transformToiletData(apiToilets: APIToilet[]): Bathroom[] {
    return apiToilets.map((toilet, index) => ({
      id: toilet.toilet_id || `toilet-${index}`,
      name: toilet.name || 'Unknown Toilet',
      address: toilet.address || 'Unknown Address',
      latitude: parseFloat(toilet.latitude?.toString()) || 0,
      longitude: parseFloat(toilet.longitude?.toString()) || 0,
      rating: 4.0, // 預設評分
      distance: 0, // 會在前端計算
      type: toilet.toilet_type || toilet.type2 || 'Public',
      source: this.determineSource(toilet),
      reviews: [],
      funnyQuote: FUNNY_QUOTES[Math.floor(Math.random() * FUNNY_QUOTES.length)],
      city: toilet.city,
      administration: toilet.administration,
      grade: toilet.grade,
    }));
  }

  static determineSource(toilet: APIToilet): 'gov' | 'commercial' | 'international' {
    const name = toilet.name || '';
    const address = toilet.address || '';
    const type = toilet.toilet_type || toilet.type2 || '';
    
    if (isGovernmentFacility(name, address, type, '')) {
      return 'gov';
    }
    
    if (isInTaiwan(toilet.latitude, toilet.longitude)) {
      return 'commercial';
    }
    
    return 'international';
  }

  // 創建打卡記錄
  static async createCheckin(checkinData: any) {
    try {
      const response = await this.fetchWithTimeout(
        `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.TOILET_CHECKINS}`,
        {
          method: 'POST',
          body: JSON.stringify(checkinData),
        }
      );
      return response;
    } catch (error) {
      console.error('創建打卡失敗:', error);
      throw error;
    }
  }
}