import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { poopTypes } from '@/constants/poopTypes';
import Colors from '@/constants/colors';

interface PoopTypeSelectorProps {
  selectedType: number;
  onSelectType: (type: number) => void;
}

export default function PoopTypeSelector({ selectedType, onSelectType }: PoopTypeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Poop Type</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.typesContainer}
      >
        {poopTypes.map((type) => (
          <Pressable
            key={type.id}
            style={[
              styles.typeItem,
              selectedType === type.id && styles.selectedTypeItem,
              { backgroundColor: type.color }
            ]}
            onPress={() => onSelectType(type.id)}
          >
            <Text style={styles.typeIcon}>{type.icon}</Text>
            <Text style={styles.typeName}>{type.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.typeDescription}>
        {poopTypes.find(type => type.id === selectedType)?.description || ''}
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
  typesContainer: {
    paddingVertical: 8,
  },
  typeItem: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTypeItem: {
    borderColor: Colors.primary.accent,
    borderWidth: 3,
  },
  typeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  typeName: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  typeDescription: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.primary.lightText,
    textAlign: 'center',
  },
});