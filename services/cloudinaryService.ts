// services/cloudinaryService.ts
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

class CloudinaryService {
  private config: CloudinaryConfig | null = null;
  
  // Configure Cloudinary
  setConfig(cloudName: string, uploadPreset: string) {
    this.config = {
      cloudName,
      uploadPreset
    };
    this.saveConfig();
  }
  
  // Save configuration locally
  private async saveConfig() {
    try {
      if (this.config) {
        await AsyncStorage.setItem('cloudinary_config', JSON.stringify(this.config));
      }
    } catch (error) {
      console.error('Failed to save Cloudinary configuration:', error);
    }
  }
  
  // Load configuration
  async loadConfig(): Promise<CloudinaryConfig | null> {
    try {
      const configStr = await AsyncStorage.getItem('cloudinary_config');
      if (configStr) {
        this.config = JSON.parse(configStr);
        return this.config;
      }
    } catch (error) {
      console.error('Failed to load Cloudinary configuration:', error);
    }
    return null;
  }
  
  // Check if configured
  isConfigured(): boolean {
    return this.config !== null;
  }
  
  // Upload image to Cloudinary
  async uploadImage(localUri: string, userId: number): Promise<UploadResult> {
    try {
      // Verify configuration exists
      if (!this.config) {
        await this.loadConfig();
        if (!this.config) {
          return { 
            success: false, 
            error: 'Please configure Cloudinary first' 
          };
        }
      }
      
      console.log('Starting image upload to Cloudinary...');
      
      // Create FormData
      const formData = new FormData();
      
      // Add image file - React Native format
      const photo = {
        uri: localUri,
        type: 'image/jpeg',
        name: `poop_${userId}_${Date.now()}.jpg`
      } as any;
      
      formData.append('file', photo);
      formData.append('upload_preset', this.config.uploadPreset);
      formData.append('folder', `poopalooza/user_${userId}`);
      
      // Upload URL
      const uploadUrl = `https://api.cloudinary.com/v1_1/${this.config.cloudName}/image/upload`;
      
      console.log('Uploading to:', uploadUrl);
      
      // Execute upload
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', errorText);
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Upload successful! URL:', data.secure_url);
      
      return { 
        success: true, 
        url: data.secure_url 
      };
      
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      return { 
        success: false, 
        error: error.message || 'Upload failed' 
      };
    }
  }
  
  // Clear configuration
  async clearConfig() {
    this.config = null;
    try {
      await AsyncStorage.removeItem('cloudinary_config');
    } catch (error) {
      console.error('Failed to clear configuration:', error);
    }
  }
  
  // Get configuration
  getConfig(): CloudinaryConfig | null {
    return this.config;
  }
}

export default new CloudinaryService();