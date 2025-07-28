import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function iCloudScreen() {
  const [isSyncEnabled, setIsSyncEnabled] = useState(true);
  const lastSynced = '2025/7/28, 11:17 AM';

  const handleToggle = () => {
    setIsSyncEnabled(!isSyncEnabled);
    // 可加上實際連動資料同步的邏輯
  };

  return (
    <>
      <Stack.Screen options={{ title: 'iCloud' }} />
      <View style={styles.container}>
        <View style={styles.syncCard}>
          <View style={styles.syncRow}>
            <Text style={styles.label}>iCloud Sync</Text>
            <Switch value={isSyncEnabled} onValueChange={handleToggle} />
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.subLabel}>Sync Status</Text>
            <Text style={styles.status}>Success</Text>
          </View>
          <Text style={styles.time}>Last synced: {lastSynced}</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
    padding: 16,
  },
  syncCard: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
  },
  syncRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontSize: 16,
    color: Colors.primary.text,
    fontWeight: '600',
  },
  subLabel: {
    fontSize: 14,
    color: Colors.primary.lightText,
  },
  status: {
    fontSize: 14,
    color: 'green',
    fontWeight: '600',
  },
  time: {
    fontSize: 13,
    color: Colors.primary.lightText,
  },
});