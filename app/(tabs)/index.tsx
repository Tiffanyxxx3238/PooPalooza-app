import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, Alert,LogBox } from 'react-native';
import { useRouter } from 'expo-router';
import { usePoopStore } from '@/store/poopStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Timer from '@/components/Timer';
import { User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { API_CONFIG } from '@/config';
import cloudinaryService from '@/services/cloudinaryService';

export default function TrackerScreen() {
  const router = useRouter();
  const { addEntry, longestStreak, entries } = usePoopStore();
  const { username, user_id } = useUserStore();
  const currentUserId = user_id || 49;

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageConfirmation, setShowImageConfirmation] = useState(false);
  
  // Add state for database records
  const [dbRecordCount, setDbRecordCount] = useState(0);
  const [healthPercentage, setHealthPercentage] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [isCloudinaryConfigured, setIsCloudinaryConfigured] = useState(false);
  // Fetch user's records from database
  useEffect(() => {
    const fetchUserRecords = async () => {
      try {
        console.log('Fetching records for user:', currentUserId);
        
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.POOP_RECORDS}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Filter by current user
        const userRecords = data.filter((record: any) => 
          record.user_id === currentUserId
        );
        
        console.log(`Found ${userRecords.length} records for user ${currentUserId}`);
        setDbRecordCount(userRecords.length);
        
        // Calculate health percentage based on bristol_scale
        if (userRecords.length > 0) {
          const healthyRecords = userRecords.filter((record: any) => {
            const scale = parseInt(record.ai_poop_type) || parseInt(record.bristol_scale) || 0;
            return scale >= 3 && scale <= 5;
          });
          const healthPercent = Math.round((healthyRecords.length / userRecords.length) * 100);
          setHealthPercentage(healthPercent);
        }
        
        // Calculate current streak
        const streak = calculateStreak(userRecords);
        setCurrentStreak(streak);
        
      } catch (error) {
        console.error('Failed to fetch records:', error);
        // Fall back to local data
        setDbRecordCount(entries.length);
      }
    };

    if (currentUserId) {
      fetchUserRecords();
    }
  }, [currentUserId]);
useEffect(() => {
    checkCloudinarySetup();
  }, [currentUserId]);
  
  const checkCloudinarySetup = async () => {
    const config = await cloudinaryService.loadConfig();
    setIsCloudinaryConfigured(config !== null);
    
    // 提示使用者設定（延遲顯示避免干擾）
    if (currentUserId && !config) {
      setTimeout(() => {
        Alert.alert(
          '☁️ Setup Cloud Storage',
          'Would you like to setup free cloud storage?\nThis way you can view your photos even when switching phones!',
          [
            { text: 'Later', style: 'cancel' },
            { text: 'Setup Now', onPress: () => router.push('/cloudinary-setup') }
          ]
        );
      }, 3000);
    }
  };
LogBox.ignoreLogs(['useInsertionEffect must not schedule updates']);
  // Calculate streak function
  const calculateStreak = (records: any[]) => {
    if (records.length === 0) return 0;
    
    // Sort by date
    const sortedRecords = [...records].sort((a, b) => 
      new Date(b.record_time).getTime() - new Date(a.record_time).getTime()
    );
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let streak = 0;
    let currentDate = new Date(today);
    
    for (const record of sortedRecords) {
      const recordDate = new Date(record.record_time);
      recordDate.setHours(0, 0, 0, 0);
      
      if (recordDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (recordDate.getTime() < currentDate.getTime()) {
        // Check if we missed a day
        const dayDiff = (currentDate.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
        if (dayDiff === 1) {
          // Yesterday, continue streak
          streak++;
          currentDate = new Date(recordDate);
          currentDate.setDate(currentDate.getDate() - 1);
        } else {
          // Streak broken
          break;
        }
      }
    }
    
    return streak;
  };

  // Main add entry function - ask if photo should be included
  const handleAddEntry = () => {
    Alert.alert(
      'Add New Record',
      'Would you like to include a photo with your record?',
      [
        {
          text: 'No Photo',
          onPress: () => router.push('/add-entry'),
          style: 'default'
        },
        {
          text: 'Take Photo',
          onPress: handleTakePicture
        },
        {
          text: 'Upload Photo',
          onPress: handleUploadPicture
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ],
      { cancelable: true }
    );
  };

  // Take picture function
  const handleTakePicture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos.');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    
    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      let finalUri = localUri;
      
      // 👇 加入 Cloudinary 上傳邏輯
      if (isCloudinaryConfigured) {
        const cloudinaryUrl = await cloudinaryService.uploadImageOnly(localUri, currentUserId);
        if (cloudinaryUrl) {
          finalUri = cloudinaryUrl;
          console.log('✅ 已上傳到雲端:', finalUri);
        }
      }
      
      router.push({ 
        pathname: '/add-entry', 
        params: { imageUri: finalUri }  // 👈 使用 finalUri
      });
    }
  };

  // Upload picture function
  const handleUploadPicture = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Media library permission is needed to upload photos.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    
    if (!result.canceled) {
      let finalUri = result.assets[0].uri;
      
      // 👇 加入 Cloudinary 上傳邏輯
      if (isCloudinaryConfigured) {
        const cloudinaryUrl = await cloudinaryService.uploadImageOnly(finalUri, currentUserId);
        if (cloudinaryUrl) {
          finalUri = cloudinaryUrl;
          console.log('✅ 已上傳到雲端:', finalUri);
        }
      }
      
      setSelectedImage(finalUri);  // 👈 使用 finalUri
      setShowImageConfirmation(true);
    }
  };

  // Confirm selected photo
  const handleConfirmImage = () => {
    if (selectedImage) {
      router.push({ 
        pathname: '/analyze-image', 
        params: { imageUri: selectedImage } 
      });
      setSelectedImage(null);
      setShowImageConfirmation(false);
    }
  };

  // Cancel photo selection
  const handleCancelImage = () => {
    setSelectedImage(null);
    setShowImageConfirmation(false);
  };

  const handleProfile = () => router.push('/profile');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {username || 'Pooper'}!</Text>
          <Text style={styles.subtitle}>How are you feeling today?</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
          <User size={24} color={Colors.primary.accent} />
        </TouchableOpacity>
      </View>
            {currentUserId && (
        <TouchableOpacity 
          style={[
            styles.cloudIndicator,
            isCloudinaryConfigured ? styles.cloudOn : styles.cloudOff
          ]}
          onPress={() => router.push('/cloudinary-setup')}
        >
          <Text style={styles.cloudText}>
            {isCloudinaryConfigured ? '☁️ Cloud Storage Active' : '📱 Device Only (Tap to Configure)'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Summary Section - Now showing database data */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Your Poop Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Entries</Text>
            <Text style={styles.summaryValue}>{dbRecordCount}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Streak</Text>
            <Text style={styles.summaryValue}>{currentStreak} days</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Healthy %</Text>
            <Text style={styles.summaryValue}>{healthPercentage}%</Text>
          </View>
        </View>
        <Text style={styles.dataSourceText}>
          Data from user {currentUserId}
        </Text>
      </View>

      {/* Timer */}
      <Timer />

      {/* Main Action Section */}
      <View style={styles.actionContainer}>
        {!showImageConfirmation ? (
          <>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1584475784921-d9dbfd9d17ca?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dG9pbGV0fGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60' }}
              style={styles.toiletImage}
            />

            <Text style={styles.actionTitle}>Ready to log your poop?</Text>
            <Text style={styles.actionSubtitle}>
              Track your bathroom habits for better health insights
            </Text>

            <Button
              title="Add New Record"
              onPress={handleAddEntry}
              style={styles.primaryActionButton}
              variant="primary"
            />

            <View style={styles.quickActions}>
              <Text style={styles.quickActionsTitle}>Quick Actions:</Text>
              <View style={styles.quickActionButtons}>
                <TouchableOpacity 
                  style={styles.quickActionItem}
                  onPress={handleTakePicture}
                >
                  <Text style={styles.quickActionIcon}>📸</Text>
                  <Text style={styles.quickActionText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.quickActionItem}
                  onPress={handleUploadPicture}
                >
                  <Text style={styles.quickActionIcon}>📁</Text>
                  <Text style={styles.quickActionText}>Upload Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.quickActionItem}
                  onPress={() => router.push('/add-entry')}
                >
                  <Text style={styles.quickActionIcon}>✏️</Text>
                  <Text style={styles.quickActionText}>Quick Entry</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        ) : (
          // Image Confirmation Screen
          <>
            <Text style={styles.confirmationTitle}>Selected Image</Text>
            <Image 
              source={{ uri: selectedImage }}
              style={styles.selectedImage}
            />
            <Text style={styles.confirmationText}>
              Do you want to analyze this image with AI?
            </Text>
            <View style={styles.confirmationButtons}>
              <Button
                title="Analyze Image"
                onPress={handleConfirmImage}
                style={styles.confirmButton}
                variant="primary"
              />
              <Button
                title="Cancel"
                onPress={handleCancelImage}
                style={styles.cancelConfirmButton}
                variant="outline"
              />
            </View>
          </>
        )}
      </View>

      {/* Tip Section */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipTitle}>Poop Tip of the Day</Text>
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
    backgroundColor: Colors.primary.background 
  },
  content: { 
    padding: 16, 
    paddingBottom: 32 
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
    color: Colors.primary.text 
  },
  subtitle: { 
    fontSize: 16, 
    color: Colors.primary.lightText 
  },
  profileButton: {
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: Colors.primary.card,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  
  // Summary Section
  summaryContainer: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.primary.lightText,
    marginBottom: 6,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.accent,
  },
  dataSourceText: {
    fontSize: 12,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginTop: 8,
  },

  // Main Action Section
  actionContainer: { 
    alignItems: 'center', 
    marginVertical: 16,
    backgroundColor: Colors.primary.card,
    borderRadius: 16,
    padding: 20,
  },
  toiletImage: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    marginBottom: 16 
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 14,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryActionButton: {
    minWidth: 200,
    marginBottom: 20,
  },

  // Quick Actions
  quickActions: {
    width: '100%',
    alignItems: 'center',
  },
  quickActionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.lightText,
    marginBottom: 12,
  },
  quickActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  quickActionItem: {
    alignItems: 'center',
    padding: 8,
    flex: 1,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.primary.lightText,
    textAlign: 'center',
  },

  // Image Confirmation
  confirmationTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  selectedImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  confirmationText: {
    fontSize: 16,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 20,
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  confirmButton: {
    minWidth: 120,
  },
  cancelConfirmButton: {
    minWidth: 120,
    borderColor: Colors.primary.lightText,
  },

  // Tip Section
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
  cloudIndicator: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cloudOn: {
    backgroundColor: '#E8F5E8',
  },
  cloudOff: {
    backgroundColor: '#FFF3E0',
  },
  cloudText: {
    fontSize: 13,
    fontWeight: '500',
  },
});