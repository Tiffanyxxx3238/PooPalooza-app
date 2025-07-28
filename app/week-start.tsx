import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Check } from 'lucide-react-native';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function WeekStartScreen() {
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState('Sunday'); // 預設值，可串 Zustand

  return (
    <>
      <Stack.Screen options={{ title: 'Week Start' }} />
      <View style={styles.container}>
        <FlatList
          data={days}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => setSelectedDay(item)} // 可加存到 store
            >
              <Text style={styles.text}>{item}</Text>
              {item === selectedDay && <Check size={20} color={Colors.primary.accent} />}
            </TouchableOpacity>
          )}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  item: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  text: {
    fontSize: 16,
    color: Colors.primary.text,
  },
});