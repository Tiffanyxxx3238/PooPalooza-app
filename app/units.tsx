import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Check } from 'lucide-react-native';

export default function UnitsScreen() {
  const router = useRouter();
  const [unit, setUnit] = useState('ml');
  const [weight, setWeight] = useState('kg');

  return (
    <>
      <Stack.Screen options={{ title: 'Units' }} />
      <ScrollView style={styles.container}>
        <Text style={styles.sectionTitle}>Units</Text>
        {['US Oz', 'UK Oz', 'ml', 'L', 'US pt'].map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.item}
            onPress={() => setUnit(item)}
          >
            <Text style={styles.text}>{item}</Text>
            {unit === item && <Check size={20} color={Colors.primary.accent} />}
          </TouchableOpacity>
        ))}

        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Weight</Text>
        {['lbs', 'kg'].map((item) => (
          <TouchableOpacity
            key={item}
            style={styles.item}
            onPress={() => setWeight(item)}
          >
            <Text style={styles.text}>{item}</Text>
            {weight === item && <Check size={20} color={Colors.primary.accent} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: Colors.primary.text,
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