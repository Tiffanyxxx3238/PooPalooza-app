import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

const appIconGroups = [
  {
    title: 'Default',
    icons: [
      { id: 'poop_default', emoji: '💩', locked: false },
      { id: 'toilet_default', emoji: '🚽', locked: false },
    ],
  },
  {
    title: 'Colors',
    icons: [
      { id: 'brown', emoji: '💩🟤', locked: false },
      { id: 'green', emoji: '💚💩', locked: true },
      { id: 'rainbow', emoji: '🌈💩', locked: true },
      { id: 'skull', emoji: '💀💩', locked: true },
      { id: 'pastel', emoji: '🧻', locked: true },
    ],
  },
  {
    title: 'Special',
    icons: [
      { id: 'santa', emoji: '🎅💩', locked: true },
      { id: 'ice', emoji: '❄️💩', locked: true },
    ],
  },
  {
    title: 'Art',
    icons: [
      { id: 'bucket', emoji: '🪣💩', locked: true },
      { id: 'hydrated', emoji: '🧼💧', locked: true },
    ],
  },
  {
    title: 'Unique',
    icons: [
      { id: 'neon', emoji: '🌌💩', locked: true },
      { id: 'galaxy', emoji: '🪐💩', locked: true },
    ],
  },
];

export default function AppIconScreen() {
  const [selected, setSelected] = useState('poop_default');

  const renderIcon = (icon: { id: string; emoji: string; locked?: boolean }) => (
    <TouchableOpacity
      key={icon.id}
      onPress={() => !icon.locked && setSelected(icon.id)}
      style={[
        styles.iconCard,
        selected === icon.id && styles.iconCardSelected,
        icon.locked && styles.iconCardLocked,
      ]}
      activeOpacity={icon.locked ? 1 : 0.7}
    >
      <Text style={styles.iconText}>{icon.emoji}</Text>
      {icon.locked && <Text style={styles.lock}>🔒</Text>}
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen options={{ title: 'App Icon' }} />
      <ScrollView style={styles.container}>
        <View style={styles.preview}>
          <Text style={{ fontSize: 64 }}>
            {
              appIconGroups
                .flatMap((group) => group.icons)
                .find((i) => i.id === selected)?.emoji
            }
          </Text>
        </View>

        {appIconGroups.map((group) => (
          <View key={group.title}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <View style={styles.grid}>
              {group.icons.map((icon) => renderIcon(icon))}
            </View>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  preview: { alignItems: 'center', marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginVertical: 8 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  iconCard: {
    width: 64,
    height: 64,
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCardSelected: {
    borderWidth: 2,
    borderColor: Colors.primary.accent,
  },
  iconCardLocked: {
    opacity: 0.5,
  },
  iconText: { fontSize: 28 },
  lock: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    fontSize: 14,
  },
});