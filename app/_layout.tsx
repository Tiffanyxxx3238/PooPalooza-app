import 'react-native-get-random-values';
import React, { useState, useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useUserStore } from '@/store/userStore';
import ChatScreen from '@/components/ChatScreen';

import {
  Dimensions,
  View,
  StyleSheet,
  Modal,
  Animated,
  PanResponder,
  Text,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

export const unstable_settings = {
  initialRouteName: 'index',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({ ...FontAwesome.font });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const FAB_SIZE = 70; // 稍微加大一點

function RootLayoutNav() {
  const [showChat, setShowChat] = useState(false);
  const [positionLoaded, setPositionLoaded] = useState(false);
  const pan = useState(new Animated.ValueXY({ x: 20, y: screenHeight / 2 - FAB_SIZE / 2 }))[0];
  
  // AI 動畫效果
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const thoughtBubbles = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  // 邊界檢查函數
  const validatePosition = (x, y) => {
    const validX = Math.min(Math.max(0, x), screenWidth - FAB_SIZE);
    const validY = Math.min(Math.max(0, y), screenHeight - FAB_SIZE);
    return { x: validX, y: validY };
  };

  // 持續的動畫效果
  useEffect(() => {
    // 脈衝動畫
    const pulse = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };
    pulse();

    // 光暈動畫
    const glow = () => {
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.3,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start(() => glow());
    };
    glow();

    // 思考泡泡動畫
    thoughtBubbles.forEach((anim, index) => {
      const animateBubble = () => {
        Animated.sequence([
          Animated.delay(index * 500),
          Animated.timing(anim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => animateBubble());
      };
      animateBubble();
    });
  }, []);

  // 載入儲存位置
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('chat_position');
        if (stored) {
          const { x, y } = JSON.parse(stored);
          if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
            const validPosition = validatePosition(x, y);
            pan.setValue(validPosition);
          } else {
            const defaultY = screenHeight / 2 - FAB_SIZE / 2;
            pan.setValue({ x: 20, y: defaultY });
          }
        }
      } catch (error) {
        console.log('載入位置時發生錯誤:', error);
        const defaultY = screenHeight / 2 - FAB_SIZE / 2;
        pan.setValue({ x: 20, y: defaultY });
      }
      setPositionLoaded(true);
    })();
  }, []);

  const panResponder = useState(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gesture) => {
        const maxX = screenWidth - FAB_SIZE;
        const maxY = screenHeight - FAB_SIZE;
        
        const rawX = gesture.dx + pan.x._offset;
        const rawY = gesture.dy + pan.y._offset;
        
        const newX = Math.min(Math.max(0, rawX), maxX);
        const newY = Math.min(Math.max(0, rawY), maxY);
        
        pan.setValue({ x: newX - pan.x._offset, y: newY - pan.y._offset });
      },
      onPanResponderRelease: async (_, gestureState) => {
        const isClick = Math.abs(gestureState.dx) < 5 && Math.abs(gestureState.dy) < 5;
        
        if (isClick) {
          // 點擊動畫效果
          Animated.sequence([
            Animated.timing(rotateAnim, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
          
          pan.flattenOffset();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowChat(true);
          return;
        }
        
        // 拖拽邏輯
        pan.flattenOffset();
        const currentX = pan.x._value;
        const currentY = pan.y._value;
        
        const validPosition = validatePosition(currentX, currentY);
        const snapX = validPosition.x < screenWidth / 2 ? 20 : screenWidth - FAB_SIZE - 20;
        const finalPosition = { x: snapX, y: validPosition.y };

        Animated.spring(pan, {
          toValue: finalPosition,
          useNativeDriver: false,
        }).start();

        try {
          await AsyncStorage.setItem('chat_position', JSON.stringify(finalPosition));
        } catch (error) {
          console.log('儲存位置時發生錯誤:', error);
        }
      },
    })
  )[0];

  if (!positionLoaded) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '15deg'],
  });

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#F5E6C4' },
          headerTintColor: '#8B4513',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#F5E6C4' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>

      <Animated.View style={[styles.fabContainer, pan.getLayout()]}>
        {/* 外層光暈 */}
        <Animated.View 
          style={[
            styles.glow,
            {
              opacity: glowAnim,
              transform: [{ scale: pulseAnim }],
            }
          ]} 
        />
        
        {/* 思考泡泡 */}
        {thoughtBubbles.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.thoughtBubble,
              {
                opacity: anim,
                transform: [
                  { translateX: 25 + index * 8 },
                  { translateY: -15 - index * 8 },
                  { scale: anim },
                ],
              },
            ]}
          />
        ))}
        
        {/* 主按鈕 */}
        <Animated.View
          style={[
            styles.fab,
            {
              transform: [
                { scale: pulseAnim },
                { rotate: spin },
              ],
            },
          ]}
          {...panResponder.panHandlers}
        >
          {/* AI 大腦圖案 */}
          <View style={styles.brainContainer}>
            <View style={styles.brainLeft} />
            <View style={styles.brainRight} />
            <Animated.View 
              style={[
                styles.brainCenter,
                {
                  opacity: glowAnim,
                }
              ]} 
            />
          </View>
          
          {/* AI 文字 */}
          <Text style={styles.aiText}>AI</Text>
        </Animated.View>
      </Animated.View>

      <Modal visible={showChat} animationType="slide" onRequestClose={() => setShowChat(false)}>
        <ChatScreen onClose={() => setShowChat(false)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    width: FAB_SIZE + 30,
    height: FAB_SIZE + 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: FAB_SIZE + 20,
    height: FAB_SIZE + 20,
    borderRadius: (FAB_SIZE + 20) / 2,
    backgroundColor: '#00D4FF',
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 10,
  },
  thoughtBubble: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: '#667eea',
    borderWidth: 3,
    borderColor: '#00D4FF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  brainContainer: {
    width: 28,
    height: 20,
    marginBottom: 5,
  },
  brainLeft: {
    position: 'absolute',
    left: 0,
    top: 2,
    width: 12,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 6,
  },
  brainRight: {
    position: 'absolute',
    right: 0,
    top: 2,
    width: 12,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 6,
  },
  brainCenter: {
    position: 'absolute',
    left: 10,
    top: 6,
    width: 8,
    height: 8,
    backgroundColor: '#00D4FF',
    borderRadius: 4,
    shadowColor: '#00D4FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
  },
  aiText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textShadowColor: '#00D4FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
});