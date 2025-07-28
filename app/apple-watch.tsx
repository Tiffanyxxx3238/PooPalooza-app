import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Switch } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function AppleWatchSettings() {
  return (
    <>
      <Stack.Screen options={{ title: 'Apple Watch' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
          {[1, 2, 3].map((id) => (
            <Image
              key={id}
              source={{ uri: `https://dummyimage.com/120x120/cccccc/000000&text=Poo+${id}` }}
              style={styles.previewImage}
            />
          ))}
        </ScrollView>

        <View style={styles.row}>
          <Text style={styles.label}>Poop Style</Text>
          <TouchableOpacity>
            <Text style={styles.rightText}>Cartoon 💩</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Show Faces</Text>
          <Switch value={true} />
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Health Color Codes</Text>
          <Switch value={false} />
        </View>

        <Text style={styles.sectionTitle}>General</Text>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>Poop Type Classification</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>Poop Emoji Faces</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Screens</Text>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row}>
          <Text style={styles.label}>Achievements</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.refreshButton}>
          <Text style={styles.refreshText}>Refresh Connection</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary.background },
  content: { padding: 16 },
  previewScroll: { marginBottom: 16 },
  previewImage: {
    width: 120, height: 120, borderRadius: 20, marginRight: 12, backgroundColor: '#eee',
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  label: { fontSize: 16, color: Colors.primary.text },
  rightText: { fontSize: 16, color: Colors.primary.accent },
  sectionTitle: {
    fontSize: 18, fontWeight: '600', marginTop: 24,
    marginBottom: 8, color: Colors.primary.text,
  },
  refreshButton: {
    marginTop: 24, paddingVertical: 12, borderRadius: 8,
    backgroundColor: Colors.primary.accent,
    alignItems: 'center',
  },
  refreshText: { color: 'white', fontWeight: '600', fontSize: 16 },
});