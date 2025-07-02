import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions, Platform, TouchableOpacity, Text, Animated } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import Svg, { Defs, Pattern, Path, Circle, Rect, G } from 'react-native-svg';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

// 假資料生成
const generateMockData = () => {
  const locations = [
    { lat: 25.0478, lng: 121.5170, name: '台北車站B1' },
    { lat: 25.0360, lng: 121.5687, name: '信義誠品4樓' },
    { lat: 25.0263, lng: 121.5345, name: '大安森林公園樹下' },
    { lat: 25.0338, lng: 121.5645, name: '101觀景台89樓' },
    { lat: 25.0416, lng: 121.5071, name: '西門町巷弄角落' },
    { lat: 25.0440, lng: 121.5292, name: '華山草地' },
    { lat: 25.0580, lng: 121.5444, name: '朋友家客廳' },
    { lat: 25.0530, lng: 121.5160, name: '便利商店外面' }
  ];

  const moods = ['😊', '😌', '😅', '🤗', '😋', '🥳', '😇', '🤤'];
  const customMessages = [
    '差點憋不住了！',
    '在這裡拉屎居然很有詩意',
    '第一次在戶外解決，挺刺激的',
    '便便很順暢，心情大好！',
    '希望沒有人看到我...',
    '突然肚子痛，只能在這裡了',
    '意外發現這個秘密基地',
    '野外大便初體驗！'
  ];

  return locations.map((loc, i) => ({
    id: `record-${i + 1}`,
    timestamp: Date.now() - (i * 24 * 60 * 60 * 1000),
    location: loc,
    mood: moods[i % moods.length],
    customMessage: customMessages[i % customMessages.length],
    note: `大便冒險記錄 #${i + 1}`,
    bristolType: Math.floor(Math.random() * 7) + 1,
    rating: Math.floor(Math.random() * 5) + 1
  }));
};

// 貝茲曲線生成函數
const generateSmoothPath = (points) => {
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

export default function GestureEnabledPoopMap() {
  const mapRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [animatedMarkers, setAnimatedMarkers] = useState({});
  
  const checkInRecords = generateMockData().slice(0, 8).sort((a, b) => a.timestamp - b.timestamp);

  const initialRegion = {
    latitude: 25.0478,
    longitude: 121.5170,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08
  };

  // 初始化動畫值
  useEffect(() => {
    const animations = {};
    checkInRecords.forEach(record => {
      animations[record.id] = new Animated.Value(0);
    });
    setAnimatedMarkers(animations);
  }, []);

  // 將經緯度轉換為螢幕座標
  const convertGpsToPoints = (records, region) => {
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

  // 地圖區域變化處理
  const handleRegionChange = (region) => {
    setMapRegion(region);
  };

  // 強制啟用地圖手勢
  const handleMapPress = () => {
    console.log('地圖被點擊，檢查手勢狀態');
    if (mapRef.current) {
      // 強制重新啟用所有手勢
      mapRef.current.setNativeProps({
        scrollEnabled: true,
        zoomEnabled: true,
        pitchEnabled: true,
        rotateEnabled: true,
      });
      console.log('手勢已重新啟用');
    }
  };

  // 標記點擊處理
  const handleMarkerPress = (record) => {
    setSelectedMarker(record);
    
    if (animatedMarkers[record.id]) {
      Animated.sequence([
        Animated.timing(animatedMarkers[record.id], {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animatedMarkers[record.id], {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // 手動縮放控制
  const handleZoomIn = () => {
    if (mapRef.current && mapRegion) {
      const newRegion = {
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 0.6,
        longitudeDelta: mapRegion.longitudeDelta * 0.6
      };
      mapRef.current.animateToRegion(newRegion, 400);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current && mapRegion) {
      const newRegion = {
        ...mapRegion,
        latitudeDelta: mapRegion.latitudeDelta * 1.6,
        longitudeDelta: mapRegion.longitudeDelta * 1.6
      };
      mapRef.current.animateToRegion(newRegion, 400);
    }
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(initialRegion, 800);
    }
  };

  // 屎紋理定義
  const EnhancedPoopTexture = () => (
    <Defs>
      <Pattern id="densePoopPattern" patternUnits="userSpaceOnUse" width="12" height="6">
        <Rect width="12" height="6" fill="#8B4513"/>
        <Circle cx="3" cy="3" r="1.5" fill="#A0522D"/>
        <Circle cx="7" cy="2" r="1" fill="#654321"/>
        <Circle cx="9" cy="4" r="0.8" fill="#5D4037"/>
        <Rect x="1" y="1" width="4" height="1.5" rx="0.75" fill="#A0522D"/>
        <Rect x="6" y="4" width="3" height="1" rx="0.5" fill="#654321"/>
      </Pattern>
      
      <Pattern id="flowPoopPattern" patternUnits="userSpaceOnUse" width="16" height="8">
        <Rect width="16" height="8" fill="#8B4513"/>
        <Circle cx="3" cy="4" r="2" fill="#A0522D"/>
        <Circle cx="9" cy="3" r="1.5" fill="#654321"/>
        <Circle cx="13" cy="5" r="1" fill="#5D4037"/>
        <Rect x="1" y="2" width="6" height="2" rx="1" fill="#A0522D"/>
        <Rect x="8" y="5" width="4" height="1.5" rx="0.75" fill="#654321"/>
      </Pattern>

      <Pattern id="roughPoopPattern" patternUnits="userSpaceOnUse" width="10" height="5">
        <Rect width="10" height="5" fill="#8B4513"/>
        <Circle cx="2" cy="2.5" r="0.8" fill="#A0522D"/>
        <Circle cx="5" cy="1.5" r="0.6" fill="#654321"/>
        <Circle cx="7.5" cy="3" r="0.5" fill="#5D4037"/>
        <Rect x="3" y="0.5" width="2.5" height="0.8" rx="0.4" fill="#A0522D"/>
        <Rect x="6" y="3.5" width="1.5" height="0.6" rx="0.3" fill="#654321"/>
      </Pattern>
    </Defs>
  );

  // 氣泡組件
  const AnimatedPoopBubbles = ({ x, y, show }) => {
    const bubbleAnim = useRef(new Animated.Value(0)).current;
    
    useEffect(() => {
      if (show) {
        Animated.sequence([
          Animated.timing(bubbleAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.delay(2000),
          Animated.timing(bubbleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [show]);

    const translateY = bubbleAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0, -30],
    });

    return (
      <Animated.View
        style={[
          styles.poopBubble,
          {
            left: x - 40,
            top: y - 60,
            opacity: bubbleAnim,
            transform: [{ translateY }],
          },
        ]}
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
      {/* 地圖 - 簡化手勢設定但保持功能 */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        onMapReady={() => {
          setMapReady(true);
          setMapRegion(initialRegion);
          console.log('🗺️ 地圖已準備就緒');
          console.log('👌 雙指縮放應該可以使用');
          console.log('👆 單指拖拽應該可以使用');
          
          // 確保手勢在地圖準備好後立即啟用
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.setNativeProps({
                scrollEnabled: true,
                zoomEnabled: true,
                pitchEnabled: true,
                rotateEnabled: true,
              });
              console.log('✅ 手勢已確認啟用');
            }
          }, 100);
        }}
        onRegionChangeComplete={handleRegionChange}
        onPress={handleMapPress}
        
        // 確保手勢完全啟用
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={true}    // 重新啟用3D
        rotateEnabled={true}   // 重新啟用旋轉
        
        // 手勢靈敏度設定
        minZoomLevel={8}       // 最小縮放級別
        maxZoomLevel={20}      // 最大縮放級別
        
        // 額外手勢設定
        showsUserLocation={true}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        
        // 確保觸控響應
        moveOnMarkerPress={false}
        pointerEvents="auto"
      >
        {/* 地點標記 */}
        {checkInRecords.map((record, index) => {
          const animScale = animatedMarkers[record.id]?.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.3],
          }) || 1;

          return (
            <Marker
              key={record.id}
              coordinate={{ 
                latitude: record.location.lat, 
                longitude: record.location.lng 
              }}
              title={`💩 第 ${index + 1} 站`}
              description={record.customMessage || record.note}
              onPress={() => handleMarkerPress(record)}
              stopPropagation={false}
            >
              <Animated.View 
                style={[
                  styles.enhancedMarker,
                  { transform: [{ scale: animScale }] }
                ]}
              >
                <Text style={styles.markerEmoji}>{record.mood}</Text>
                <Text style={styles.markerNumber}>{index + 1}</Text>
              </Animated.View>
            </Marker>
          );
        })}
      </MapView>

      {/* 屎線 SVG 疊加層 */}
      {mapReady && mapRegion && smoothPath && (
        <Svg style={styles.svgOverlay} pointerEvents="none">
          <EnhancedPoopTexture />
          
          <Path
            d={smoothPath}
            fill="none"
            stroke="#654321"
            strokeWidth={20}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.2}
          />
          
          <Path
            d={smoothPath}
            fill="none"
            stroke="url(#densePoopPattern)"
            strokeWidth={16}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          <Path
            d={smoothPath}
            fill="none"
            stroke="url(#flowPoopPattern)"
            strokeWidth={12}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          <Path
            d={smoothPath}
            fill="none"
            stroke="url(#roughPoopPattern)"
            strokeWidth={8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {pathPoints.map((point, index) => (
            <G key={`poop-pile-${index}`}>
              <Circle
                cx={point.x}
                cy={point.y}
                r="10"
                fill="#8B4513"
                stroke="#654321"
                strokeWidth="2"
                opacity={0.7}
              />
              <Circle
                cx={point.x}
                cy={point.y}
                r="6"
                fill="#A0522D"
                opacity={0.5}
              />
            </G>
          ))}
        </Svg>
      )}

      {/* 移除縮放控制按鈕 - 純手勢操作 */}

      {/* 動畫氣泡 */}
      {selectedMarker && pathPoints.map((point, index) => 
        point.record.id === selectedMarker.id ? (
          <AnimatedPoopBubbles
            key={`bubble-${selectedMarker.id}`}
            x={point.x}
            y={point.y}
            show={true}
          />
        ) : null
      )}

      {/* 資訊面板 */}
      <View style={styles.enhancedInfo}>
        <View style={styles.infoHeader}>
          <Text style={styles.infoTitle}>💩 Poop Line Adventure</Text>
          <Text style={styles.infoSubtitle}>Enhanced with smooth curves</Text>
        </View>
        <Text style={styles.infoText}>
          {checkInRecords.length} stops • Following the brown trail
        </Text>
        <Text style={styles.infoHint}>
          👆 點擊標記查看詳情 • 👌 雙指縮放地圖 • 📱 單指拖拽移動
        </Text>
      </View>

      {/* 圖例 */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5E6D3',
  },
  
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  
  svgOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  
  webMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
  },
  webMapTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 16,
  },
  webMapText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },

  enhancedMarker: {
    backgroundColor: 'white',
    borderRadius: 22,
    padding: 8,
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#8B4513',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  markerEmoji: {
    fontSize: 20,
  },
  markerNumber: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#8B4513',
    marginTop: 2,
  },

  mapControls: {
    position: 'absolute',
    top: 60,
    right: 16,
    zIndex: 1000,
    gap: 12,
  },
  controlButton: {
    width: 50,
    height: 50,
    backgroundColor: 'white',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 2,
    borderColor: '#E8D5B7',
  },

  poopBubble: {
    position: 'absolute',
    zIndex: 2000,
  },
  bubbleContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 12,
    borderWidth: 2,
    borderColor: '#8B4513',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    alignItems: 'center',
  },
  bubbleText: {
    fontSize: 12,
    color: '#8B4513',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bubbleEmoji: {
    fontSize: 16,
  },

  enhancedInfo: {
    position: 'absolute',
    bottom: 120,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#E8D5B7',
    zIndex: 100,
  },
  infoHeader: {
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  infoSubtitle: {
    fontSize: 12,
    color: '#A0522D',
    fontStyle: 'italic',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoHint: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },

  enhancedLegend: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E8D5B7',
    zIndex: 100,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendSmoothLine: {
    width: 24,
    height: 4,
    backgroundColor: '#8B4513',
    borderRadius: 2,
    marginRight: 8,
  },
  legendEmoji: {
    fontSize: 14,
    marginRight: 8,
  },
  legendText: {
    fontSize: 10,
    color: '#666',
  },
});