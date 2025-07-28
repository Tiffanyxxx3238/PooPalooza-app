import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Droplet, Lock, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';

const dynamicShortcuts = ['Log a Poop', 'Log Pee', 'Quick Record'];

const quickShortcuts = [
  { title: 'Log 1 Solid Poop' },
  { title: 'Log 1 Soft Poop' },
  { title: 'Log 1 Urine' },
  { title: 'Show my last poop', subtitle: 'Last poop entry' },
  { title: 'Show poop streak', subtitle: 'Current streak' },
  { title: 'Show poop health tips', subtitle: 'Poop Analysis Guide' },
];

export default function SiriShortcutsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Siri Shortcuts' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Dynamic Shortcuts</Text>
        <View style={styles.card}>
          {dynamicShortcuts.map((item, index) => (
            <View key={index} style={styles.row}>
              <Droplet size={20} color={Colors.primary.accent} />
              <Text style={styles.rowText}>{item}</Text>
              <Lock size={18} color={Colors.primary.lightText} />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Quick Shortcuts</Text>
        <View style={styles.card}>
          {quickShortcuts.map((item, index) => (
            <View key={index} style={styles.row}>
              <Droplet size={20} color={Colors.primary.accent} />
              <View style={styles.textGroup}>
                <Text style={styles.rowText}>{item.title}</Text>
                {item.subtitle && <Text style={styles.rowSub}>{item.subtitle}</Text>}
              </View>
              <Plus size={18} color={Colors.primary.accent} />
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 8,
    marginTop: 16,
  },
  card: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  rowText: {
    fontSize: 16,
    color: Colors.primary.text,
    marginLeft: 10,
    flex: 1,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginLeft: 10,
  },
  textGroup: {
    flex: 1,
    marginLeft: 10,
  },
});