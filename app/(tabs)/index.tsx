import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { usePoopStore } from '@/store/poopStore';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import Timer from '@/components/Timer';
import { User } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

export default function TrackerScreen() {
  const router = useRouter();
  const { addEntry, longestStreak, entries } = usePoopStore();
  const { username } = useUserStore();

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageConfirmation, setShowImageConfirmation] = useState(false);

  // 主要的新增記錄函數 - 詢問是否要添加照片
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

  // 拍照功能
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
      router.push({ 
        pathname: '/add-entry', 
        params: { imageUri: result.assets[0].uri } 
      });
    }
  };

  // 上傳照片功能
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
      setSelectedImage(result.assets[0].uri);
      setShowImageConfirmation(true);
    }
  };

  // 確認選擇的照片
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

  // 取消照片選擇
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

      {/* Summary Section */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>Your Poop Summary</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Entries</Text>
            <Text style={styles.summaryValue}>{entries.length}</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Streak</Text>
            <Text style={styles.summaryValue}>{longestStreak} days</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Healthy %</Text>
            <Text style={styles.summaryValue}>84%</Text>
          </View>
        </View>
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
});