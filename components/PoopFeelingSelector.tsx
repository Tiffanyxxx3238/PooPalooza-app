import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { poopFeelings } from '@/constants/poopTypes';
import Colors from '@/constants/colors';

interface PoopFeelingSelectorProps {
  selectedFeeling: number;
  onSelectFeeling: (feeling: number) => void;
}

export default function PoopFeelingSelector({ selectedFeeling, onSelectFeeling }: PoopFeelingSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How was it?</Text>
      <View style={styles.feelingsContainer}>
        {poopFeelings.map((feeling) => (
          <Pressable
            key={feeling.id}
            style={[
              styles.feelingItem,
              selectedFeeling === feeling.id && styles.selectedFeelingItem,
            ]}
            onPress={() => onSelectFeeling(feeling.id)}
          >
            <Text style={styles.feelingIcon}>{feeling.icon}</Text>
            <Text style={[
              styles.feelingName,
              selectedFeeling === feeling.id && styles.selectedFeelingText
            ]}>
              {feeling.name}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  feelingsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  feelingItem: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedFeelingItem: {
    borderColor: Colors.primary.accent,
    backgroundColor: Colors.primary.accent,
  },
  feelingIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  feelingName: {
    fontSize: 14,
    color: Colors.primary.text,
  },
  selectedFeelingText: {
    color: '#FFFFFF',
  },
});