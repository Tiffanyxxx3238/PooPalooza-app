import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { poopColors } from '@/constants/poopTypes';
import Colors from '@/constants/colors';

interface PoopColorSelectorProps {
  selectedColor: number;
  onSelectColor: (color: number) => void;
}

export default function PoopColorSelector({ selectedColor, onSelectColor }: PoopColorSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Poop Color</Text>
      <View style={styles.colorsContainer}>
        {poopColors.map((color) => (
          <Pressable
            key={color.id}
            style={[
              styles.colorItem,
              { backgroundColor: color.color },
              selectedColor === color.id && styles.selectedColorItem,
            ]}
            onPress={() => onSelectColor(color.id)}
          >
            {selectedColor === color.id && (
              <View style={styles.selectedIndicator} />
            )}
          </Pressable>
        ))}
      </View>
      <Text style={styles.colorName}>
        {poopColors.find(color => color.id === selectedColor)?.name || ''}
      </Text>
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
  colorsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  colorItem: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorItem: {
    borderColor: Colors.primary.accent,
    borderWidth: 3,
  },
  selectedIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  colorName: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.primary.text,
    textAlign: 'center',
    fontWeight: 'bold',
  },
});