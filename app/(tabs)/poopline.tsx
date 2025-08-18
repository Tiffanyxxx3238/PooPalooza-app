import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform, Text, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import Svg, { Defs, Pattern, Path, Circle, Rect, G } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const API_BASE_URL = Platform.select({
  ios: 'http://127.0.0.1:5001',     // iOS 模擬器 → 你的 Flask http://localhost:5001
  android: 'http://10.0.2.2:5001',  // Android 模擬器
  default: 'http://<你的電腦LAN_IP>:5001', // 真機請改成電腦區網 IP
});

/** -------------------- API -------------------- **/

async function fetchCheckinsNear({
  lat,
  lng,
  radius_m = 1500,
  limit = 200,
  userId,
}: {
  lat: number;
  lng: number;
  radius_m?: number;
  limit?: number;
  userId?: string;
}) {
  const qs =
    `lat=${encodeURIComponent(String(lat))}` +
    `&lng=${encodeURIComponent(String(lng))}` +
    `&radius_m=${encodeURIComponent(String(radius_m))}` +
    `&limit=${encodeURIComponent(String(limit))}` +
    (userId ? `&user_id=${encodeURIComponent(userId)}` : '');

  const res = await fetch(`${API_BASE_URL}/toilet_checkins/near?${qs}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fetchCheckinsNear failed: ${res.status} ${text}`);
  }
  // 後端回傳: [{ id, user_id, lat, lng, note, created_at, distance_m }]
  return res.json();
}

/** 把後端資料轉成前端使用的結構 */
function mapServerToRecord(c: any) {
  if (c.lat == null || c.lng == null) return null;
  return {
    id: String(c.id),
    timestamp: new Date(c.created_at ?? Date.now()).getTime(),
    location: { lat: Number(c.lat), lng: Number(c.lng) },
    mood: '💩',
    customMessage: c.note ?? '',
    note: c.user_id ? `by ${c.user_id}` : '',
    bristolType: null,
    rating: 3,
    distance_m: c.distance_m ?? null,
  };
}

/** -------------------- 幾何工具 -------------------- **/

// 貝茲曲線生成函數
const generateSmoothPath = (points: Array<{ x: number; y: number }>) => {
  if (points.length < 2) return '';
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const current = points[i];
    if (i === 1) {
      const cp1x = prev.x + (current.x - prev.x) * 0.5;
      const cp1y = prev.y + (current.y - prev.y) * 0.3;
      path += ` Q ${cp1x} ${cp1y} ${current.x} ${current.y}`;
    } else {
      const prevPrev = points[i - 2];
      const cp1x = prev.x + (current.x - prevPrev.x) * 0.2;
      const cp1y = prev.y + (current.y - prevPrev.y) * 0.2;
      const cp2x = current.x - (current.x - prev.x) * 0.2;
      const cp2y = current.y - (current.y - prev.y) * 0.2;
      path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${current.x} ${current.y}`;
    }
  }
  return path;
};

/** -------------------- 主元件 -------------------- **/

export default function GestureEnabledPoopMap() {
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);

  const [checkInRecords, setCheckInRecords] = useState<any[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);
  const [animatedMarkers, setAnimatedMarkers] = useState<Record<string, Animated.Value>>({});
  const fetchTimerRef = useRef<NodeJS.Timeout | null>(null);

  const initialRegion: Region = {
    latitude: 25.0478,
    longitude: 121.5170,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  /** 依地圖區域抓附近打卡 */
  const loadNearBy = async (region: Region | null) => {
    if (!region) return;
    try {
      const raw = await fetchCheckinsNear({
        lat: region.latitude,
        lng: region.longitude,
        radius_m: 1500,
        limit: 200,
      });
      const mapped = raw.map(mapServerToRecord).filter(Boolean as any);
      // 依時間排序
      mapped.sort((a: any, b: any) => a.timestamp - b.timestamp);
      setCheckInRecords(mapped);
    } catch (e) {
      console.warn('loadNearBy error', e);
    }
  };

  /** 初始化 & 地圖就緒時載入 */
  useEffect(() => {
    if (mapReady && mapRegion) {
      loadNearBy(mapRegion);
    }
  }, [mapReady]);

  /** 地圖移動後節流抓資料 */
  const handleRegionChangeComplete = (region: Region) => {
    setMapRegion(region);
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => {
      loadNearBy(region);
    }, 350);
  };

  /** 當資料更新時，為每個 marker 準備動畫值 */
  useEffect(() => {
    const animations: Record<string, Animated.Value> = {};
    checkInRecords.forEach((r) => {
      animations[r.id] = animations[r.id] || new Animated.Value(0);
    });
    setAnimatedMarkers(animations);
  }, [checkInRecords.length]);

  /** 將經緯度轉成螢幕座標（給 SVG 路徑用） */
  const convertGpsToPoints = (records: any[], region: Region | null) => {
    if (!region) return [];
    const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
    return records.map((record) => {
      const latOffset = (record.location.lat - latitude) / latitudeDelta;
      const lngOffset = (record.location.lng - longitude) / longitudeDelta;
      const x = width / 2 + (lngOffset * width);
      const y = height / 2 - (latOffset * height);
      return { x, y, record };
    });
  };

  const pathPoints = convertGpsToPoints(checkInRecords, mapRegion);
  const smoothPath = generateSmoothPath(pathPoints);

  /** 點 marker 動畫 */
  const handleMarkerPress = (record: any) => {
    setSelectedMarker(record);
    const anim = animatedMarkers[record.id];
    if (anim) {
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  };

  /** 屎紋理定義 */
  const EnhancedPoopTexture = () => (
    <Defs>
      <Pattern id="densePoopPattern" patternUnits="userSpaceOnUse" width="12" height="6">
        <Rect width="12" height="6" fill="#8B4513" />
        <Circle cx="3" cy="3" r="1.5" fill="#A0522D" />
        <Circle cx="7" cy="2" r="1" fill="#654321" />
        <Circle cx="9" cy="4" r="0.8" fill="#5D4037" />
        <Rect x="1" y="1" width="4" height="1.5" rx="0.75" fill="#A0522D" />
        <Rect x="6" y="4" width="3" height="1" rx="0.5" fill="#654321" />
      </Pattern>
      <Pattern id="flowPoopPattern" patternUnits="userSpaceOnUse" width="16" height="8">
        <Rect width="16" height="8" fill="#8B4513" />
        <Circle cx="3" cy="4" r="2" fill="#A0522D" />
        <Circle cx="9" cy="3" r="1.5" fill="#654321" />
        <Circle cx="13" cy="5" r="1" fill="#5D4037" />
        <Rect x="1" y="2" width="6" height="2" rx="1" fill="#A0522D" />
        <Rect x="8" y="5" width="4" height="1.5" rx="0.75" fill="#654321" />
      </Pattern>
      <Pattern id="roughPoopPattern" patternUnits="userSpaceOnUse" width="10" height="5">
        <Rect width="10" height="5" fill="#8B4513" />
        <Circle cx="2" cy="2.5" r="0.8" fill="#A0522D" />
        <Circle cx="5" cy="1.5" r="0.6" fill="#654321" />
        <Circle cx="7.5" cy="3" r="0.5" fill="#5D4037" />
        <Rect x="3" y="0.5" width="2.5" height="0.8" rx="0.4" fill="#A0522D" />
        <Rect x="6" y="3.5" width="1.5" height="0.6" rx="0.3" fill="#654321" />
      </Pattern>
    </Defs>
  );

  /** 動畫氣泡 */
  const AnimatedPoopBubbles = ({ x, y, show }: { x: number; y: number; show: boolean }) => {
    const bubbleAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
      if (show) {
        Animated.sequence([
          Animated.timing(bubbleAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.delay(2000),
          Animated.timing(bubbleAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      }
    }, [show]);
    const translateY = bubbleAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -30] });
    return (
      <Animated.View
        style={[styles.poopBubble, { left: x - 40, top: y - 60, opacity: bubbleAnim, transform: [{ translateY }] }]}
        pointerEvents="none"
      >
        <View style={styles.bubbleContainer}>
          <Text style={styles.bubbleText}>💨 今天拉得很通暢！</Text>
          <Text style={styles.bubbleEmoji}>💩</Text>
        </View>
      </Animated.View>
    );
  };

  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <View style={styles.webMapContainer}>
          <MaterialIcons name="location-on" size={48} color="#8B4513" />
          <Text style={styles.webMapTitle}>Enhanced Poop Line Map</Text>
          <Text style={styles.webMapText}>Interactive poop trail with gesture support</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onMapReady={() => {
          setMapReady(true);
          setMapRegion(initialRegion);
          setTimeout(() => {
            mapRef.current?.setNativeProps({
              scrollEnabled: true,
              zoomEnabled: true,
              pitchEnabled: true,
              rotateEnabled: true,
            });
          }, 100);
        }}
        onRegionChangeComplete={handleRegionChangeComplete}
        scrollEnabled
        zoomEnabled
        pitchEnabled
        rotateEnabled
        minZoomLevel={8}
        maxZoomLevel={20}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        moveOnMarkerPress={false}
        pointerEvents="auto"
      >
        {checkInRecords.map((record, index) => {
          const animScale =
            animatedMarkers[record.id]?.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) ?? 1;
        return (
            <Marker
              key={record.id}
              coordinate={{ latitude: record.location.lat, longitude: record.location.lng }}
              title={`💩 第 ${index + 1} 站`}
              description={record.customMessage || record.note}
              onPress={() => handleMarkerPress(record)}
              stopPropagation={false}
            >
              <Animated.View style={[styles.enhancedMarker, { transform: [{ scale: animScale }] }]}>
                <Text style={styles.markerEmoji}>{record.mood}</Text>
                <Text style={styles.markerNumber}>{index + 1}</Text>
              </Animated.View>
            </Marker>
          );
        })}
      </MapView>

      {mapReady && mapRegion && smoothPath ? (
        <Svg style={styles.svgOverlay} pointerEvents="none">
          <EnhancedPoopTexture />
          <Path d={smoothPath} fill="none" stroke="#654321" strokeWidth={20} strokeLinecap="round" strokeLinejoin="round" opacity={0.2}/>
          <Path d={smoothPath} fill="none" stroke="url(#densePoopPattern)" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round"/>
          <Path d={smoothPath} fill="none" stroke="url(#flowPoopPattern)" strokeWidth={12} strokeLinecap="round" strokeLinejoin="round"/>
          <Path d={smoothPath} fill="none" stroke="url(#roughPoopPattern)" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round"/>
          {pathPoints.map((p, idx) => (
            <G key={`pile-${idx}`}>
              <Circle cx={p.x} cy={p.y} r="10" fill="#8B4513" stroke="#654321" strokeWidth="2" opacity={0.7}/>
              <Circle cx={p.x} cy={p.y} r="6" fill="#A0522D" opacity={0.5}/>
            </G>
          ))}
        </Svg>
      ) : null}

      {selectedMarker &&
        pathPoints.map((pt, i) =>
          pt.record.id === selectedMarker.id ? (
            <AnimatedPoopBubbles key={`bubble-${selectedMarker.id}`} x={pt.x} y={pt.y} show />
          ) : null
        )}

      <View style={styles.enhancedInfo}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>💩 Poop Line Adventure</Text>
          <Text style={styles.infoSubtitle}>Enhanced with smooth curves</Text>
        </View>
        <Text style={styles.infoText}>
          {checkInRecords.length} stops • Following the brown trail
        </Text>
        <Text style={styles.infoHint}>👆 點擊標記查看詳情 • 👌 雙指縮放地圖 • 📱 單指拖拽移動</Text>
      </View>

      <View style={styles.enhancedLegend}>
        <Text style={styles.legendTitle}>🎨 圖例</Text>
        <View style={styles.legendItem}>
          <View style={styles.legendSmoothLine} />
          <Text style={styles.legendText}>流暢屎線軌跡</Text>
        </View>
        <View style={styles.legendItem}>
          <Text style={styles.legendEmoji}>💩</Text>
          <Text style={styles.legendText}>互動大便地點</Text>
        </View>
      </View>
    </View>
  );
}

/** -------------------- 樣式 -------------------- **/

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5E6D3' },
  map: { ...StyleSheet.absoluteFillObject },
  svgOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 1 },
  webMapContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F8FF' },
  webMapTitle: { fontSize: 24, fontWeight: 'bold', color: '#8B4513', marginTop: 16 },
  webMapText: { fontSize: 16, color: '#666', marginTop: 8 },
  enhancedMarker: {
    backgroundColor: 'white', borderRadius: 22, padding: 8, alignItems: 'center',
    borderWidth: 3, borderColor: '#8B4513', shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 6,
  },
  markerEmoji: { fontSize: 20 },
  markerNumber: { fontSize: 10, fontWeight: 'bold', color: '#8B4513', marginTop: 2 },
  poopBubble: { position: 'absolute', zIndex: 2000 },
  bubbleContainer: {
    backgroundColor: 'white', borderRadius: 15, padding: 12, borderWidth: 2, borderColor: '#8B4513',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 5, alignItems: 'center',
  },
  bubbleText: { fontSize: 12, color: '#8B4513', fontWeight: 'bold', marginBottom: 4 },
  bubbleEmoji: { fontSize: 16 },
  enhancedInfo: {
    position: 'absolute', bottom: 120, left: 16, right: 16, backgroundColor: 'white', padding: 16,
    borderRadius: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6,
    elevation: 8, borderWidth: 2, borderColor: '#E8D5B7', zIndex: 100,
  },
  infoHeader: { marginBottom: 8 },
  infoTitle: { fontSize: 18, fontWeight: 'bold', color: '#8B4513' },
  infoSubtitle: { fontSize: 12, color: '#A0522D', fontStyle: 'italic' },
  infoText: { fontSize: 14, color: '#666', marginBottom: 4 },
  infoHint: { fontSize: 11, color: '#999', fontStyle: 'italic' },
  enhancedLegend: {
    position: 'absolute', bottom: 16, left: 16, backgroundColor: 'white', padding: 12, borderRadius: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 4,
    borderWidth: 1, borderColor: '#E8D5B7', zIndex: 100,
  },
  legendTitle: { fontSize: 12, fontWeight: 'bold', color: '#8B4513', marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  legendSmoothLine: { width: 24, height: 4, backgroundColor: '#8B4513', borderRadius: 2, marginRight: 8 },
  legendEmoji: { fontSize: 14, marginRight: 8 },
  legendText: { fontSize: 10, color: '#666' },
});
