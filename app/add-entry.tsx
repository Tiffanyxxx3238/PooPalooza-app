import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { usePoopStore } from '@/store/poopStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import PoopTypeSelector from '@/components/PoopTypeSelector';
import PoopVolumeSelector from '@/components/PoopVolumeSelector';
import PoopFeelingSelector from '@/components/PoopFeelingSelector';
import PoopColorSelector from '@/components/PoopColorSelector';
import { Image } from 'expo-image';
import { getTimeOfDay } from '@/utils/dateUtils';

export default function AddEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ 
    imageUri?: string, 
    type?: string, 
    volume?: string, 
    color?: string,
    analysisDetails?: string,
    recommendations?: string
  }>();
  const { addEntry, stopTimer, currentTimer, resetTimer } = usePoopStore();
  
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
  
  const saveEntry = () => {
    const newEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      name: name,
      type,
      volume,
      feeling,
      color,
      duration,
      notes,
      imageUri: params.imageUri,
      analysisDetails: analysisDetails,
      recommendations: recommendations
    };
    
    addEntry(newEntry);
    resetTimer();
    router.replace('/(tabs)');
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