import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Linking, Alert } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function AdvancedScreen() {
  const [disableAnalytics, setDisableAnalytics] = useState(false);

  const handleToggle = () => {
    setDisableAnalytics(!disableAnalytics);
    // 可加入實際關閉 analytics 的邏輯
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'Are you sure you want to delete all poop records and analysis?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Reset', style: 'destructive', onPress: () => {
          // 可加入資料清除邏輯
          console.log('Data reset confirmed');
        }},
      ]
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Advanced' }} />
      <View style={styles.container}>
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Disable Analytics</Text>
          <Switch value={disableAnalytics} onValueChange={handleToggle} />
        </View>

        <Text style={styles.description}>
          PooPalooza uses anonymous usage and crash logs to improve our poop health detection.
          You can turn off all logging activities via the toggle above. Some changes may require restarting the app.
        </Text>

        <TouchableOpacity onPress={() => Linking.openURL('https://yourpoopapp.com/privacy')}>
          <Text style={styles.link}>Privacy Policy</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResetData} style={styles.resetButton}>
          <Text style={styles.resetText}>Reset All Data</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary.background, padding: 20 },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 1, borderColor: Colors.primary.border,
  },
  label: { fontSize: 16, color: Colors.primary.text },
  description: {
    marginTop: 16, fontSize: 14, color: Colors.primary.lightText,
    lineHeight: 20,
  },
  link: {
    marginTop: 12, fontSize: 14, color: Colors.primary.accent,
    textDecorationLine: 'underline',
  },
  resetButton: {
    marginTop: 32, paddingVertical: 16, borderRadius: 8,
    backgroundColor: '#ff3b30', alignItems: 'center',
  },
  resetText: {
    color: 'white', fontWeight: '600', fontSize: 16,
  },
});