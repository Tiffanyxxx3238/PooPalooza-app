import React, { useEffect } from 'react'; 
import { Tabs } from 'expo-router';
import Colors from '@/constants/colors';
import { MapPin, BookOpen, Trophy, BarChart, Clock } from 'lucide-react-native';
import backgroundMusicService from '@/services/backgroundMusicService';
export default function TabLayout() {
   useEffect(() => {
    // 初始化背景音樂
    backgroundMusicService.initialize();

    // 清理函數
    return () => {
      backgroundMusicService.cleanup();
    };
  }, []);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary.accent,
        tabBarInactiveTintColor: Colors.primary.lightText,
        tabBarStyle: {
          backgroundColor: Colors.primary.background,
          borderTopColor: Colors.primary.border,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: Colors.primary.background,
        },
        headerTintColor: Colors.primary.accent,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tracker',
          tabBarIcon: ({ color, size }) => (
            <Clock size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="library"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} />
          ),
        }} 
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Journey',
          tabBarIcon: ({ color, size }) => (
            <Trophy size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Stats',
          tabBarIcon: ({ color, size }) => (
            <BarChart size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, size }) => (
            <MapPin size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}