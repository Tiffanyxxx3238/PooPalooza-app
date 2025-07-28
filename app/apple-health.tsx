import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

interface PermissionItem {
  name: string;
  description: string;
  emoji: string;
  status: 'Granted' | 'Not Determined' | 'Denied';
}

export default function AppleHealthScreen() {
  const [permissions, setPermissions] = useState<PermissionItem[]>([
    { name: 'Stool Records', emoji: '💩', description: 'Read poop events for health insights', status: 'Granted' },
    { name: 'Digestive Health', emoji: '🧠', description: 'Track gut health trends', status: 'Not Determined' },
    { name: 'Fiber Intake', emoji: '🌾', description: 'Analyze fiber consumption', status: 'Not Determined' },
    { name: 'Water Intake', emoji: '💧', description: 'Correlate hydration & poop type', status: 'Granted' },
    { name: 'Caffeine', emoji: '☕', description: 'Check digestive impact of caffeine', status: 'Not Determined' },
    { name: 'Alcohol', emoji: '🍺', description: 'Monitor alcohol and gut health', status: 'Not Determined' },
  ]);

  const handleToggle = (index: number) => {
    const updated = [...permissions];
    updated[index].status = updated[index].status === 'Granted' ? 'Not Determined' : 'Granted';
    setPermissions(updated);
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Apple Health Sync' }} />
      <ScrollView style={styles.container}>
        {permissions.map((item, index) => (
          <View key={item.name} style={styles.card}>
            <Text style={styles.title}>{item.emoji} {item.name}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.status}>Status: {item.status}</Text>
            <TouchableOpacity onPress={() => handleToggle(index)}>
              <Text style={styles.action}>
                {item.status === 'Granted' ? 'Manage' : 'Allow'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
    padding: 16,
  },
  card: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: Colors.primary.lightText,
    marginBottom: 6,
  },
  status: {
    fontSize: 14,
    color: Colors.primary.text,
    marginBottom: 8,
  },
  action: {
    color: Colors.primary.accent,
    fontWeight: '500',
    fontSize: 15,
  },
});