import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { usePoopStore } from '@/store/poopStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Timer from '@/components/Timer';
import { Camera, Upload, User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { getTimeOfDay } from '@/utils/dateUtils';

export default function TrackerScreen() {
  const router = useRouter();
  const { addEntry, longestStreak, entries } = usePoopStore();
  const { username } = useUserStore();
  
  const [image, setImage] = useState<string | null>(null);
  
  const handleTakePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need camera permissions to make this work!');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      router.push('/add-entry');
    }
  };
  
  const handleUploadPicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('Sorry, we need media library permissions to make this work!');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      router.push({
        pathname: '/add-entry',
        params: { imageUri: result.assets[0].uri }
      });
    }
  };
  
  const handleAddWithoutPicture = () => {
    router.push('/add-entry');
  };
  
  const handleProfile = () => {
    router.push('/profile');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {username || 'Pooper'}!</Text>
          <Text style={styles.subtitle}>How are you feeling today?</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
          <User size={24} color={Colors.primary.accent} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Your Poop Stats</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{entries.length}</Text>
            <Text style={styles.statLabel}>Total Poops</Text>
          </View>
        </View>
      </View>
      
      <Timer />
      
      <View style={styles.toiletContainer}>
        <Image 
          source={{ uri: 'https://images.unsplash.com/photo-1584475784921-d9dbfd9d17ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dG9pbGV0fGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60' }}
          style={styles.toiletImage}
        />
        
        <View style={styles.actionButtons}>
          <Button
            title="Take Pic"
            onPress={handleTakePicture}
            style={styles.actionButton}
            variant="primary"
            textStyle={styles.actionButtonText}
          />
          
          <Button
            title="Upload Pic"
            onPress={handleUploadPicture}
            style={styles.actionButton}
            variant="secondary"
            textStyle={styles.actionButtonText}
          />
        </View>
        
        <Button
          title="Add Poop Without Picture"
          onPress={handleAddWithoutPicture}
          style={styles.addWithoutButton}
          variant="outline"
        />
      </View>
      
      <View style={styles.tipContainer}>
        <Text style={styles.tipTitle}>💡 Poop Tip of the Day</Text>
        <Text style={styles.tipText}>
          Staying hydrated helps maintain regular bowel movements. Aim to drink at least 8 glasses of water daily!
        </Text>
      </View>
    </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: Platform.OS === 'ios' ? 0 : 16,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.primary.lightText,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsCard: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.accent,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.primary.lightText,
  },
  statDivider: {
    height: 40,
    width: 1,
    backgroundColor: Colors.primary.border,
  },
  toiletContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  toiletImage: {
    width: 200,
    height: 200,
    borderRadius: 100,
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    minWidth: 120,
  },
  actionButtonText: {
    fontSize: 14,
  },
  addWithoutButton: {
    marginTop: 8,
  },
  tipContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.primary.lightText,
    lineHeight: 20,
  },
});