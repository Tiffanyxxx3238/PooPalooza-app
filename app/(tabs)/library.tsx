import React, { useState, useMemo, useEffect,useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Platform, 
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { usePoopStore } from '@/store/poopStore';
import Colors from '@/constants/colors';
import PoopCard from '@/components/PoopCard';
import API_BASE_URL from '@/config';
import { useUserStore } from '@/store/userStore';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import ViewShot from 'react-native-view-shot';
import XLSX from 'xlsx';


// 簡化的圖標組件
const ChevronLeft = () => <Text style={{fontSize: 24, color: Colors.primary.text}}>‹</Text>;
const ChevronRight = () => <Text style={{fontSize: 24, color: Colors.primary.text}}>›</Text>;
const Calendar = () => <Text style={{fontSize: 18}}>📅</Text>;
const List = () => <Text style={{fontSize: 18}}>📋</Text>;
const Eye = () => <Text style={{fontSize: 20}}>👁️</Text>;
const EyeOff = () => <Text style={{fontSize: 20}}>🙈</Text>;
const FileDown = () => <Text style={{fontSize: 20}}>📤</Text>;
const Search = () => <Text style={{fontSize: 20, color: Colors.primary.lightText}}>🔍</Text>;

type ViewMode = 'calendar' | 'library';

export default function LibraryScreen() {
  const router = useRouter();
  const { entries: localEntries } = usePoopStore();
  const { user_id } = useUserStore();
  
  // Database state
  const [dbPoopRecords, setDbPoopRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewShotRef = useRef<ViewShot>(null);
  
  const currentUserId = user_id;
  const entries = dbPoopRecords.length > 0 ? dbPoopRecords : localEntries;
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [showImages, setShowImages] = useState(false);
  
  // Library state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<string>('all');
  
  // 所有標籤樣式函數
  const getDifficultyTagStyle = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return { backgroundColor: '#E8F5E8' };
      case 'medium':
        return { backgroundColor: '#FFF3E0' };
      case 'difficult':
      case 'hard':
        return { backgroundColor: '#FFEBEE' };
      default:
        return { backgroundColor: '#F5F5F5' };
    }
  };

  const getDifficultyTagTextStyle = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return { color: '#2E7D32' };
      case 'medium':
        return { color: '#F57C00' };
      case 'difficult':
      case 'hard':
        return { color: '#C62828' };
      default:
        return { color: '#666666' };
    }
  };

  const getTypeTagStyle = (type) => {
    const typeNumber = parseInt(type?.replace(/[^0-9]/g, '') || '4');
    
    switch (typeNumber) {
      case 1:
        return { backgroundColor: '#FFCDD2' };
      case 2:
        return { backgroundColor: '#FFE0B2' };
      case 3:
        return { backgroundColor: '#FFF9C4' };
      case 4:
        return { backgroundColor: '#E8F5E8' };
      case 5:
        return { backgroundColor: '#E1F5FE' };
      case 6:
        return { backgroundColor: '#F3E5F5' };
      case 7:
        return { backgroundColor: '#FCE4EC' };
      default:
        return { backgroundColor: '#D7CCC8' };
    }
  };

  const getTypeTagTextStyle = (type) => {
    const typeNumber = parseInt(type?.replace(/[^0-9]/g, '') || '4');
    
    switch (typeNumber) {
      case 1:
        return { color: '#C62828' };
      case 2:
        return { color: '#E65100' };
      case 3:
        return { color: '#F57F17' };
      case 4:
        return { color: '#2E7D32' };
      case 5:
        return { color: '#0277BD' };
      case 6:
        return { color: '#7B1FA2' };
      case 7:
        return { color: '#AD1457' };
      default:
        return { color: '#5D4037' };
    }
  };

  const getVolumeTagStyle = (volume) => {
    switch (volume) {
      case 'Small':
        return { backgroundColor: '#E8F5E8' };
      case 'Medium':
        return { backgroundColor: '#FFF3E0' };
      case 'Large':
        return { backgroundColor: '#FFEBEE' };
      default:
        return { backgroundColor: '#E1BEE7' };
    }
  };

  const getVolumeTagTextStyle = (volume) => {
    switch (volume) {
      case 'Small':
        return { color: '#2E7D32' };
      case 'Medium':
        return { color: '#F57C00' };
      case 'Large':
        return { color: '#C62828' };
      default:
        return { color: '#7B1FA2' };
    }
  };
  
  // 從資料庫獲取記錄
  const fetchPoopRecords = async () => {
    try {
      console.log('🔍 Fetching records...');
      console.log('API_BASE_URL:', API_BASE_URL);
      console.log('Current user ID:', currentUserId);
      
      setError(null);
      const response = await fetch(`${API_BASE_URL}/poop-records`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON');
      }
      
      const data = await response.json();
      console.log('📊 Raw data from API:', data.length, 'records');
      
      let userRecords = [];
      if (currentUserId) {
        userRecords = data.filter((record: any) => {
          return record.user_id === currentUserId || 
                 record.user_id === String(currentUserId) ||
                 record.user_id === Number(currentUserId);
        });
      } else {
        console.warn('⚠️ No user_id available, showing all records');
        userRecords = data;
      }
      
      console.log('👤 Filtered user records:', userRecords.length);
      
      const transformedRecords = userRecords.map((record: any) => {
        // 處理 bristol_scale 或 ai_poop_type
        let poopType = 'Type 4';
        if (record.bristol_scale) {
          poopType = `Type ${record.bristol_scale}`;
        } else if (record.ai_poop_type) {
          poopType = `Type ${record.ai_poop_type}`;
        }
        
        // 處理 consistency 或其他難度指標
        let difficulty = 'medium';
        if (record.consistency) {
          const consistencyNum = parseInt(record.consistency);
          if (consistencyNum === 1) difficulty = 'easy';
          else if (consistencyNum === 2) difficulty = 'medium';
          else if (consistencyNum >= 3) difficulty = 'difficult';
        }
        
        // 處理體積顯示
        let volumeDisplay = 'Medium';
        const rawVolume = record.volume || record.ai_poop_volume;
        if (rawVolume !== undefined && rawVolume !== null) {
          if (typeof rawVolume === 'number') {
            switch (rawVolume) {
              case 1: volumeDisplay = 'Small'; break;
              case 2: volumeDisplay = 'Medium'; break;
              case 3: volumeDisplay = 'Large'; break;
              default: volumeDisplay = 'Medium';
            }
          } else if (typeof rawVolume === 'string') {
            const lowerVolume = rawVolume.toLowerCase();
            if (lowerVolume === 'small' || lowerVolume === '1') volumeDisplay = 'Small';
            else if (lowerVolume === 'medium' || lowerVolume === '2') volumeDisplay = 'Medium';
            else if (lowerVolume === 'large' || lowerVolume === '3') volumeDisplay = 'Large';
            else volumeDisplay = rawVolume.charAt(0).toUpperCase() + rawVolume.slice(1).toLowerCase();
          }
        }

        const transformed = {
          id: record.record_id ? record.record_id.toString() : Math.random().toString(),
          date: record.record_time || new Date().toISOString(),
          type: poopType,
          difficulty: difficulty,
          notes: record.ai_diagnosis_summary || record.health_recommendations || '',
          color: record.color || record.ai_poop_color || 'brown',
          hasBlood: record.has_blood || false,
          hasMucus: record.has_mucus || false,
          image: record.image_url || null,
          volume: volumeDisplay,
          originalRecord: record
        };
        
        return transformed;
      });
      
      console.log('✅ Final transformed records:', transformedRecords.length);
      setDbPoopRecords(transformedRecords);
      
    } catch (error) {
      console.error('❌ Error fetching poop records:', error);
      setError(error.message || 'Failed to fetch records');
      
      if (localEntries && localEntries.length > 0) {
        console.log('📱 Falling back to local entries:', localEntries.length);
        setDbPoopRecords(localEntries);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    console.log('🚀 LibraryScreen mounted, user_id:', currentUserId);
    fetchPoopRecords();
  }, [currentUserId]);
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPoopRecords();
    setRefreshing(false);
  };
  
  // Calendar utilities
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, date: null });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ day: i, date });
    }
    
    return days;
  };
  
  // Data processing
  const getEntriesForDate = (date: Date) => {
    if (!date) return [];
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  const filteredAndSearchedEntries = useMemo(() => {
    let result = [...entries];
    
    if (searchQuery.trim()) {
      result = result.filter(entry => 
        entry.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.difficulty?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterBy !== 'all') {
      result = result.filter(entry => entry.difficulty === filterBy);
    }
    
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, searchQuery, filterBy]);
  
  const hasEntries = (date: Date | null) => {
    if (!date) return false;
    return entries.some(entry => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  // Monthly stats
  const getMonthlyStats = () => {
    const monthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === currentMonth.getMonth() &&
        entryDate.getFullYear() === currentMonth.getFullYear()
      );
    });
    
    const totalDays = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const typeCounts = monthEntries.reduce((acc, entry) => {
      const type = entry.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonType = Object.entries(typeCounts).length > 0 
      ? Object.entries(typeCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'N/A';
    
    return {
      totalEntries: monthEntries.length,
      averagePerDay: (monthEntries.length / totalDays).toFixed(1),
      mostCommonType,
    };
  };
  
  // Event handlers
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const handleTakePicture = async (date?: Date) => {
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
        params: { 
          imageUri: result.assets[0].uri,
          date: date?.toISOString() || new Date().toISOString()
        } 
      });
    }
  };

  const handleUploadPicture = async (date?: Date) => {
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
      router.push({ 
        pathname: '/add-entry', 
        params: { 
          imageUri: result.assets[0].uri,
          date: date?.toISOString() || new Date().toISOString()
        } 
      });
    }
  };

  const handleDayPress = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
      
      const dayEntries = getEntriesForDate(date);
      if (dayEntries.length === 0) {
        const dateStr = date.toLocaleDateString('en-US', { 
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        });
        
        Alert.alert(
          'No Records',
          `No records found for ${dateStr}.\nWould you like to add a record for this date?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'No Photo', 
              onPress: () => {
                router.push({
                  pathname: '/add-entry',
                  params: { date: date.toISOString() }
                });
              }
            },
            { 
              text: 'Take Photo', 
              onPress: () => handleTakePicture(date)
            },
            { 
              text: 'Upload Photo', 
              onPress: () => handleUploadPicture(date)
            }
          ]
        );
      }
    }
  };
  
  const handleEntryPress = (id: string) => {
    const entry = entries.find(e => e.id === id);
    if (entry) {
      router.push({
        pathname: '/entry-details-db',
        params: { 
          entry: JSON.stringify(entry)
        }
      });
    }
  };
  
  const toggleShowImages = () => {
    const newState = !showImages;
    console.log('Toggling showImages from', showImages, 'to', newState);
    setShowImages(newState);
  };
  
const handleExport = () => {
  Alert.alert(
    'Export Records',
    'Choose export format',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Excel',
        onPress: () => exportToExcel(),
      },
      {
        text: 'PDF',
        onPress: () => exportToPDF(),
      },
    ],
    { cancelable: true }
  );
};

const exportToExcel = async () => {
  try {
    setIsLoading(true);
    
    // 準備完整的資料 - 加入安全檢查
    const exportData = entries.map(entry => ({
      'ID': entry.id || '',
      'Date': new Date(entry.date).toLocaleDateString(),
      'Time': new Date(entry.date).toLocaleTimeString(),
      'Bristol Scale': entry.originalRecord?.bristol_scale || (entry.type ? String(entry.type).replace('Type ', '') : ''),
      'Color': entry.originalRecord?.color || entry.color || '',
      'Consistency': entry.originalRecord?.consistency || '',
      'Volume': entry.originalRecord?.volume || entry.volume || '',
      'Odor': entry.originalRecord?.odor || '',
      'Notes': entry.originalRecord?.notes || entry.notes || '',
      'AI Type Analysis': entry.originalRecord?.ai_poop_type || '',
      'AI Color Analysis': entry.originalRecord?.ai_poop_color || '',
      'AI Volume Analysis': entry.originalRecord?.ai_poop_volume || '',
      'AI Diagnosis Summary': entry.originalRecord?.ai_diagnosis_summary || '',
      'Health Recommendations': entry.originalRecord?.health_recommendations || '',
      'Health Indicators': entry.originalRecord?.health_indicators || '',
      'Image URL': entry.originalRecord?.image_url || entry.image || '',
    }));

    // 建立工作表
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Poop Records');

    // 轉換為 base64
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    
    // 儲存檔案
    const fileName = `poop_records_${new Date().toISOString().split('T')[0]}.xlsx`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    
    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 分享檔案
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      Alert.alert('Success', `File saved to: ${fileUri}`);
    }

  } catch (error) {
    console.error('Export to Excel error:', error);
    Alert.alert('Export Failed', 'Failed to export Excel file');
  } finally {
    setIsLoading(false);
  }
};

// 匯出為 PDF
const exportToPDF = async () => {
  try {
    setIsLoading(true);

    // 建立可愛風格的 HTML 內容（英文版）
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>My Poop Diary</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap');
            
            body {
              font-family: 'Comic Neue', cursive, Arial, sans-serif;
              padding: 30px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: #333;
            }
            
            .container {
              background: white;
              border-radius: 20px;
              padding: 30px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            }
            
            h1 {
              color: #8B4513;
              text-align: center;
              font-size: 36px;
              margin-bottom: 10px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            
            .subtitle {
              text-align: center;
              color: #666;
              font-size: 18px;
              margin-bottom: 30px;
            }
            
            .stats {
              background: linear-gradient(135deg, #FFF8DC 0%, #F5DEB3 100%);
              padding: 20px;
              border-radius: 15px;
              margin: 20px 0;
              border: 2px solid #DEB887;
            }
            
            .stats h2 {
              color: #8B4513;
              margin-bottom: 15px;
              font-size: 24px;
            }
            
            .stat-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 15px;
            }
            
            .stat-item {
              text-align: center;
              padding: 10px;
              background: white;
              border-radius: 10px;
            }
            
            .stat-number {
              font-size: 24px;
              font-weight: bold;
              color: #8B4513;
            }
            
            .stat-label {
              font-size: 14px;
              color: #666;
              margin-top: 5px;
            }
            
            .record {
              background: #FFFAF0;
              border: 2px solid #DEB887;
              padding: 20px;
              margin: 15px 0;
              border-radius: 15px;
              page-break-inside: avoid;
              position: relative;
            }
            
            .record-header {
              display: flex;
              justify-content: space-between;
              margin-bottom: 15px;
              font-weight: bold;
              color: #8B4513;
            }
            
            .tag {
              display: inline-block;
              padding: 6px 12px;
              margin: 3px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
            }
            
            .type-1 { background: #FFCDD2; color: #C62828; }
            .type-2 { background: #FFE0B2; color: #E65100; }
            .type-3 { background: #FFF9C4; color: #F57F17; }
            .type-4 { background: #E8F5E8; color: #2E7D32; }
            .type-5 { background: #E1F5FE; color: #0277BD; }
            .type-6 { background: #F3E5F5; color: #7B1FA2; }
            .type-7 { background: #FCE4EC; color: #AD1457; }
            
            .easy { background: #C8E6C9; color: #2E7D32; }
            .medium { background: #FFE082; color: #F57C00; }
            .difficult { background: #FFCDD2; color: #C62828; }
            
            .small { background: #E1F5FE; color: #0277BD; }
            .medium-size { background: #FFF9C4; color: #F57F17; }
            .large { background: #FFE0B2; color: #E65100; }
            
            .notes {
              margin-top: 10px;
              padding: 10px;
              background: white;
              border-radius: 10px;
              font-style: italic;
              color: #555;
            }
            
            .ai-analysis {
              margin-top: 10px;
              padding: 10px;
              background: #E3F2FD;
              border-radius: 10px;
              border-left: 4px solid #2196F3;
            }
            
            .poop-emoji {
              position: absolute;
              top: 10px;
              right: 10px;
              font-size: 30px;
              opacity: 0.8;
            }
            
            .footer {
              margin-top: 40px;
              text-align: center;
              padding: 20px;
              background: linear-gradient(135deg, #FFF8DC 0%, #F5DEB3 100%);
              border-radius: 15px;
            }
            
            .footer-emoji {
              font-size: 40px;
              margin: 10px 0;
            }
            
            .footer-text {
              color: #8B4513;
              font-size: 16px;
              font-weight: bold;
            }
            
            .footer-date {
              color: #666;
              font-size: 14px;
              margin-top: 10px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>💩 My Poop Diary 💩</h1>
            <div class="subtitle">Recording Every Beautiful Moment</div>
            
            <div class="stats">
              <h2>📊 Statistics Summary</h2>
              <div class="stat-grid">
                <div class="stat-item">
                  <div class="stat-number">${entries.length}</div>
                  <div class="stat-label">Total Records</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">${entries.length > 0 ? (entries.length / 30).toFixed(1) : 0}</div>
                  <div class="stat-label">Avg per Day</div>
                </div>
                <div class="stat-item">
                  <div class="stat-number">${currentUserId || 'Guest'}</div>
                  <div class="stat-label">User</div>
                </div>
              </div>
            </div>

            <h2 style="color: #8B4513; margin-top: 30px;">📝 Detailed Records</h2>
            ${entries.slice(0, 50).map(entry => {
              // 安全地處理 type
              const typeStr = entry.type || '';
              const typeNum = entry.originalRecord?.bristol_scale || 
                            (typeStr ? typeStr.replace(/[^0-9]/g, '') : '') || 
                            '4';
              const volumeClass = entry.volume === 'Small' ? 'small' : 
                                entry.volume === 'Large' ? 'large' : 'medium-size';
              
              return `
                <div class="record">
                  <span class="poop-emoji">💩</span>
                  <div class="record-header">
                    <span>📅 ${new Date(entry.date).toLocaleDateString()}</span>
                    <span>⏰ ${new Date(entry.date).toLocaleTimeString()}</span>
                  </div>
                  <div>
                    <span class="tag type-${typeNum}">Bristol ${typeNum}</span>
                    <span class="tag ${entry.difficulty || 'medium'}">${
                      entry.difficulty === 'easy' ? '😌 Easy' : 
                      entry.difficulty === 'difficult' ? '😣 Difficult' : '😐 Medium'
                    }</span>
                    <span class="tag ${volumeClass}">${
                      entry.volume === 'Small' ? '🔹 Small' :
                      entry.volume === 'Large' ? '🔷 Large' : '🔶 Medium'
                    }</span>
                    ${entry.originalRecord?.color ? `<span class="tag">🎨 ${entry.originalRecord.color}</span>` : ''}
                    ${entry.originalRecord?.odor ? `<span class="tag">👃 ${entry.originalRecord.odor}</span>` : ''}
                  </div>
                  ${entry.notes ? `<div class="notes">📝 ${entry.notes}</div>` : ''}
                  ${entry.originalRecord?.ai_diagnosis_summary ? 
                    `<div class="ai-analysis">🤖 AI Analysis: ${entry.originalRecord.ai_diagnosis_summary}</div>` : ''}
                  ${entry.originalRecord?.health_recommendations ? 
                    `<div class="ai-analysis">💡 Health Tips: ${entry.originalRecord.health_recommendations}</div>` : ''}
                </div>
              `;
            }).join('')}
            
            ${entries.length > 50 ? `<p style="text-align: center; color: #666;">... ${entries.length - 50} more records not shown ...</p>` : ''}

            <div class="footer">
              <div class="footer-emoji">🚽 💩 🧻</div>
              <div class="footer-text">Poopalooza - Your Personal Poop Tracker</div>
              <div class="footer-date">Report Generated: ${new Date().toLocaleString()}</div>
            </div>
          </div>
        </body>
      </html>
    `;

    // 產生 PDF
    const { uri } = await Print.printToFileAsync({ 
      html: htmlContent,
      base64: false
    });

    // 分享 PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert('Success', `PDF saved to: ${uri}`);
    }

  } catch (error) {
    console.error('Export to PDF error:', error);
    Alert.alert('Export Failed', 'Failed to export PDF file');
  } finally {
    setIsLoading(false);
  }
};

// 匯出為圖片
const exportToImage = async () => {
  try {
    setIsLoading(true);

    // 建立一個簡單的統計圖表視圖
    Alert.alert(
      'Export as Image',
      'Choose what to export',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Current View',
          onPress: async () => {
            if (viewShotRef.current) {
              const uri = await viewShotRef.current.capture();
              
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri);
              } else {
                Alert.alert('Success', `Image saved to: ${uri}`);
              }
            }
          },
        },
        {
          text: 'Statistics Chart',
          onPress: () => exportStatisticsImage(),
        },
      ]
    );

  } catch (error) {
    console.error('Export to image error:', error);
    Alert.alert('Export Failed', 'Failed to export image');
  } finally {
    setIsLoading(false);
  }
};

// 匯出統計圖表為圖片
const exportStatisticsImage = async () => {
  try {
    setIsLoading(true);
    
    // Calculate statistics
    const typeStats = entries.reduce((acc, entry) => {
      const type = entry.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const difficultyStats = entries.reduce((acc, entry) => {
      const difficulty = entry.difficulty || 'unknown';
      acc[difficulty] = (acc[difficulty] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Create beautiful HTML chart
    const chartHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Poop Statistics</title>
          <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Comic+Neue:wght@400;700&display=swap');
            
            body {
              font-family: 'Comic Neue', cursive, Arial, sans-serif;
              padding: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
            }
            
            .container {
              background: white;
              border-radius: 20px;
              padding: 30px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
              max-width: 1200px;
              margin: 0 auto;
            }
            
            h1 {
              color: #8B4513;
              text-align: center;
              font-size: 32px;
              margin-bottom: 30px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            }
            
            .stats-summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            
            .stat-card {
              background: linear-gradient(135deg, #FFF8DC 0%, #F5DEB3 100%);
              padding: 20px;
              border-radius: 15px;
              text-align: center;
              border: 2px solid #DEB887;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .stat-emoji {
              font-size: 32px;
              margin-bottom: 10px;
            }
            
            .stat-number {
              font-size: 36px;
              font-weight: bold;
              color: #8B4513;
              margin: 10px 0;
            }
            
            .stat-label {
              font-size: 16px;
              color: #666;
              margin-top: 5px;
            }
            
            .chart-container {
              position: relative;
              height: 400px;
              margin: 30px 0;
              background: #FFFAF0;
              padding: 20px;
              border-radius: 15px;
              border: 2px solid #DEB887;
              box-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .footer {
              text-align: center;
              margin-top: 30px;
              padding: 20px;
              background: linear-gradient(135deg, #FFF8DC 0%, #F5DEB3 100%);
              border-radius: 15px;
              border: 2px solid #DEB887;
            }
            
            .footer-emoji {
              font-size: 40px;
              margin: 10px 0;
            }
            
            .footer-text {
              color: #8B4513;
              font-size: 16px;
              font-weight: bold;
              margin: 10px 0;
            }
            
            .footer-date {
              color: #666;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>💩 Poopalooza Statistics Report 💩</h1>
            
            <div class="stats-summary">
              <div class="stat-card">
                <div class="stat-emoji">💩</div>
                <div class="stat-number">${entries.length}</div>
                <div class="stat-label">Total Poops</div>
              </div>
              <div class="stat-card">
                <div class="stat-emoji">📊</div>
                <div class="stat-number">${Object.keys(typeStats).length}</div>
                <div class="stat-label">Different Types</div>
              </div>
              <div class="stat-card">
                <div class="stat-emoji">📅</div>
                <div class="stat-number">${(entries.length / 30).toFixed(1)}</div>
                <div class="stat-label">Daily Average</div>
              </div>
            </div>
            
            <div class="chart-container">
              <canvas id="typeChart"></canvas>
            </div>
            
            <div class="chart-container">
              <canvas id="difficultyChart"></canvas>
            </div>
            
            <div class="footer">
              <div class="footer-emoji">🚽 💩 🧻</div>
              <div class="footer-text">Poopalooza - Your Personal Poop Tracker</div>
              <div class="footer-date">Generated on ${new Date().toLocaleString()}</div>
            </div>
          </div>

          <script>
            // Bristol Type Distribution - Doughnut Chart
            new Chart(document.getElementById('typeChart'), {
              type: 'doughnut',
              data: {
                labels: ${JSON.stringify(Object.keys(typeStats))},
                datasets: [{
                  data: ${JSON.stringify(Object.values(typeStats))},
                  backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
                    '#9966FF', '#FF9F40', '#FF6B6B', '#C9CBCF'
                  ],
                  borderWidth: 3,
                  borderColor: '#fff',
                  hoverOffset: 10
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: 'Bristol Scale Distribution',
                    font: {
                      size: 20,
                      weight: 'bold',
                      family: "'Comic Neue', cursive"
                    },
                    color: '#8B4513',
                    padding: 20
                  },
                  legend: {
                    position: 'bottom',
                    labels: {
                      padding: 15,
                      font: {
                        size: 14,
                        family: "'Comic Neue', cursive"
                      },
                      generateLabels: function(chart) {
                        const data = chart.data;
                        if (data.labels.length && data.datasets.length) {
                          return data.labels.map((label, i) => {
                            const value = data.datasets[0].data[i];
                            const total = data.datasets[0].data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return {
                              text: label + ' (' + percentage + '%)',
                              fillStyle: data.datasets[0].backgroundColor[i],
                              hidden: false,
                              index: i
                            };
                          });
                        }
                        return [];
                      }
                    }
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed;
                        const total = context.dataset.data.reduce((a, b) => a + b, 0);
                        const percentage = ((value / total) * 100).toFixed(1);
                        return label + ': ' + value + ' (' + percentage + '%)';
                      }
                    }
                  }
                }
              }
            });

            // Difficulty Distribution - Bar Chart
            const difficultyLabels = ${JSON.stringify(Object.keys(difficultyStats).map(d => 
              d === 'easy' ? '😌 Easy' : 
              d === 'difficult' ? '😣 Difficult' : 
              d === 'medium' ? '😐 Medium' : d
            ))};
            
            new Chart(document.getElementById('difficultyChart'), {
              type: 'bar',
              data: {
                labels: difficultyLabels,
                datasets: [{
                  label: 'Number of Poops',
                  data: ${JSON.stringify(Object.values(difficultyStats))},
                  backgroundColor: [
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(255, 193, 7, 0.8)',
                    'rgba(244, 67, 54, 0.8)'
                  ],
                  borderColor: [
                    'rgba(76, 175, 80, 1)',
                    'rgba(255, 193, 7, 1)',
                    'rgba(244, 67, 54, 1)'
                  ],
                  borderWidth: 2,
                  borderRadius: 10
                }]
              },
              options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  title: {
                    display: true,
                    text: 'Difficulty Distribution',
                    font: {
                      size: 20,
                      weight: 'bold',
                      family: "'Comic Neue', cursive"
                    },
                    color: '#8B4513',
                    padding: 20
                  },
                  legend: {
                    display: false
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return 'Count: ' + context.parsed.y;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: {
                      color: 'rgba(0,0,0,0.1)',
                      borderDash: [5, 5]
                    },
                    ticks: {
                      font: {
                        family: "'Comic Neue', cursive",
                        size: 12
                      }
                    }
                  },
                  x: {
                    grid: {
                      display: false
                    },
                    ticks: {
                      font: {
                        family: "'Comic Neue', cursive",
                        size: 14,
                        weight: 'bold'
                      }
                    }
                  }
                }
              }
            });
          </script>
        </body>
      </html>
    `;

    // Generate PDF with charts
    const { uri } = await Print.printToFileAsync({ 
      html: chartHtml,
      base64: false
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert('Success', `Statistics saved to: ${uri}`);
    }

  } catch (error) {
    console.error('Export statistics error:', error);
    Alert.alert('Export Failed', 'Failed to export statistics');
  } finally {
    setIsLoading(false);
  }
};

  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  // Helper functions
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  const isSelectedDate = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };
  
  const calendarDays = generateCalendarDays();
  const selectedEntries = getEntriesForDate(selectedDate);
  const monthlyStats = getMonthlyStats();

  // Loading screen
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text style={styles.loadingText}>Loading records...</Text>
        <Text style={styles.debugText}>
          User ID: {currentUserId || 'Not logged in'}
        </Text>
        {error && (
          <Text style={styles.errorText}>
            Error: {error}
          </Text>
        )}
      </View>
    );
  }

  // Error state
  if (error && entries.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load records</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <Text style={styles.debugText}>
          User ID: {currentUserId || 'Not logged in'} | 
          Local entries: {localEntries.length}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPoopRecords}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render Calendar View
  const renderCalendarView = () => (
    <ScrollView 
      style={styles.scrollView} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          📊 DB Records: {dbPoopRecords.length} | Local: {localEntries.length} | 
          Total Entries: {entries.length} | User: {currentUserId || 'None'}
        </Text>
      </View>

      <View style={styles.calendarContainer}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
            <ChevronLeft />
          </TouchableOpacity>
          
          <Text style={styles.monthText}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <ChevronRight />
          </TouchableOpacity>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{monthlyStats.totalEntries}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{monthlyStats.averagePerDay}</Text>
            <Text style={styles.statLabel}>Avg/Day</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{monthlyStats.mostCommonType}</Text>
            <Text style={styles.statLabel}>Most Common</Text>
          </View>
        </View>
        
        <View style={styles.weekdaysContainer}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <Text key={index} style={styles.weekdayText}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.daysContainer}>
          {calendarDays.map((item, index) => {
            const entriesCount = item.date ? getEntriesForDate(item.date).length : 0;
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayItem,
                  item.day === 0 && styles.emptyDay,
                  isToday(item.date) && styles.todayItem,
                  isSelectedDate(item.date) && styles.selectedDayItem,
                  entriesCount > 0 && styles.hasEntriesDay,
                ]}
                onPress={() => handleDayPress(item.date)}
                disabled={item.day === 0}
              >
                {item.day !== 0 && (
                  <>
                    <Text style={[
                      styles.dayText,
                      isToday(item.date) && styles.todayText,
                      isSelectedDate(item.date) && styles.selectedDayText,
                      entriesCount > 0 && styles.hasEntriesText,
                    ]}>
                      {item.day}
                    </Text>
                    
                    {entriesCount > 0 && (
                      <View style={[
                        styles.recordCountBadge,
                        isSelectedDate(item.date) && styles.selectedRecordCountBadge,
                      ]}>
                        <Text style={[
                          styles.recordCountText,
                          isSelectedDate(item.date) && styles.selectedRecordCountText,
                        ]}>
                          {entriesCount}
                        </Text>
                      </View>
                    )}
                  </>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
      
      {/* Selected Date Entries */}
      <View style={styles.selectedDateSection}>
        <Text style={styles.dateTitle}>
          {selectedDate.toLocaleDateString('default', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </Text>
        
        {selectedEntries.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No entries for this date</Text>
          </View>
        ) : (
          <View style={styles.entriesContainer}>
            {selectedEntries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={styles.libraryCardContainer}
                onPress={() => handleEntryPress(entry.id)}
              >
                <View style={styles.libraryCard}>
                  <View style={styles.libraryCardHeader}>
                    <Text style={styles.libraryCardTitle}>Today Poop</Text>
                    <Text style={styles.libraryCardTime}>
                      {new Date(entry.date).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </View>
                  
                  <View style={styles.libraryCardContent}>
                    <View style={styles.libraryCardTags}>
                      <View style={[styles.difficultyTag, getDifficultyTagStyle(entry.difficulty)]}>
                        <Text style={[styles.difficultyTagText, getDifficultyTagTextStyle(entry.difficulty)]}>
                          {entry.difficulty.charAt(0).toUpperCase() + entry.difficulty.slice(1)}
                        </Text>
                      </View>
                      
                      <View style={[styles.typeTag, getTypeTagStyle(entry.type)]}>
                        <Text style={[styles.typeTagText, getTypeTagTextStyle(entry.type)]}>
                          {entry.type}
                        </Text>
                      </View>
                      
                      {entry.volume && (
                        <View style={[styles.volumeTag, getVolumeTagStyle(entry.volume)]}>
                          <Text style={[styles.volumeTagText, getVolumeTagTextStyle(entry.volume)]}>
                            {entry.volume}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    {showImages && (
                      <View style={styles.libraryCardImageContainer}>
                        {entry.image ? (
                          <Image 
                            source={{ uri: entry.image }} 
                            style={styles.libraryCardImage}
                          />
                        ) : (
                          <View style={styles.libraryCardNoImage}>
                            <Text style={styles.noImageIcon}>📸</Text>
                            <Text style={styles.noImageText}>No Photo</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                  
                  {entry.notes && (
                    <View style={styles.libraryCardNotes}>
                      <Text style={styles.libraryCardNotesText} numberOfLines={2}>
                        {entry.originalRecord?.ai_diagnosis_summary ? '🎯 ' : '📝 '}{entry.notes}
                      </Text>
                    </View>
                  )}
                  
                  {(entry.hasBlood || entry.hasMucus || entry.originalRecord?.ai_diagnosis_summary) && (
                    <View style={styles.libraryCardAlerts}>
                      {entry.hasBlood && (
                        <Text style={styles.alertText}>🩸 Blood detected</Text>
                      )}
                      {entry.hasMucus && (
                        <Text style={styles.alertText}>💧 Mucus detected</Text>
                      )}
                      {entry.originalRecord?.ai_diagnosis_summary && (
                        <Text style={[styles.alertText, { backgroundColor: '#E3F2FD', color: '#1976D2' }]}>
                          🤖 AI Analysis Available
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  // Render Library View
  const renderLibraryView = () => (
    <View style={styles.libraryContainer}>
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Search />
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.primary.lightText}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Text style={styles.clearSearch}>×</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.filterContainer}>
          {['all', 'easy', 'medium', 'difficult'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                filterBy === filter && styles.activeFilterButton,
              ]}
              onPress={() => setFilterBy(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                filterBy === filter && styles.activeFilterButtonText,
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.debugContainer}>
        <Text style={styles.debugText}>
          Total entries: {entries.length} | Filtered: {filteredAndSearchedEntries.length} | 
          User: {currentUserId || 'None'}
        </Text>
      </View>
      
      {filteredAndSearchedEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {entries.length === 0 
              ? 'No entries yet' 
              : (searchQuery || filterBy !== 'all' ? 'No matching entries' : 'No entries')
            }
          </Text>
          <Text style={styles.emptySubtext}>
            {entries.length === 0 
              ? 'Start tracking your poops to see them here'
              : (searchQuery || filterBy !== 'all' 
                ? 'Try adjusting your search or filter'
                : 'Check your database connection'
              )
            }
          </Text>
          {entries.length === 0 && (
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredAndSearchedEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.libraryCardContainer}
              onPress={() => handleEntryPress(item.id)}
            >
              <View style={styles.libraryCard}>
                <View style={styles.libraryCardHeader}>
                  <Text style={styles.libraryCardTitle}>Today Poop</Text>
                  <Text style={styles.libraryCardTime}>
                    {new Date(item.date).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </View>
                
                <View style={styles.libraryCardContent}>
                  <View style={styles.libraryCardTags}>
                    <View style={[styles.difficultyTag, getDifficultyTagStyle(item.difficulty)]}>
                      <Text style={[styles.difficultyTagText, getDifficultyTagTextStyle(item.difficulty)]}>
                        {item.difficulty.charAt(0).toUpperCase() + item.difficulty.slice(1)}
                      </Text>
                    </View>
                    
                    <View style={[styles.typeTag, getTypeTagStyle(item.type)]}>
                      <Text style={[styles.typeTagText, getTypeTagTextStyle(item.type)]}>
                        {item.type}
                      </Text>
                    </View>
                    
                    {item.volume && (
                      <View style={[styles.volumeTag, getVolumeTagStyle(item.volume)]}>
                        <Text style={[styles.volumeTagText, getVolumeTagTextStyle(item.volume)]}>
                          {item.volume}
                        </Text>
                      </View>
                    )}
                  </View>
                  
                  {showImages && (
                    <View style={styles.libraryCardImageContainer}>
                      {item.image ? (
                        <Image 
                          source={{ uri: item.image }} 
                          style={styles.libraryCardImage}
                        />
                      ) : (
                        <View style={styles.libraryCardNoImage}>
                          <Text style={styles.noImageIcon}>📸</Text>
                          <Text style={styles.noImageText}>No Photo</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                
                {item.notes && (
                  <View style={styles.libraryCardNotes}>
                    <Text style={styles.libraryCardNotesText} numberOfLines={2}>
                      {item.originalRecord?.ai_diagnosis_summary ? '🎯 ' : '📝 '}{item.notes}
                    </Text>
                  </View>
                )}
                
                {(item.hasBlood || item.hasMucus || item.originalRecord?.ai_diagnosis_summary) && (
                  <View style={styles.libraryCardAlerts}>
                    {item.hasBlood && (
                      <Text style={styles.alertText}>🩸 Blood detected</Text>
                    )}
                    {item.hasMucus && (
                      <Text style={styles.alertText}>💧 Mucus detected</Text>
                    )}
                    {item.originalRecord?.ai_diagnosis_summary && (
                      <Text style={[styles.alertText, { backgroundColor: '#E3F2FD', color: '#1976D2' }]}>
                        🤖 AI Analysis Available
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>
            {viewMode === 'calendar' ? 'Calendar' : 'Library'}
          </Text>
          {viewMode === 'library' && (
            <Text style={styles.resultCount}>
              {filteredAndSearchedEntries.length} of {entries.length} entries
            </Text>
          )}
        </View>
        
        <View style={styles.headerRight}>
          <View style={styles.viewToggle}>
            <TouchableOpacity 
              style={[
                styles.toggleButton,
                viewMode === 'calendar' && styles.activeToggleButton
              ]}
              onPress={() => setViewMode('calendar')}
            >
              <Calendar />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.toggleButton,
                viewMode === 'library' && styles.activeToggleButton
              ]}
              onPress={() => setViewMode('library')}
            >
              <List />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[
              styles.headerButton,
              showImages && styles.activeHeaderButton
            ]}
            onPress={toggleShowImages}
          >
            {showImages ? <Eye /> : <EyeOff />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleExport}
          >
            <FileDown />
          </TouchableOpacity>
        </View>
      </View>
      
      {viewMode === 'calendar' ? renderCalendarView() : renderLibraryView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
  },
  
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.primary.lightText,
  },
  
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
  },
  
  errorSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: Colors.primary.lightText,
    textAlign: 'center',
  },
  
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary.accent,
    borderRadius: 20,
  },
  
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  debugContainer: {
    padding: 10,
    backgroundColor: '#ffffcc',
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  
  debugText: {
    fontSize: 12,
    color: '#666',
  },
  
  scrollView: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
    backgroundColor: Colors.primary.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  
  headerLeft: {
    flex: 1,
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  
  resultCount: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginTop: 2,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  // View Toggle
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.background,
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  activeToggleButton: {
    backgroundColor: Colors.primary.accent,
  },
  
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  
  activeHeaderButton: {
    backgroundColor: Colors.primary.accent + '20',
    borderColor: Colors.primary.accent,
  },
  
  // Calendar Styles
  calendarContainer: {
    backgroundColor: Colors.primary.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  
  navButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.primary.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.accent,
  },
  
  statLabel: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginTop: 2,
  },
  
  // Calendar Grid
  weekdaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  
  weekdayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: Colors.primary.lightText,
    fontWeight: 'bold',
  },
  
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  
  dayItem: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  
  emptyDay: {
    backgroundColor: 'transparent',
  },
  
  todayItem: {
    backgroundColor: Colors.primary.border,
    borderColor: Colors.primary.accent,
  },
  
  selectedDayItem: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  
  hasEntriesDay: {
    backgroundColor: '#E8F5E8',
    borderColor: '#4CAF50',
  },
  
  dayText: {
    fontSize: 16,
    color: Colors.primary.text,
  },
  
  todayText: {
    fontWeight: 'bold',
    color: Colors.primary.accent,
  },
  
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  
  hasEntriesText: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  
  recordCountBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.primary.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  
  selectedRecordCountBadge: {
    backgroundColor: '#FFFFFF',
  },
  
  recordCountText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  
  selectedRecordCountText: {
    color: Colors.primary.accent,
  },
  
  // Selected Date Section
  selectedDateSection: {
    padding: 16,
    paddingBottom: 100,
  },
  
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  
  entriesContainer: {
    gap: 12,
  },
  
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  emptyStateText: {
    fontSize: 16,
    color: Colors.primary.lightText,
    marginBottom: 16,
    textAlign: 'center',
  },
  
  // Library Styles
  libraryContainer: {
    flex: 1,
  },
  
  // Search and Filter
  searchSection: {
    padding: 16,
    backgroundColor: Colors.primary.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.primary.text,
  },
  
  clearSearch: {
    fontSize: 20,
    color: Colors.primary.lightText,
    paddingHorizontal: 8,
  },
  
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary.background,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  
  activeFilterButton: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  
  filterButtonText: {
    fontSize: 12,
    color: Colors.primary.text,
    fontWeight: '600',
  },
  
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  
  // Library List
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  
  emptySubtext: {
    fontSize: 16,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 24,
  },

  // Library Card 樣式
  libraryCardContainer: {
    marginBottom: 12,
  },
  
  libraryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  
  libraryCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  libraryCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  
  libraryCardTime: {
    fontSize: 14,
    color: '#666666',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  libraryCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  libraryCardTags: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  // 標籤基本樣式
  difficultyTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  
  difficultyTagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  typeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  
  typeTagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  volumeTag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  volumeTagText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // 圖片區域
  libraryCardImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: 12,
  },
  
  libraryCardImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  
  libraryCardNoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  noImageIcon: {
    fontSize: 20,
    marginBottom: 2,
    opacity: 0.6,
  },
  
  noImageText: {
    fontSize: 10,
    color: Colors.primary.lightText,
    textAlign: 'center',
    opacity: 0.7,
  },
  
  // 備註區域
  libraryCardNotes: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  
  libraryCardNotesText: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  
  // 警告區域
  libraryCardAlerts: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 12,
  },
  
  alertText: {
    fontSize: 12,
    color: '#D32F2F',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});