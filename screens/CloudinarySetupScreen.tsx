// screens/CloudinarySetupScreen.tsx
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
import { useRouter } from 'expo-router';
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
  
  // 載入現有配置
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
  
  // 儲存設定
  const handleSave = async () => {
    // 驗證輸入
    if (!cloudName || !uploadPreset) {
      Alert.alert('錯誤', '請填寫所有欄位');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // 儲存配置
      cloudinaryService.setConfig(cloudName, uploadPreset);
      
      // 測試上傳（可選）
      Alert.alert(
        '設定成功',
        'Cloudinary 已設定完成！\n\n雲端名稱: ' + cloudName + '\n上傳預設: ' + uploadPreset,
        [
          {
            text: '完成',
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('錯誤', '儲存設定失敗');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 清除設定
  const handleClear = () => {
    Alert.alert(
      '清除設定',
      '確定要清除 Cloudinary 設定嗎？\n之後的照片將儲存在裝置本機。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            await cloudinaryService.clearConfig();
            setCloudName('');
            setUploadPreset('');
            setIsConfigured(false);
            setCurrentConfig(null);
            Alert.alert('成功', '已清除 Cloudinary 設定');
          }
        }
      ]
    );
  };
  
  // 開啟 Cloudinary 網站
  const openCloudinaryWebsite = () => {
    Linking.openURL('https://cloudinary.com/users/register/free');
  };
  
  // 顯示說明
  const showInstructions = () => {
    Alert.alert(
      '如何設定 Cloudinary',
      '1. 註冊免費 Cloudinary 帳號\n\n' +
      '2. 登入後在 Dashboard 找到你的 Cloud Name\n\n' +
      '3. 前往 Settings > Upload\n\n' +
      '4. 點擊 "Add upload preset"\n\n' +
      '5. 設定 Signing Mode 為 "Unsigned"\n\n' +
      '6. 記下 Preset Name\n\n' +
      '7. 將 Cloud Name 和 Preset Name 填入下方',
      [
        { text: '了解', style: 'default' },
        { text: '前往註冊', onPress: openCloudinaryWebsite }
      ]
    );
  };
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text style={styles.loadingText}>處理中...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {/* 標題區 */}
      <View style={styles.header}>
        <Text style={styles.title}>Cloudinary 雲端儲存設定</Text>
        <Text style={styles.subtitle}>
          將便便照片安全地儲存在雲端，隨時隨地都能查看
        </Text>
      </View>
      
      {/* 目前狀態 */}
      {isConfigured && (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>✅ 已設定 Cloudinary</Text>
          <Text style={styles.statusText}>雲端名稱: {currentConfig?.cloudName}</Text>
          <Text style={styles.statusText}>上傳預設: {currentConfig?.uploadPreset}</Text>
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearLink}>清除設定</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* 優點說明 */}
      <View style={styles.benefitsCard}>
        <Text style={styles.benefitsTitle}>為什麼選擇 Cloudinary？</Text>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>☁️</Text>
          <Text style={styles.benefitText}>免費方案提供 25GB 儲存空間</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>🔒</Text>
          <Text style={styles.benefitText}>照片儲存在你的私人帳號</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>📱</Text>
          <Text style={styles.benefitText}>跨裝置同步，換手機也不怕</Text>
        </View>
        <View style={styles.benefitItem}>
          <Text style={styles.benefitIcon}>⚡</Text>
          <Text style={styles.benefitText}>自動壓縮優化，載入速度快</Text>
        </View>
      </View>
      
      {/* 設定表單 */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>設定資訊</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cloud Name（雲端名稱）</Text>
          <TextInput
            style={styles.input}
            placeholder="例如: dxxxxx"
            value={cloudName}
            onChangeText={setCloudName}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>在 Cloudinary Dashboard 可以找到</Text>
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Upload Preset（上傳預設）</Text>
          <TextInput
            style={styles.input}
            placeholder="例如: poop_upload"
            value={uploadPreset}
            onChangeText={setUploadPreset}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Text style={styles.hint}>必須是 Unsigned（未簽署）類型</Text>
        </View>
        
        <TouchableOpacity style={styles.helpButton} onPress={showInstructions}>
          <Text style={styles.helpButtonText}>📖 查看設定教學</Text>
        </TouchableOpacity>
        
        <Button
          title={isConfigured ? "更新設定" : "儲存設定"}
          onPress={handleSave}
          style={styles.saveButton}
        />
      </View>
      
      {/* 快速連結 */}
      <View style={styles.linksCard}>
        <Text style={styles.linksTitle}>快速連結</Text>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={openCloudinaryWebsite}
        >
          <Text style={styles.linkButtonText}>🌐 註冊 Cloudinary 免費帳號</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => Linking.openURL('https://cloudinary.com/console')}
        >
          <Text style={styles.linkButtonText}>🏠 前往 Cloudinary Dashboard</Text>
        </TouchableOpacity>
      </View>
      
      {/* 注意事項 */}
      <View style={styles.noteCard}>
        <Text style={styles.noteTitle}>⚠️ 注意事項</Text>
        <Text style={styles.noteText}>
          • 請妥善保管你的 Cloudinary 帳號{'\n'}
          • 免費方案每月有流量限制{'\n'}
          • 建議定期備份重要照片{'\n'}
          • 設定後新拍的照片才會上傳雲端
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