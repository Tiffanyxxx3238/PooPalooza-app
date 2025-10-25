import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { Globe } from 'lucide-react-native';


// Copy the same RecommendationDisplay component from analyze-image.tsx
const RecommendationDisplay = ({ recommendations, bristolType, isEnglish }: { 
  recommendations: string, 
  bristolType: number, 
  isEnglish: boolean 
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
    if (!text) return [{ emoji: '📋', category: 'Recommendation', content: 'No recommendations available' }];
    
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
    
    return [{ emoji: '📋', category: isEnglish ? 'Recommendation' : '建議', content: text }];
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

export default function EntryDetailsDBScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isEnglish, setIsEnglish] = useState(false);
  
  // Parse the entry data
  const entry = params.entry ? JSON.parse(params.entry as string) : null;
  
  if (!entry) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Entry not found</Text>
      </View>
    );
  }

  // 🔍 除錯：看看各個欄位的值
console.log('===== ENTRY DEBUG =====');
console.log('entry.notes:', entry.notes);
console.log('entry.notes type:', typeof entry.notes);
console.log('entry.notes length:', entry.notes?.length);
console.log('entry.originalRecord:', entry.originalRecord);
console.log('entry.originalRecord.ai_diagnosis_summary:', entry.originalRecord?.ai_diagnosis_summary);
console.log('entry.originalRecord.health_recommendations:', entry.originalRecord?.health_recommendations);
console.log('=====================');

  // Extract data from entry
  const bristolType = parseInt(entry.type?.replace('Type ', '') || '4');
  const volume = entry.difficulty === 'small' ? 1 : entry.difficulty === 'large' ? 3 : 2;
  const color = entry.color || 'Brown';
  
  // Generate recommendations based on Bristol type
  const getRecommendations = (type: number) => {
    const recommendations: { [key: number]: string } = {
      1: '🔴 Severe Constipation Alert | 💧 Diet Advice: Increase dietary fiber (whole grains, vegetables, fruits, legumes), drink 2000ml+ water daily | 🏃‍♂️ Lifestyle: Regular exercise to promote bowel movement',
      2: '🟡 Mild Constipation | 💧 Diet Advice: Emphasize fiber and water intake, reduce high-fat foods | 🧘‍♀️ Lifestyle: Maintain regular schedule to reduce stress',
      3: '🟢 Slightly Dry but Near Normal | 💧 Diet Advice: Maintain current fiber and water intake | 🚶‍♀️ Lifestyle: Keep exercising and regular living',
      4: '🎉 Perfect Stool State | 💧 Diet Advice: Continue balanced diet | 💪 Lifestyle: Maintain regular exercise and routine',
      5: '🟡 Slightly Soft - Attention Needed | 💧 Diet Advice: Check if fiber or water intake is excessive | 🍽️ Lifestyle: Maintain regular diet',
      6: '🟠 Mild Diarrhea Warning | 💧 Diet Advice: Reduce high-fat, spicy foods | ⏰ Lifestyle: Regular meals, avoid overeating',
      7: '🔴 Severe Diarrhea Emergency | 💧 Emergency Care: Immediately replenish fluids and electrolytes | 🏥 Medical Advice: Seek medical attention if persists'
    };
    return recommendations[type] || recommendations[4];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
        <Stack.Screen 
                options={{ 
                title: 'Record Details',
                headerLeft: () => (
                    <TouchableOpacity 
                    onPress={() => router.push('/library')}
                    style={styles.headerBackButton}
                    >
                    <Text style={styles.headerBackText}>← Calendar</Text>
                    </TouchableOpacity>
                ),
                }} 
            />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Date and Time Section */}
        <View style={styles.dateSection}>
          <Text style={styles.dateText}>📅 {formatDate(entry.date)}</Text>
        </View>

        {/* AI Health Analysis Results Section */}
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <Text style={styles.resultTitle}>AI Health Analysis Results</Text>
          </View>
          <Text style={styles.resultDescription}>
            Based on your recorded data, here is your poop health status:
          </Text>

          {/* Analysis Details */}
          <View style={styles.analysisDetails}>
            <Text style={styles.analysisTitle}>Analysis Details</Text>
            <Text style={styles.analysisText}>
              🎯 Main Detection Type: Type {bristolType}{'\n'}
              {'\n'}🎨 Color Analysis Results:{'\n'}
              • Main: {color} (Normal){'\n'}
              {'\n'}📏 Volume Analysis: {entry.difficulty === 'small' ? 'Small' : entry.difficulty === 'large' ? 'Large' : 'Medium'}
            </Text>
          </View>

          {/* Health Recommendations */}
          <View style={styles.recommendationsContainer}>
            <View style={styles.recommendationsHeader}>
              <Text style={styles.recommendationsTitle}>
                🏥 Health Recommendations & Improvement Plan
              </Text>
            </View>
            <RecommendationDisplay 
              recommendations={
                (entry.originalRecord?.health_recommendations && entry.originalRecord.health_recommendations.trim() !== '') 
                  ? entry.originalRecord.health_recommendations 
                  : (entry.notes && entry.notes.trim() !== '')
                    ? entry.notes
                    : getRecommendations(bristolType)
              } 
              bristolType={bristolType}
              isEnglish={true}
            />
          </View>
        </View>

        {/* Type, Volume, Color Display Section */}
        <View style={styles.selectorsContainer}>
          {/* Bristol Type */}
          <View style={styles.selectorSection}>
            <Text style={styles.selectorTitle}>💩 Bristol Type</Text>
            <View style={styles.typeDisplay}>
              <Text style={styles.typeNumber}>Type {bristolType}</Text>
              <Text style={styles.typeDescription}>
                {bristolType === 1 && 'Separate hard lumps'}
                {bristolType === 2 && 'Lumpy sausage'}
                {bristolType === 3 && 'Sausage with cracks'}
                {bristolType === 4 && 'Smooth sausage - Perfect!'}
                {bristolType === 5 && 'Soft blobs'}
                {bristolType === 6 && 'Mushy consistency'}
                {bristolType === 7 && 'Liquid consistency'}
              </Text>
            </View>
          </View>

          {/* Volume */}
          <View style={styles.selectorSection}>
            <Text style={styles.selectorTitle}>📏 Volume</Text>
            <View style={styles.volumeDisplay}>
              <Text style={styles.volumeText}>
                {volume === 1 && 'Small'}
                {volume === 2 && 'Medium'}
                {volume === 3 && 'Large'}
              </Text>
            </View>
          </View>

          {/* Color */}
          <View style={styles.selectorSection}>
            <Text style={styles.selectorTitle}>🎨 Color</Text>
            <View style={styles.colorDisplay}>
              <View style={[styles.colorDot, { backgroundColor: getColorHex(color) }]} />
              <Text style={styles.colorText}>{color}</Text>
            </View>
          </View>
        </View>

        {/* Health Indicators if present */}
        {(entry.hasBlood || entry.hasMucus) && (
          <View style={[styles.warningSection]}>
            <Text style={styles.warningTitle}>⚠️ Health Indicators</Text>
            {entry.hasBlood && <Text style={styles.warningText}>• Blood present</Text>}
            {entry.hasMucus && <Text style={styles.warningText}>• Mucus present</Text>}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Helper function to get color hex
const getColorHex = (colorName: string): string => {
  const colors: { [key: string]: string } = {
    'Brown': '#8B4513',
    'Dark Brown': '#654321',
    'Light Brown': '#D2B48C',
    'Yellow': '#DAA520',
    'Green': '#8FBC8F',
    'Red': '#CD5C5C',
    'Black': '#2F2F2F',
  };
  return colors[colorName] || '#8B4513';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  errorText: {
    fontSize: 18,
    color: Colors.primary.error,
    textAlign: 'center',
    marginTop: 50,
  },
  dateSection: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  dateText: {
    fontSize: 16,
    color: Colors.primary.text,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultHeader: {
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  resultDescription: {
    fontSize: 14,
    color: Colors.primary.lightText,
    marginBottom: 16,
  },
  analysisDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 14,
    color: Colors.primary.lightText,
    lineHeight: 20,
  },
  recommendationsContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 8,
    padding: 12,
  },
  recommendationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    flex: 1,
  },
  languageToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary.accent,
  },
  languageToggleText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary.accent,
    marginLeft: 4,
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
  selectorsContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectorSection: {
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  typeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.accent,
  },
  typeDescription: {
    fontSize: 14,
    color: Colors.primary.lightText,
    flex: 1,
  },
  volumeDisplay: {
    padding: 12,
    backgroundColor: Colors.primary.background,
    borderRadius: 8,
  },
  volumeText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
  },
  colorDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.primary.background,
    borderRadius: 8,
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  colorText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
  },
  warningSection: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderColor: '#FCA5A5',
    borderWidth: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#991B1B',
    marginBottom: 4,
  },
  headerBackButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerBackText: {
    fontSize: 16,
    color: Colors.primary.accent,
    fontWeight: '600',
  },
});