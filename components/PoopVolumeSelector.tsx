import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { poopVolumes } from '@/constants/poopTypes';
import Colors from '@/constants/colors';

interface PoopVolumeSelectorProps {
  selectedVolume: number;
  onSelectVolume: (volume: number) => void;
}

export default function PoopVolumeSelector({ selectedVolume, onSelectVolume }: PoopVolumeSelectorProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Poop Volume</Text>
      <View style={styles.volumesContainer}>
        {poopVolumes.map((volume) => (
          <Pressable
            key={volume.id}
            style={[
              styles.volumeItem,
              selectedVolume === volume.id && styles.selectedVolumeItem,
            ]}
            onPress={() => onSelectVolume(volume.id)}
          >
            <Text style={[
              styles.volumeIcon,
              selectedVolume === volume.id && styles.selectedVolumeText
            ]}>
              {volume.icon}
            </Text>
            <Text style={[
              styles.volumeName,
              selectedVolume === volume.id && styles.selectedVolumeText
            ]}>
              {volume.name}
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
  volumesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  volumeItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedVolumeItem: {
    borderColor: Colors.primary.accent,
    backgroundColor: Colors.primary.accent,
  },
  volumeIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 4,
  },
  volumeName: {
    fontSize: 14,
    color: Colors.primary.text,
  },
  selectedVolumeText: {
    color: '#FFFFFF',
  },
});