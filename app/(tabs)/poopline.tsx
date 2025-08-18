import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform, Text, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { Region } from 'react-native-maps';
import { MaterialIcons } from '@expo/vector-icons';
// ⚠️ 暫時移除 react-native-svg 疊加層，避免 iOS Expo Go 崩潰
// import Svg, { Defs, Pattern, Path, Circle, Rect, G } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

/** ← 把這個換成你的電腦 IPv4（例：192.168.1.23） */
const LAN_IP = '192.168.1.23';
const API_BASE_URL = `http://${LAN_IP}:5001`;

// iOS 安全模式：不用 Google provider、先關閉 SVG 疊加
const IS_IOS = Platform.OS === 'ios';
const SAFE_MODE = IS_IOS; // iOS 先開啟安全模式

/** -------------------- API -------------------- **/
async function fetchCheckinsNear({
  lat, lng, radius_m = 1500, limit = 200, userId,
}: { lat: number; lng: number; radius_m?: number; limit?: number; userId?: string; }) {
  const qs =
    `lat=${encodeURIComponent(String(lat))}` +
    `&lng=${encodeURIComponent(String(lng))}` +
    `&radius_m=${encodeURIComponent(String(radius_m))}` +
    `&limit=${encodeURIComponent(String(limit))}` +
    (userId ? `&user_id=${encodeURIComponent(userId)}` : '');
  const res = await fetch(`${API_BASE_URL}/toilet_checkins/near?${qs}`);
  if (!res.ok) throw new Error(`fetchCheckinsNear failed: ${res.status} ${await res.text()}`);
  return res.json();
}

function mapServerToRecord(c: any) {
  if (c.latitude == null || c.longitude == null) return null;
  return {
    id: `checkin-${c.toilet_checkin_id ?? c.id}`,
    timestamp: new Date(c.checkin_time || c.created_at || Date.now()).getTime(),
    location: { lat: Number(c.latitude ?? c.lat), lng: Number(c.longitude ?? c.lng) },
    mood: '💩',
    customMessage: c.note || '',
    note: `by ${c.user_id ?? ''}`,
    bristolType: null,
    rating: 3,
  };
}

export default function GestureEnabledPoopMap() {
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [checkInRecords, setCheckInRecords] = useState<any[]>([]);
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);
  const [animatedMarkers, setAnimatedMarkers] = useState<Record<string, Animated.Value>>({});
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initialRegion: Region = {
    latitude: 25.0478, longitude: 121.5170, latitudeDelta: 0.08, longitudeDelta: 0.08,
  };

  const loadNearBy = async (region: Region | null) => {
    if (!region) return;
    try {
      const raw = await fetchCheckinsNear({ lat: region.latitude, lng: region.longitude, radius_m: 1500, limit: 200 });
      const mapped = raw.map(mapServerToRecord).filter(Boolean as any).sort((a: any, b: any) => a.timestamp - b.timestamp);
      setCheckInRecords(mapped);
    } catch (e) { console.warn('loadNearBy error', e); }
  };

  useEffect(() => { if (mapReady && mapRegion) loadNearBy(mapRegion); }, [mapReady, mapRegion]);

  const handleRegionChangeComplete = (region: Region) => {
    setMapRegion(region);
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(() => loadNearBy(region), 350);
  };

  useEffect(() => {
    const animations: Record<string, Animated.Value> = {};
    checkInRecords.forEach(r => { animations[r.id] = animations[r.id] || new Animated.Value(0); });
    setAnimatedMarkers(animations);
  }, [checkInRecords.length]);

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
        // ⬇️ iOS 不要用 Google provider，避免 Expo Go 直接 crash
        provider={SAFE_MODE ? undefined : (Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined)}
        initialRegion={initialRegion}
        onMapReady={() => {
          setMapReady(true);
          setMapRegion(initialRegion);
          setTimeout(() => {
            mapRef.current?.setNativeProps({ scrollEnabled: true, zoomEnabled: true, pitchEnabled: true, rotateEnabled: true });
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
          const animScale = animatedMarkers[record.id]?.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) ?? 1;
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

      {/* ⬇️ 安全模式先關掉 SVG 疊加（屎線）。等不閃退再開回來
      {mapReady && mapRegion && checkInRecords.length > 1 && !SAFE_MODE ? (
        <Svg style={styles.svgOverlay} pointerEvents="none">
          ... 你的 Path / Pattern 疊加層 ...
        </Svg>
      ) : null}
      */}

      <View style={styles.enhancedInfo}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>💩 Poop Line Adventure</Text>
          <Text style={styles.infoSubtitle}>Enhanced with smooth curves</Text>
        </View>
        <Text style={styles.infoText}>{checkInRecords.length} stops • Following the brown trail</Text>
        <Text style={styles.infoHint}>👆 點擊標記查看詳情 • 👌 雙指縮放地圖 • 📱 單指拖拽移動</Text>
      </View>
    </View>
  );
}

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
});
