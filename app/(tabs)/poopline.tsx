import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  Alert,
  ScrollView,
  Share,
  Dimensions,
  Animated,
  Modal,
  PanResponder 
} from 'react-native';
import Colors from '@/constants/colors';
import { 
  MapPin, 
  Route, 
  Share2, 
  Calendar, 
  Trophy,
  ArrowLeft,
  Filter,
  ChevronDown,
  ChevronUp,
  Camera,
  X 
} from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import Svg, { 
  Defs, 
  Pattern, 
  Image as SvgImage, 
  Polyline,
  Circle,
  Text as SvgText,
  LinearGradient,
  Stop,
  DropShadow,
  G,
  Ellipse 
} from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { captureRef } from 'react-native-view-shot'; // 如果要使用截圖功能需安裝

// 獲取螢幕尺寸
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Bristol Scale emoji 映射
const BRISTOL_EMOJIS = {
  1: '🥵', // 便秘
  2: '😓', // 稍微便秘
  3: '🧻', // 正常
  4: '😊', // 理想
  5: '😅', // 軟便
  6: '🥲', // 腹瀉
  7: '💧', // 水狀
};

// 檢查記錄介面
interface CheckInRecord {
  id: string;
  timestamp: number;
  bathroom: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    address: string;
    type: string;
  };
  mood: string;
  bristolType?: number;
  note: string;
  quickTag: string;
  rating: number;
  location: {
    lat: number;
    lng: number;
    name: string;
  };
  isPrivate: boolean;
  anonymous: boolean;
  customMessage?: string;
}

// 屎線統計介面
interface PoopLineStats {
  totalLength: number;
  totalCheckIns: number;
  uniqueLocations: number;
  longestStreak: number;
  favoriteSpot: string;
  firstCheckIn: number;
  lastCheckIn: number;
}

// 本地存儲工具
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
    } catch {
      // Handle error
    }
  }
};

// 計算兩點間距離（公里）
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // 地球半徑（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// 經緯度轉換為 SVG 座標
const convertCoordinatesToSvg = (
  records: CheckInRecord[], 
  mapBounds: { north: number; south: number; east: number; west: number },
  svgWidth: number,
  svgHeight: number
) => {
  return records.map(record => {
    const x = ((record.location.lng - mapBounds.west) / (mapBounds.east - mapBounds.west)) * svgWidth;
    const y = ((mapBounds.north - record.location.lat) / (mapBounds.north - mapBounds.south)) * svgHeight;
    return { x, y, record };
  });
};

// 生成 SVG polyline 點字串
const generateSvgPoints = (svgCoordinates: Array<{ x: number; y: number }>) => {
  return svgCoordinates.map(coord => `${coord.x},${coord.y}`).join(' ');
};

export default function PoopLineScreen({ navigation }: { navigation?: any }) {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<any>(null);
  const [checkInRecords, setCheckInRecords] = useState<CheckInRecord[]>([]);
  const [poopLineStats, setPoopLineStats] = useState<PoopLineStats | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<CheckInRecord | null>(null);
  const [showTimeline, setShowTimeline] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'week' | 'month' | 'year'>('all');
  const [mapBounds, setMapBounds] = useState({
    north: 0,
    south: 0,
    east: 0,
    west: 0
  });

  // 動畫相關狀態
  const [flowingDrops, setFlowingDrops] = useState<Array<{ id: string; progress: Animated.Value }>>([]);
  const [lineShakeAnimation] = useState(new Animated.Value(0));
  const [isMapMoving, setIsMapMoving] = useState(false);
  
  // 氣泡相關狀態
  const [showBubble, setShowBubble] = useState(false);
  const [bubblePosition, setBubblePosition] = useState({ x: 0, y: 0 });
  const [bubbleData, setBubbleData] = useState<CheckInRecord | null>(null);
  const [bubbleAnimation] = useState(new Animated.Value(0));

  // 截圖相關
  const [isCapturing, setIsCapturing] = useState(false);

  // 載入打卡記錄
  const loadCheckInRecords = async () => {
    try {
      const records = await localStorageUtil.getItem('checkInRecords');
      if (records) {
        const parsedRecords = JSON.parse(records);
        const sortedRecords = parsedRecords.sort((a: CheckInRecord, b: CheckInRecord) => a.timestamp - b.timestamp);
        setCheckInRecords(sortedRecords);
        calculatePoopLineStats(sortedRecords);
        calculateMapBounds(sortedRecords);
      } else {
        // 示範資料
        const demoRecords = generateDemoRecords();
        setCheckInRecords(demoRecords);
        calculatePoopLineStats(demoRecords);
        calculateMapBounds(demoRecords);
      }
    } catch (error) {
      console.error('載入打卡記錄失敗:', error);
    }
  };

  // 生成示範資料
  const generateDemoRecords = (): CheckInRecord[] => {
    const now = Date.now();
    return [
      {
        id: 'demo-1',
        timestamp: now - 1000 * 60 * 60 * 24 * 7,
        bathroom: {
          id: 'toilet-1',
          name: '星巴克咖啡廳',
          latitude: 25.0518,
          longitude: 121.5637,
          address: '台北市信義區',
          type: 'Café'
        },
        mood: '💩',
        bristolType: 4,
        note: '咖啡喝太多了',
        quickTag: 'Cafe',
        rating: 4,
        location: { lat: 25.0518, lng: 121.5637, name: '星巴克咖啡廳' },
        isPrivate: false,
        anonymous: false,
        customMessage: '一週屎線的起點 ☕'
      },
      {
        id: 'demo-2',
        timestamp: now - 1000 * 60 * 60 * 24 * 6,
        bathroom: {
          id: 'toilet-2',
          name: '台北101購物中心',
          latitude: 25.0336,
          longitude: 121.5650,
          address: '台北市信義區信義路五段7號',
          type: 'Mall'
        },
        mood: '🧻',
        bristolType: 3,
        note: '購物途中的小憩',
        quickTag: 'Mall',
        rating: 5,
        location: { lat: 25.0336, lng: 121.5650, name: '台北101購物中心' },
        isPrivate: false,
        anonymous: false,
        customMessage: '101的豪華體驗 🏢'
      },
      {
        id: 'demo-3',
        timestamp: now - 1000 * 60 * 60 * 24 * 5,
        bathroom: {
          id: 'toilet-3',
          name: '國父紀念館',
          latitude: 25.0408,
          longitude: 121.5598,
          address: '台北市信義區仁愛路四段505號',
          type: 'Museum'
        },
        mood: '😊',
        bristolType: 4,
        note: '參觀後的放鬆',
        quickTag: 'Museum',
        rating: 4,
        location: { lat: 25.0408, lng: 121.5598, name: '國父紀念館' },
        isPrivate: false,
        anonymous: false,
        customMessage: '歷史建築中的現代需求 🏛️'
      },
      {
        id: 'demo-4',
        timestamp: now - 1000 * 60 * 60 * 24 * 3,
        bathroom: {
          id: 'toilet-4',
          name: '誠品書店信義店',
          latitude: 25.0360,
          longitude: 121.5687,
          address: '台北市信義區松高路11號',
          type: 'Bookstore'
        },
        mood: '🥲',
        bristolType: 6,
        note: '讀書讀到肚子痛',
        quickTag: 'Bookstore',
        rating: 3,
        location: { lat: 25.0360, lng: 121.5687, name: '誠品書店信義店' },
        isPrivate: false,
        anonymous: false,
        customMessage: '知識與生理的雙重滿足 📚'
      },
      {
        id: 'demo-5',
        timestamp: now - 1000 * 60 * 60 * 24 * 1,
        bathroom: {
          id: 'toilet-5',
          name: '台北車站',
          latitude: 25.0478,
          longitude: 121.5170,
          address: '台北市中正區北平西路3號',
          type: 'Station'
        },
        mood: '💨',
        bristolType: 5,
        note: '趕火車前的最後一次',
        quickTag: 'Station',
        rating: 2,
        location: { lat: 25.0478, lng: 121.5170, name: '台北車站' },
        isPrivate: false,
        anonymous: false,
        customMessage: '旅程的終點 🚄'
      }
    ];
  };

  // 計算地圖邊界
  const calculateMapBounds = (records: CheckInRecord[]) => {
    if (records.length === 0) return;

    const lats = records.map(r => r.location.lat);
    const lngs = records.map(r => r.location.lng);
    
    const bounds = {
      north: Math.max(...lats) + 0.01,
      south: Math.min(...lats) - 0.01,
      east: Math.max(...lngs) + 0.01,
      west: Math.min(...lngs) - 0.01
    };
    
    setMapBounds(bounds);
  };

  // 計算屎線統計
  const calculatePoopLineStats = (records: CheckInRecord[]) => {
    if (records.length === 0) {
      setPoopLineStats(null);
      return;
    }

    const sortedRecords = records.sort((a, b) => a.timestamp - b.timestamp);
    
    // 計算總距離
    let totalLength = 0;
    for (let i = 1; i < sortedRecords.length; i++) {
      const prev = sortedRecords[i - 1];
      const curr = sortedRecords[i];
      totalLength += calculateDistance(
        prev.location.lat,
        prev.location.lng,
        curr.location.lat,
        curr.location.lng
      );
    }

    // 計算獨特地點數
    const uniqueLocations = new Set(records.map(r => r.bathroom.id)).size;

    // 計算最愛地點
    const locationCounts = records.reduce((acc, record) => {
      acc[record.bathroom.name] = (acc[record.bathroom.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const favoriteSpot = Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || '';

    // 計算最長連續天數
    const dayCheckins = records.reduce((acc, record) => {
      const day = new Date(record.timestamp).toDateString();
      acc[day] = true;
      return acc;
    }, {} as Record<string, boolean>);
    
    const longestStreak = Object.keys(dayCheckins).length;

    const stats: PoopLineStats = {
      totalLength: Math.round(totalLength * 100) / 100,
      totalCheckIns: records.length,
      uniqueLocations,
      longestStreak,
      favoriteSpot,
      firstCheckIn: sortedRecords[0].timestamp,
      lastCheckIn: sortedRecords[sortedRecords.length - 1].timestamp
    };

    setPoopLineStats(stats);
  };

  // 過濾記錄
  const getFilteredRecords = () => {
    const now = Date.now();
    switch (filterPeriod) {
      case 'week':
        return checkInRecords.filter(r => now - r.timestamp <= 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return checkInRecords.filter(r => now - r.timestamp <= 30 * 24 * 60 * 60 * 1000);
      case 'year':
        return checkInRecords.filter(r => now - r.timestamp <= 365 * 24 * 60 * 60 * 1000);
      default:
        return checkInRecords;
    }
  };

  // 分享屎線
  const sharePoopLine = async () => {
    try {
      if (isCapturing) return;
      
      setIsCapturing(true);
      
      // 如果有安裝 react-native-view-shot，可以啟用截圖分享
      // if (mapContainerRef.current) {
      //   try {
      //     const uri = await captureRef(mapContainerRef, {
      //       format: "png",
      //       quality: 0.8,
      //       width: screenWidth,
      //       height: screenHeight * 0.6
      //     });
      //     
      //     await Share.share({
      //       message: message,
      //       url: uri,
      //       title: '我的屎線冒險'
      //     });
      //   } catch (captureError) {
      //     // 截圖失敗時的備用方案
      //   }
      // }
      
      // 文字分享
      const filteredRecords = getFilteredRecords();
      const message = `我的屎線冒險記錄 💩\n\n` +
        `📍 總打卡次數: ${filteredRecords.length}\n` +
        `🗺️ 獨特地點: ${new Set(filteredRecords.map(r => r.bathroom.id)).size}\n` +
        `📏 總路線長度: ${poopLineStats?.totalLength || 0} 公里\n` +
        `⭐ 最愛地點: ${poopLineStats?.favoriteSpot || ''}\n\n` +
        `來自 PooPalooza 💩`;
      
      await Share.share({
        message: message,
        title: '我的屎線冒險'
      });
    } catch (error) {
      console.error('分享失敗:', error);
      Alert.alert('分享失敗', '無法分享屎線，請稍後再試');
    } finally {
      setIsCapturing(false);
    }
  };

  // 啟動流動滴落動畫
  const startFlowingAnimation = () => {
    const newDrops = Array.from({ length: 3 }, (_, index) => ({
      id: `drop-${Date.now()}-${index}`,
      progress: new Animated.Value(0)
    }));

    setFlowingDrops(newDrops);

    newDrops.forEach((drop, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(index * 1000), // 錯開開始時間
          Animated.timing(drop.progress, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: false,
          }),
          Animated.timing(drop.progress, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          })
        ])
      ).start();
    });
  };

  // 啟動線條抖動動畫
  const startLineShakeAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineShakeAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(lineShakeAnimation, {
          toValue: -1,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.timing(lineShakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }),
        Animated.delay(2000), // 停頓2秒
      ])
    ).start();
  };

  // 顯示氣泡
  const showNodeBubble = (record: CheckInRecord, x: number, y: number) => {
    setBubbleData(record);
    setBubblePosition({ x: x - 100, y: y - 120 }); // 調整位置避免遮擋
    setShowBubble(true);
    
    // 氣泡彈出動畫
    Animated.spring(bubbleAnimation, {
      toValue: 1,
      tension: 150,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  // 隱藏氣泡
  const hideBubble = () => {
    Animated.timing(bubbleAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setShowBubble(false);
      setBubbleData(null);
    });
  };

  // 處理地圖移動
  const handleMapMove = () => {
    setIsMapMoving(true);
    if (!isMapMoving) {
      startLineShakeAnimation();
    }
    
    // 延遲停止抖動
    setTimeout(() => {
      setIsMapMoving(false);
      lineShakeAnimation.setValue(0);
    }, 1000);
  };

  // 初始化
  useEffect(() => {
    loadCheckInRecords();
    startFlowingAnimation();
  }, []);

  // 氣泡組件
  const NodeBubble = () => {
    if (!showBubble || !bubbleData) return null;

    const bristolEmoji = bubbleData.bristolType ? BRISTOL_EMOJIS[bubbleData.bristolType as keyof typeof BRISTOL_EMOJIS] : '❓';
    
    return (
      <Modal transparent visible={showBubble} onRequestClose={hideBubble}>
        <TouchableOpacity 
          style={styles.bubbleOverlay} 
          activeOpacity={1} 
          onPress={hideBubble}
        >
          <Animated.View 
            style={[
              styles.bubble,
              {
                left: bubblePosition.x,
                top: bubblePosition.y,
                transform: [
                  { scale: bubbleAnimation },
                  { 
                    rotate: bubbleAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-5deg', '0deg'],
                    })
                  }
                ],
              }
            ]}
          >
            {/* 糞便形狀的氣泡背景 */}
            <View style={styles.bubblePoopShape}>
              <View style={styles.bubbleHeader}>
                <Text style={styles.bubbleTitle}>{bubbleData.bathroom.name}</Text>
                <TouchableOpacity onPress={hideBubble} style={styles.bubbleCloseButton}>
                  <X size={16} color="#8B4513" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.bubbleContent}>
                <View style={styles.bubbleMoodRow}>
                  <Text style={styles.bubbleMoodEmoji}>{bubbleData.mood}</Text>
                  <Text style={styles.bubbleMoodText}>心情狀態</Text>
                </View>
                
                {bubbleData.bristolType && (
                  <View style={styles.bubbleBristolRow}>
                    <Text style={styles.bubbleBristolEmoji}>{bristolEmoji}</Text>
                    <Text style={styles.bubbleBristolText}>
                      Type {bubbleData.bristolType} Bristol
                    </Text>
                  </View>
                )}
                
                <View style={styles.bubbleRatingRow}>
                  <Text style={styles.bubbleRatingStars}>
                    {'★'.repeat(bubbleData.rating)}{'☆'.repeat(5 - bubbleData.rating)}
                  </Text>
                  <Text style={styles.bubbleRatingText}>舒適度</Text>
                </View>
                
                {bubbleData.customMessage && (
                  <Text style={styles.bubbleMessage}>
                    💬 {bubbleData.customMessage}
                  </Text>
                )}
                
                <Text style={styles.bubbleTime}>
                  {new Date(bubbleData.timestamp).toLocaleString('zh-TW')}
                </Text>
              </View>
              
              {/* 氣泡尾巴 */}
              <View style={styles.bubbleTail} />
            </View>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // SVG 屎線組件
  const PoopLineSvg = () => {
    const filteredRecords = getFilteredRecords();
    if (filteredRecords.length < 2) return null;

    const svgCoordinates = convertCoordinatesToSvg(
      filteredRecords,
      mapBounds,
      screenWidth,
      screenHeight * 0.4
    );

    const svgPoints = generateSvgPoints(svgCoordinates);

    return (
      <Svg 
        style={StyleSheet.absoluteFill}
        width={screenWidth}
        height={screenHeight * 0.4}
      >
        <Defs>
          {/* 3D 漸層效果 */}
          <LinearGradient id="poopGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#CD853F" stopOpacity="1" />
            <Stop offset="50%" stopColor="#8B4513" stopOpacity="1" />
            <Stop offset="100%" stopColor="#654321" stopOpacity="1" />
          </LinearGradient>
          
          {/* 糞便貼圖圖案 */}
          <Pattern 
            id="poopPattern" 
            patternUnits="userSpaceOnUse" 
            width="30" 
            height="30"
          >
            <SvgText 
              x="15" 
              y="20" 
              fontSize="20" 
              textAnchor="middle"
              fill="url(#poopGradient)"
            >
              💩
            </SvgText>
          </Pattern>
        </Defs>
        
        {/* 底層陰影線 */}
        <Polyline
          points={svgPoints}
          fill="none"
          stroke="rgba(0,0,0,0.2)"
          strokeWidth={isMapMoving ? 16 : 14}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform="translate(3, 5)"
        />
        
        {/* 主要屎線 - 帶3D效果和抖動 */}
        <Animated.View>
          <Polyline
            points={svgPoints}
            fill="none"
            stroke="url(#poopPattern)"
            strokeWidth={isMapMoving ? 14 : 12}
            strokeLinecap="round"
            strokeLinejoin="round"
            transform={`translate(${lineShakeAnimation._value * 2}, ${lineShakeAnimation._value})`}
          />
        </Animated.View>
        
        {/* 流動滴落動畫 */}
        {flowingDrops.map((drop, index) => {
          const progress = drop.progress._value;
          const totalPoints = svgCoordinates.length;
          const currentIndex = Math.floor(progress * (totalPoints - 1));
          const nextIndex = Math.min(currentIndex + 1, totalPoints - 1);
          const localProgress = (progress * (totalPoints - 1)) % 1;
          
          if (currentIndex >= svgCoordinates.length - 1) return null;
          
          const current = svgCoordinates[currentIndex];
          const next = svgCoordinates[nextIndex];
          
          const x = current.x + (next.x - current.x) * localProgress;
          const y = current.y + (next.y - current.y) * localProgress;
          
          return (
            <G key={drop.id}>
              <Circle
                cx={x}
                cy={y}
                r="4"
                fill="#8B4513"
                opacity="0.8"
              />
              {/* 滴落痕跡 */}
              <Ellipse
                cx={x}
                cy={y + 2}
                rx="2"
                ry="6"
                fill="#654321"
                opacity="0.4"
              />
            </G>
          );
        })}
        
        {/* 打卡點標記 - 帶3D效果 */}
        {svgCoordinates.map((coord, index) => (
          <G key={coord.record.id}>
            {/* 陰影 */}
            <Circle
              cx={coord.x + 2}
              cy={coord.y + 3}
              r="12"
              fill="rgba(0,0,0,0.2)"
            />
            
            {/* 主體 */}
            <Circle
              cx={coord.x}
              cy={coord.y}
              r="10"
              fill="url(#poopGradient)"
              stroke="#FFFFFF"
              strokeWidth="3"
              onPress={() => {
                const screenX = coord.x;
                const screenY = coord.y + 100; // 調整Y軸偏移
                showNodeBubble(coord.record, screenX, screenY);
              }}
            />
            
            {/* 序號 */}
            <SvgText
              x={coord.x}
              y={coord.y + 3}
              fontSize="10"
              textAnchor="middle"
              fill="#FFFFFF"
              fontWeight="bold"
            >
              {index + 1}
            </SvgText>
          </G>
        ))}
        
        {/* 殘留效果 - 當地圖移動時顯示 */}
        {isMapMoving && (
          <G opacity="0.3">
            {svgCoordinates.map((coord, index) => (
              <Circle
                key={`residue-${index}`}
                cx={coord.x + Math.random() * 4 - 2}
                cy={coord.y + Math.random() * 4 - 2}
                r="2"
                fill="#8B4513"
              />
            ))}
          </G>
        )}
      </Svg>
    );
  };

  // 地圖組件
  const MapComponent = () => {
    const filteredRecords = getFilteredRecords();
    
    if (filteredRecords.length === 0) {
      return (
        <View style={styles.emptyMapContainer}>
          <MapPin size={48} color={Colors.primary.lightText} />
          <Text style={styles.emptyMapText}>尚無屎線記錄</Text>
        </View>
      );
    }

    // 計算地圖中心點
    const centerLat = (mapBounds.north + mapBounds.south) / 2;
    const centerLng = (mapBounds.east + mapBounds.west) / 2;

    const region = {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.abs(mapBounds.north - mapBounds.south) * 1.2,
      longitudeDelta: Math.abs(mapBounds.east - mapBounds.west) * 1.2,
    };

    return (
      <View style={styles.mapContainer} ref={mapContainerRef}>
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={region}
          showsUserLocation={false}
          onRegionChangeComplete={handleMapMove}
          onPanDrag={handleMapMove}
          scrollEnabled={true}
          zoomEnabled={true}
          pitchEnabled={true}
          rotateEnabled={true}
        >
          {/* 打卡點標記 */}
          {filteredRecords.map((record, index) => (
            <Marker
              key={record.id}
              coordinate={{
                latitude: record.location.lat,
                longitude: record.location.lng
              }}
              title={`${index + 1}. ${record.bathroom.name}`}
              description={record.customMessage || record.note}
              onPress={(event) => {
                setSelectedRecord(record);
                // 獲取觸摸點座標來顯示氣泡
                showNodeBubble(record, screenWidth / 2, screenHeight * 0.2);
              }}
            >
              <View style={styles.markerContainer}>
                <Text style={styles.markerEmoji}>{record.mood}</Text>
                <Text style={styles.markerNumber}>{index + 1}</Text>
              </View>
            </Marker>
          ))}
        </MapView>
        
        {/* SVG 屎線覆蓋層 */}
        <PoopLineSvg />
        
        {/* 截圖提示 */}
        {isCapturing && (
          <View style={styles.capturingOverlay}>
            <Text style={styles.capturingText}>正在生成屎線截圖...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 標題列 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <ArrowLeft size={24} color={Colors.primary.text} />
        </TouchableOpacity>
        <Text style={styles.title}>我的屎線 💩</Text>
        <TouchableOpacity style={styles.shareButton} onPress={sharePoopLine}>
          <Camera size={24} color={Colors.primary.accent} />
        </TouchableOpacity>
      </View>

      {/* 過濾器 */}
      <View style={styles.filterContainer}>
        {['all', 'week', 'month', 'year'].map(period => (
          <TouchableOpacity
            key={period}
            style={[
              styles.filterButton,
              filterPeriod === period && styles.activeFilterButton
            ]}
            onPress={() => setFilterPeriod(period as any)}
          >
            <Text style={[
              styles.filterText,
              filterPeriod === period && styles.activeFilterText
            ]}>
              {period === 'all' ? '全部' : 
               period === 'week' ? '本週' :
               period === 'month' ? '本月' : '本年'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 統計資料 */}
      {poopLineStats && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{getFilteredRecords().length}</Text>
            <Text style={styles.statLabel}>總打卡</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{poopLineStats.totalLength}km</Text>
            <Text style={styles.statLabel}>總距離</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{poopLineStats.uniqueLocations}</Text>
            <Text style={styles.statLabel}>獨特地點</Text>
          </View>
        </View>
      )}

      {/* 地圖區域 */}
      <MapComponent />

      {/* 氣泡組件 */}
      <NodeBubble />

      {/* 時間軸切換 */}
      <TouchableOpacity 
        style={styles.timelineToggle}
        onPress={() => setShowTimeline(!showTimeline)}
      >
        <Text style={styles.timelineToggleText}>
          {showTimeline ? '🔼 隱藏時間軸' : '🔽 顯示時間軸'}
        </Text>
        {showTimeline ? (
          <ChevronUp size={20} color={Colors.primary.text} />
        ) : (
          <ChevronDown size={20} color={Colors.primary.text} />
        )}
      </TouchableOpacity>

      {/* 時間軸 */}
      {showTimeline && (
        <ScrollView 
          style={styles.timelineContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.timelineTitle}>屎線時間軸</Text>
          {getFilteredRecords().map((record, index) => (
            <TouchableOpacity
              key={record.id}
              style={[
                styles.timelineItem,
                selectedRecord?.id === record.id && styles.selectedTimelineItem
              ]}
              onPress={() => setSelectedRecord(record)}
            >
              <View style={styles.timelineMarker}>
                <Text style={styles.timelineEmoji}>{record.mood}</Text>
                <Text style={styles.timelineNumber}>{index + 1}</Text>
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLocationName}>{record.bathroom.name}</Text>
                <Text style={styles.timelineMessage}>
                  {record.customMessage || record.note}
                </Text>
                <Text style={styles.timelineTime}>
                  {new Date(record.timestamp).toLocaleDateString('zh-TW')} {' '}
                  {new Date(record.timestamp).toLocaleTimeString('zh-TW', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
                <Text style={styles.timelineTag}>#{record.quickTag}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 44 : 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  shareButton: {
    padding: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.primary.card,
    alignItems: 'center',
  },
  activeFilterButton: {
    backgroundColor: Colors.primary.accent,
  },
  filterText: {
    fontSize: 14,
    color: Colors.primary.text,
  },
  activeFilterText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.accent,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginTop: 4,
  },
  mapContainer: {
    height: screenHeight * 0.4,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  emptyMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary.card,
  },
  emptyMapText: {
    fontSize: 16,
    color: Colors.primary.lightText,
    marginTop: 12,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#8B4513',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  markerEmoji: {
    fontSize: 16,
  },
  markerNumber: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
    position: 'absolute',
    bottom: -2,
  },
  timelineToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.primary.border,
    gap: 8,
  },
  timelineToggleText: {
    fontSize: 16,
    color: Colors.primary.text,
    fontWeight: 'bold',
  },
  timelineContainer: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#F8E9D2',
  },
  timelineTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    textAlign: 'center',
    paddingVertical: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedTimelineItem: {
    borderWidth: 2,
    borderColor: Colors.primary.accent,
    backgroundColor: '#FFF9E6',
  },
  timelineMarker: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#8B4513',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  timelineEmoji: {
    fontSize: 20,
  },
  timelineNumber: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 2,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLocationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 4,
  },
  timelineMessage: {
    fontSize: 14,
    color: Colors.primary.accent,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  timelineTime: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginBottom: 2,
  },
  timelineTag: {
    fontSize: 12,
    color: Colors.primary.accent,
  },
  
  // 氣泡樣式
  bubbleOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bubble: {
    position: 'absolute',
    width: 200,
    minHeight: 150,
    zIndex: 1000,
  },
  bubblePoopShape: {
    backgroundColor: '#D2B48C',
    borderRadius: 20,
    padding: 16,
    borderWidth: 3,
    borderColor: '#8B4513',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  bubbleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bubbleTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
    flex: 1,
  },
  bubbleCloseButton: {
    padding: 4,
  },
  bubbleContent: {
    gap: 8,
  },
  bubbleMoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bubbleMoodEmoji: {
    fontSize: 24,
  },
  bubbleMoodText: {
    fontSize: 12,
    color: '#8B4513',
  },
  bubbleBristolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bubbleBristolEmoji: {
    fontSize: 20,
  },
  bubbleBristolText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: 'bold',
  },
  bubbleRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bubbleRatingStars: {
    fontSize: 14,
    color: '#FFD700',
  },
  bubbleRatingText: {
    fontSize: 12,
    color: '#8B4513',
  },
  bubbleMessage: {
    fontSize: 12,
    color: '#654321',
    fontStyle: 'italic',
    backgroundColor: 'rgba(255,255,255,0.3)',
    padding: 6,
    borderRadius: 8,
  },
  bubbleTime: {
    fontSize: 10,
    color: '#8B4513',
    textAlign: 'center',
    marginTop: 4,
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -8,
    left: 20,
    width: 16,
    height: 16,
    backgroundColor: '#D2B48C',
    borderWidth: 2,
    borderColor: '#8B4513',
    borderRadius: 8,
    transform: [{ rotate: '45deg' }],
  },
  
  // 截圖覆蓋層
  capturingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturingText: {
    fontSize: 16,
    color: '#8B4513',
    fontWeight: 'bold',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
});