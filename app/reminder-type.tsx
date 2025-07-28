import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

const types = [
  { label: 'Static', locked: false },
  { label: 'Interval', locked: true },
  { label: 'Water Level', locked: true },
];

export default function ReminderTypeScreen() {
  const [selected, setSelected] = useState('Static');

  return (
    <>
      <Stack.Screen options={{ title: 'Choose Reminder Type' }} />
      <View style={styles.container}>
        {types.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.row}
            disabled={item.locked}
            onPress={() => setSelected(item.label)}
          >
            <Text style={[styles.label, item.locked && styles.lockedText]}>
              {item.label}
            </Text>
            {item.locked ? <Text style={styles.icon}>🔒</Text> : selected === item.label && <Text style={styles.icon}>✔️</Text>}
          </TouchableOpacity>
        ))}
        <Text style={styles.description}>
          Changing reminder type will affect the message styles. Check them in Notification Messages screen.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: Colors.primary.background },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  label: { fontSize: 16, color: Colors.primary.text },
  lockedText: { color: Colors.primary.lightText },
  icon: { fontSize: 16, color: Colors.primary.accent },
  description: {
    marginTop: 16,
    fontSize: 13,
    color: Colors.primary.lightText,
    lineHeight: 18,
  },
});