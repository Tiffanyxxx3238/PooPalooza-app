import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { usePoopStore } from '@/store/poopStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { Image } from 'expo-image';
import { poopTypes, poopVolumes, poopFeelings, poopColors } from '@/constants/poopTypes';
import { Trash2 } from 'lucide-react-native';

export default function EntryDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { entries, removeEntry } = usePoopStore();
  
  const entry = entries.find(e => e.id === id);
  
  if (!entry) {
    return (
      <View style={styles.notFoundContainer}>
        <Text style={styles.notFoundText}>Entry not found</Text>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.backButton}
        />
      </View>
    );
  }
  
  const poopType = poopTypes.find(type => type.id === entry.type) || poopTypes[0];
  const poopVolume = poopVolumes.find(vol => vol.id === entry.volume) || poopVolumes[0];
  const poopFeeling = poopFeelings.find(feel => feel.id === entry.feeling) || poopFeelings[0];
  const poopColor = poopColors.find(col => col.id === entry.color) || poopColors[0];
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} min ${remainingSeconds} sec`;
  };
  
  const handleDelete = () => {
    removeEntry(id);
    router.back();
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Poop Details',
          headerRight: () => (
            <Trash2 
              size={24} 
              color={Colors.primary.error} 
              onPress={handleDelete}
              style={{ marginRight: 16 }}
            />
          ),
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(entry.date)}</Text>
          <Text style={styles.timeText}>{formatTime(entry.date)}</Text>
        </View>
        
        {entry.imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: entry.imageUri }}
              style={styles.image}
              contentFit="cover"
            />
          </View>
        )}
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type</Text>
              <View style={[styles.detailValue, { backgroundColor: poopType.color }]}>
                <Text style={styles.detailValueText}>{poopType.id}</Text>
              </View>
              <Text style={styles.detailDescription}>{poopType.name}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Volume</Text>
              <View style={styles.detailValue}>
                <Text style={styles.detailValueText}>{poopVolume.icon}</Text>
              </View>
              <Text style={styles.detailDescription}>{poopVolume.name}</Text>
            </View>
          </View>
          
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Feeling</Text>
              <View style={styles.detailValue}>
                <Text style={styles.detailValueText}>{poopFeeling.icon}</Text>
              </View>
              <Text style={styles.detailDescription}>{poopFeeling.name}</Text>
            </View>
            
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Color</Text>
              <View style={[styles.detailValue, { backgroundColor: poopColor.color }]}>
                <Text style={styles.detailValueText}></Text>
              </View>
              <Text style={styles.detailDescription}>{poopColor.name}</Text>
            </View>
          </View>
          
          <View style={styles.durationContainer}>
            <Text style={styles.durationLabel}>Duration</Text>
            <Text style={styles.durationValue}>{formatDuration(entry.duration)}</Text>
          </View>
          
          {entry.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notes</Text>
              <Text style={styles.notesText}>{entry.notes}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.analysisContainer}>
          <Text style={styles.analysisTitle}>Analysis</Text>
          
          <Text style={styles.analysisText}>
            {poopType.id <= 2 && "Your stool is on the harder side, which may indicate constipation. Try increasing your water intake and consuming more fiber-rich foods."}
            {poopType.id >= 3 && poopType.id <= 5 && "Your stool is healthy and well-formed. Keep up your current diet and hydration habits."}
            {poopType.id >= 6 && "Your stool is on the looser side. This could be due to various factors including diet, stress, or mild illness. Monitor for other symptoms and consider reducing caffeine and spicy foods."}
            
            {entry.duration > 300 && "\n\nYou spent quite a long time in the bathroom. Extended sitting on the toilet can increase your risk of hemorrhoids. Try to keep bathroom visits under 5 minutes when possible."}
            
            {poopColor.id >= 5 && "\n\nThe color of your stool is unusual. If this persists for multiple bowel movements, consider consulting a healthcare professional."}
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  notFoundContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  backButton: {
    width: 120,
  },
  dateContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  timeText: {
    fontSize: 16,
    color: Colors.primary.lightText,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: 250,
    height: 250,
    borderRadius: 12,
  },
  detailsContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.primary.lightText,
    marginBottom: 8,
  },
  detailValue: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailValueText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  detailDescription: {
    fontSize: 14,
    color: Colors.primary.text,
  },
  durationContainer: {
    alignItems: 'center',
    marginBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.primary.border,
  },
  durationLabel: {
    fontSize: 14,
    color: Colors.primary.lightText,
    marginBottom: 8,
  },
  durationValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  notesContainer: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.primary.border,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  notesText: {
    fontSize: 14,
    color: Colors.primary.text,
    lineHeight: 20,
  },
  analysisContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  analysisText: {
    fontSize: 14,
    color: Colors.primary.text,
    lineHeight: 20,
  },
});