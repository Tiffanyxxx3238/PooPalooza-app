// app/theme.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { getThemeColors } from '@/constants/colors';
import { CheckCircle2, Sun, Moon, Monitor } from 'lucide-react-native';

const themeOptions = [
  { label: 'Light', value: 'light', icon: <Sun /> },
  { label: 'Dark', value: 'dark', icon: <Moon /> },
  { label: 'System', value: 'system', icon: <Monitor /> },
];

export default function ThemeScreen() {
  const { theme, setTheme, resolvedTheme } = useThemeStore();
  const Colors = getThemeColors(resolvedTheme);

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <Stack.Screen options={{ title: 'Theme' }} />
      {themeOptions.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          onPress={() => setTheme(opt.value)}
          style={[styles.row, { backgroundColor: Colors.card }]}
        >
          <View style={styles.left}>
            {opt.icon}
            <Text style={[styles.label, { color: Colors.text }]}>{opt.label}</Text>
          </View>
          {theme === opt.value && <CheckCircle2 color={Colors.accent} />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontSize: 16, marginLeft: 8 },
});