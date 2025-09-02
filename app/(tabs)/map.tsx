import React, { useState, useEffect, useRef, useCallback, useMemo,memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, Alert, Modal, TextInput, ScrollView, Image, Share, KeyboardAvoidingView, Linking, FlatList } from 'react-native';
import Colors from '@/constants/colors';
import { MapPin, Navigation, Compass, List, Heart, Camera, Calendar, Trophy, Route, MessageCircle, Star, Upload, Mic, MicOff, Share2, Eye, EyeOff, Filter, ChevronDown, ChevronUp } from 'lucide-react-native';
import MapView, { Marker, Polyline, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import API_BASE_URL from '@/config';
// 🆕 新增：資料庫整合
import { useToiletDatabase } from '@/hooks/useToiletDatabase';
import { ToiletAPIService } from '@/services/ToiletAPIService';

// 🔄 保留你的所有原有介面和常數
import changhua from '@/assets/public_bathroom/Changhua.json';
import Chiayi from '@/assets/public_bathroom/Chiayi.json';
import Chiayi2 from '@/assets/public_bathroom/Chiayi2.json';
import Hsinchu from '@/assets/public_bathroom/Hsinchu.json';
import Hsinchu2 from '@/assets/public_bathroom/Hsinchu2.json';
import Hualien from '@/assets/public_bathroom/Hualien.json';
import Kaohsiung from '@/assets/public_bathroom/Kaohsiung.json';
import Keelung from '@/assets/public_bathroom/Keelung.json';
import Kinmen from '@/assets/public_bathroom/Kinmen.json';
import Lienchiang from '@/assets/public_bathroom/Lienchiang.json';
import Miaoli from '@/assets/public_bathroom/Miaoli.json';
import Nantou from '@/assets/public_bathroom/Nantou.json';
import new_taipei from '@/assets/public_bathroom/new_taipei.json';
import Penghu from '@/assets/public_bathroom/Penghu.json';
import Pingtung from '@/assets/public_bathroom/Pingtung.json';
import Taichung from '@/assets/public_bathroom/Taichung.json';
import Tainan from '@/assets/public_bathroom/Tainan.json';
import Taipei from '@/assets/public_bathroom/Taipei.json';
import Taitung from '@/assets/public_bathroom/Taitung.json';
import Taoyuan from '@/assets/public_bathroom/Taoyuan.json';
import Yilan from '@/assets/public_bathroom/Yilan.json';
import Yunlin from '@/assets/public_bathroom/Yunlin.json';
import changGungData from '@/assets/public_bathroom/CGU.json';

// 🔄 保留你的所有介面定義
interface Bathroom {
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
  reviews?: Review[];
  funnyQuote?: string;
  university?: string;
  building?: string;
  campusArea?: string;
  needCard?: boolean;
  floors?: string;
  locationDetail?: string;
  side?: string;
  price?: number;
  originalDescription?: string;
}

// 🔄 簡化 Review 介面
interface Review {
  id: string;
  rating: number;
  comment: string;
  timestamp: number;
}

interface PublicCheckInData {
  id: string;
  user_id: string | number;
  bathroom_name: string;
  latitude: string;
  longitude: string;
  mood_emoji: string;
  bristol_type?: number;
  custom_message?: string;
  created_at: string;
  is_anonymous: boolean;
}

interface PrivateCheckInData {
  id: string;
  user_id: string | number;
  bathroom_name: string;
  latitude: string;
  longitude: string;
  mood_emoji: string;
  bristol_type?: number;
  custom_message?: string;
  created_at: string;
}

interface CheckInRecord {
  id: string;
  timestamp: number;
  bathroom: Bathroom;
  mood: string;
  bristolType?: number;
  note: string;
  quickTag: string;
  rating: number;
  image?: string;
  audioUri?: string;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  isPrivate: boolean;
  anonymous: boolean;
  customMessage?: string;
}
;

const BRISTOL_EMOJIS: Record<number, string> = {
  1: '🥵', 2: '😓', 3: '🧻', 4: '😊', 5: '😅', 6: '🥲', 7: '💧',
};

const MOOD_EMOJIS = ['🧻', '💩', '🥲', '🥵', '😊', '😅', '🌟', '💫', '😤', '😏', '🚽', '💨'];

const QUICK_TAGS = [
  'High Speed Rail', 'Restaurant', "Friend's House", 'Park', 'International', 'On a Date', 
  'Airport', 'Office', 'Mall', 'Gas Station', 'Cafe', 'School'
];

const FUNNY_QUOTES = [
  "Just dropped my kids off at the pool.",
  "Mission accomplished: Operation Brown Thunder.",
  "The bathroom was my sanctuary today.",
  "Another successful pit stop!",
  "Nature called, I answered.",
];

// 🔄 保留你的工具函數
const isInTaiwan = (lat: number, lng: number): boolean => {
  return lat >= 21.5 && lat <= 25.5 && lng >= 119.5 && lng <= 122.5;
};

const isGovernmentFacility = (name: string, address: string, type: string, type2?: string): boolean => {
  const govKeywords = [
    '公所', '市政府', '縣政府', '區公所', '鄉公所', '鎮公所', '里民活動中心', 
    '公園', '學校', '圖書館', '醫院', '衛生所', '國小', '國中', '高中', '大學',
    '火車站', '捷運站', '政府', '市府', '縣府', '戶政', '地政', '警察局', '消防局'
  ];
  
  const allText = `${name || ''} ${address || ''} ${type || ''} ${type2 || ''}`;
  return govKeywords.some(keyword => allText.includes(keyword));
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const getBathroomIcon = (bathroom: Bathroom) => {
  switch (bathroom.source) {
    case 'gov': return '🏛️';
    case 'commercial': return '🚻';
    case 'international': return '🌍';
    default: return '🚽';
  }
};

const getMarkerColor = (bathroom: Bathroom) => {
  switch (bathroom.source) {
    case 'gov': return '#34C759';
    case 'commercial': return '#007AFF';
    case 'international': return '#FF9500';
    default: return '#FF9500';
  }
};

const getBathroomDisplayName = (bathroom: Bathroom): string => {
  const emoji = getBathroomIcon(bathroom);
  return `${emoji} ${bathroom.name}`;
};

// 🔄 保留你的 Mock 資料作為備用
const mockBathrooms: Bathroom[] = [
  {
    id: 'commercial-1',
    name: 'Starbucks',
    distance: 0.2,
    rating: 4.5,
    type: 'Café',
    address: '123 Main St',
    latitude: 25.0518,
    longitude: 121.5637,
    source: 'commercial',
    reviews: [],
    funnyQuote: FUNNY_QUOTES[0],
  },
  {
    id: 'commercial-2',
    name: 'McDonald\'s',
    distance: 0.3,
    rating: 4.0,
    type: 'Fast Food',
    address: '456 Oak Ave',
    latitude: 25.0525,
    longitude: 121.5644,
    source: 'commercial',
    reviews: [],
    funnyQuote: FUNNY_QUOTES[1],
  },
  {
    id: 'gov-1',
    name: 'Public Library',
    distance: 0.4,
    rating: 4.2,
    type: 'Library',
    address: '789 Pine St',
    latitude: 25.0512,
    longitude: 121.5630,
    source: 'gov',
    reviews: [],
    funnyQuote: FUNNY_QUOTES[2],
  },
];

const internationalBathrooms: Bathroom[] = [
  {
    id: 'int-1',
    name: 'Times Square Public Restroom',
    distance: 0,
    rating: 3.5,
    type: 'Public',
    address: 'Times Square, NYC',
    latitude: 40.7580,
    longitude: -73.9855,
    source: 'international',
    reviews: [],
    funnyQuote: FUNNY_QUOTES[3],
  },
  {
    id: 'int-2',
    name: 'Tower Bridge Facilities',
    distance: 0,
    rating: 4.0,
    type: 'Tourist',
    address: 'Tower Bridge, London',
    latitude: 51.5055,
    longitude: -0.0754,
    source: 'international',
    reviews: [],
    funnyQuote: FUNNY_QUOTES[4],
  },
];

const localStorageUtil = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        localStorage.setItem(key, value);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (error) {
      console.warn('Storage error:', error);
    }
  }
};
export default function MapScreen() {
  const mapRef = useRef<any>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // 🆕 使用資料庫 Hook 替代原本的 allBathrooms
  const {
    nearbyBathrooms: dbNearbyBathrooms,
    allBathrooms: dbAllBathrooms,
    loading: dbLoading,
    error: dbError,
    loadingProgress,
    loadNearbyBathrooms,
    searchBathrooms,
  } = useToiletDatabase();

  // 🔄 保留你的其他狀態
  const [allBathrooms, setAllBathrooms] = useState<Bathroom[]>([]);
  const [nearbyBathrooms, setNearbyBathrooms] = useState<Bathroom[]>([]);
  const [activeTab, setActiveTab] = useState(Platform.OS === 'web' ? 'nearby' : 'map');
  const [selectedBathroom, setSelectedBathroom] = useState<Bathroom | null>(null);
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([]);
  const [showRecords, setShowRecords] = useState(true);
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [showRecordsDrawer, setShowRecordsDrawer] = useState(false);
  const [publicCheckIns, setPublicCheckIns] = useState<PublicCheckInData[]>([]);
  const [privateCheckIns, setPrivateCheckIns] = useState<PrivateCheckInData[]>([]);
  // 🔄 保留你的 Modal 狀態
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [checkInMood, setCheckInMood] = useState('');
  const [checkInNote, setCheckInNote] = useState('');
  const [checkInRating, setCheckInRating] = useState(5);
  const [checkInBristolType, setCheckInBristolType] = useState<number | undefined>();
  const [checkInQuickTag, setCheckInQuickTag] = useState('');
  const [checkInImage, setCheckInImage] = useState<string | null>(null);
  const [checkInAudio, setCheckInAudio] = useState<string | null>(null);
  const [isPrivateCheckIn, setIsPrivateCheckIn] = useState(false);
  const [isAnonymousCheckIn, setIsAnonymousCheckIn] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<any>(null);
  
  // 🔄 簡化評論狀態 - 移除複雜的評論功能
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  
  const [showTodayRecords, setShowTodayRecords] = useState(true);
  const [showPreviousRecords, setShowPreviousRecords] = useState(false);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [visitedBathroomIds, setVisitedBathroomIds] = useState<string[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [showPoopLinePage, setShowPoopLinePage] = useState(false);
  // 🆕 狀態變化監控 - Debug用
  useEffect(() => {
    console.log('🔄 狀態變化監控:');
    console.log('- showCheckInModal:', showCheckInModal);
    console.log('- selectedBathroom:', selectedBathroom?.name);
    console.log('- checkInMood:', checkInMood);
    console.log('- location存在:', !!location);
  }, [showCheckInModal, selectedBathroom, checkInMood, location]);

  // Load check-in records
  const loadCheckInRecords = async () => {
    try {
      const records = await localStorageUtil.getItem('checkInRecords');
      if (records) {
        const parsedRecords = JSON.parse(records);
        setCheckInRecords(parsedRecords);
        setVisitedBathroomIds(parsedRecords.map((r: CheckInRecord) => r.bathroom.id));
      } else {
        // 專為測試做的模擬資料
        const now = Date.now();
        const demoRecords: CheckInRecord[] = [
          {
            id: 'mock-1',
            timestamp: now - 1000 * 60 * 60 * 2,
            bathroom: mockBathrooms[0],
            mood: '💩',
            bristolType: 4,
            note: '超順暢的早上',
            quickTag: 'Cafe',
            rating: 4,
            image: undefined,
            audioUri: undefined,
            location: {
              lat: mockBathrooms[0].latitude,
              lng: mockBathrooms[0].longitude,
              name: mockBathrooms[0].name,
            },
            isPrivate: false,
            anonymous: false,
            customMessage: '一天的開始就從咖啡館出發 ☕',
          },
          {
            id: 'mock-2',
            timestamp: now - 1000 * 60 * 60 * 5,
            bathroom: mockBathrooms[1],
            mood: '😅',
            bristolType: 5,
            note: '有點急的狀況',
            quickTag: 'Mall',
            rating: 3,
            image: undefined,
            audioUri: undefined,
            location: {
              lat: mockBathrooms[1].latitude,
              lng: mockBathrooms[1].longitude,
              name: mockBathrooms[1].name,
            },
            isPrivate: false,
            anonymous: true,
            customMessage: '緊急應變！',
          },
        ];

        setCheckInRecords(demoRecords);
        setVisitedBathroomIds(demoRecords.map(r => r.bathroom.id));
        await localStorageUtil.setItem('checkInRecords', JSON.stringify(demoRecords));
      }
    } catch (error) {
      console.error('載入打卡記錄失敗:', error);
    }
  };
const fetchPublicCheckIns = async () => {
  try {
    // Get ALL public check-ins (from all users)
    const response = await fetch('https://poopalooza-backend-api-af34f62d7c87.herokuapp.com/public-checkins');
    const data: PublicCheckInData[] = await response.json();
    console.log('Fetched all public check-ins:', data.length);
    setPublicCheckIns(data);
  } catch (error) {
    console.error('Failed to fetch public check-ins:', error);
  }
};

const fetchPrivateCheckIns = async () => {
  try {
    const userId = 1; // TODO: Get from auth/user context
    // Get only current user's private check-ins
    const response = await fetch(`https://poopalooza-backend-api-af34f62d7c87.herokuapp.com/private-checkins?user_id=${userId}`);
    const data: PrivateCheckInData[] = await response.json();
    console.log('Fetched user private check-ins:', data.length);
    setPrivateCheckIns(data);
  } catch (error) {
    console.error('Failed to fetch private check-ins:', error);
  }
};
  // Image picker
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCheckInImage(result.assets[0].uri);
      }
    } catch (error) {
      console.warn('Image picker error:', error);
    }
  };

  // Camera picker
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Sorry, we need camera permissions to make this work!');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setCheckInImage(result.assets[0].uri);
      }
    } catch (error) {
      console.warn('Camera error:', error);
    }
  };

  // 🔧 修正：Validate check-in form
  const validateCheckInForm = (): boolean => {
    console.log('🔍 驗證表單 - checkInMood:', checkInMood);
    
    if (!checkInMood) {
      Alert.alert('選擇心情', '請選擇一個心情或大便狀態');
      return false;
    }
    return true;
  };

const performCheckIn = async () => {
  if (!selectedBathroom) {
    Alert.alert('Error', 'No bathroom selected');
    return;
  }
  
  if (!checkInMood) {
    Alert.alert('Select mood', 'Please select a mood');
    return;
  }
  
  try {
    const API_URL = 'https://poopalooza-backend-api-af34f62d7c87.herokuapp.com';
    
    const checkInData = {
      user_id: 1,
      checkin_time: new Date().toISOString().slice(0, 19).replace('T', ' '),
      latitude: selectedBathroom.latitude,
      longitude: selectedBathroom.longitude,
      toilet_name: selectedBathroom.name,
      toilet_rating_cleanliness: checkInRating,
      toilet_rating_privacy: isPrivateCheckIn ? 5 : 3,
      toilet_rating_amenities: checkInRating,
      toilet_review_text: `${checkInMood} - ${customMessage || checkInNote}`,
      public_toilet_id: selectedBathroom.id
    };
    
    console.log('Sending check-in data:', JSON.stringify(checkInData, null, 2));
    
    const response = await fetch(`${API_URL}/toilet_checkins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkInData),
    });
    
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}: ${responseText}`);
    }
    
    const result = JSON.parse(responseText);
    console.log('Check-in saved:', result);
    
    // Save locally...
    const localRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      bathroom: selectedBathroom,
      mood: checkInMood,
      bristolType: checkInBristolType,
      note: checkInNote,
      quickTag: checkInQuickTag,
      rating: checkInRating,
      location: {
        lat: selectedBathroom.latitude,
        lng: selectedBathroom.longitude,
        name: selectedBathroom.name,
      },
      isPrivate: isPrivateCheckIn,
      anonymous: isAnonymousCheckIn,
      customMessage: customMessage,
    };
    
    const updatedRecords = [...checkInRecords, localRecord];
    setCheckInRecords(updatedRecords);
    await localStorageUtil.setItem('checkInRecords', JSON.stringify(updatedRecords));
    
    setShowCheckInModal(false);
    resetCheckInForm(false);
    
    Alert.alert('Success!', 'Check-in saved to database!');
    
  } catch (error) {
    console.error('Full error details:', error);
    if (error instanceof Error) {
      Alert.alert('Error', `Failed to save: ${error.message}`);
    } else {
      Alert.alert('Error', 'Failed to save: Unknown error');
    }
  }
};
  // 🆕 混合資料策略：資料庫優先，備用本地資料
const finalAllBathrooms = useMemo(() => {
  if (dbAllBathrooms.length > 0) {
    return dbAllBathrooms; // 優先使用資料庫資料
  }
  return allBathrooms; // 備用本地資料
}, [dbAllBathrooms, allBathrooms]);

const finalNearbyBathrooms = useMemo(() => {
  if (dbNearbyBathrooms.length > 0) {
    return dbNearbyBathrooms; // 優先使用資料庫資料
  }
  return nearbyBathrooms; // 備用本地資料
}, [dbNearbyBathrooms, nearbyBathrooms]);
  // Reset check-in form
  const resetCheckInForm = (closeModal = true) => {
    setCheckInNote('');
    setCheckInMood('');
    setCheckInRating(5);
    setCheckInBristolType(undefined);
    setCheckInQuickTag('');
    setCheckInImage(null);
    setCheckInAudio(null);
    setIsPrivateCheckIn(false);
    setIsAnonymousCheckIn(false);
    setCustomMessage('');
    setSelectedBathroom(null);
    if (closeModal) setShowCheckInModal(false);
  };

  // 🔄 簡化評論提交功能
  const submitReview = async () => {
    if (!selectedBathroom || !reviewText.trim()) {
      Alert.alert('Fill Review', 'Please enter review content');
      return;
    }

    try {
      const newReview: Review = {
        id: Date.now().toString(),
        rating: reviewRating,
        comment: reviewText,
        timestamp: Date.now(),
      };

      // Update bathroom reviews
      const updatedBathrooms = allBathrooms.map(bathroom => {
        if (bathroom.id === selectedBathroom.id) {
          const updatedReviews = [...(bathroom.reviews || []), newReview];
          const avgRating = updatedReviews.reduce((sum, review) => sum + review.rating, 0) / updatedReviews.length;
          return {
            ...bathroom,
            reviews: updatedReviews,
            rating: avgRating,
          };
        }
        return bathroom;
      });

      setAllBathrooms(updatedBathrooms);

      // Reset review form
      setShowReviewModal(false);
      setReviewText('');
      setReviewRating(5);
      
      Alert.alert('✅ Review Submitted', 'Thank you for your review!');
    } catch (error) {
      console.error('Review submission error:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    }
  };

  // Share poop journey
  const sharePooJourney = async () => {
    try {
      const todayRecords = getTodayRecords();
      const message = `Today's poop adventure: Visited ${todayRecords.length} bathrooms!\n${todayRecords.map(r => `${r.mood} ${r.bathroom.name}`).join('\n')}\n\nFrom PooPalooza 💩`;
      
      await Share.share({
        message: message,
        title: 'My Poop Adventure',
      });
    } catch (error) {
      console.error('分享失敗:', error);
    }
  };

  // Get today's records
  const getTodayRecords = (): CheckInRecord[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkInRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
  };

  // Get previous records (not today)
  const getPreviousRecords = (): CheckInRecord[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkInRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() < today.getTime();
    });
  };
  // Filter bathrooms within 1.5km
  const filterNearbyBathrooms = (userLocation: Location.LocationObject, bathrooms: Bathroom[]) => {
    return bathrooms
      .map(bathroom => {
        const distance = calculateDistance(
          userLocation.coords.latitude,
          userLocation.coords.longitude,
          bathroom.latitude,
          bathroom.longitude
        );
        return { ...bathroom, distance: distance / 1000 }; // 轉換為公里
      })
      .filter(bathroom => bathroom.distance <= 1.5) // 500公尺內
      .sort((a, b) => a.distance - b.distance); // 按距離排序
  };  

  // 🆕 新增這個完整函數
const clusterNearbyMarkers = (bathrooms: Bathroom[], threshold = 0.001) => {
  const clusters: Array<{
    id: string;
    bathrooms: Bathroom[];
    latitude: number;
    longitude: number;
    count: number;
  }> = [];
  
  const processed = new Set<string>();
  
  bathrooms.forEach(bathroom => {
    if (processed.has(bathroom.id)) return;
    
    // 找出附近的廁所
    const nearbyBathrooms = bathrooms.filter(other => {
      if (processed.has(other.id) || other.id === bathroom.id) return false;
      
      const distance = Math.abs(bathroom.latitude - other.latitude) + 
                      Math.abs(bathroom.longitude - other.longitude);
      return distance < threshold; // 約100公尺內視為同一個聚集
    });
    
    if (nearbyBathrooms.length > 0) {
      // 創建聚合點
      const allBathrooms = [bathroom, ...nearbyBathrooms];
      const avgLat = allBathrooms.reduce((sum, b) => sum + b.latitude, 0) / allBathrooms.length;
      const avgLng = allBathrooms.reduce((sum, b) => sum + b.longitude, 0) / allBathrooms.length;
      
      clusters.push({
        id: `cluster-${bathroom.id}`,
        bathrooms: allBathrooms,
        latitude: avgLat,
        longitude: avgLng,
        count: allBathrooms.length
      });
      
      // 標記為已處理
      allBathrooms.forEach(b => processed.add(b.id));
    } else {
      // 單獨的廁所
      clusters.push({
        id: bathroom.id,
        bathrooms: [bathroom],
        latitude: bathroom.latitude,
        longitude: bathroom.longitude,
        count: 1
      });
      processed.add(bathroom.id);
    }
    });
  
  return clusters;
};

  const convertChangGungData = (jsonData: any[]): Bathroom[] => {
    return jsonData.map((toilet) => ({
      id: toilet.id,
      name: toilet.name,
      distance: 0, // 會在後續計算
      rating: Math.round((Math.random() * 1.5 + 3.5) * 10) / 10, // 3.5-5.0 隨機評分
      type: toilet.type,
      address: toilet.address,
      latitude: toilet.latitude,
      longitude: toilet.longitude,
      source: 'gov' as const, // 大學廁所歸類為政府設施
      reviews: [],
      funnyQuote: FUNNY_QUOTES[Math.floor(Math.random() * FUNNY_QUOTES.length)],
      
      // 大學廁所特有屬性
      university: '長庚大學',
      building: toilet.building,
      campusArea: toilet.campus_area,
      needCard: toilet.needCard,
      floors: toilet.floors,
      locationDetail: toilet.location_detail || '',
      side: toilet.side || '',
      price: toilet.price,
      originalDescription: toilet.description,
    }));
  };

// 🆕 模擬更多廁所資料（基於台灣常見地點）
const generateMoreMockBathrooms = (userLat: number, userLng: number): Bathroom[] => {
  const commonPlaces = [
    { name: '7-ELEVEN', type: 'Convenience Store' },
    { name: '全家便利商店', type: 'Convenience Store' },
    { name: 'OK超商', type: 'Convenience Store' },
    { name: '萊爾富', type: 'Convenience Store' },
    { name: '麥當勞', type: 'Fast Food' },
    { name: '肯德基', type: 'Fast Food' },
    { name: '摩斯漢堡', type: 'Fast Food' },
    { name: '星巴克', type: 'Cafe' },
    { name: '85度C', type: 'Cafe' },
    { name: '路易莎咖啡', type: 'Cafe' },
    { name: '丹堤咖啡', type: 'Cafe' },
    { name: '公園公廁', type: 'Public Toilet' },
    { name: '捷運站廁所', type: 'Transportation' },
    { name: '火車站廁所', type: 'Transportation' },
    { name: '百貨公司', type: 'Shopping Mall' },
    { name: '家樂福', type: 'Supermarket' },
    { name: '全聯福利中心', type: 'Supermarket' },
    { name: '中油加油站', type: 'Gas Station' },
    { name: '台塑加油站', type: 'Gas Station' },
    { name: '市場公廁', type: 'Public Market' },
  ];

  const mockBathrooms: Bathroom[] = [];
  
  // 在用戶周圍 2km 內生成隨機廁所
  for (let i = 0; i < 40; i++) {
    const randomPlace = commonPlaces[Math.floor(Math.random() * commonPlaces.length)];
    const randomLat = userLat + (Math.random() - 0.5) * 0.025; // 約 ±1.5km
    const randomLng = userLng + (Math.random() - 0.5) * 0.025;
    
    mockBathrooms.push({
      id: `mock-nearby-${i}`,
      name: `${randomPlace.name} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 99)}店`,
      latitude: randomLat,
      longitude: randomLng,
      address: `${randomPlace.name}地址 ${i + 1}號`,
      rating: Math.round((Math.random() * 2 + 3) * 10) / 10, // 3.0-5.0
      distance: 0,
      type: randomPlace.type,
      source: randomPlace.type === 'Public Toilet' || randomPlace.type === 'Transportation' ? 'gov' : 'commercial',
      reviews: [],
      funnyQuote: FUNNY_QUOTES[Math.floor(Math.random() * FUNNY_QUOTES.length)],
    });
  }
  
  return mockBathrooms;
};

  const bathroomStats = useMemo(() => {
    const targetBathrooms = finalNearbyBathrooms; 
    const govCount = targetBathrooms.filter(b => b.source === 'gov').length;
    const commercialCount = targetBathrooms.filter(b => b.source === 'commercial').length;
    const internationalCount = targetBathrooms.filter(b => b.source === 'international').length;
    return { govCount, commercialCount, internationalCount };
  }, [finalNearbyBathrooms]);

  const sortedRecords = useMemo(() => 
    [...checkInRecords].sort((a, b) => a.timestamp - b.timestamp),
    [checkInRecords]
  );

  const displayBathrooms = useMemo(() => {
    switch (activeTab) {
      case 'visited':
      case 'journey':
      case 'poopline': 
        return checkInRecords.map(r => r.bathroom);
      case 'nearby':
        return finalNearbyBathrooms; 
      default:
        return finalAllBathrooms; 
    }
  }, [activeTab, checkInRecords, finalNearbyBathrooms, finalAllBathrooms]);

  const journeyStats = useMemo(() => {
    const locationCounts = checkInRecords.reduce((acc, record) => {
      acc[record.bathroom.id] = (acc[record.bathroom.id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const favoriteLocationEntry = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      totalCheckIns: checkInRecords.length,
      uniqueLocations: new Set(checkInRecords.map(r => r.bathroom.id)).size,
      totalDistance: 0,
      favoriteLocation: favoriteLocationEntry ? 
        checkInRecords.find(r => r.bathroom.id === favoriteLocationEntry[0])?.bathroom.name || '' 
        : '',
    };
  }, [checkInRecords]);
  // Filter nearby bathrooms when location is obtained
  useEffect(() => {
    if (location && finalAllBathrooms.length > 0) { // 使用混合資料
      console.log('🎯 開始篩選500公尺內廁所...');
      const nearby = filterNearbyBathrooms(location, finalAllBathrooms);
      console.log(`📍 找到 ${nearby.length} 個500公尺內的廁所`);
      setNearbyBathrooms(nearby);
    }
  }, [location, finalAllBathrooms]);

  // Auto move map to user location when location is obtained
  useEffect(() => {
    if (location && mapReady && (activeTab === 'map' || activeTab === 'visited')) {
      const timer = setTimeout(() => {
        centerMapOnUser();
      }, 500);
      
      return () => clearTimeout(timer); 
    }
  }, [location, activeTab, mapReady]);

  useEffect(() => {
    const initializeApp = async () => {
      console.log('🚀 初始化應用資料');
      await loadCheckInRecords();
      await fetchPublicCheckIns(); 
      await fetchPrivateCheckIns();
      console.log('📊 本地資料初始化完成');
    };
    
    initializeApp();
  }, []);

  const initializeBasicData = () => {
    const changGungBathrooms = convertChangGungData(changGungData);
    return [
      ...mockBathrooms,
      ...changGungBathrooms,
      ...internationalBathrooms
    ];
  };

  // Get location and government data - run in background, non-blocking
  useEffect(() => {
    const getLocationAndData = async () => {
      if (Platform.OS === 'web') {
        console.log('🌐 Web 平台，跳過位置獲取');
        const basicBathroomsData = initializeBasicData();
        setAllBathrooms(basicBathroomsData);
        console.log(`📊 Web 平台載入：${basicBathroomsData.length} 個廁所`);
        return;
      }

      const changGungBathrooms = convertChangGungData(changGungData);

      try {
        console.log('📍 開始請求位置權限...');
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('📍 權限狀態:', status);
        
        if (status !== 'granted') {
          console.log('❌ 位置權限被拒絕');
          setErrorMsg('Permission to access location was denied');
          const allBathroomsData = [
            ...mockBathrooms,
            ...changGungBathrooms,
            ...internationalBathrooms
          ];
          setAllBathrooms(allBathroomsData);
          console.log(`📊 無位置權限，載入基本資料：${allBathroomsData.length} 個廁所`);
          return;
        }

        console.log('📍 獲取當前位置...');
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        console.log('📍 位置獲取成功：', currentLocation.coords);
        setLocation(currentLocation);
        // 🆕 生成附近模擬廁所
        console.log('🏪 生成附近常見廁所...');
        const nearbyMockBathrooms = generateMoreMockBathrooms(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude
        );
        console.log(`🎯 模擬生成 ${nearbyMockBathrooms.length} 個附近廁所`);

        // 🔄 簡化政府資料載入 - 減少資料量避免當機
        console.log('🏛️ 開始處理政府廁所資料...');
        
        // 只載入主要城市的資料，減少記憶體使用
        const govDataSets = [
          { data: Taipei.slice(0, 80), name: '台北' }, // 減少載入量
          { data: new_taipei.slice(0, 60), name: '新北' },
          { data: Taichung.slice(0, 40), name: '台中' },
          { data: Kaohsiung.slice(0, 40), name: '高雄' },
        ];

        // 初始化基本資料
        let allBathroomData = [
          ...mockBathrooms,
          ...changGungBathrooms,
          ...internationalBathrooms,
          ...nearbyMockBathrooms,
        ];

        // 分批載入，避免一次載入太多資料
        for (const { data, name } of govDataSets) {
          console.log(`📊 載入 ${name}...`);
          
          const batchBathrooms: Bathroom[] = data
            .filter((item) => item.latitude && item.longitude)
            .slice(0, 30) 
            .map((item, index) => {
              const lat = parseFloat(item.latitude);
              const lng = parseFloat(item.longitude);
              
              if (isNaN(lat) || isNaN(lng)) return null;
              
              let source: 'gov' | 'commercial' | 'international' = 'international';
              if (isInTaiwan(lat, lng)) {
                const isGov = isGovernmentFacility(
                  item.name || '', 
                  item.address || '', 
                  item.type || '', 
                  item.type2 || ''
                );
                source = isGov ? 'gov' : 'commercial';
              }

              return {
                id: `${name}-${index}`,
                name: item.name || item.type || item.type2 || 'Public Toilet',
                address: item.address || 'Unknown Address',
                latitude: lat,
                longitude: lng,
                rating: 4.0,
                distance: 0.5,
                type: item.type || item.type2 || 'Public',
                source: source,
                reviews: [],
                funnyQuote: FUNNY_QUOTES[Math.floor(Math.random() * FUNNY_QUOTES.length)],
              };
            })
            .filter(Boolean) as Bathroom[];

          allBathroomData = [...allBathroomData, ...batchBathrooms];
          
          // 讓 UI 有時間更新，避免阻塞
          await new Promise(resolve => setTimeout(resolve, 50));
          
          console.log(`✅ ${name} 載入完成，新增 ${batchBathrooms.length} 個廁所`);
        }
        
        setAllBathrooms(allBathroomData);
        console.log('🎉 政府廁所資料載入完成，總共:', allBathroomData.length);
        
      } catch (error) {
        console.error('❌ 位置獲取失敗：', error);
        const allBathroomsData = [
          ...mockBathrooms,
          ...changGungBathrooms,
          ...internationalBathrooms
        ];
        setAllBathrooms(allBathroomsData);
      }
    };

    getLocationAndData();
  }, []);

  // Center map on user location
  const centerMapOnUser = useCallback(() => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [location]);

  const retryLocationRequest = async () => {
    console.log('🔄 手動重試位置獲取...');
    setIsLocationLoading(true);
    setErrorMsg(null);
    
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      console.log('✅ 重試成功，位置:', currentLocation.coords);
      setLocation(currentLocation);
    } catch (error) {
      console.error('❌ 重試失敗:', error);
      setErrorMsg('Still unable to get location. Please check GPS settings.');
    } finally {
      setIsLocationLoading(false);
    }
  };
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <View style={styles.starsContainer}>
        {Array.from({ length: fullStars }).map((_, i) => (
          <Text key={`full-${i}`} style={styles.starIcon}>
            ★
          </Text>
        ))}
        {halfStar && <Text style={styles.starIcon}>★</Text>}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Text key={`empty-${i}`} style={[styles.starIcon, styles.emptyStar]}>
            ★
          </Text>
        ))}
      </View>
    );
  };

  const renderLoadingProgress = () => {
    if (dbLoading || (allBathrooms.length > 0 && allBathrooms.length < 1000)) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {dbLoading 
              ? `從資料庫載入中... ${Math.round(loadingProgress)}%`
              : `本地資料載入中... 已載入 ${allBathrooms.length} 個廁所`
            }
          </Text>
        </View>
      );
    }
    return null;
  };

  // 🆕 智能地圖渲染 - 限制 marker 數量避免當機
  const limitedDisplayBathrooms = useMemo(() => {
    const bathrooms = displayBathrooms;
    
  // 根據不同 tab 限制數量，避免渲染太多 marker 導致當機
  let filteredBathrooms;
  switch (activeTab) {
    case 'nearby':
      filteredBathrooms = bathrooms.slice(0, 50); // 附近最多 50 個
      break;
    case 'map':
      // 如果有位置，只顯示附近範圍內的
      if (location) {
        const nearbyInRange = bathrooms.filter((b: Bathroom) => {
          const distance = calculateDistance(
            location.coords.latitude,
            location.coords.longitude,
            b.latitude,
            b.longitude
          );
          return distance <= 2000; // 2km 內
        }).slice(0, 80); // 最多 80 個
        filteredBathrooms = nearbyInRange;
      } else {
        filteredBathrooms = bathrooms.slice(0, 60); // 沒有位置時最多 60 個
      }
      break;
    default:
      filteredBathrooms = bathrooms.slice(0, 100); // 其他情況最多 100 個
  }
  
  // 🆕 使用聚合邏輯減少重疊
  return clusterNearbyMarkers(filteredBathrooms);
}, [displayBathrooms, activeTab, location]);

  // 地圖導航功能
  const openMaps = (bathroom: Bathroom) => {
    const { latitude, longitude, name } = bathroom;
    
    let primaryUrl = '';
    let fallbackUrl = '';
    
    if (Platform.OS === 'ios') {
      primaryUrl = `https://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d&t=m`;
      fallbackUrl = `comgooglemaps://?daddr=${latitude},${longitude}&directionsmode=driving`;
    } else if (Platform.OS === 'android') {
      primaryUrl = `google.navigation:q=${latitude},${longitude}&mode=d`;
      fallbackUrl = `geo:${latitude},${longitude}?q=${latitude},${longitude}(${encodeURIComponent(name)})`;
    } else {
      primaryUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(name)}`;
    }

    const webFallback = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    
    Linking.canOpenURL(primaryUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(primaryUrl);
        } else {
          console.log('主要地圖 URL 不支援，使用網頁版');
          return Linking.openURL(webFallback);
        }
      })
      .catch((err) => {
        console.error('開啟地圖 URL 失敗:', err);
        Linking.openURL(webFallback)
          .catch(() => {
            Alert.alert(
              '無法開啟地圖', 
              `請手動搜尋：${name}\n座標：${latitude}, ${longitude}`
            );
          });
      });
  };

  const handleNavigate = (bathroom: Bathroom) => {
    Alert.alert(
      '導航到廁所', 
      `要導航到 ${bathroom.name} 嗎？`, 
      [
        { text: '取消', style: 'cancel' },
        {
          text: '開始導航',
          onPress: () => openMaps(bathroom),
        },
      ]
    );
  };

  // Handle check-in button
  const handleCheckIn = (bathroom: Bathroom | null | undefined) => {
    resetCheckInForm(false);
    if (!bathroom) {
      Alert.alert('錯誤', '無法取得打卡地點資料，請稍後再試');
      setShowCheckInModal(false);
      return;
    }
    setSelectedBathroom(bathroom);
    setShowCheckInModal(true);
  };

const handleQuickLocationCheckIn = () => {
  if (!location) {
    Alert.alert('⚠️ Cannot check in', 'GPS location not available');
    return;
  }

  // Create a location-based "bathroom" entry
  const currentLocationBathroom: Bathroom = {
    id: 'location-' + Date.now(),
    name: 'Current Location',
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    address: `${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)}`,
    rating: 0,
    distance: 0,
    type: 'Personal',
    source: 'commercial',
    reviews: [],
    funnyQuote: 'I was here!',
  };

  setSelectedBathroom(currentLocationBathroom);
  setShowCheckInModal(true);
};

  const handleMoodSelect = (emoji: string) => {
    console.log('選擇心情:', emoji);
    setCheckInMood(emoji);
  };

  const handleTagSelect = (tag: string) => {
    setCheckInQuickTag(tag);
  };

  const handleBristolSelect = (type: number) => {
    console.log('選擇Bristol類型:', type);
    setCheckInBristolType(type);
  };

  const handleRatingSelect = (rating: number) => {
    setCheckInRating(rating);
  };

  // Handle review button
  const handleReview = (bathroom: Bathroom) => {
    setSelectedBathroom(bathroom);
    setShowReviewModal(true);
  };

  // 🆕 新增純位置打卡功能
const handleLocationCheckIn = async () => {
  if (!location) {
    Alert.alert('⚠️ 無法打卡', '尚未取得 GPS 位置，請稍後再試');
    return;
  }

  try {
    // 創建位置打卡記錄
    const locationCheckIn: CheckInRecord = {
      id: `location-${Date.now()}`,
      timestamp: Date.now(),
      bathroom: {
        id: `loc-${Date.now()}`,
        name: 'My Location',
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        address: `位置打卡 (${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)})`,
        rating: 0,
        distance: 0,
        type: 'Location Check-in',
        source: 'commercial',
        reviews: [],
        funnyQuote: 'I was here! 📍',
      },
      mood: '📍', // 預設位置 emoji
      bristolType: undefined,
      note: '純位置打卡',
      quickTag: 'Location',
      rating: 5,
      location: {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        name: 'My Location'
      },
      isPrivate: false,
      anonymous: false,
      customMessage: '我在這裡打卡！',
    };

    const updatedRecords = [...checkInRecords, locationCheckIn];
    setCheckInRecords(updatedRecords);
    await localStorageUtil.setItem('checkInRecords', JSON.stringify(updatedRecords));
    
    Alert.alert('🎉 位置打卡成功！', '已記錄您的位置打卡', [
      { text: '太棒了！', onPress: () => console.log('Location check-in completed') }
    ]);
  } catch (error) {
    console.error('位置打卡失敗:', error);
    Alert.alert('錯誤', '位置打卡失敗，請稍後再試');
  }
};

  // Handle tab press
  const handleTabPress = (tab: string) => {
    console.log(`🔄 切換到 ${tab} 標籤`);
    setActiveTab(tab);
    
    if ((tab === 'map' || tab === 'visited' || tab === 'journey') && location) {
      console.log('🗺️ 切換到地圖頁面，準備移動到用戶位置');
    }
  };
  // 🔄 簡化評論 Modal
  const ReviewModal = () => (
    <Modal
      visible={showReviewModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowReviewModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>
  💩 大便心情打卡 🚽
</Text>

{/* Mood selection */}
<Text style={styles.sectionTitle}>選擇心情 / 大便狀態 *</Text>
<View style={styles.emojiContainer}>
  {MOOD_EMOJIS.map((emoji) => (
    <TouchableOpacity
      key={emoji}
      style={[
        styles.emojiButton,
        checkInMood === emoji && styles.selectedEmoji
      ]}
      onPress={() => handleMoodSelect(emoji)}
      activeOpacity={0.7} 
    >
      <Text style={styles.emojiText}>{emoji}</Text>
    </TouchableOpacity>
  ))}
</View>

{/* One-line Description */}
<Text style={styles.sectionTitle}>心情描述</Text>
<TextInput
  style={styles.messageInput}
  placeholder="例如：今天超順暢！終於解脫了～"
  value={customMessage}
  onChangeText={setCustomMessage}
  maxLength={100}
/>

{/* Bristol Scale selection - 簡化版 */}
<Text style={styles.sectionTitle}>大便類型</Text>
<View style={styles.bristolContainer}>
  {Object.entries(BRISTOL_EMOJIS).map(([type, emoji]) => (
    <TouchableOpacity
      key={type}
      style={[
        styles.bristolButton,
        checkInBristolType === parseInt(type) && styles.selectedBristol
      ]}
      onPress={() => handleBristolSelect(parseInt(type))}
      activeOpacity={0.7}
    >
      <Text style={styles.bristolEmoji}>{emoji}</Text>
      <Text style={styles.bristolType}>類型 {type}</Text>
    </TouchableOpacity>
  ))}
</View>

{/* Privacy settings - 重點功能 */}
<Text style={styles.sectionTitle}>分享設定</Text>
<View style={styles.privacyContainer}>
  <TouchableOpacity 
    style={styles.privacyOption}
    onPress={() => setIsPrivateCheckIn(!isPrivateCheckIn)}
  >
    <Text style={[styles.privacyText, !isPrivateCheckIn && styles.activePrivacyText]}>
      {!isPrivateCheckIn ? '🌍' : '🔒'} {!isPrivateCheckIn ? '公開分享' : '私人紀錄'}
    </Text>
    <Text style={styles.privacySubtext}>
      {!isPrivateCheckIn ? '其他人可以看到這次打卡' : '只有你自己看得到'}
    </Text>
  </TouchableOpacity>
</View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

const CheckInModal = memo(() => {
  // 🔧 修正：使用本地狀態避免外部狀態變化導致重新渲染
  const [localMood, setLocalMood] = useState('');
  const [localMessage, setLocalMessage] = useState('');
  const [localBristolType, setLocalBristolType] = useState<number | undefined>(undefined);
  const [localQuickTag, setLocalQuickTag] = useState('');
  const [localRating, setLocalRating] = useState(5);


useEffect(() => {
    if (showCheckInModal) {
      console.log('🔄 Modal opened - initializing local state');
      setLocalMood(checkInMood || '');
      setLocalMessage(customMessage || '');
      setLocalBristolType(checkInBristolType);
      setLocalQuickTag(checkInQuickTag || '');
      setLocalRating(checkInRating || 5);
    }
    
  }, [showCheckInModal]); 

  const handleClose = useCallback(() => {
    console.log('❌ Modal closing');
    setShowCheckInModal(false);
  }, []);

const handleCheckIn = useCallback(async (isPrivate: boolean) => {
  console.log(`${isPrivate ? '🔒' : '🌍'} ${isPrivate ? 'Private' : 'Public'} check-in started`);
  
  if (!localMood) {
    Alert.alert('Select mood', 'Please select a mood');
    return;
  }
  
  if (!selectedBathroom) {
    Alert.alert('Error', 'No bathroom selected');
    return;
  }
  
  try {
    const API_URL = 'https://poopalooza-backend-api-af34f62d7c87.herokuapp.com';
    
    // Prepare check-in data
    const checkInData = {
      user_id: 1,
      bathroom_id: selectedBathroom.id || `location-${Date.now()}`,
      bathroom_name: selectedBathroom.name,
      bathroom_address: selectedBathroom.address || 'Unknown',
      latitude: selectedBathroom.latitude,
      longitude: selectedBathroom.longitude,
      mood_emoji: localMood,
      bristol_type: localBristolType || null,
      rating: localRating,
      custom_message: localMessage || '',
      quick_tag: localQuickTag || 'Other',
      is_anonymous: false
    };
    
    const endpoint = isPrivate ? '/private-checkins' : '/public-checkins';
    
    console.log(`Sending to ${endpoint}:`, checkInData);
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(checkInData),
    });
    
    // ADD THESE LOGS
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);
    
    if (!response.ok) {
      throw new Error(`Server error (${response.status}): ${responseText}`);
    }
    
    // Try to parse the response
    let responseData;
    try {
      responseData = JSON.parse(responseText);
      console.log('Parsed response:', responseData);
    } catch (e) {
      console.log('Response is not JSON:', responseText);
    }
    
    // Save to local state for immediate UI update
    const localRecord: CheckInRecord = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      bathroom: selectedBathroom,
      mood: localMood,
      bristolType: localBristolType,
      note: localMessage,
      quickTag: localQuickTag,
      rating: localRating,
      location: {
        lat: selectedBathroom.latitude,
        lng: selectedBathroom.longitude,
        name: selectedBathroom.name,
      },
      isPrivate: isPrivate,
      anonymous: false,
      customMessage: localMessage,
    };
    
    // Update local records
    const updatedRecords = [...checkInRecords, localRecord];
    setCheckInRecords(updatedRecords);
    await localStorageUtil.setItem('checkInRecords', JSON.stringify(updatedRecords));
    
    // Refresh the appropriate list
    if (isPrivate) {
      await fetchPrivateCheckIns();
    } else {
      await fetchPublicCheckIns();
    }
    
    // Close modal and reset
    setShowCheckInModal(false);
    setLocalMood('');
    setLocalMessage('');
    setLocalBristolType(undefined);
    setLocalQuickTag('');
    setLocalRating(5);
    
    Alert.alert(
      'Success! 🎉', 
      `Your ${isPrivate ? 'private' : 'public'} check-in has been saved!`
    );
    
  } catch (error: any) {
    console.error('Check-in error:', error);
    Alert.alert('Error', `Failed to save: ${error.message}`);
  }
}, [localMood, localMessage, localBristolType, localQuickTag, localRating, selectedBathroom, checkInRecords]);
  
// 🚨 如果 Modal 不顯示，直接返回 null，避免渲染
  if (!showCheckInModal || !selectedBathroom) {
    return null;
  }

  return (
    <Modal
      visible={showCheckInModal}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
      // 🔧 關鍵：添加這些屬性確保Modal穩定
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}
    >
      {/* 🔧 修正：使用固定的容器樣式 */}
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
      }}>
        <View style={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          height: '90%', // 🔧 修正：使用固定高度而不是 maxHeight
          width: '100%',
        }}>
          {/* 固定Header */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: 'rgba(0,0,0,0.1)',
            backgroundColor: '#FFFFFF',
            height: 70, // 固定高度
          }}>
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: Colors.primary.text,
            }}>💩 Poop Check-In</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: 'rgba(0,0,0,0.1)',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* 🔧 修正：ScrollView 使用固定高度 */}
          <ScrollView 
            style={{ 
              flex: 1,
              backgroundColor: '#FFFFFF',
            }}
            contentContainerStyle={{ 
              padding: 20,
              paddingBottom: 140, // 為底部按鈕留空間
            }}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled" // 🔧 重要：處理鍵盤
            keyboardDismissMode="on-drag" // 拖動時關閉鍵盤
          >
            {/* 1. 心情選擇 */}
            <View style={{ 
              marginBottom: 25,
              backgroundColor: '#F0F8FF',
              padding: 16,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#4A90E2',
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#2C3E50',
                marginBottom: 8,
              }}>😊 SELECT YOUR MOOD</Text>
              
              <Text style={{
                fontSize: 14,
                color: '#7F8C8D',
                marginBottom: 12,
              }}>Currently selected: {localMood ? `${localMood} (Selected)` : '❌ None selected'}</Text>
              
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 10,
              }}>
                {MOOD_EMOJIS.map((emoji, index) => (
                  <TouchableOpacity
                    key={`mood-${emoji}-${index}`}
                    style={{
                      width: 65,
                      height: 65,
                      borderRadius: 32.5,
                      backgroundColor: localMood === emoji ? '#4A90E2' : '#FFFFFF',
                      justifyContent: 'center',
                      alignItems: 'center',
                      borderWidth: 4,
                      borderColor: localMood === emoji ? '#2E86AB' : '#BDC3C7',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.2,
                      shadowRadius: 5,
                      elevation: 5,
                      ...(localMood === emoji && {
                        transform: [{ scale: 1.15 }],
                        shadowOpacity: 0.4,
                      })
                    }}
                    onPress={() => {
                      console.log(`✅ Selecting mood: ${emoji}`);
                      setLocalMood(emoji); // 🔧 使用本地狀態
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 32 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 2. 描述輸入 */}
            <View style={{ 
              marginBottom: 25,
              backgroundColor: '#FFF8DC',
              padding: 16,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#F39C12',
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#2C3E50',
                marginBottom: 8,
              }}>💭 DESCRIPTION</Text>
              
              <Text style={{
                fontSize: 14,
                color: '#7F8C8D',
                marginBottom: 12,
              }}>Content: {localMessage ? `"${localMessage}"` : '❌ Not filled'}</Text>
              
              <TextInput
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 12,
                  padding: 16,
                  fontSize: 16,
                  color: '#2C3E50',
                  textAlignVertical: 'top',
                  minHeight: 100,
                  borderWidth: 3,
                  borderColor: localMessage ? '#27AE60' : '#BDC3C7',
                }}
                placeholder="Share your poop experience... e.g., So smooth today!"
                placeholderTextColor="#95A5A6"
                value={localMessage}
                onChangeText={(text) => {
                  console.log('📝 Description input:', text);
                  setLocalMessage(text); // 🔧 使用本地狀態
                }}
                maxLength={150}
                multiline={true}
                numberOfLines={4}
                // 🔧 重要：防止輸入時重新渲染
                autoCorrect={false}
                autoCapitalize="none"
              />
              <Text style={{
                fontSize: 12,
                color: '#7F8C8D',
                textAlign: 'right',
                marginTop: 5,
              }}>{localMessage.length}/150 characters</Text>
            </View>

            {/* 3. Bristol Scale */}
            <View style={{ 
              marginBottom: 25,
              backgroundColor: '#FFF0F5',
              padding: 16,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#E74C3C',
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#2C3E50',
                marginBottom: 8,
              }}>🧻 BRISTOL STOOL SCALE</Text>
              
              <Text style={{
                fontSize: 14,
                color: '#7F8C8D',
                marginBottom: 12,
              }}>Selected: {localBristolType ? `✅ Type ${localBristolType}` : '❌ None selected'}</Text>
              
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 8,
              }}>
                {Object.entries(BRISTOL_EMOJIS).map(([type, emoji]) => {
                  const typeNum = parseInt(type);
                  return (
                    <TouchableOpacity
                      key={`bristol-${type}`}
                      style={{
                        width: 75,
                        height: 85,
                        borderRadius: 12,
                        backgroundColor: localBristolType === typeNum ? '#E74C3C' : '#FFFFFF',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: 3,
                        borderColor: localBristolType === typeNum ? '#C0392B' : '#BDC3C7',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: 0.2,
                        shadowRadius: 5,
                        elevation: 5,
                        ...(localBristolType === typeNum && {
                          transform: [{ scale: 1.1 }],
                        })
                      }}
                      onPress={() => {
                        console.log(`🧻 Selecting Bristol type: ${type}`);
                        setLocalBristolType(typeNum); // 🔧 使用本地狀態
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={{ fontSize: 30, marginBottom: 5 }}>{emoji}</Text>
                      <Text style={{
                        fontSize: 12,
                        fontWeight: 'bold',
                        color: localBristolType === typeNum ? '#FFFFFF' : '#2C3E50',
                      }}>TYPE {type}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* 4. 快速標籤 */}
            <View style={{ 
              marginBottom: 25,
              backgroundColor: '#F0FFF0',
              padding: 16,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#27AE60',
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#2C3E50',
                marginBottom: 8,
              }}>🏷️ LOCATION TAGS</Text>
              
              <Text style={{
                fontSize: 14,
                color: '#7F8C8D',
                marginBottom: 12,
              }}>Selected: {localQuickTag ? `✅ ${localQuickTag}` : '❌ None selected'}</Text>
              
              <View style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                {QUICK_TAGS.map((tag) => (
                  <TouchableOpacity
                    key={`tag-${tag}`}
                    style={{
                      backgroundColor: localQuickTag === tag ? '#27AE60' : '#FFFFFF',
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      borderRadius: 20,
                      borderWidth: 2,
                      borderColor: localQuickTag === tag ? '#1E8449' : '#BDC3C7',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 3,
                      elevation: 3,
                    }}
                    onPress={() => {
                      console.log(`🏷️ Selecting tag: ${tag}`);
                      setLocalQuickTag(tag); // 🔧 使用本地狀態
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{
                      fontSize: 14,
                      color: localQuickTag === tag ? '#FFFFFF' : '#2C3E50',
                      fontWeight: localQuickTag === tag ? 'bold' : 'normal',
                    }}>{tag}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 5. 評分系統 */}
            <View style={{ 
              marginBottom: 25,
              backgroundColor: '#FFFACD',
              padding: 16,
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#F1C40F',
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                color: '#2C3E50',
                marginBottom: 8,
              }}>⭐ RATING SYSTEM</Text>
              
              <Text style={{
                fontSize: 14,
                color: '#7F8C8D',
                marginBottom: 12,
              }}>Current rating: ✅ {localRating}/5 stars</Text>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'center',
                gap: 12,
              }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={`star-${star}`}
                    onPress={() => {
                      console.log(`⭐ Selecting rating: ${star}`);
                      setLocalRating(star); // 🔧 使用本地狀態
                    }}
                    activeOpacity={0.7}
                    style={{
                      padding: 8,
                    }}
                  >
                    <Text style={{
                      fontSize: 45,
                      color: star <= localRating ? '#F1C40F' : '#BDC3C7',
                      textShadowColor: star <= localRating ? '#F39C12' : 'transparent',
                      textShadowOffset: { width: 1, height: 1 },
                      textShadowRadius: 2,
                    }}>★</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 6. 當前選擇總結 */}
            <View style={{ 
              marginBottom: 30,
              backgroundColor: '#E8F5E8',
              padding: 16,
              borderRadius: 12,
              borderWidth: 3,
              borderColor: '#27AE60',
            }}>
              <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
                color: '#2C3E50',
                marginBottom: 12,
                textAlign: 'center',
              }}>📋 CURRENT SELECTIONS SUMMARY</Text>
              
              <Text style={{ fontSize: 15, marginBottom: 6, fontWeight: '600' }}>
                😊 Mood: {localMood || '❌ Not selected'}
              </Text>
              <Text style={{ fontSize: 15, marginBottom: 6, fontWeight: '600' }}>
                💭 Description: {localMessage || '❌ Not filled'}
              </Text>
              <Text style={{ fontSize: 15, marginBottom: 6, fontWeight: '600' }}>
                🧻 Bristol Type: {localBristolType ? `✅ Type ${localBristolType}` : '❌ Not selected'}
              </Text>
              <Text style={{ fontSize: 15, marginBottom: 6, fontWeight: '600' }}>
                🏷️ Location Tag: {localQuickTag || '❌ Not selected'}
              </Text>
              <Text style={{ fontSize: 15, fontWeight: '600' }}>
                ⭐ Rating: ✅ {localRating}/5 stars
              </Text>
            </View>
          </ScrollView>

          {/* 🔧 修正：固定底部按鈕 */}
          <View style={{
            position: 'absolute', // 🔧 絕對定位確保固定
            bottom: 0,
            left: 0,
            right: 0,
            flexDirection: 'row',
            padding: 20,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 2,
            borderTopColor: '#E0E0E0',
            gap: 15,
            height: 90, // 固定高度
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 18,
                borderRadius: 12,
                backgroundColor: '#6C757D',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 5,
              }}
              onPress={() => handleCheckIn(true)}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: '#FFFFFF',
              }}>🔒 CHECK IN PRIVATE</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 18,
                borderRadius: 12,
                backgroundColor: Colors.primary.accent,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 5,
              }}
              onPress={() => handleCheckIn(false)}
              activeOpacity={0.8}
            >
              <Text style={{
                fontSize: 12,
                fontWeight: 'bold',
                color: '#FFFFFF',
              }}>🌍 CHECK IN PUBLIC</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
});

// 🔧 重要：設定 displayName 用於 debugging
CheckInModal.displayName = 'CheckInModal';
const ClusterModal = () => {
  if (!showClusterModal || !selectedCluster) return null;

  return (
    <Modal
      visible={showClusterModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowClusterModal(false)}
    >
      <View style={styles.clusterModalOverlay}>
        <View style={styles.clusterModalContainer}>
          <View style={styles.clusterModalHeader}>
            <Text style={styles.clusterModalTitle}>
              📍 {selectedCluster.count} 個廁所聚集
            </Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowClusterModal(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.clusterModalContent}>
            {selectedCluster.bathrooms.map((bathroom: Bathroom, index: number) => (
              <TouchableOpacity
                key={bathroom.id}
                style={styles.clusterBathroomCard}
                onPress={() => {
                  setSelectedBathroom(bathroom);
                  setShowClusterModal(false);
                }}
              >
                <View style={styles.clusterBathroomInfo}>
                  <Text style={styles.clusterBathroomName}>
                    {getBathroomIcon(bathroom)} {bathroom.name}
                  </Text>
                  <Text style={styles.clusterBathroomAddress}>
                    {bathroom.address}
                  </Text>
                  <View style={styles.clusterBathroomDetails}>
                    <View style={styles.ratingContainer}>
                      {renderStars(bathroom.rating)}
                      <Text style={styles.ratingText}>
                        {bathroom.rating.toFixed(1)}
                      </Text>
                    </View>
                    <Text style={styles.distanceText}>
                      {bathroom.distance < 1 
                        ? `${Math.round(bathroom.distance * 1000)}m`
                        : `${bathroom.distance.toFixed(1)}km`
                      }
                    </Text>
                  </View>
                  {bathroom.funnyQuote && (
                    <Text style={styles.funnyQuote}>
                      💭 {bathroom.funnyQuote}
                    </Text>
                  )}
                </View>
                <View style={styles.clusterActionButtons}>
                  <TouchableOpacity 
                    style={styles.navigateButton} 
                    onPress={() => {
                      setShowClusterModal(false);
                      handleNavigate(bathroom);
                    }}
                  >
                    <Navigation size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const RecordsDrawer = () => {
  const [showTodayRecords, setShowTodayRecords] = useState(true);
  const [showPreviousRecords, setShowPreviousRecords] = useState(false);
  const [dbRecords, setDbRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch records from database when drawer opens
  useEffect(() => {
    if (showRecordsDrawer) {
      fetchUserRecords();
    }
  }, [showRecordsDrawer]);

  const fetchUserRecords = async () => {
    setLoading(true);
    try {
      const userId = 1; // TODO: Get from auth context
      
      // Fetch both public and private check-ins for this user
      const [publicRes, privateRes] = await Promise.all([
        fetch('https://poopalooza-backend-api-af34f62d7c87.herokuapp.com/public-checkins'),
        fetch(`https://poopalooza-backend-api-af34f62d7c87.herokuapp.com/private-checkins?user_id=${userId}`)
      ]);

      const publicData = await publicRes.json();
      const privateData = await privateRes.json();

      // Filter public check-ins to only show current user's
      const userPublicCheckIns = publicData.filter((checkin: any) => checkin.user_id === userId);
      
      // Combine and format the records
      const allRecords = [
        ...userPublicCheckIns.map((checkin: any) => ({
          ...checkin,
          isPrivate: false,
          timestamp: new Date(checkin.created_at).getTime()
        })),
        ...privateData.map((checkin: any) => ({
          ...checkin,
          isPrivate: true,
          timestamp: new Date(checkin.created_at).getTime()
        }))
      ];

      // Sort by timestamp (newest first)
      allRecords.sort((a, b) => b.timestamp - a.timestamp);
      
      setDbRecords(allRecords);
    } catch (error) {
      console.error('Failed to fetch records:', error);
      Alert.alert('Error', 'Failed to load check-in records');
    } finally {
      setLoading(false);
    }
  };

  // Get today's records from database data
  const getTodayRecords = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dbRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime();
    });
  };

  // Get previous records from database data
  const getPreviousRecords = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return dbRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() < today.getTime();
    });
  };

  const todayRecords = getTodayRecords();
  const previousRecords = getPreviousRecords();

  // Share function using database records
  const sharePooJourney = async () => {
    try {
      const todayRecs = getTodayRecords();
      const message = `Today's poop adventure: Visited ${todayRecs.length} bathrooms!\n${
        todayRecs.map(r => `${r.mood_emoji || '💩'} ${r.bathroom_name}`).join('\n')
      }\n\nFrom PooPalooza 💩`;
      
      await Share.share({
        message: message,
        title: 'My Poop Adventure',
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (!showRecordsDrawer) return null;

  return (
    <Modal
      visible={showRecordsDrawer}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowRecordsDrawer(false)}
    >
      <View style={styles.drawerOverlay}>
        <TouchableOpacity 
          style={styles.drawerBackdrop}
          onPress={() => setShowRecordsDrawer(false)}
        />
        
        <View style={styles.drawerContainer}>
          <View style={styles.drawerHandle} />
          
          <View style={styles.drawerHeader}>
            <Text style={styles.drawerTitle}>Check-In Records</Text>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={sharePooJourney}
            >
              <Share2 size={20} color="#FFFFFF" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Tab switcher */}
          <View style={styles.drawerTabContainer}>
            <TouchableOpacity
              style={[
                styles.drawerTab,
                showTodayRecords && styles.activeDrawerTab
              ]}
              onPress={() => {
                setShowTodayRecords(true);
                setShowPreviousRecords(false);
              }}
            >
              <Text style={[
                styles.drawerTabText,
                showTodayRecords && styles.activeDrawerTabText
              ]}>
                🌟 Today ({todayRecords.length})
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.drawerTab,
                showPreviousRecords && styles.activeDrawerTab
              ]}
              onPress={() => {
                setShowTodayRecords(false);
                setShowPreviousRecords(true);
              }}
            >
              <Text style={[
                styles.drawerTabText,
                showPreviousRecords && styles.activeDrawerTabText
              ]}>
                📅 History ({previousRecords.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Records content */}
          <ScrollView 
            style={styles.drawerContent}
            showsVerticalScrollIndicator={false}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading records...</Text>
              </View>
            ) : (
              <>
                {/* Today's records */}
                {showTodayRecords && (
                  <View style={styles.recordsSection}>
                    {todayRecords.length === 0 ? (
                      <View style={styles.emptyRecordsContainer}>
                        <Text style={styles.emptyRecordsEmoji}>🌱</Text>
                        <Text style={styles.emptyRecordsTitle}>No check-ins today</Text>
                        <Text style={styles.emptyRecordsText}>Tap the "Check In" button to start recording!</Text>
                      </View>
                    ) : (
                      todayRecords.map(record => (
                        <View key={`${record.id}-${record.created_at}`} style={styles.modernRecordCard}>
                          <View style={styles.recordCardHeader}>
                            <Text style={styles.recordMoodLarge}>{record.mood_emoji || '💩'}</Text>
                            <View style={styles.recordTimeInfo}>
                              <Text style={styles.recordTimeText}>
                                {new Date(record.timestamp).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </Text>
                              {record.isPrivate && (
                                <View style={styles.privateTag}>
                                  <Text style={styles.privateTagText}>🔒 Private</Text>
                                </View>
                              )}
                            </View>
                          </View>
                          
                          {record.custom_message && (
                            <View style={styles.recordMessageContainer}>
                              <Text style={styles.recordMessage}>"{record.custom_message}"</Text>
                            </View>
                          )}
                          
                          <View style={styles.recordFooterInfo}>
                            <Text style={styles.recordLocationText}>
                              📍 {record.bathroom_name}
                            </Text>
                            {record.bristol_type && (
                              <Text style={styles.recordBristolText}>
                                {BRISTOL_EMOJIS[record.bristol_type]} Type {record.bristol_type}
                              </Text>
                            )}
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* History records */}
                {showPreviousRecords && (
                  <View style={styles.recordsSection}>
                    {previousRecords.length === 0 ? (
                      <View style={styles.emptyRecordsContainer}>
                        <Text style={styles.emptyRecordsEmoji}>📚</Text>
                        <Text style={styles.emptyRecordsTitle}>No history records</Text>
                        <Text style={styles.emptyRecordsText}>Check in more times to build your history!</Text>
                      </View>
                    ) : (
                      // Group by date
                      (() => {
                        const groupedRecords = previousRecords.reduce((groups, record) => {
                          const date = new Date(record.timestamp).toLocaleDateString('en-US');
                          if (!groups[date]) groups[date] = [];
                          groups[date].push(record);
                          return groups;
                        }, {} as Record<string, any[]>);

                        return Object.entries(groupedRecords)
                          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                          .map(([date, records]) => (
                            <View key={date} style={styles.dateGroup}>
                              <Text style={styles.dateHeader}>{date}</Text>
                              {records.map(record => (
                                <View key={`${record.id}-${record.created_at}`} style={styles.modernRecordCard}>
                                  <View style={styles.recordCardHeader}>
                                    <Text style={styles.recordMoodLarge}>{record.mood_emoji || '💩'}</Text>
                                    <View style={styles.recordTimeInfo}>
                                      <Text style={styles.recordTimeText}>
                                        {new Date(record.timestamp).toLocaleTimeString('en-US', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </Text>
                                      {record.isPrivate && (
                                        <View style={styles.privateTag}>
                                          <Text style={styles.privateTagText}>🔒</Text>
                                        </View>
                                      )}
                                    </View>
                                  </View>
                                  
                                  {record.custom_message && (
                                    <View style={styles.recordMessageContainer}>
                                      <Text style={styles.recordMessage}>"{record.custom_message}"</Text>
                                    </View>
                                  )}
                                  
                                  <View style={styles.recordFooterInfo}>
                                    <Text style={styles.recordLocationText}>
                                      📍 {record.bathroom_name}
                                    </Text>
                                    {record.bristol_type && (
                                      <Text style={styles.recordBristolText}>
                                        {BRISTOL_EMOJIS[record.bristol_type]} Type {record.bristol_type}
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              ))}
                            </View>
                          ));
                      })()
                    )}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};
// Map component - 使用優化後的限制 marker 數量
  const MapComponent = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.webMapPlaceholder}>
          <MapPin size={48} color={Colors.primary.lightText} />
          <Text style={styles.webMapTitle}>Map View</Text>
          <Text style={styles.webMapText}>
            Interactive map is available in the mobile app. Please use list view to see nearby bathrooms.
          </Text>
          <TouchableOpacity style={styles.webMapButton} onPress={() => setActiveTab('nearby')}>
            <Text style={styles.webMapButtonText}>View List</Text>
          </TouchableOpacity>
        </View>
      );
    }

    try {
      const MapModule = require('react-native-maps');
      const MapView = MapModule.default;
      const { Marker, Callout, Polyline, PROVIDER_GOOGLE } = MapModule;

      const defaultRegion = {
        latitude: 25.0330,
        longitude: 121.5654,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      const currentRegion = location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      } : defaultRegion;

      const handleMarkerPress = (bathroom: Bathroom) => {
        setSelectedBathroom(bathroom);
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: bathroom.latitude,
              longitude: bathroom.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            500,
          );
        }
      };

      const journeyCoordinates = activeTab === 'journey' && checkInRecords.length > 1
        ? sortedRecords.map(record => ({
            latitude: record.location.lat,
            longitude: record.location.lng,
          }))
        : [];

      return (
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={currentRegion}
            showsUserLocation={!!location}
            showsMyLocationButton={false}
            onMapReady={() => setMapReady(true)}
          >
          {limitedDisplayBathrooms.map((cluster) => (
  <Marker
    key={cluster.id}
    coordinate={{ latitude: cluster.latitude, longitude: cluster.longitude }}
    title={cluster.count > 1 ? `${cluster.count} 個廁所` : getBathroomDisplayName(cluster.bathrooms[0])}
    onPress={() => {
      if (cluster.count > 1) {
        // 🆕 顯示聚集詳情Modal
        setSelectedCluster(cluster);
        setShowClusterModal(true);
      } else {
        // 單個廁所直接顯示詳情
        setSelectedBathroom(cluster.bathrooms[0]);
      }
      
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude: cluster.latitude,
            longitude: cluster.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500,
        );
      }
    }}
  >
    <View
      style={[
        styles.markerContainer, 
        { 
          borderColor: cluster.count > 1 ? '#FF6B6B' : getMarkerColor(cluster.bathrooms[0]),
          backgroundColor: cluster.count > 1 ? '#FFEBEE' : '#FFFFFF'
        },
        selectedBathroom?.id === cluster.bathrooms[0].id && styles.selectedMarker
      ]}
    >
      {cluster.count > 1 ? (
        <View style={styles.clusterMarker}>
          <Text style={styles.clusterCount}>{cluster.count}</Text>
        </View>
      ) : (
        <Text style={[styles.markerEmoji, { color: getMarkerColor(cluster.bathrooms[0]) }]}>
          {getBathroomIcon(cluster.bathrooms[0])}
        </Text>
      )}
    </View>
    <Callout tooltip>
      <View style={styles.calloutContainer}>
        {cluster.count > 1 ? (
          <>
            <Text style={styles.calloutTitle}>📍 {cluster.count} 個廁所聚集</Text>
            <Text style={styles.calloutSubtitle}>點擊查看詳情</Text>
          </>
        ) : (
          <>
            <Text style={styles.calloutTitle}>{cluster.bathrooms[0].name}</Text>
            <Text style={styles.calloutSubtitle}>{cluster.bathrooms[0].type}</Text>
            <View style={styles.calloutRating}>{renderStars(cluster.bathrooms[0].rating)}</View>
            <Text style={styles.calloutSource}>
              Source: {cluster.bathrooms[0].source === 'gov' ? 'Government' : cluster.bathrooms[0].source === 'commercial' ? 'Commercial' : 'International'}
            </Text>
            {cluster.bathrooms[0].funnyQuote && (
              <Text style={styles.calloutQuote}>💭 {cluster.bathrooms[0].funnyQuote}</Text>
            )}
            {(activeTab === 'visited' || activeTab === 'journey') && (
              <Text style={styles.calloutVisited}>✅ Visited</Text>
            )}
          </>
        )}
      </View>
    </Callout>
  </Marker>
))}                  
            {/* Show journey route */}
            {activeTab === 'journey' && journeyCoordinates.length > 1 && (
              <Polyline
                coordinates={journeyCoordinates}
                strokeColor="#FF6B6B"
                strokeWidth={3}
                lineDashPattern={[5, 5]}
              />
            )}
{/* Show markers for visited tab */}
{activeTab === 'visited' && (() => {
  const uniqueRecords = checkInRecords.reduce((acc, record) => {
    const locationKey = `${record.location.lat.toFixed(4)}-${record.location.lng.toFixed(4)}`;
    if (!acc[locationKey] || acc[locationKey].timestamp < record.timestamp) {
      acc[locationKey] = record;
    }
    return acc;
  }, {} as Record<string, CheckInRecord>);

  return Object.values(uniqueRecords).map((record) => (
    <Marker
      key={`unique-record-${record.id}`}
      coordinate={{ latitude: record.location.lat, longitude: record.location.lng }}
      title={`${record.mood} ${record.location.name}`}
      description={record.customMessage || record.note}
    >
      <View style={styles.checkInMarker}>
        <Text style={styles.checkInEmoji}>{record.mood}</Text>
      </View>
    </Marker>
  ));
})()}

{/* Journey Tab: Show ALL check-ins */}
{/* Journey Tab: 使用聚合邏輯避免重疊閃爍 */}
{activeTab === 'journey' && (() => {
  // 定義類型
  interface CheckInPoint {
    id: string;
    latitude: number;
    longitude: number;
    type: string;
    isPrivate?: boolean;
    mood: string;
    message?: string;
    timestamp?: number;
    bathroom?: string;
    userId?: string | number;
    isAnonymous?: boolean;
  }

  interface ClusterPoint {
    id: string;
    latitude: number;
    longitude: number;
    count: number;
    checkIns?: CheckInPoint[];
    displayMood?: string;
    isCluster: boolean;
    type?: string;
    isPrivate?: boolean;
    mood?: string;
    message?: string;
    bathroom?: string;
  }

  // 1. 合併所有打卡數據
  const allCheckIns: CheckInPoint[] = [
    // 用戶自己的打卡
    ...checkInRecords.map(record => ({
      id: `user-${record.id}`,
      latitude: record.location.lat,
      longitude: record.location.lng,
      type: 'user',
      isPrivate: record.isPrivate,
      mood: record.mood,
      message: record.customMessage || record.note,
      timestamp: record.timestamp,
      bathroom: record.bathroom.name || record.location.name,
    })),
    // 公開打卡
    ...publicCheckIns.map(checkin => ({
      id: `public-${checkin.id}`,
      latitude: parseFloat(checkin.latitude),
      longitude: parseFloat(checkin.longitude),
      type: 'public',
      mood: checkin.mood_emoji || '💩',
      message: checkin.custom_message,
      userId: checkin.user_id,
      isAnonymous: checkin.is_anonymous,
      bathroom: checkin.bathroom_name,
    })),
    // 私人打卡
    ...privateCheckIns.map(checkin => ({
      id: `private-${checkin.id}`,
      latitude: parseFloat(checkin.latitude),
      longitude: parseFloat(checkin.longitude),
      type: 'private',
      mood: checkin.mood_emoji || '💩',
      message: checkin.custom_message,
      bathroom: checkin.bathroom_name,
    }))
  ];

  // 2. 聚合重疊的打卡點
  const clusterCheckIns = (checkIns: CheckInPoint[], threshold: number = 0.0001): ClusterPoint[] => {
    const clusters: ClusterPoint[] = [];
    const processed = new Set<string>();
    
    checkIns.forEach((checkIn: CheckInPoint) => {
      if (processed.has(checkIn.id)) return;
      
      // 找出附近的打卡點（同一位置）
      const nearbyCheckIns = checkIns.filter((other: CheckInPoint) => {
        if (processed.has(other.id) || other.id === checkIn.id) return false;
        
        const latDiff = Math.abs(checkIn.latitude - other.latitude);
        const lngDiff = Math.abs(checkIn.longitude - other.longitude);
        return latDiff < threshold && lngDiff < threshold;
      });
      
      if (nearbyCheckIns.length > 0) {
        // 創建聚合點
        const allPoints = [checkIn, ...nearbyCheckIns];
        
        clusters.push({
          id: `cluster-${checkIn.id}`,
          latitude: checkIn.latitude,
          longitude: checkIn.longitude,
          count: allPoints.length,
          checkIns: allPoints,
          displayMood: allPoints[0].mood,
          isCluster: true,
        });
        
        allPoints.forEach(p => processed.add(p.id));
      } else {
        // 單獨的打卡點
        clusters.push({
          ...checkIn,
          count: 1,
          isCluster: false,
        });
        processed.add(checkIn.id);
      }
    });
    
    return clusters;
  };

  const clusteredCheckIns = clusterCheckIns(allCheckIns);

  // 3. 渲染聚合後的標記
return clusteredCheckIns.map((cluster: ClusterPoint) => (
  <Marker
    key={cluster.id}
    coordinate={{ 
      latitude: cluster.latitude, 
      longitude: cluster.longitude 
    }}
    onPress={() => {
      // 處理聚合點的點擊
      if (cluster.isCluster && cluster.count > 1) {
        const details = cluster.checkIns?.map((c: CheckInPoint) => 
          `${c.mood} ${c.bathroom || 'Location'}\n${c.message || ''}`
        ).join('\n---\n');
        
        Alert.alert(
          `📍 ${cluster.count} Check-ins Here`,
          details || 'No details available',
          [{ text: 'OK' }]
        );
      }
    }}
  >
    <View style={[
      styles.checkInMarker,
      cluster.isCluster && cluster.count > 1 && {
        width: 36,
        height: 36,
        backgroundColor: '#FFE0E0',
        borderColor: '#FF6B6B',
        borderWidth: 3,
      }
    ]}>
      {cluster.isCluster && cluster.count > 1 ? (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#FF6B6B' }}>
            {cluster.count}
          </Text>
        </View>
      ) : (
        <Text style={styles.checkInEmoji}>
          {cluster.type === 'private' || cluster.isPrivate ? '🔒' : (cluster.mood || cluster.displayMood)}
        </Text>
      )}
    </View>
    
    <Callout tooltip>
      <View style={styles.calloutContainer}>
        <Text style={styles.calloutTitle}>
          {cluster.isCluster && cluster.count > 1 
            ? `${cluster.count} Check-ins` 
            : cluster.bathroom || 'Location'}
        </Text>
        {cluster.message && (
          <Text style={styles.calloutSubtitle}>{cluster.message}</Text>
        )}
      </View>
    </Callout>
  </Marker>
));
})()}

{/* Keep the existing private check-ins section as is */}
          </MapView>
          <View style={styles.mapControls}>
            <TouchableOpacity 
              style={[styles.mapControlButton, !location && styles.disabledButton]} 
              onPress={centerMapOnUser}
              disabled={!location}
            >
              <Compass size={24} color={location ? Colors.primary.accent : Colors.primary.lightText} />
            </TouchableOpacity>
          </View>

          {/* Show bathroom statistics */}
          <View style={styles.locationStatus}>
            <Text style={styles.locationStatusText}>
              {activeTab === 'visited' 
                ? `📍 ${checkInRecords.length} Check-ins`
                : activeTab === 'journey'
                ? `🗺️ ${checkInRecords.length} Journey Points`
                : activeTab === 'nearby'
                ? `📍 ${nearbyBathrooms.length} Nearby Bathrooms`
                : `🗺️ ${limitedDisplayBathrooms.length}/${allBathrooms.length} Bathrooms`
              }
            </Text>
            {activeTab === 'nearby' && nearbyBathrooms.length > 0 && (
              <Text style={styles.locationStatusSubtext}>
                🏛️ {bathroomStats.govCount} Gov | 
                🚻 {bathroomStats.commercialCount} Commercial |
                🌍 {bathroomStats.internationalCount} International
              </Text>
            )}
            {activeTab === 'map' && allBathrooms.length > 0 && (
              <Text style={styles.locationStatusSubtext}>
                🏛️ {allBathrooms.filter(b => b.source === 'gov').length} Gov | 
                🚻 {allBathrooms.filter(b => b.source === 'commercial').length} Commercial |
                🌍 {allBathrooms.filter(b => b.source === 'international').length} International
              </Text>
            )}
            
            {(activeTab === 'visited' || activeTab === 'journey') && checkInRecords.length > 0 && (
              <Text style={styles.locationStatusSubtext}>
                🎯 {journeyStats.uniqueLocations} Unique Locations | 
                ⭐ Favorite: {journeyStats.favoriteLocation || 'None yet'}
              </Text>
            )}              
          </View> 

          {selectedBathroom && (
            <View style={styles.bathroomDetailCard}>
              <View style={styles.bathroomInfo}>
                <View style={styles.bathroomHeader}>
                  <Text style={styles.bathroomName}>{getBathroomDisplayName(selectedBathroom)}</Text>
                  <View style={styles.typeTag}>
                    <Text style={styles.typeText}>{selectedBathroom.type}</Text>
                  </View>
                </View>

                <Text style={styles.bathroomAddress}>{selectedBathroom.address}</Text>
                
                {selectedBathroom.funnyQuote && (
                  <Text style={styles.funnyQuote}>💭 {selectedBathroom.funnyQuote}</Text>
                )}

                <View style={styles.bathroomDetails}>
                  <View style={styles.ratingContainer}>
                    {renderStars(selectedBathroom.rating)}
                    <Text style={styles.ratingText}>{selectedBathroom.rating.toFixed(1)}</Text>
                    {selectedBathroom.reviews && selectedBathroom.reviews.length > 0 && (
                      <Text style={styles.reviewCount}>({selectedBathroom.reviews.length} reviews)</Text>
                    )}
                  </View>
                  <Text style={styles.distanceText}>
                    {selectedBathroom.distance < 1 
                      ? `${Math.round(selectedBathroom.distance * 1000)}m`
                      : `${selectedBathroom.distance.toFixed(1)}km`
                    }
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtons}>
                <TouchableOpacity 
                  style={styles.navigateButton} 
                  onPress={() => handleNavigate(selectedBathroom)}
                >
                  <Navigation size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>導航</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      );
    } catch (error) {
      console.error('地圖載入失敗:', error);
      return (
        <View style={styles.mapFallback}>
          <MapPin size={64} color={Colors.primary.accent} />
          <Text style={styles.mapFallbackTitle}>Map temporarily unavailable</Text>
          <Text style={styles.mapFallbackText}>
            Map functionality is loading. Please try again later or use list mode to view nearby bathrooms.
          </Text>
          <TouchableOpacity 
            style={styles.fallbackButton}
            onPress={() => setActiveTab('nearby')}
          >
            <Text style={styles.fallbackButtonText}>Switch to List Mode</Text>
          </TouchableOpacity>
          
          {location && (
            <View style={styles.locationInfo}>
              <Text style={styles.locationInfoText}>
                Your location: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
              </Text>
            </View>
          )}
        </View>
      );
    }
  };
  // Show nearby bathroom list (within 500m)
  const renderNearbyList = () => (
    <View style={styles.listContainer}>
      <View style={styles.listHeader}>
        <Text style={styles.sectionTitle}>Bathrooms within 500m</Text>
        {nearbyBathrooms.length > 0 && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              Total {nearbyBathrooms.length} | 
              🏛️ {bathroomStats.govCount} Gov | 
              🚻 {bathroomStats.commercialCount} Commercial |
              🌍 {bathroomStats.internationalCount} International
            </Text>
            </View>
        )}
      </View>
      
      {nearbyBathrooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {location ? 'No bathrooms found within 500m' : 'Loading nearby bathrooms...'}
          </Text>
          {!location && (
            <Text style={styles.emptySubtext}>
              Please ensure GPS location services are enabled
            </Text>
          )}
        </View>
      ) : (
<FlatList 
  data={nearbyBathrooms}
  keyExtractor={(item) => item.id}
  renderItem={({ item: bathroom }) => (
    <TouchableOpacity
      style={[
        styles.bathroomCard,
        visitedBathroomIds.includes(bathroom.id) && styles.visitedCard
      ]}
      onPress={() => {
        if (Platform.OS !== 'web') {
          setActiveTab('map');
          setSelectedBathroom(bathroom);
        }
      }}
    >
      <View style={styles.bathroomInfo}>
        <View style={styles.bathroomHeader}>
          <Text style={styles.bathroomName}>
            {getBathroomIcon(bathroom)} {bathroom.name}
            {visitedBathroomIds.includes(bathroom.id) && ' ✅'}
          </Text>
          <View style={[
            styles.typeTag,
            { backgroundColor: getMarkerColor(bathroom) }
          ]}>
            <Text style={styles.typeText}>{bathroom.type}</Text>
          </View>
        </View>
        <Text style={styles.bathroomAddress}>{bathroom.address}</Text>
        
        {bathroom.funnyQuote && (
          <Text style={styles.funnyQuote}>💭 {bathroom.funnyQuote}</Text>
        )}
        
        <View style={styles.bathroomDetails}>
          <View style={styles.ratingContainer}>
            {renderStars(bathroom.rating)}
            <Text style={styles.ratingText}>{bathroom.rating.toFixed(1)}</Text>
            {bathroom.reviews && bathroom.reviews.length > 0 && (
              <Text style={styles.reviewCount}>({bathroom.reviews.length})</Text>
            )}
          </View>
          <Text style={styles.distanceText}>
            {bathroom.distance < 1 
              ? `${Math.round(bathroom.distance * 1000)}m`
              : `${bathroom.distance.toFixed(1)}km`
            }
          </Text>
        </View>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.navigateButton} 
          onPress={() => handleNavigate(bathroom)}
        >
          <Navigation size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>導航</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )}
  showsVerticalScrollIndicator={false}
  contentContainerStyle={styles.scrollContent}
/>
      )}
    </View>
  );

// 🔧 完全重寫：Journey 頁面 - 徹底解決重疊問題
const renderJourneyContent = () => {
  const todayRecords = getTodayRecords();
  const previousRecords = getPreviousRecords();

  return (
    <View style={styles.journeyContainer}>
      {/* 全螢幕地圖區域 */}
      <View style={styles.fullScreenMapSection}>
        <MapComponent />
        
        {/* 🚫 完全遮蔽 MapComponent 原始控制按鈕 */}
        <View style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 80,
          height: 120,
          backgroundColor: 'transparent',
          zIndex: 50, // 超高層級遮蔽原按鈕
        }} />

        {/* ✨ 整合統計條 + 功能按鈕在同一框 */}
        <View style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 60 : 50,
          left: 16,
          right: 16,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 16,
          padding: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 4,
          zIndex: 100,
        }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            {/* 左側：統計數據區域 */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              flex: 1 
            }}>
              <View style={styles.statsItem}>
                <Text style={styles.statsNumber}>{checkInRecords.length}</Text>
                <Text style={styles.statsLabel}>Total</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsItem}>
                <Text style={styles.statsNumber}>{journeyStats.uniqueLocations}</Text>
                <Text style={styles.statsLabel}>Places</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsItem}>
                <Text style={styles.statsNumber}>{todayRecords.length}</Text>
                <Text style={styles.statsLabel}>Today</Text>
              </View>
            </View>

            {/* 右側：功能按鈕組 */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center',
              gap: 8,
              marginLeft: 16,
            }}>
              
              {/* Route 按鈕 */}
              <TouchableOpacity 
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#FFFFFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 2,
                  elevation: 3,
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.08)',
                }}
                onPress={() => setShowPoopLinePage(true)}
              >
                <Route size={16} color="#8B4513" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 🗑️ 移除獨立的功能按鈕組 - 已整合到統計條內 */}

        {/* ✨ 主要打卡按鈕 */}
        {location ? (
          <TouchableOpacity 
            style={{
              position: 'absolute',
              bottom: 120,
              right: 20,
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#FF6B6B',
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: '#FF6B6B',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.4,
              shadowRadius: 12,
              elevation: 12,
              borderWidth: 4,
              borderColor: '#FFFFFF',
              zIndex: 1000,
            }}
            onPress={() => {
              console.log('🎯 浮動按鈕被點擊！');
              handleQuickLocationCheckIn();
            }}
            activeOpacity={0.8}
          >
            <Text style={{ fontSize: 28, marginBottom: 2 }}>💩</Text>
            <Text style={{ 
              fontSize: 11, 
              fontWeight: 'bold', 
              color: '#FFFFFF',
              textAlign: 'center' 
            }}>
              Check In
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{
            position: 'absolute',
            bottom: 120,
            right: 20,
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#BDC3C7',
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 4,
            borderColor: '#FFFFFF',
          }}>
            <Text style={{ fontSize: 28, marginBottom: 2 }}>📍</Text>
            <Text style={{ 
              fontSize: 10, 
              fontWeight: 'bold', 
              color: '#FFFFFF',
              textAlign: 'center' 
            }}>
              GPS...
            </Text>
          </View>
        )}

        {/* ✨ 底部抽屜觸發器 */}
        <TouchableOpacity 
          style={{
            position: 'absolute',
            bottom: 20,
            left: 20,
            right: 120, // 為打卡按鈕預留空間
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            borderRadius: 25,
            paddingVertical: 16,
            paddingHorizontal: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            maxWidth: Dimensions.get('window').width - 140,
          }}
          onPress={() => setShowRecordsDrawer(true)}
        >
          <ChevronUp size={24} color="#FFFFFF" />
          <Text style={{
            color: '#FFFFFF',
            fontSize: 15,
            fontWeight: '600',
            flexShrink: 1,
          }}>
            View Records ({checkInRecords.length})
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
  const renderContent = () => {
    if (errorMsg) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
          <Text style={styles.errorSubtext}>
            Please enable location services to find nearby bathrooms.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={retryLocationRequest}
          >
            <Text style={styles.retryButtonText}>Retry Location</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 'map':
        return <MapComponent />;
      case 'nearby':
        return renderNearbyList();
      case 'journey':
        return renderJourneyContent();
      case 'poopline':                    
        return renderJourneyContent();
      default:
        return renderNearbyList();
    }
  };
  return (
    <View style={styles.container}>
      <View
        style={{ flex: 1 }}
        pointerEvents={showCheckInModal ? 'box-none' : 'auto'} 
      >
        <View style={styles.header}>
          <Text style={styles.title}>PooPalooza 💩</Text>
          <View style={styles.tabContainer}>
            {Platform.OS !== 'web' && (
              <TouchableOpacity
                style={[styles.tab, activeTab === 'map' && styles.activeTab]}
                onPress={() => handleTabPress('map')}
                activeOpacity={0.7}
              >
                <MapPin size={16} color={activeTab === 'map' ? '#fff' : Colors.primary.lightText} />
                <Text style={[styles.tabText, activeTab === 'map' && styles.activeTabText]}>
                  Map
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.tab, activeTab === 'nearby' && styles.activeTab]}
              onPress={() => handleTabPress('nearby')}
              activeOpacity={0.7}
            >
              <List size={16} color={activeTab === 'nearby' ? '#fff' : Colors.primary.lightText} />
              <Text style={[styles.tabText, activeTab === 'nearby' && styles.activeTabText]}>
                Nearby ({nearbyBathrooms.length})
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'journey' && styles.activeTab]}
              onPress={() => handleTabPress('journey')}
            >
              <Route size={16} color={activeTab === 'journey' ? '#fff' : Colors.primary.lightText} />
              <Text style={[styles.tabText, activeTab === 'journey' && styles.activeTabText]}>
                Journey
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {renderContent()}
      </View>

      {/* 🚨 重要：確保所有Modal都在這裡渲染 */}
      <CheckInModal />
      <ReviewModal />
      <ClusterModal />
      <RecordsDrawer />
    </View>
  );
}

// 🔄 簡化樣式 - 移除成就系統相關樣式，保留所有其他樣式
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.card,
    borderRadius: 20,
    padding: 4,
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    gap: 4,
  },
  activeTab: {
    backgroundColor: Colors.primary.accent,
  },
  tabText: {
    fontSize: 12,
    color: Colors.primary.lightText,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 16,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: Colors.primary.text,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: Colors.primary.lightText,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Colors.primary.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 16,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: Colors.primary.background,
  },
  mapFallbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginTop: 16,
    marginBottom: 8,
  },
  mapFallbackText: {
    fontSize: 16,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 24,
  },
  fallbackButton: {
    backgroundColor: Colors.primary.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginBottom: 16,
  },
  fallbackButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  locationInfo: {
    backgroundColor: Colors.primary.card,
    padding: 12,
    borderRadius: 8,
  },
  locationInfoText: {
    fontSize: 14,
    color: Colors.primary.text,
    textAlign: 'center',
  },
  mapControls: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
  },
  mapControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  disabledButton: {
    opacity: 0.5,
  },
  locationStatus: {
    position: 'absolute', 
    top: 70,
    left:20,           
    right: 20,           
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    zIndex:5,
  },
  locationStatusText: {
    fontSize: 12,
    color: Colors.primary.text,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  locationStatusSubtext: {
    fontSize: 10,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginTop: 2,
  },
  markerContainer: {
    padding: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 3,
    borderColor: Colors.primary.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectedMarker: {
    borderColor: Colors.primary.accent,
    backgroundColor: Colors.primary.card,
  },
  checkInMarker: {
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  checkInEmoji: {
    fontSize: 18,
  },
  calloutContainer: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  calloutSubtitle: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginBottom: 4,
  },
  calloutRating: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calloutSource: {
    fontSize: 11,
    color: Colors.primary.lightText,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  calloutQuote: {
    fontSize: 11,
    color: Colors.primary.accent,
    marginBottom: 2,
    fontStyle: 'italic',
  },
  calloutVisited: {
    fontSize: 11,
    color: '#34C759',
    marginTop: 2,
    fontWeight: 'bold',
  },
  bathroomDetailCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  listContainer: {
    flex: 1,
    padding: 16,
  },
  listHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  statsContainer: {
    backgroundColor: Colors.primary.card,
    padding: 8,
    borderRadius: 8,
  },
  statsText: {
    fontSize: 14,
    color: Colors.primary.lightText,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  bathroomCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  visitedCard: {
    borderWidth: 2,
    borderColor: '#34C759',
  },
  bathroomInfo: {
    flex: 1,
  },
  bathroomHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  bathroomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginRight: 8,
    flex: 1,
  },
  typeTag: {
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  bathroomAddress: {
    fontSize: 14,
    color: Colors.primary.lightText,
    marginBottom: 4,
  },
  funnyQuote: {
    fontSize: 12,
    color: Colors.primary.accent,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  bathroomDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
  },
  starIcon: {
    fontSize: 16,
    color: '#FFC107',
    marginRight: 2,
  },
  emptyStar: {
    color: Colors.primary.border,
  },
  ratingText: {
    fontSize: 14,
    color: Colors.primary.lightText,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginLeft: 4,
  },
  distanceText: {
    fontSize: 14,
    color: Colors.primary.lightText,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  checkInActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  reviewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  navigateButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.primary.lightText,
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: Colors.primary.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    marginTop: 16,
    shadowColor: Colors.primary.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  startButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.primary.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: Platform.OS === 'ios' ? 200 : 250,
  },
  modalContent: {
    padding: 20,
    backgroundColor: Colors.primary.background,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  emojiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  emojiButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary.card,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedEmoji: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
    shadowColor: Colors.primary.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  emojiText: {
    fontSize: 24,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    justifyContent: 'flex-start',
  },
  tagButton: {
    backgroundColor: Colors.primary.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  selectedTag: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
    shadowColor: Colors.primary.accent,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  tagText: {
    fontSize: 14,
    color: Colors.primary.text,
  },
  selectedTagText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  messageInput: {
    backgroundColor: Colors.primary.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    color: Colors.primary.text,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  bristolContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  bristolButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary.card,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedBristol: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
    shadowColor: Colors.primary.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  bristolEmoji: {
    fontSize: 20,
  },
  bristolType: {
    fontSize: 10,
    color: Colors.primary.text,
    textAlign: 'center',
    marginTop: 2, 
  },
  ratingStarLarge: {
    fontSize: 32,
    marginHorizontal: 4,
  },
  activeStar: {
    color: '#FFC107',
  },
  inactiveStar: {
    color: Colors.primary.border,
  },
  noteInput: {
    backgroundColor: Colors.primary.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    color: Colors.primary.text,
    textAlignVertical: 'top',
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  mediaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: Colors.primary.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  mediaButtonText: {
    fontSize: 14,
    color: '#FFFFFF', 
    fontWeight: '600',
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 20,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  privacyContainer: {
    marginBottom: 20,
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary.card,
    borderRadius: 8,
    marginBottom: 8,    
  },
  privacyText: {
    fontSize: 16,
    color: Colors.primary.text,
  },
  activePrivacyText: {
    color: Colors.primary.accent,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: Colors.primary.card,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  cancelButtonText: {
    color: Colors.primary.text,
    fontWeight: '600',
    fontSize: 16,
  },
  checkInButton: {
    flex: 1,
    backgroundColor: Colors.primary.accent,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: Colors.primary.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  visitedContainer: {
    flex: 1, 
    backgroundColor: Colors.primary.background, 
  },
  visitedMapContainer: {
    height: 300,
    position: 'relative',
  },
  recordsScrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  recordsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  noRecordsText: {
    fontSize: 14,
    color: Colors.primary.lightText,
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 16,
  },
  recordCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.primary.border,
    alignItems: 'center',
  },
  recordMood: {
    fontSize: 32,
    marginRight: 16,
  },
  recordInfo: {
    flex: 1,
  },
  recordName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  recordTime: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginTop: 2,
  },
  recordCustomMessage: {
    fontSize: 14,
    color: Colors.primary.accent,
    fontWeight: 'bold',
    marginTop: 4,
  },
  recordTag: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginTop: 2,
  },
  journeyContainer: {
    flex: 1,
  },
  journeyMapContainer: {
    height: 300,
  },
  journeyScrollView: {
    flex: 1,
    padding: 16,
  },
  journeyStatsSection: {
    marginBottom: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statCard: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.accent,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginTop: 4,
  },
  timelineSection: {
    marginBottom: 24,
  },
  timeline: {
    paddingLeft: 20,
  },
  timelineItem: {
    position: 'relative',
    paddingBottom: 20,
  },
  timelineMarker: {
    position: 'absolute',
    left: -30,
    top: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.primary.accent,
  },
  timelineEmoji: {
    fontSize: 20,
  },
  timelineContent: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 12,
    marginLeft: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginBottom: 4,
  },
  timelineMessage: {
    fontSize: 14,
    color: Colors.primary.accent,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  timelineTag: {
    fontSize: 12,
    color: Colors.primary.lightText,
  },
  timelineLine: {
    position: 'absolute',
    left: -11,
    top: 40,
    width: 2,
    height: 20,
    backgroundColor: Colors.primary.border,
  },
  journeyShareSection: {
    marginBottom: 24,
  },
  shareJourneyButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.primary.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  shareJourneyText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  webMapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  webMapTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginTop: 16,
    marginBottom: 8,
  },
  webMapText: {
    fontSize: 16,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 24,
  },
  webMapButton: {
    backgroundColor: Colors.primary.accent,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
  },
  webMapButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  toggleListButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: Colors.primary.card,
    alignSelf: 'center',
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.primary.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleListText: {
    fontSize: 16,
    color: Colors.primary.text,
    fontWeight: '600',
  },
  recordsWrapper: {
    flex: 1,
    backgroundColor: Colors.primary.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: 8,
    minHeight: 32,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  poopLineButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    backgroundColor: Colors.primary.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  poopLineButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  quickCheckInButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 200, 
  },
  quickCheckInText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
    flexShrink: 1,
  },
  clusterMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  locationCheckInButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  locationCheckInText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
  checkInCluster: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkInClusterCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  actionButtonText: {
    fontSize: 10,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  privacySubtext: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginTop: 4,
  },
  disabledButtonText: {
    opacity: 0.5,
  },
  modernModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modernModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  modernModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',  
    alignItems: 'center', 
  },
  sectionContainer: {
    marginBottom: 24,
  },
  modernSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  closeButtonText: {
    fontSize: 16,
    color: Colors.primary.text,
    fontWeight: 'bold',
  },
  modernModalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  
  // 心情選擇樣式
  modernEmojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  modernEmojiButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedModernEmoji: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
    shadowColor: Colors.primary.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    transform: [{ scale: 1.1 }],
  },
  modernEmojiText: {
    fontSize: 28,
  },
  
  // 輸入框樣式
  modernTextInput: {
    backgroundColor: 'rgba(108, 99, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: Colors.primary.text,
    textAlignVertical: 'top',
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  
  // Bristol Scale 樣式
  modernBristolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  modernBristolButton: {
    width: 44,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedModernBristol: {
    backgroundColor: '#FFC107',
    borderColor: '#FFC107',
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modernBristolEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  modernBristolType: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  
  // 🔧 修正：Modal Footer 樣式
  modernModalFooter: {
   flexDirection: 'row',
   padding: 20,
   paddingTop: 16,
   borderTopWidth: 1,
   borderTopColor: 'rgba(0,0,0,0.05)',
   gap: 12,
   zIndex: 1001, // 確保足夠高的層級
},
  modernCancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignItems: 'center',
  },
  modernCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
  },
  modernCheckInButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary.accent,
    alignItems: 'center',
    shadowColor: Colors.primary.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modernButtonDisabled: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    shadowOpacity: 0,
    elevation: 0,
  },
  modernCheckInText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // 🔧 修正：Journey 頁面樣式
  fullScreenMapSection: {
    flex: 1,
    position: 'relative',
  },
  floatingCheckInButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    zIndex: 1000, // 確保按鈕在最上層
  },
  checkInButtonContent: {
    alignItems: 'center',
  },
  checkInButtonEmoji: {
    fontSize: 24,
    marginBottom: 2,
  },
  checkInButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  topStatsBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 80,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  statsItem: {
    alignItems: 'center',
    flex: 1,
    minWidth: 40,
  },
  statsNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.accent,
  },
  statsLabel: {
    fontSize: 10,
    color: Colors.primary.lightText,
    marginTop: 2,
    textAlign: 'center',
  },
  statsDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.primary.border,
    marginHorizontal: 8,
  },
  topRightControls: {
    position: 'absolute',
    top: 50,
    right: 16,
    flexDirection: 'column',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  drawerTrigger: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  drawerTriggerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  privateCheckInButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#6C757D', // 灰色代表私人
    alignItems: 'center',
    marginRight: 6,
    shadowColor: '#6C757D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 50, // 確保按鈕足夠大
  },
  publicCheckInButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: Colors.primary.accent, // 主題色代表公開
    alignItems: 'center',
    marginLeft: 6,
    shadowColor: Colors.primary.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    minHeight: 50, // 確保按鈕足夠大
  },
  privateCheckInText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  publicCheckInText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Cluster Modal 樣式
   clusterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  clusterModalContainer: {
    backgroundColor: Colors.primary.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    minHeight: 300,
  },
  clusterModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  clusterModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  clusterModalContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  clusterBathroomCard: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  clusterBathroomInfo: {
    flex: 1,
  },
  clusterBathroomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 4,
  },
  clusterBathroomAddress: {
    fontSize: 14,
    color: Colors.primary.lightText,
    marginBottom: 4,
  },
  clusterBathroomDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  clusterActionButtons: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Records Drawer 樣式
  drawerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  drawerContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: '50%',
  },
  drawerHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.accent,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  drawerTabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginHorizontal: 20,
    marginVertical: 16,
    borderRadius: 16,
    padding: 4,
  },
  drawerTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  activeDrawerTab: {
    backgroundColor: Colors.primary.accent,
    shadowColor: Colors.primary.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  drawerTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.lightText,
  },
  activeDrawerTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  drawerContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  recordsSection: {
    paddingBottom: 20,
  },
  emptyRecordsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyRecordsEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyRecordsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  emptyRecordsText: {
    fontSize: 14,
    color: Colors.primary.lightText,
    textAlign: 'center',
    lineHeight: 20,
  },
  modernRecordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    marginBottom: 12,
  },
  recordCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  recordMoodLarge: {
    fontSize: 40,
  },
  recordTimeInfo: {
    alignItems: 'flex-end',
  },
  recordTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  privateTag: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  privateTagText: {
    fontSize: 10,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  recordMessageContainer: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary.accent,
  },
  recordMessage: {
    fontSize: 15,
    color: Colors.primary.text,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  recordFooterInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordLocationText: {
    fontSize: 13,
    color: Colors.primary.lightText,
    flex: 1,
  },
  recordBristolText: {
    fontSize: 12,
    color: Colors.primary.accent,
    fontWeight: '600',
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 12,
    paddingLeft: 4,
  },
  publicCheckInMarker: {
  padding: 6,
  backgroundColor: '#E3F2FD',
  borderRadius: 15,
  borderWidth: 2,
  borderColor: '#2196F3',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 3,
  elevation: 5,
},
publicCheckInEmoji: {
  fontSize: 18,
},
userCheckInMarker: {
  padding: 6,
  backgroundColor: '#FFFFFF',
  borderRadius: 15,
  borderWidth: 2,
  borderColor: '#4CAF50',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 3,
  elevation: 5,
},
privateMarker: {
  borderColor: '#9C27B0',
  backgroundColor: '#F3E5F5',
},
userCheckInEmoji: {
  fontSize: 18,
},
anonymousBadge: {
  position: 'absolute',
  top: -4,
  right: -4,
  width: 14,
  height: 14,
  borderRadius: 7,
  backgroundColor: '#FF5722',
  justifyContent: 'center',
  alignItems: 'center',
},
anonymousText: {
  fontSize: 8,
  color: '#FFFFFF',
  fontWeight: 'bold',
},
});