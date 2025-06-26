import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, View } from 'react-native';
import Colors from '@/constants/colors';

type CharacterButtonProps = {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  style?: ViewStyle;
};

export default function CharacterButton({ label, icon, onPress, style }: CharacterButtonProps) {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    width: 70,
    height: 70,
  },
  iconContainer: {
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.primary.text,
    textAlign: 'center',
  },
});