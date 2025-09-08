// app/cloudinary-setup.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import cloudinaryService from '@/services/cloudinaryService';
import { useUserStore } from '@/store/userStore';

export default function CloudinarySetupScreen() {
  const router = useRouter();
  const { user_id } = useUserStore();
  
  const [cloudName, setCloudName] = useState('');
  const [uploadPreset, setUploadPreset] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<any>(null);
  
  // Load existing configuration
  useEffect(() => {
    loadExistingConfig();
  }, []);
  
  const loadExistingConfig = async () => {
    const config = await cloudinaryService.loadConfig();
    if (config) {
      setCloudName(config.cloudName);
      setUploadPreset(config.uploadPreset);
      setIsConfigured(true);
      setCurrentConfig(config);
    }
  };
  
  // Save settings
  const handleSave = async () => {
    // Validate input
    if (!cloudName || !uploadPreset) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Save configuration
      cloudinaryService.setConfig(cloudName, uploadPreset);
      
      // Test upload (optional)
      Alert.alert(
        'Success',
        'Cloudinary setup complete!\n\nCloud Name: ' + cloudName + '\nUpload Preset: ' + uploadPreset,
        [
          {
            text: 'Done',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clear settings
  const handleClear = () => {
    Alert.alert(
      'Clear Settings',
      'Are you sure you want to clear Cloudinary settings?\nFuture photos will be stored locally on device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await cloudinaryService.clearConfig();
            setCloudName('');
            setUploadPreset('');
            setIsConfigured(false);
            setCurrentConfig(null);
            Alert.alert('Success', 'Cloudinary settings cleared');
          }
        }
      ]
    );
  };
  
  // Open Cloudinary website
  const openCloudinaryWebsite = () => {
    Linking.openURL('https://cloudinary.com/users/register/free');
  };
  
  // Show instructions
  const showInstructions = () => {
    Alert.alert(
      'How to Setup Cloudinary',
      '1. Sign up for a free Cloudinary account\n\n' +
      '2. Find your Cloud Name in the Dashboard after login\n\n' +
      '3. Go to Settings > Upload\n\n' +
      '4. Click "Add upload preset"\n\n' +
      '5. Set Signing Mode to "Unsigned"\n\n' +
      '6. Note down the Preset Name\n\n' +
      '7. Enter Cloud Name and Preset Name below',
      [
        { text: 'Got it', style: 'default' },
        { text: 'Sign Up Now', onPress: openCloudinaryWebsite }
      ]
    );
  };
  
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Cloudinary Setup' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>Processing...</Text>
        </View>
      </>
    );
  }
  
  return (
    <>
      <Stack.Screen options={{ title: 'Cloudinary Setup' }} />
      <ScrollView style={styles.container}>
        {/* Title Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Cloudinary Cloud Storage Setup</Text>
          <Text style={styles.subtitle}>
            Store your poop photos securely in the cloud, accessible anytime, anywhere
          </Text>
        </View>
        
        {/* Current Status */}
        {isConfigured && (
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>✅ Cloudinary Configured</Text>
            <Text style={styles.statusText}>Cloud Name: {currentConfig?.cloudName}</Text>
            <Text style={styles.statusText}>Upload Preset: {currentConfig?.uploadPreset}</Text>
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearLink}>Clear Settings</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Benefits */}
        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Why Choose Cloudinary?</Text>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>☁️</Text>
            <Text style={styles.benefitText}>Free plan includes 25GB storage</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>🔒</Text>
            <Text style={styles.benefitText}>Photos stored in your private account</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>📱</Text>
            <Text style={styles.benefitText}>Cross-device sync, no worries when switching phones</Text>
          </View>
          <View style={styles.benefitItem}>
            <Text style={styles.benefitIcon}>⚡</Text>
            <Text style={styles.benefitText}>Auto compression & optimization for fast loading</Text>
          </View>
        </View>
        
        {/* Settings Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Configuration</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cloud Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. dxxxxx"
              value={cloudName}
              onChangeText={setCloudName}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>Found in your Cloudinary Dashboard</Text>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Upload Preset</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. poop_upload"
              value={uploadPreset}
              onChangeText={setUploadPreset}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>Must be Unsigned type</Text>
          </View>
          
          <TouchableOpacity style={styles.helpButton} onPress={showInstructions}>
            <Text style={styles.helpButtonText}>📖 View Setup Guide</Text>
          </TouchableOpacity>
          
          <Button
            title={isConfigured ? "Update Settings" : "Save Settings"}
            onPress={handleSave}
            style={styles.saveButton}
          />
        </View>
        
        {/* Quick Links */}
        <View style={styles.linksCard}>
          <Text style={styles.linksTitle}>Quick Links</Text>
          
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={openCloudinaryWebsite}
          >
            <Text style={styles.linkButtonText}>🌐 Sign up for Free Cloudinary Account</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => Linking.openURL('https://cloudinary.com/console')}
          >
            <Text style={styles.linkButtonText}>🏠 Go to Cloudinary Dashboard</Text>
          </TouchableOpacity>
        </View>
        
        {/* Important Notes */}
        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>⚠️ Important Notes</Text>
          <Text style={styles.noteText}>
            • Keep your Cloudinary account secure{'\n'}
            • Free plan has monthly bandwidth limits{'\n'}
            • Regularly backup important photos{'\n'}
            • Only new photos will be uploaded to cloud after setup
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
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary.background,
  },
  
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.primary.lightText,
  },
  
  header: {
    padding: 20,
    backgroundColor: Colors.primary.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  
  subtitle: {
    fontSize: 14,
    color: Colors.primary.lightText,
    lineHeight: 20,
  },
  
  statusCard: {
    margin: 16,
    padding: 16,
    backgroundColor: '#E8F5E8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  
  statusText: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 4,
  },
  
  clearLink: {
    marginTop: 8,
    fontSize: 14,
    color: '#C62828',
    textDecorationLine: 'underline',
  },
  
  benefitsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  
  benefitsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  benefitIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: Colors.primary.text,
  },
  
  formCard: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  
  inputGroup: {
    marginBottom: 20,
  },
  
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.primary.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.primary.text,
  },
  
  hint: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.primary.lightText,
  },
  
  helpButton: {
    alignItems: 'center',
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  
  helpButtonText: {
    fontSize: 14,
    color: Colors.primary.accent,
    fontWeight: '600',
  },
  
  saveButton: {
    marginTop: 8,
  },
  
  linksCard: {
    margin: 16,
    padding: 16,
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
  },
  
  linksTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  
  linkButton: {
    padding: 12,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    marginBottom: 8,
  },
  
  linkButtonText: {
    fontSize: 14,
    color: '#1976D2',
    fontWeight: '500',
  },
  
  noteCard: {
    margin: 16,
    marginBottom: 32,
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFB74D',
  },
  
  noteTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 8,
  },
  
  noteText: {
    fontSize: 13,
    color: '#E65100',
    lineHeight: 20,
  },
});