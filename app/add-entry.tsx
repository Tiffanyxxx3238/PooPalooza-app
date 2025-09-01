import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Platform, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { usePoopStore } from '@/store/poopStore';
import { useUserStore } from '@/store/userStore'; 
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import PoopTypeSelector from '@/components/PoopTypeSelector';
import PoopVolumeSelector from '@/components/PoopVolumeSelector';
import PoopFeelingSelector from '@/components/PoopFeelingSelector';
import PoopColorSelector from '@/components/PoopColorSelector';
import { Image } from 'expo-image';
import { getTimeOfDay } from '@/utils/dateUtils';
import API_BASE_URL from '@/config';

export default function AddEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    imageUri?: string, 
    type?: string, 
    volume?: string, 
    color?: string,
    analysisDetails?: string,
    recommendations?: string,
    date?: string
  }>();
  const { user_id } = useUserStore.getState();
  console.log('🧠 DEBUG user:', user_id);
  const { addEntry, stopTimer, currentTimer, resetTimer } = usePoopStore();
  
  // 日期相關狀態
  const [entryDate, setEntryDate] = useState(params.date ? new Date(params.date) : new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [name, setName] = useState(`${getTimeOfDay()} Poop`);
  const [type, setType] = useState(params.type ? parseInt(params.type) : 4);
  const [volume, setVolume] = useState(params.volume ? parseInt(params.volume) : 2);
  const [feeling, setFeeling] = useState(1);
  const [color, setColor] = useState(params.color ? parseInt(params.color) : 1);
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(0);
  const [analysisDetails, setAnalysisDetails] = useState('');
  const [recommendations, setRecommendations] = useState('');
  
  useEffect(() => {
    if (currentTimer) {
      setDuration(currentTimer);
    }
    
    if (params.analysisDetails) {
      const decodedAnalysis = decodeURIComponent(params.analysisDetails);
      setAnalysisDetails(decodedAnalysis);
      
      if (decodedAnalysis.trim() !== '' && !notes.includes('AI Analysis:')) {
        setNotes(prev => `AI Analysis: ${decodedAnalysis}\n\n${prev}`);
      }
    }
    
    if (params.recommendations) {
      const decodedRecommendations = decodeURIComponent(params.recommendations);
      setRecommendations(decodedRecommendations);
      
      if (decodedRecommendations.trim() !== '' && !notes.includes('Health Recommendations:')) {
        setNotes(prev => `${prev}\nHealth Recommendations: ${decodedRecommendations}`);
      }
    }
  }, [currentTimer, params.analysisDetails, params.recommendations]);
  
  // 生成日期選項
  const getDateOptions = () => {
    const today = new Date();
    const options = [];
    
    // 今天不同時間
    options.push({ 
      label: 'Now', 
      date: new Date() 
    });
    
    options.push({ 
      label: '1 hour ago', 
      date: new Date(today.getTime() - 60 * 60 * 1000) 
    });
    
    options.push({ 
      label: '3 hours ago', 
      date: new Date(today.getTime() - 3 * 60 * 60 * 1000) 
    });
    
    options.push({ 
      label: '6 hours ago', 
      date: new Date(today.getTime() - 6 * 60 * 60 * 1000) 
    });
    
    // 昨天
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    options.push({ 
      label: 'Yesterday morning (9 AM)', 
      date: new Date(yesterday.setHours(9, 0, 0, 0)) 
    });
    
    const yesterdayEvening = new Date(today);
    yesterdayEvening.setDate(yesterdayEvening.getDate() - 1);
    options.push({ 
      label: 'Yesterday evening (6 PM)', 
      date: new Date(yesterdayEvening.setHours(18, 0, 0, 0)) 
    });
    
    // 前天
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    options.push({ 
      label: 'Two days ago', 
      date: new Date(twoDaysAgo.setHours(12, 0, 0, 0)) 
    });
    
    // 三天前
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    options.push({ 
      label: 'Three days ago', 
      date: new Date(threeDaysAgo.setHours(12, 0, 0, 0)) 
    });
    
    return options;
  };
  
  // 格式化日期時間顯示
  const formatDateTime = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    let dateStr = '';
    if (isToday) {
      dateStr = 'Today';
    } else if (isYesterday) {
      dateStr = 'Yesterday';
    } else {
      dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        weekday: 'short'
      });
    }
    
    const timeStr = date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    
    return `${dateStr} at ${timeStr}`;
  };
  
  const handleSave = () => {
    if (params.imageUri && !params.analysisDetails) {
      router.push({
        pathname: '/analyze-image',
        params: {
          imageUri: params.imageUri,
          returnToAddEntry: 'true',
          currentName: name,
          currentType: type.toString(),
          currentVolume: volume.toString(),
          currentFeeling: feeling.toString(),
          currentColor: color.toString(),
          currentNotes: notes,
          currentDuration: duration.toString(),
          currentDate: entryDate.toISOString()
        }
      });
      return;
    }
    
    saveEntry();
  };
  
  const saveEntry = async () => {
    if (!user_id) {
      alert('You must be logged in to save.');
      return;
    }

    try {
      const payload = {
        user_id: user_id,
        record_time: entryDate.toISOString(),
        color: color.toString(),
        consistency: feeling.toString(),
        volume: volume.toString(),
        odor: '',
        has_blood: false,
        has_mucus: false,
        image_url: params.imageUri || '',
        ai_poop_type: type.toString(),
        ai_poop_color: color.toString(),
        ai_poop_volume: volume.toString(),
        ai_diagnosis_summary: analysisDetails,
        health_recommendations: recommendations,
        health_indicators: ''
      };

      console.log('🚀 Submitting payload:', payload);

      const response = await fetch(`${API_BASE_URL}/poop-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Non-JSON response:', errorText);
        alert('Server error. Please try again later.');
        return;
      }

      const result = await response.json();
      console.log('✅ Record saved:', result);

      if (response.ok) {
        console.log('✅ Record saved:', result);

        addEntry({
          ...payload,
          ...result,
          record_time: result.record_time || payload.record_time,
        });
        
        resetTimer();
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('❌ Failed to save poop record:', error);
      alert('Failed to save poop record. Please try again later.');
    }
  };
  
  const handleCancel = () => {
    router.back();
  };

  const isAnalyzed = params.analysisDetails || analysisDetails;
  const hasImage = params.imageUri;

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Add New Entry',
          headerBackTitle: 'Cancel',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* 日期時間選擇區域 */}
        <View style={styles.dateSection}>
          <Text style={styles.sectionTitle}>When did this happen?</Text>
          
          <TouchableOpacity 
            style={styles.currentDateButton}
            onPress={() => setShowDatePicker(!showDatePicker)}
          >
            <Text style={styles.dateIcon}>📅</Text>
            <View style={styles.dateInfo}>
              <Text style={styles.currentDateText}>
                {formatDateTime(entryDate)}
              </Text>
              <Text style={styles.changeText}>
                {showDatePicker ? 'Tap to close options' : 'Tap to change date/time'}
              </Text>
            </View>
          </TouchableOpacity>
          
          {showDatePicker && (
            <View style={styles.dateOptionsContainer}>
              <Text style={styles.optionsTitle}>Choose when this happened:</Text>
              {getDateOptions().map((option, index) => (
                <TouchableOpacity 
                  key={index}
                  style={[
                    styles.dateOption,
                    entryDate.getTime() === option.date.getTime() && styles.selectedDateOption
                  ]}
                  onPress={() => {
                    setEntryDate(option.date);
                    setShowDatePicker(false);
                    // 更新名稱以反映時間
                    const timeOfDay = getTimeOfDay(option.date);
                    setName(`${timeOfDay} Poop`);
                  }}
                >
                  <Text style={[
                    styles.dateOptionText,
                    entryDate.getTime() === option.date.getTime() && styles.selectedDateOptionText
                  ]}>
                    {option.label}
                  </Text>
                  <Text style={styles.dateOptionDetail}>
                    {option.date.toLocaleDateString()} {option.date.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Text>
                </TouchableOpacity>
              ))}
              
              {/* 自定義日期選項 */}
              <TouchableOpacity 
                style={styles.customDateOption}
                onPress={() => {
                  Alert.prompt(
                    'Custom Date & Time',
                    'Enter date and time (YYYY-MM-DD HH:MM)',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { 
                        text: 'Set', 
                        onPress: (input) => {
                          if (!input) return;
                          
                          try {
                            const customDate = new Date(input);
                            if (isNaN(customDate.getTime())) {
                              Alert.alert('Invalid Date', 'Please use format: YYYY-MM-DD HH:MM');
                              return;
                            }
                            
                            if (customDate > new Date()) {
                              Alert.alert('Future Date', 'Cannot select a future date');
                              return;
                            }
                            
                            setEntryDate(customDate);
                            setShowDatePicker(false);
                            const timeOfDay = getTimeOfDay(customDate);
                            setName(`${timeOfDay} Poop`);
                          } catch (error) {
                            Alert.alert('Invalid Date', 'Please use format: YYYY-MM-DD HH:MM');
                          }
                        }
                      }
                    ],
                    'plain-text',
                    entryDate.toISOString().slice(0, 16).replace('T', ' ')
                  );
                }}
              >
                <Text style={styles.customDateText}>🛠️ Custom date & time</Text>
                <Text style={styles.customDateSubtext}>Enter specific date and time</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {params.imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: params.imageUri }}
              style={styles.image}
              contentFit="cover"
            />
            <View style={styles.analysisStatus}>
              <Text style={[
                styles.analysisStatusText, 
                isAnalyzed ? styles.analyzedText : styles.notAnalyzedText
              ]}>
                {isAnalyzed ? '✅ AI Analyzed' : '⏳ Ready for AI Analysis'}
              </Text>
            </View>
          </View>
        )}
        
        {analysisDetails && (
          <View style={styles.analysisResultsContainer}>
            <Text style={styles.analysisResultsTitle}>AI Analysis Results</Text>
            <View style={styles.analysisDetailsCard}>
              <Text style={styles.analysisDetailsText}>{analysisDetails}</Text>
            </View>
            {recommendations && (
              <View style={styles.recommendationsCard}>
                <Text style={styles.recommendationsTitle}>Health Recommendations:</Text>
                <Text style={styles.recommendationsText}>{recommendations}</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Give your poop a name"
            />
          </View>
          
          <PoopTypeSelector
            selectedType={type}
            onSelectType={setType}
          />
          
          <PoopVolumeSelector
            selectedVolume={volume}
            onSelectVolume={setVolume}
          />
          
          <PoopFeelingSelector
            selectedFeeling={feeling}
            onSelectFeeling={setFeeling}
          />
          
          <PoopColorSelector
            selectedColor={color}
            onSelectColor={setColor}
          />
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Duration</Text>
            <View style={styles.durationContainer}>
              <Text style={styles.durationText}>
                {Math.floor(duration / 60)}m {duration % 60}s
              </Text>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any additional notes"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button
            title={hasImage && !isAnalyzed ? "Analyze & Save Entry" : "Save Entry"}
            onPress={handleSave}
            style={styles.saveButton}
          />
          
          <Button
            title="Cancel"
            onPress={handleCancel}
            variant="outline"
            style={styles.cancelButton}
          />
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  dateSection: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  currentDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  dateIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  dateInfo: {
    flex: 1,
  },
  currentDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 2,
  },
  changeText: {
    fontSize: 12,
    color: Colors.primary.lightText,
  },
  dateOptionsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  optionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  dateOption: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedDateOption: {
    borderColor: Colors.primary.accent,
    backgroundColor: '#FFF7ED',
  },
  dateOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary.text,
    marginBottom: 2,
  },
  selectedDateOptionText: {
    color: Colors.primary.accent,
  },
  dateOptionDetail: {
    fontSize: 12,
    color: Colors.primary.lightText,
  },
  customDateOption: {
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  customDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary.accent,
    marginBottom: 2,
  },
  customDateSubtext: {
    fontSize: 11,
    color: Colors.primary.lightText,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  image: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  analysisStatus: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: Colors.primary.card,
  },
  analysisStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  analyzedText: {
    color: '#10B981',
  },
  notAnalyzedText: {
    color: '#F59E0B',
  },
  analysisResultsContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  analysisResultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  analysisDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  analysisDetailsText: {
    fontSize: 14,
    color: Colors.primary.lightText,
    lineHeight: 20,
  },
  recommendationsCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 12,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 4,
  },
  recommendationsText: {
    fontSize: 14,
    color: Colors.primary.lightText,
    lineHeight: 20,
  },
  formContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  durationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  durationText: {
    fontSize: 16,
    color: Colors.primary.text,
  },
  buttonContainer: {
    marginTop: 16,
  },
  saveButton: {
    marginBottom: 12,
  },
  cancelButton: {},
});