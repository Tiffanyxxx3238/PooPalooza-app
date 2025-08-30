import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Platform } from 'react-native';
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
import { ActivityIndicator } from 'react-native';
const RecommendationDisplay = ({ recommendations, bristolType }: { 
  recommendations: string, 
  bristolType: number 
}) => {
  const getTypeColor = (type: number) => {
    switch(type) {
      case 1: return { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' };
      case 2: return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' };
      case 3: return { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' };
      case 4: return { bg: '#DCFCE7', border: '#4ADE80', text: '#14532D' };
      case 5: return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' };
      case 6: return { bg: '#FED7AA', border: '#FDBA74', text: '#9A3412' };
      case 7: return { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' };
      default: return { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' };
    }
  };

  const typeColor = getTypeColor(bristolType);

  const parseRecommendations = (text: string) => {
    if (text.includes('|')) {
      const sections = text.split('|').map(section => section.trim());
      return sections.map(section => {
        const emojiMatch = section.match(/^(\p{Emoji})/u);
        const emoji = emojiMatch ? emojiMatch[1] : '•';
        const withoutEmoji = section.replace(/^(\p{Emoji})\s*/u, '');
        const [category, ...contentParts] = withoutEmoji.split(':');
        const content = contentParts.join(':').trim();
        
        return { emoji, category: category.trim(), content };
      });
    }
    return [{ emoji: '📋', category: 'Recommendation', content: text }];
  };

  const sections = parseRecommendations(recommendations);

  return (
    <View style={[styles.recommendationSections, { backgroundColor: typeColor.bg, borderColor: typeColor.border }]}>
      {sections.map((section, index) => (
        <View key={index} style={styles.recommendationSection}>
          <View style={styles.recommendationHeader}>
            <Text style={styles.recommendationEmoji}>{section.emoji}</Text>
            <View style={styles.recommendationTextContainer}>
              <Text style={[styles.recommendationCategory, { color: typeColor.text }]}>
                {section.category}
              </Text>
              <Text style={styles.recommendationContent}>{section.content}</Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};
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
  console.log('🧠 DEBUG user:', user_id); // 加上這行確認 user 是不是 undefined
  const { addEntry, stopTimer, currentTimer, resetTimer } = usePoopStore();
  const entryDate = params.date ? new Date(params.date) : new Date();
  const [name, setName] = useState(`${getTimeOfDay()} Poop`);
  const [type, setType] = useState(params.type ? parseInt(params.type) : 4);
  const [volume, setVolume] = useState(params.volume ? parseInt(params.volume) : 2);
  const [feeling, setFeeling] = useState(1); // Default to easy
  const [color, setColor] = useState(params.color ? parseInt(params.color) : 1);
  const [notes, setNotes] = useState('');
  const [duration, setDuration] = useState(0);
  const [analysisDetails, setAnalysisDetails] = useState('');
  const [recommendations, setRecommendations] = useState('');
  useEffect(() => {
    if (currentTimer) {
      setDuration(currentTimer);
    }
    
    // Handle analysis details from analyze-image screen
    if (params.analysisDetails) {
      const decodedAnalysis = decodeURIComponent(params.analysisDetails);
      setAnalysisDetails(decodedAnalysis);
      
      // Add analysis to notes if not already there
      if (decodedAnalysis.trim() !== '' && !notes.includes('AI Analysis:')) {
        setNotes(prev => `AI Analysis: ${decodedAnalysis}\n\n${prev}`);
      }
    }
    
    // Handle recommendations from analyze-image screen
    if (params.recommendations) {
      const decodedRecommendations = decodeURIComponent(params.recommendations);
      setRecommendations(decodedRecommendations);
      
      // Add recommendations to notes if not already there
      if (decodedRecommendations.trim() !== '' && !notes.includes('Health Recommendations:')) {
        setNotes(prev => `${prev}\nHealth Recommendations: ${decodedRecommendations}`);
      }
    }
  }, [currentTimer, params.analysisDetails, params.recommendations]);
  const fetchAIHealthAdvice = async (
  bristolType: number,
  colorValue: number,
  volumeValue: number
): Promise<string> => {
  try {
    
    const response = await fetch('https://poop-analysis-recommendation-system.onrender.com/api/health-advice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bristolType,
        colorAnalysis: { 
          summary: { 
            Manual: { 
              color: colorValue === 1 ? 'Normal_Brown' : 
                     colorValue === 2 ? 'Dark_Tone' :
                     colorValue === 3 ? 'Light_Tone' :
                     colorValue === 4 ? 'Yellowish' :
                     colorValue === 5 ? 'Greenish' :
                     colorValue === 6 ? 'Reddish' : 'Very_Dark',
              health_status: 'Manual Entry' 
            } 
          } 
        },
        volumeAnalysis: { 
          overall_volume_class: volumeValue === 1 ? 'Small' : 
                               volumeValue === 2 ? 'Medium' : 'Large' 
        },
        userProfile: null,
        previousRecords: []
      })
    });

    const data = await response.json();
    return formatAIAdvice(data.advice || data);
    
  } catch (error) {
    console.error('Failed to get AI advice:', error);
    return getDefaultAdvice(bristolType);
  }
};

const formatAIAdvice = (aiAdvice: any): string => {
  if (!aiAdvice) return getDefaultAdvice(type);
  
  // Check if aiAdvice is a string (already formatted)
  if (typeof aiAdvice === 'string') {
    return aiAdvice;
  }
  
  let text = '';
  
  // Health Status Section
  if (aiAdvice.healthStatus) {
    const { level, summary, score, mainConcern, positiveAspects } = aiAdvice.healthStatus;
    const levelEmojis: Record<string, string> = {
      'excellent': '🎉', 'good': '🟢', 'attention': '🟡', 
      'warning': '🟠', 'critical': '🔴'
    };
    
    text += `${levelEmojis[level] || '📊'} Health Score: ${score}/100 (${level?.toUpperCase() || 'UNKNOWN'})\n\n`;
    
    if (summary) {
      text += `📋 Current Status:\n${summary}\n\n`;
    }
    
    if (positiveAspects) {
      text += `✅ What's Good:\n${positiveAspects}\n\n`;
    }
    
    if (mainConcern) {
      text += `⚠️ Focus Area:\n${mainConcern}\n\n`;
    }
  }
  
  // Immediate Actions
  if (aiAdvice.dietaryAdvice?.immediateActions?.length > 0) {
    text += '🚨 DO NOW (Today):\n';
    aiAdvice.dietaryAdvice.immediateActions.forEach((action: string, index: number) => {
      text += `${index + 1}. ${action}\n`;
    });
    text += '\n';
  }
  
  // Diet recommendations
  if (aiAdvice.dietaryAdvice?.recommendations?.length > 0) {
    text += '🍽️ Diet Changes:\n';
    aiAdvice.dietaryAdvice.recommendations.slice(0, 3).forEach((rec: string) => {
      text += `• ${rec}\n`;
    });
    text += '\n';
  }
  
  // Water intake
  if (aiAdvice.dietaryAdvice?.waterIntake) {
    text += `💧 Water: ${aiAdvice.dietaryAdvice.waterIntake}\n\n`;
  }
  
  // Exercise
  if (aiAdvice.lifestyleAdvice?.exercise) {
    const ex = aiAdvice.lifestyleAdvice.exercise;
    text += '🏃 Exercise:\n';
    text += `• Type: ${ex.type || 'Moderate activity'}\n`;
    text += `• Duration: ${ex.duration || '30 minutes'}\n`;
    text += `• Frequency: ${ex.frequency || 'Daily'}\n\n`;
  }
  
  // Quick Tips
  if (aiAdvice.personalizedTips?.length > 0) {
    text += '💡 QUICK TIPS:\n';
    aiAdvice.personalizedTips.slice(0, 3).forEach((tip: string, index: number) => {
      const shortTip = tip.length > 80 ? tip.substring(0, 77) + '...' : tip;
      text += `${index + 1}. ${shortTip}\n`;
    });
    text += '\n';
  }
  
  // If we still have no text, try to parse the raw advice object
  if (!text && aiAdvice.advice) {
    return formatAIAdvice(aiAdvice.advice);
  }
  
  return text.trim() || getDefaultAdvice(type);
};

const getDefaultAdvice = (type: number): string => {
  const adviceMap: { [key: number]: string } = {
    1: '🔴 Severe Constipation Alert | 💧 Diet Advice: Increase fiber and water intake | 🏃‍♂️ Lifestyle: Regular exercise',
    2: '🟡 Mild Constipation | 💧 Diet Advice: Emphasize fiber and water | 🧘‍♀️ Lifestyle: Reduce stress',
    3: '🟢 Slightly Dry but Near Normal | 💧 Diet Advice: Maintain current intake | 🚶‍♀️ Lifestyle: Keep exercising',
    4: '🎉 Perfect Stool State | 💧 Diet Advice: Continue balanced diet | 💪 Lifestyle: Maintain routine',
    5: '🟡 Slightly Soft | 💧 Diet Advice: Check fiber intake | 🍽️ Lifestyle: Regular meals',
    6: '🟠 Mild Diarrhea Warning | 💧 Diet Advice: Reduce high-fat foods | ⏰ Lifestyle: Regular meals',
    7: '🔴 Severe Diarrhea Emergency | 💧 Emergency Care: Replenish fluids | 🏥 Medical: Seek help if persists'
  };
  return adviceMap[type] || adviceMap[4];
};
  const handleSave = () => {
    // Check if there's an image that hasn't been analyzed yet
    if (params.imageUri && !params.analysisDetails) {
      // Navigate to analyze-image screen first
      router.push({
        pathname: '/analyze-image',
        params: {
          imageUri: params.imageUri,
          // Pass current form data so we can return to it after analysis
          returnToAddEntry: 'true',
          currentName: name,
          currentType: type.toString(),
          currentVolume: volume.toString(),
          currentFeeling: feeling.toString(),
          currentColor: color.toString(),
          currentNotes: notes,
          currentDuration: duration.toString()
        }
      });
      return;
    }
    
    // If no image or already analyzed, save directly
    saveEntry();
  };
  
const getAPIUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5001';
  } else if (Platform.OS === 'ios') {
    // Try your machine's actual IP instead of localhost
    return 'http://127.0.0.1:5001';  // or use your computer's IP
  } else {
    return 'http://192.168.0.196:5001';
  }
};

const saveEntry = async () => {
  if (!user_id) {
    alert('You must be logged in to save.');
    return;
  }

  try {
    let finalRecommendations = recommendations;
    let finalAnalysisDetails = analysisDetails;
    
    if (!params.imageUri && !recommendations) {
      console.log('📤 Getting AI recommendations for manual entry...');
      const aiAdvice = await fetchAIHealthAdvice(type, color, volume);
      finalRecommendations = aiAdvice;
      finalAnalysisDetails = `Manual Entry - Bristol Type ${type}, Volume: ${volume === 1 ? 'Small' : volume === 2 ? 'Medium' : 'Large'}, Color: ${color === 1 ? 'Brown' : color === 2 ? 'Dark' : color === 3 ? 'Light' : color === 4 ? 'Yellow' : color === 5 ? 'Green' : color === 6 ? 'Red' : 'Black'}`;
      console.log('✅ AI recommendations received:', finalRecommendations.substring(0, 100) + '...');
    }

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
      ai_diagnosis_summary: finalAnalysisDetails,
      health_recommendations: finalRecommendations,
      health_indicators: ''
    };

    console.log('🚀 Submitting to:', `${getAPIUrl()}/poop-records`);

    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const response = await fetch(`${getAPIUrl()}/poop-records`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      console.log('📨 Response status:', response.status);

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Non-JSON response:', errorText);
        
        // Save locally anyway if backend fails
        console.log('⚠️ Backend issue, saving locally');
        addEntry({
          ...payload,
         date: entryDate.toISOString()
        });
        resetTimer();
        router.replace('/(tabs)');
        return;
      }

      const result = await response.json();
      console.log('✅ Backend response:', result);

      if (response.ok) {
        addEntry({
          ...payload,
          ...result,
          date: entryDate.toISOString(),
          record_time: result.record_time || payload.record_time,
        });
        resetTimer();
        router.replace('/(tabs)');
      }

      // In the error cases where you save locally:
      } catch (fetchError: any) {  // Type fix here
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.log('⏱️ Request timeout - saving locally');
          alert('Server timeout - saving locally');
        } else {
          console.log('🔌 Network error - saving locally');
          console.error('Network error:', fetchError);
        }
        
        // Save locally if network fails
        addEntry({
          ...payload,
          date: entryDate.toISOString()
        });
        resetTimer();
        router.replace('/(tabs)');
      }

  } catch (error) {
    console.error('❌ Failed to save:', error);
    alert('Failed to save. Please try again.');
  }
};
  
  const handleCancel = () => {
    router.back();
  };

  // Check if this entry has been analyzed
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
        <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '600' }}>
          Adding record for: {entryDate.toDateString()}
        </Text>
      </View>
        {params.imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: params.imageUri }}
              style={styles.image}
              contentFit="cover"
            />
            {/* Show analysis status */}
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
        
        {/* Show analysis results if available */}
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
    color: '#10B981', // Green color
  },
  notAnalyzedText: {
    color: '#F59E0B', // Amber color
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
  aiRecommendationContainer: {
    marginTop: 16,
    marginBottom: 16,
  },
  aiButton: {
    marginBottom: 12,
  },
  loadingContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.primary.lightText,
    marginTop: 8,
  },
  recommendationsContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
  },
  recommendationsHeader: {
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  recommendationSections: {
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
  },
  recommendationSection: {
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recommendationEmoji: {
    fontSize: 18,
    marginRight: 10,
    marginTop: 2,
  },
  recommendationTextContainer: {
    flex: 1,
  },
  recommendationCategory: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  recommendationContent: {
    flex: 1,
    fontSize: 13,
    color: Colors.primary.text,
    lineHeight: 18,
  },
});