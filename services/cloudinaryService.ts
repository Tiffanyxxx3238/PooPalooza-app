// services/cloudinaryService.ts
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 添加 API URL - 你需要根據實際情況修改
const API_BASE_URL = 'https://poopalooza-backend-api-af34f62d7c87.herokuapp.com'; // 替換成你的 Heroku URL

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  recordId?: number; // 添加後端記錄 ID
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
  
  // 🆕 新增：只上傳圖片到 Cloudinary，不保存到後端
  async uploadImageOnly(localUri: string, userId: number): Promise<string | null> {
    try {
      // Verify configuration exists
      if (!this.config) {
        await this.loadConfig();
        if (!this.config) {
          console.error('Please configure Cloudinary first');
          return null;
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
      
      // Execute upload to Cloudinary
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
      console.log('✅ Upload successful! URL:', data.secure_url);
      
      // 只返回 URL，不保存到後端
      return data.secure_url;
      
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      return null;
    }
  }
  
  // Upload image to Cloudinary AND save to backend
  async uploadImage(localUri: string, userId: number, additionalData?: any): Promise<UploadResult> {
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
      
      // Execute upload to Cloudinary
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
      
      // Save to backend database
      const backendResult = await this.saveToBackend(data.secure_url, userId, additionalData);
      
      return { 
        success: true, 
        url: data.secure_url,
        recordId: backendResult?.record_id
      };
      
    } catch (error: any) {
      console.error('Cloudinary upload error:', error);
      return { 
        success: false, 
        error: error.message || 'Upload failed' 
      };
    }
  }
  
  // Save image URL to backend
  private async saveToBackend(imageUrl: string, userId: number, additionalData?: any) {
    try {
      console.log('Saving to backend...');
      
      const response = await fetch(`${API_BASE_URL}/poop-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          image_url: imageUrl,
          record_time: new Date().toISOString(),
          bristol_scale: additionalData?.bristolScale || null,
          color: additionalData?.color || null,
          consistency: additionalData?.consistency || null,
          volume: additionalData?.volume || null,
          odor: additionalData?.odor || null,
          has_blood: additionalData?.hasBlood || false,
          has_mucus: additionalData?.hasMucus || false,
          ai_diagnosis_summary: additionalData?.aiDiagnosis || null,
          health_recommendations: additionalData?.recommendations || null,
        })
      });
      
      if (!response.ok) {
        console.error('Backend save failed:', response.status);
        throw new Error('Failed to save to backend');
      }
      
      const result = await response.json();
      console.log('Backend save successful:', result);
      return result;
      
    } catch (error) {
      console.error('Backend save error:', error);
      // 不要因為後端錯誤而讓整個上傳失敗
      // 照片已經上傳到 Cloudinary，可以之後再重試
      return null;
    }
  }
  
  // Get user's photos from backend
  async getUserPhotos(userId: number): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/poop-records?user_id=${userId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      
      const records = await response.json();
      
      // Filter records with photos and format
      return records
        .filter((record: any) => record.image_url)
        .map((record: any) => ({
          id: record.record_id,
          url: record.image_url,
          date: record.record_time,
          bristolScale: record.bristol_scale,
          color: record.color,
          volume: record.volume,
          diagnosis: record.ai_diagnosis_summary,
        }));
        
    } catch (error) {
      console.error('Failed to fetch photos from backend:', error);
      return [];
    }
  }
  
  // Delete photo (from Cloudinary and backend)
  async deletePhoto(recordId: number, cloudinaryPublicId?: string): Promise<boolean> {
    try {
      // Delete from backend
      const response = await fetch(`${API_BASE_URL}/poop-records/${recordId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete from backend');
      }
      
      // Optionally delete from Cloudinary (需要另外設定)
      // This requires Admin API which needs API secret (不建議在前端做)
      
      return true;
    } catch (error) {
      console.error('Delete failed:', error);
      return false;
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