// app/home-screen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function HomeScreenSettings() {
  const [showPoopSummary, setShowPoopSummary] = useState(true);
  const [showPeeTracker, setShowPeeTracker] = useState(true);
  const [showMood, setShowMood] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);

  return (
    <>
      <Stack.Screen options={{ title: 'Home Screen Settings' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Customize Home Screen</Text>
        <Text style={styles.subtitle}>Choose what appears on your main page.</Text>

        <View style={styles.section}>
          <ItemSwitch
            label="Poop Summary Card"
            value={showPoopSummary}
            onValueChange={setShowPoopSummary}
          />
          <ItemSwitch
            label="Pee Tracker Card"
            value={showPeeTracker}
            onValueChange={setShowPeeTracker}
          />
          <ItemSwitch
            label="Mood Indicator"
            value={showMood}
            onValueChange={setShowMood}
          />
          <ItemSwitch
            label="AI Health Suggestions"
            value={showAIAssistant}
            onValueChange={setShowAIAssistant}
          />
          <ItemSwitch
            label="Poop Calendar"
            value={showCalendar}
            onValueChange={setShowCalendar}
          />
        </View>

        <Text style={styles.noteTitle}>💡 Coming Soon</Text>
        <Text style={styles.noteText}>
          We'll soon let you drag to reorder your cards, just like customizing widgets!
        </Text>
      </ScrollView>
    </>
  );
}

function ItemSwitch({ label, value, onValueChange }: {
  label: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary.background },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: Colors.primary.text, marginBottom: 8 },
  subtitle: { fontSize: 16, color: Colors.primary.lightText, marginBottom: 20 },
  section: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  label: { fontSize: 16, color: Colors.primary.text },
  noteTitle: { fontSize: 16, fontWeight: '600', marginBottom: 4, color: Colors.primary.accent },
  noteText: { fontSize: 14, color: Colors.primary.lightText },
});