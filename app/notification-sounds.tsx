import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

const sounds = [
  'Default',
  'Arctic Bells', 'At The Door', 'Bicycle Style Bell',
  'Bubble Splash 1', 'Bubble Splash 2', 'Chiming Bells',
  'Glockenspiel', 'Horn', 'Splash Pour',
  'Water Pour 1', 'Water Pour 2', 'Chime',
  'Tritone 1', 'Tritone 2',
];

export default function NotificationSoundScreen() {
  const [selected, setSelected] = useState('Default');

  return (
    <>
      <Stack.Screen options={{ title: 'Notification Sounds' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {sounds.map((name, index) => {
          const isLocked = index !== 0;
          const isSelected = selected === name;

          return (
            <TouchableOpacity
              key={index}
              style={styles.soundRow}
              disabled={isLocked}
              onPress={() => setSelected(name)}
            >
              <Text style={[styles.soundText, isLocked && styles.lockedText]}>{name}</Text>
              {isLocked ? (
                <Text style={styles.lock}>🔒</Text>
              ) : (
                isSelected && <Text style={styles.check}>✔️</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary.background },
  content: { padding: 16 },
  soundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  soundText: {
    fontSize: 16,
    color: Colors.primary.text,
  },
  lockedText: {
    color: Colors.primary.lightText,
  },
  check: {
    fontSize: 16,
    color: Colors.primary.accent,
  },
  lock: {
    fontSize: 16,
    color: Colors.primary.lightText,
  },
});