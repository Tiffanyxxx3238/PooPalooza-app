import React from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';


const reminderTimes = [
  '12:30 AM', '2:00 AM', '3:30 AM', '5:00 AM', '6:30 AM',
  '8:00 AM', '9:30 AM', '11:00 AM', '12:30 PM', '2:00 PM',
  '3:30 PM', '5:00 PM', '6:30 PM', '8:00 PM', '9:30 PM', '11:00 PM',
];

export default function ReminderSettingsScreen() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen options={{ title: 'Reminders' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Reminders Switch */}
        <Row label="Reminders" switchValue />
        <Row label="Reminder Type" right="Static" />

        {/* More Settings */}
        <Row label="Notification Messages" />
        <Row label="Week Days" />
        <Row label="Advanced" />

        {/* Custom Reminders */}
        <Text style={styles.sectionLabel}>Custom Reminders</Text>
        <TouchableOpacity style={styles.addRow}>
          <Text style={styles.addText}>Add</Text>
          <Text style={styles.lock}>🔒</Text>
        </TouchableOpacity>

        {/* Default Reminder Times */}
        <Text style={styles.sectionLabel}>Default Reminders</Text>
        {reminderTimes.map((time, index) => (
          <Row key={index} label={time} switchValue={index % 3 === 0} />
        ))}

        <TouchableOpacity style={styles.resetButton}>
          <Text style={styles.resetText}>Reset Reminders</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

function Row({
  label,
  right,
  switchValue,
}: {
  label: string;
  right?: string;
  switchValue?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {switchValue !== undefined ? (
        <Switch value={switchValue} />
      ) : (
        <Text style={styles.rightText}>{right}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary.background },
  content: { padding: 16 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.primary.border,
  },
  label: { fontSize: 16, color: Colors.primary.text },
  rightText: { fontSize: 16, color: Colors.primary.lightText },
  sectionLabel: {
    marginTop: 24, marginBottom: 8,
    fontSize: 16, fontWeight: '600', color: Colors.primary.text,
  },
  addRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.primary.border,
  },
  addText: { color: Colors.primary.accent, fontSize: 16 },
  lock: { fontSize: 16, color: Colors.primary.lightText },
  resetButton: {
    marginTop: 24, alignSelf: 'center', padding: 10,
  },
  resetText: { color: Colors.primary.accent, fontWeight: '500' },
});