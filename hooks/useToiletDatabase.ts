// hooks/useToiletDatabase.ts

import { useState, useCallback, useRef } from 'react';
import { ToiletAPIService, Bathroom } from '@/services/ToiletAPIService';
import { calculateDistance } from '@/utils/helpers';

export const useToiletDatabase = () => {
  const [nearbyBathrooms, setNearbyBathrooms] = useState<Bathroom[]>([]);
  const [allBathrooms, setAllBathrooms] = useState<Bathroom[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const currentPage = useRef(1);

  // 載入附近廁所
  const loadNearbyBathrooms = useCallback(async (latitude: number, longitude: number, radius = 1000) => {
    setLoading(true);
    setError(null);
    setLoadingProgress(10);
    
    try {
      console.log('🔍 正在載入附近廁所...');
      const bathrooms = await ToiletAPIService.getNearbyToilets(latitude, longitude, radius);
      
      // 計算距離並排序
      const bathroomsWithDistance = bathrooms.map(bathroom => {
        const distance = calculateDistance(latitude, longitude, bathroom.latitude, bathroom.longitude);
        return { ...bathroom, distance: distance / 1000 }; // 轉換為公里
      }).sort((a, b) => a.distance - b.distance);
      
      setNearbyBathrooms(bathroomsWithDistance);
      setLoadingProgress(100);
      console.log(`✅ 載入了 ${bathroomsWithDistance.length} 個附近廁所`);
    } catch (err) {
      setError('載入附近廁所失敗');
      console.error('載入附近廁所錯誤:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 分頁載入所有廁所
  const loadMoreBathrooms = useCallback(async () => {
    if (loading || !hasMoreData) return;
    
    setLoading(true);
    setLoadingProgress(prev => Math.min(prev + 20, 90));
    
    try {
      console.log(`📄 載入第 ${currentPage.current} 頁廁所資料...`);
      const { toilets, hasMore } = await ToiletAPIService.getAllToilets(currentPage.current);
      
      setAllBathrooms(prev => [...prev, ...toilets]);
      setHasMoreData(hasMore);
      currentPage.current += 1;
      
      console.log(`✅ 載入了 ${toilets.length} 個廁所，總計 ${allBathrooms.length + toilets.length} 個`);
    } catch (err) {
      setError('載入廁所資料失敗');
      console.error('載入廁所錯誤:', err);
    } finally {
      setLoading(false);
      setLoadingProgress(100);
    }
  }, [loading, hasMoreData, allBathrooms.length]);

  // 搜尋廁所
  const searchBathrooms = useCallback(async (query: string, latitude?: number, longitude?: number) => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 搜尋廁所: ${query}`);
      const results = await ToiletAPIService.searchToilets(query, latitude, longitude);
      
      if (latitude && longitude) {
        const resultsWithDistance = results.map(bathroom => {
          const distance = calculateDistance(latitude, longitude, bathroom.latitude, bathroom.longitude);
          return { ...bathroom, distance: distance / 1000 };
        }).sort((a, b) => a.distance - b.distance);
        
        return resultsWithDistance;
      }
      
      return results;
    } catch (err) {
      setError('搜尋失敗');
      console.error('搜尋錯誤:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // 重置資料
  const resetData = useCallback(() => {
    setAllBathrooms([]);
    setNearbyBathrooms([]);
    setError(null);
    setLoadingProgress(0);
    setHasMoreData(true);
    currentPage.current = 1;
  }, []);

  return {
    nearbyBathrooms,
    allBathrooms,
    loading,
    error,
    loadingProgress,
    hasMoreData,
    loadNearbyBathrooms,
    loadMoreBathrooms,
    searchBathrooms,
    resetData,
  };
};