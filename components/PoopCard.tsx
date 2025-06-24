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

  return (
    <Pressable 
      style={styles.container}
      onPress={onPress}
    >
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
          <View style={styles.tag}>
            <Text style={styles.tagText}>{poopFeeling.name.toLowerCase()}</Text>
          </View>
          
          <View style={styles.tag}>
            <Text style={styles.tagText}>Type {poopType.id}</Text>
          </View>
          
          <View style={styles.tag}>
            <Text style={styles.tagText}>{poopVolume.name.toLowerCase()}</Text>
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
    backgroundColor: '#FFF2C2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    color: '#8B4513',
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