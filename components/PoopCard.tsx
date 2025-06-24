// PoopCard.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { poopTypes, poopVolumes, poopFeelings } from '@/constants/poopTypes';
import Colors from '@/constants/colors';
import { PoopEntry } from '@/types/poop';
import { formatDate } from '@/utils/dateUtils';
import { Clock } from 'lucide-react-native';

interface PoopCardProps {
  entry: PoopEntry;
  onPress?: () => void;
  showImage?: boolean;
}

export default function PoopCard({ entry, onPress, showImage = false }: PoopCardProps) {
  const poopType = poopTypes.find(type => type.id === entry.type) || poopTypes[0];
  const poopVolume = poopVolumes.find(vol => vol.id === entry.volume) || poopVolumes[0];
  const poopFeeling = poopFeelings.find(feel => feel.id === entry.feeling) || poopFeelings[0];

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return "No duration recorded";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const tagStyles: Record<string, { background: string; text: string }> = {
    // Feelings
    easy:       { background: '#C8E6C9', text: '#2E7D32' },
    moderate:   { background: '#FFF9C4', text: '#F9A825' },
    difficult:  { background: '#FFCDD2', text: '#C62828' },
    incomplete: { background: '#E0E0E0', text: '#424242' },

    // Volumes
    small:  { background: '#D7CCC8', text: '#4E342E' },
    medium: { background: '#FFECB3', text: '#FF8F00' },
    large:  { background: '#FFE0B2', text: '#E65100' },

    // Types
    'type 1': { background: '#D7CCC8', text: '#3E2723' },
    'type 2': { background: '#A1887F', text: '#4E342E' },
    'type 3': { background: '#F0B27A', text: '#784212' },
    'type 4': { background: '#FFE082', text: '#8D6E63' },
    'type 5': { background: '#C5E1A5', text: '#558B2F' },
    'type 6': { background: '#B2DFDB', text: '#00695C' },
    'type 7': { background: '#CE93D8', text: '#6A1B9A' },
  };

  const getTagStyle = (label: string) => {
    const key = label.toLowerCase();
    return tagStyles[key] || { background: '#FFF2C2', text: '#8B4513' };
  };

  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.content}>
        <Text style={styles.title}>
          {entry.name || `${formatDate(entry.date)} Poop`}
        </Text>

        <View style={styles.durationRow}>
          <Clock size={18} color="#9E9E9E" style={styles.clockIcon} />
          <Text style={styles.durationText}>
            {formatDuration(entry.duration)}
          </Text>
        </View>

        <View style={styles.tagsContainer}>
          {/* Feeling */}
          <View style={[styles.tag, { backgroundColor: getTagStyle(poopFeeling.name).background }]}>
            <Text style={[styles.tagText, { color: getTagStyle(poopFeeling.name).text }]}>
              {poopFeeling.name}
            </Text>
          </View>

          {/* Type */}
          <View style={[styles.tag, { backgroundColor: getTagStyle(`type ${poopType.id}`).background }]}>
            <Text style={[styles.tagText, { color: getTagStyle(`type ${poopType.id}`).text }]}>
              Type {poopType.id}
            </Text>
          </View>

          {/* Volume */}
          <View style={[styles.tag, { backgroundColor: getTagStyle(poopVolume.name).background }]}>
            <Text style={[styles.tagText, { color: getTagStyle(poopVolume.name).text }]}>
              {poopVolume.name}
            </Text>
          </View>
        </View>
      </View>

      {showImage && entry.imageUri && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: entry.imageUri }}
            style={styles.image}
            contentFit="cover"
          />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E3A59',
    marginBottom: 8,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  clockIcon: {
    marginRight: 6,
  },
  durationText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    marginLeft: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
