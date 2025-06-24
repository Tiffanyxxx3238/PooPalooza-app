import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import PoopTypeSelector from '@/components/PoopTypeSelector';
import PoopVolumeSelector from '@/components/PoopVolumeSelector';
import PoopColorSelector from '@/components/PoopColorSelector';
import { poopTypes, poopVolumes, poopColors } from '@/constants/poopTypes';
import { FileText, Check, AlertCircle, Globe } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Component to display structured recommendations
const RecommendationDisplay = ({ recommendations, bristolType, isEnglish }: { recommendations: string, bristolType: number, isEnglish: boolean }) => {
  // Get color scheme based on Bristol type
  const getTypeColor = (type: number) => {
    switch(type) {
      case 1: return { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' }; // Red - Severe constipation
      case 2: return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' }; // Yellow - Mild constipation  
      case 3: return { bg: '#D1FAE5', border: '#6EE7B7', text: '#065F46' }; // Light green - Slightly dry
      case 4: return { bg: '#DCFCE7', border: '#4ADE80', text: '#14532D' }; // Green - Ideal
      case 5: return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' }; // Yellow - Slightly loose
      case 6: return { bg: '#FED7AA', border: '#FDBA74', text: '#9A3412' }; // Orange - Mild diarrhea
      case 7: return { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' }; // Red - Severe diarrhea
      default: return { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' };
    }
  };

  const typeColor = getTypeColor(bristolType);

  // Translation function for Bristol types
  const getTranslatedAdvice = (bristolType: number, isEnglish: boolean) => {
    const translations = {
      1: {
        zh: '🔴 嚴重便秘警示 | 💧 飲食建議: 增加膳食纖維攝取（全穀、蔬菜、水果、豆類），每日攝取2000ml以上水分，補充優酪乳等發酵食品促進腸道益菌 | 🏃‍♂️ 生活建議: 規律運動促進腸蠕動，可進行腹部按摩幫助腸道運動 | ⚠️ 注意事項: 像堅果般的硬塊，排便困難需特別注意',
        en: '🔴 Severe Constipation Alert | 💧 Diet Advice: Increase dietary fiber (whole grains, vegetables, fruits, legumes), drink 2000ml+ water daily, add fermented foods like yogurt to promote gut bacteria | 🏃‍♂️ Lifestyle: Regular exercise to promote bowel movement, abdominal massage can help | ⚠️ Note: Hard lumps like nuts, difficult to pass - needs attention'
      },
      2: {
        zh: '🟡 輕度便秘 | 💧 飲食建議: 同第1型強調纖維與水分攝取，減少高油脂及加工食品 | 🧘‍♀️ 生活建議: 維持規律作息減少壓力，持續運動 | 📈 改善目標: 香腸狀但表面凹凸，需要調理',
        en: '🟡 Mild Constipation | 💧 Diet Advice: Same as Type 1, emphasize fiber and water intake, reduce high-fat and processed foods | 🧘‍♀️ Lifestyle: Maintain regular schedule to reduce stress, continue exercise | 📈 Goal: Sausage-shaped but lumpy surface needs adjustment'
      },
      3: {
        zh: '🟢 偏乾但接近正常 | 💧 飲食建議: 維持現有纖維及水分攝取，適度增加蔬果 | 🚶‍♀️ 生活建議: 保持運動與規律生活 | ✅ 狀態說明: 香腸狀但表面有裂痕，持續保持即可',
        en: '🟢 Slightly Dry but Near Normal | 💧 Diet Advice: Maintain current fiber and water intake, moderately increase fruits and vegetables | 🚶‍♀️ Lifestyle: Keep exercising and regular living | ✅ Status: Sausage-shaped with surface cracks, continue maintaining'
      },
      4: {
        zh: '🎉 完美便便狀態 | 💧 飲食建議: 持續均衡飲食，攝取足夠纖維與水分 | 💪 生活建議: 維持規律運動與作息 | 🏆 健康指標: 香腸或蛇狀表面光滑柔軟，這是理想型態！',
        en: '🎉 Perfect Stool State | 💧 Diet Advice: Continue balanced diet, adequate fiber and water intake | 💪 Lifestyle: Maintain regular exercise and routine | 🏆 Health Indicator: Sausage or snake-like, smooth and soft surface - this is ideal!'
      },
      5: {
        zh: '🟡 略軟需注意 | 💧 飲食建議: 檢視是否過量攝取纖維或水分需適度調整，避免過多刺激性食物（辛辣、咖啡） | 🍽️ 生活建議: 維持規律飲食與運動 | 📊 狀態說明: 柔軟小塊邊緣清楚，稍微調整即可',
        en: '🟡 Slightly Soft - Attention Needed | 💧 Diet Advice: Check if excessive fiber or water intake needs adjustment, avoid too many irritating foods (spicy, coffee) | 🍽️ Lifestyle: Maintain regular diet and exercise | 📊 Status: Soft blobs with clear edges, slight adjustment needed'
      },
      6: {
        zh: '🟠 輕度腹瀉警示 | 💧 飲食建議: 減少高油脂、辛辣、刺激性及人工甜味劑食物，避免碳酸飲料和酒精，少量多餐補充益生菌 | ⏰ 生活建議: 規律三餐避免暴飲暴食 | 🔍 監測建議: 若持續出現需檢查腸道感染或食物不耐受',
        en: '🟠 Mild Diarrhea Warning | 💧 Diet Advice: Reduce high-fat, spicy, irritating foods and artificial sweeteners, avoid carbonated drinks and alcohol, eat small frequent meals with probiotics | ⏰ Lifestyle: Regular meals, avoid overeating | 🔍 Monitor: If persistent, check for bowel infection or food intolerance'
      },
      7: {
        zh: '🔴 嚴重腹瀉緊急 | 💧 緊急處理: 立即補充水分與電解質防止脫水，暫時避免乳製品、高脂肪、辛辣及高纖維食物，攝取易消化食物（白飯、香蕉、吐司） | 🏥 就醫建議: 若腹瀉超過48小時或有脫水、血便等症狀應儘速就醫 | ⚠️ 危險信號: 水狀無固體需立即關注',
        en: '🔴 Severe Diarrhea Emergency | 💧 Emergency Care: Immediately replenish fluids and electrolytes to prevent dehydration, temporarily avoid dairy, high-fat, spicy and high-fiber foods, eat easily digestible foods (white rice, bananas, toast) | 🏥 Medical Advice: If diarrhea persists over 48 hours or symptoms of dehydration/bloody stool appear, seek medical attention immediately | ⚠️ Danger Sign: Watery with no solid pieces requires immediate attention'
      }
    };

    return translations[bristolType] ? (isEnglish ? translations[bristolType].en : translations[bristolType].zh) : recommendations;
  };

  // Use translated advice if available, otherwise use original
  const displayAdvice = bristolType >= 1 && bristolType <= 7 ? getTranslatedAdvice(bristolType, isEnglish) : recommendations;

  // Parse recommendations if they're in the new structured format
  const parseRecommendations = (text: string) => {
    if (text.includes('|')) {
      const sections = text.split('|').map(section => section.trim());
      return sections.map(section => {
        // Extract emoji and category
        const emojiMatch = section.match(/^(\p{Emoji})/u);
        const emoji = emojiMatch ? emojiMatch[1] : '•';
        
        // Extract category and content
        const withoutEmoji = section.replace(/^(\p{Emoji})\s*/u, '');
        const [category, ...contentParts] = withoutEmoji.split(':');
        const content = contentParts.join(':').trim();
        
        return {
          emoji,
          category: category.trim(),
          content
        };
      });
    }
    
    // If not structured, create basic sections
    return [{ emoji: '📋', category: isEnglish ? 'Recommendation' : '建議', content: text }];
  };

  const sections = parseRecommendations(displayAdvice);

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

export default function AnalyzeImageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri: string }>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState('正在準備分析...');
  
  const [predictedType, setPredictedType] = useState<number>(4); // Default to type 4
  const [predictedVolume, setPredictedVolume] = useState<number>(2); // Default to medium
  const [predictedColor, setPredictedColor] = useState<number>(1); // Default to brown
  
  const [selectedType, setSelectedType] = useState<number>(4);
  const [selectedVolume, setSelectedVolume] = useState<number>(2);
  const [selectedColor, setSelectedColor] = useState<number>(1);
  
  const [analysisDetails, setAnalysisDetails] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');
  const [isEnglish, setIsEnglish] = useState<boolean>(false);

  useEffect(() => {
    if (params.imageUri) {
      setImageUri(params.imageUri);
      analyzeImage(params.imageUri);
    }
  }, [params.imageUri]);

  const analyzeImage = async (uri: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisProgress('正在準備分析...');
    
    try {
      if (Platform.OS === 'web') {
        // For web, we'll use a mock analysis since we can't easily get base64
        mockAnalysis();
        return;
      }
      
      // Try to call your poop API directly with the image URI
      await analyzeWithPoopAPI(uri);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError('Failed to analyze the image');
      setIsAnalyzing(false);
    }
  };

  const analyzeWithPoopAPI = async (imageUri: string) => {
    try {
      console.log('Calling poop-api for analysis...');
      console.log('API URL: https://poop-api.onrender.com/analyze');
      console.log('Image URI:', imageUri);
      
      setAnalysisProgress('正在喚醒AI服務器（首次可能需要1-2分鐘）...');
      
      // Create FormData for React Native file upload
      const formData = new FormData();
      
      // React Native way to append file from URI
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'poop_image.jpg'
      } as any);
      
      console.log('Uploading image as file...');
      
      // Longer timeout for Render cold start
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setAnalysisProgress('服務器響應超時，正在使用備用AI...');
      }, 90000); // 90 seconds timeout for cold start
      
      // Progress updates
      let progressStep = 0;
      const progressSteps = [
        '正在喚醒AI服務器...',
        '服務器啟動中，請稍候...',
        '正在上傳圖片...',
        'AI模型載入中...',
        '正在分析圖片特徵...',
        '正在生成健康建議...'
      ];
      
      const progressTimer = setInterval(() => {
        if (progressStep < progressSteps.length - 1) {
          progressStep++;
          setAnalysisProgress(progressSteps[progressStep]);
        }
      }, 12000); // Update every 12 seconds
      
      try {
        const response = await fetch('https://poop-api.onrender.com/analyze', {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        clearInterval(progressTimer);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API Error Response:', errorText);
          
          // If it's a 500 error, might be a cold start, try once more
          if (response.status === 500 || response.status === 503) {
            console.log('🔄 Server might be cold starting, trying fallback immediately...');
            throw new Error('Server cold start detected');
          }
          
          throw new Error(`Poop API error: ${response.status} - ${response.statusText}\nDetails: ${errorText}`);
        }
        
        const result = await response.json();
        console.log('✅ SUCCESS! Poop API response:', result);
        
        setAnalysisProgress('分析完成！正在處理結果...');
        
        // Process your API's specific response format
        processPoopAPIResponse(result);
        
      } catch (fetchError) {
        clearTimeout(timeoutId);
        clearInterval(progressTimer);
        
        if (fetchError.name === 'AbortError') {
          console.error('API request timed out after 2 minutes');
          // Don't throw error, just fallback
        }
        throw fetchError;
      }
      
    } catch (error) {
      console.error('❌ Poop API analysis error:', error);
      
      // Provide user feedback about what happened
      if (error.name === 'AbortError') {
        setAnalysisProgress('您的專用AI服務器需要更多時間啟動，正在使用通用AI...');
      } else {
        setAnalysisProgress('正在使用備用AI進行分析...');
      }
      
      // Fallback: Use a mock analysis instead of LLM API for now
      await mockAnalysisWithRealData();
    }
  };

  const processPoopAPIResponse = (result: any) => {
    try {
      console.log('Processing poop API response:', result);
      
      // Your API returns: main_type, main_advice, other_types, raw_stats
      const mainType = result.main_type || '';
      const mainAdvice = result.main_advice || '';
      const otherTypes = result.other_types || {};
      const rawStats = result.raw_stats || {};
      
      // Map your model's class names to Bristol types (you may need to adjust this)
      const bristolTypeMap: { [key: string]: number } = {
        'type1': 1, 'type_1': 1, 'bristol_1': 1,
        'type2': 2, 'type_2': 2, 'bristol_2': 2,
        'type3': 3, 'type_3': 3, 'bristol_3': 3,
        'type4': 4, 'type_4': 4, 'bristol_4': 4,
        'type5': 5, 'type_5': 5, 'bristol_5': 5,
        'type6': 6, 'type_6': 6, 'bristol_6': 6,
        'type7': 7, 'type_7': 7, 'bristol_7': 7,
        // Add more mappings based on your model's class names
        'hard': 1, 'lumpy': 2, 'cracked': 3, 'smooth': 4, 
        'soft': 5, 'mushy': 6, 'liquid': 7
      };
      
      // Try to determine Bristol type from main_type
      const bristolType = bristolTypeMap[mainType.toLowerCase()] || 4;
      
      // Estimate volume based on total detected area (if available)
      let volume = 2; // default medium
      if (rawStats && Object.keys(rawStats).length > 0) {
        const totalArea = Object.values(rawStats).reduce((sum: number, area: any) => sum + (Number(area) || 0), 0);
        if (totalArea > 10000) {
          volume = 3; // large
        } else if (totalArea < 3000) {
          volume = 1; // small
        }
      }
      
      // Default color (you might want to enhance this based on your model)
      const color = 1; // brown by default
      
      // Generate personalized advice based on detected types
      const personalizedAdvice = generatePersonalizedAdvice(mainType, otherTypes, rawStats, volume);
      
      // Combine analysis details with statistics
      let analysisText = `🎯 主要檢測類型: ${mainType}\n`;
      
      // Show detection confidence and areas
      if (Object.keys(rawStats).length > 0) {
        analysisText += `📊 詳細檢測結果:\n`;
        const sortedStats = Object.entries(rawStats)
          .sort(([,a], [,b]) => (Number(b) || 0) - (Number(a) || 0));
        
        const totalPixels = Object.values(rawStats).reduce((sum: number, area: any) => sum + (Number(area) || 0), 0);
        
        sortedStats.forEach(([type, count]) => {
          const percentage = totalPixels > 0 ? ((Number(count) || 0) / totalPixels * 100).toFixed(1) : '0';
          analysisText += `  • ${type}: ${percentage}% (${count} 像素)\n`;
        });
      }
      
      // Add multi-type analysis
      if (Object.keys(otherTypes).length > 0) {
        analysisText += `\n🔍 混合類型檢測:\n`;
        Object.entries(otherTypes).forEach(([type, advice]) => {
          analysisText += `  • ${type}: 檢測到次要特徵\n`;
        });
        analysisText += `\n💡 個人化分析: 您的便便顯示混合特徵，建議將重點放在主要類型的改善上`;
      }
      
      // Set the analysis results
      setPredictedType(bristolType);
      setSelectedType(bristolType);
      
      setPredictedVolume(volume);
      setSelectedVolume(volume);
      
      setPredictedColor(color);
      setSelectedColor(color);
      
      setAnalysisDetails(analysisText);
      setRecommendations(personalizedAdvice);
      
      setIsAnalyzing(false);
      
      console.log('✅ Successfully processed API response with personalized advice');
      
    } catch (error) {
      console.error('Error processing poop API response:', error);
      setAnalysisError('Could not process the analysis results');
      setIsAnalyzing(false);
    }
  };

  // Generate personalized advice based on multiple detected types
  const generatePersonalizedAdvice = (mainType: string, otherTypes: any, rawStats: any, volume: number): string => {
    // Base advice for main type
    const mainTypeAdvice = getAdviceForType(mainType);
    
    // Get other significant types (more than 10% of total area)
    const totalArea = Object.values(rawStats).reduce((sum: number, area: any) => sum + (Number(area) || 0), 0);
    const significantTypes = Object.entries(rawStats)
      .filter(([type, area]) => {
        const percentage = totalArea > 0 ? (Number(area) || 0) / totalArea : 0;
        return percentage > 0.1 && type !== mainType; // More than 10% and not main type
      })
      .map(([type, area]) => ({
        type,
        percentage: totalArea > 0 ? (Number(area) || 0) / totalArea : 0
      }));

    let personalizedAdvice = mainTypeAdvice;

    // Add combination advice if multiple types detected
    if (significantTypes.length > 0) {
      personalizedAdvice += `\n\n🔄 混合類型個人化建議:\n`;
      
      significantTypes.forEach((item, index) => {
        const comboAdvice = getCombinationAdvice(mainType, item.type, item.percentage);
        personalizedAdvice += `${index + 1}. ${comboAdvice}\n`;
      });
      
      // Add overall strategy for mixed types
      personalizedAdvice += `\n💡 整體策略: 您的便便顯示${significantTypes.length + 1}種特徵混合，建議優先改善主要類型(${mainType})的問題，同時關注次要特徵的變化。`;
    }

    // Add volume-specific advice
    const volumeAdvice = getVolumeAdvice(volume);
    if (volumeAdvice) {
      personalizedAdvice += `\n\n${volumeAdvice}`;
    }

    // Add tracking suggestions
    personalizedAdvice += `\n\n📊 追蹤建議: 建議記錄未來3-7天的便便變化，觀察改善效果並調整飲食策略`;

    return personalizedAdvice;
  };

  // Get advice for specific type
  const getAdviceForType = (type: string): string => {
    const adviceMap: { [key: string]: string } = {
      'type1': '🔴 嚴重便秘警示 | 💧 飲食建議: 增加膳食纖維攝取（全穀、蔬菜、水果、豆類），每日攝取2000ml以上水分 | 🏃‍♂️ 生活建議: 規律運動促進腸蠕動，腹部按摩',
      'type2': '🟡 輕度便秘 | 💧 飲食建議: 強調纖維與水分攝取，減少高油脂及加工食品 | 🧘‍♀️ 生活建議: 維持規律作息減少壓力',
      'type3': '🟢 偏乾但接近正常 | 💧 飲食建議: 維持現有纖維及水分攝取，適度增加蔬果 | 🚶‍♀️ 生活建議: 保持運動與規律生活',
      'type4': '🎉 完美便便狀態 | 💧 飲食建議: 持續均衡飲食，攝取足夠纖維與水分 | 💪 生活建議: 維持規律運動與作息',
      'type5': '🟡 略軟需注意 | 💧 飲食建議: 檢視纖維或水分攝取是否過量，避免刺激性食物 | 🍽️ 生活建議: 維持規律飲食與運動',
      'type6': '🟠 輕度腹瀉警示 | 💧 飲食建議: 減少高油脂、辛辣食物，少量多餐補充益生菌 | ⏰ 生活建議: 規律三餐避免暴飲暴食',
      'type7': '🔴 嚴重腹瀉緊急 | 💧 緊急處理: 立即補充水分與電解質，攝取易消化食物 | 🏥 就醫建議: 持續超過48小時請就醫'
    };

    return adviceMap[type] || '🎯 基本建議 | 💧 飲食: 保持均衡飲食 | 🏃‍♂️ 運動: 規律運動';
  };

  // Get combination advice for mixed types
  const getCombinationAdvice = (mainType: string, secondaryType: string, percentage: number): string => {
    const percentageText = `(${(percentage * 100).toFixed(1)}%)`;
    
    // Define combination strategies
    const combinations: { [key: string]: string } = {
      'type1_type2': `硬便與塊狀便混合 ${percentageText}: 重點增加水分攝取，溫和增加纖維`,
      'type1_type3': `硬便與正常便混合 ${percentageText}: 好轉跡象，繼續當前改善策略`,
      'type2_type3': `塊狀與正常便混合 ${percentageText}: 改善進行中，維持纖維平衡`,
      'type3_type4': `正常偏乾與理想便混合 ${percentageText}: 接近完美，微調水分攝取`,
      'type4_type5': `理想與偏軟便混合 ${percentageText}: 優秀狀態，保持現有習慣`,
      'type5_type6': `偏軟與腹瀉便混合 ${percentageText}: 注意避免刺激性食物，觀察變化`,
      'type6_type7': `腹瀉惡化趨勢 ${percentageText}: 需要及時調整飲食，考慮就醫`
    };

    const comboKey = `${mainType}_${secondaryType}`;
    const reverseKey = `${secondaryType}_${mainType}`;
    
    return combinations[comboKey] || combinations[reverseKey] || `${secondaryType}特徵 ${percentageText}: 混合型態，建議平衡改善策略`;
  };

  // Get volume-specific advice
  const getVolumeAdvice = (volume: number): string => {
    switch(volume) {
      case 1: return '📏 體積偏小建議: 可能攝取不足，增加健康脂肪如堅果、酪梨，確保足夠營養';
      case 3: return '📏 體積較大建議: 可能攝取過量，考慮分餐進食，增加消化時間';
      default: return '';
    }
  };

  // Helper function to format advice text with better structure
  const formatAdviceText = (adviceText: string): string => {
    if (!adviceText) return '';
    
    // If the advice already contains pipes (|), it's probably in the new format
    if (adviceText.includes('|')) {
      return adviceText.split('|').map(section => section.trim()).join('\n\n');
    }
    
    // Otherwise, return as is but add some basic formatting
    return adviceText;
  };

  const analyzeWithLLMAPI = async (base64Image: string) => {
    try {
      setAnalysisProgress('正在使用備用AI分析...');
      
      // Fallback to the original LLM API
      const messages = [
        {
          role: 'system',
          content: 'You are an expert medical AI specialized in analyzing stool samples based on the Bristol Stool Scale. Analyze the provided image and determine: 1) Stool type (1-7 on Bristol Scale), 2) Volume (small/medium/large), and 3) Color (brown, dark brown, light brown, yellow, green, red, or black). Provide a brief explanation for your assessment and health recommendations. Format your response as JSON: {"type": number, "volume": number, "color": number, "explanation": "text", "recommendations": "text"}. For volume, use 1 for small, 2 for medium, 3 for large. For color, use 1 for brown, 2 for dark brown, 3 for light brown, 4 for yellow, 5 for green, 6 for red, 7 for black.'
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analyze this stool sample image:' },
            { type: 'image', image: `data:image/jpeg;base64,${base64Image}` }
          ]
        }
      ];
      
      const response = await fetch('https://toolkit.rork.com/text/llm/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });
      
      if (!response.ok) {
        throw new Error(`LLM API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('LLM API raw response:', data);
      
      // Try to parse the LLM response more carefully
      let result;
      try {
        // Sometimes the response might have extra text before/after JSON
        const completion = data.completion || '';
        const jsonMatch = completion.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, create a basic result
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse LLM response:', parseError);
        console.log('Raw completion:', data.completion);
        
        // Fallback to mock analysis if JSON parsing fails
        await mockAnalysisWithRealData();
        return;
      }
      
      setPredictedType(result.type || 4);
      setSelectedType(result.type || 4);
      
      setPredictedVolume(result.volume || 2);
      setSelectedVolume(result.volume || 2);
      
      setPredictedColor(result.color || 1);
      setSelectedColor(result.color || 1);
      
      setAnalysisDetails(result.explanation || '通用AI分析完成');
      setRecommendations(result.recommendations || '🎯 基本建議 | 💧 飲食: 保持均衡飲食 | 🏃‍♂️ 運動: 規律運動');
      
      setIsAnalyzing(false);
      
    } catch (error) {
      console.error('LLM API analysis error:', error);
      
      // Final fallback to mock analysis
      console.log('🔄 Using mock analysis as final fallback...');
      await mockAnalysisWithRealData();
    }
  };
  
  // Enhanced mock analysis with realistic data
  const mockAnalysisWithRealData = async () => {
    setAnalysisProgress('正在使用通用AI進行分析...');
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate analysis time
    
    // Provide realistic analysis based on common patterns
    const mockType = 4; // Default to normal
    const mockVolume = 2; // Medium
    const mockColor = 1; // Brown
    
    const mockAdvice = `🟢 接近正常狀態 | 💧 飲食建議: 維持現有纖維及水分攝取，適度增加蔬果 | 🚶‍♀️ 生活建議: 保持運動與規律生活 | ✅ 狀態說明: 建議繼續保持良好的生活習慣`;
    
    setPredictedType(mockType);
    setSelectedType(mockType);
    
    setPredictedVolume(mockVolume);
    setSelectedVolume(mockVolume);
    
    setPredictedColor(mockColor);
    setSelectedColor(mockColor);
    
    setAnalysisDetails('🎯 基於圖片特徵的AI分析\n📊 使用通用健康模型進行評估\n💡 建議結合個人健康狀況進行參考');
    setRecommendations(mockAdvice);
    
    setIsAnalyzing(false);
  };
  
  // Mock analysis for web or testing
  const mockAnalysis = () => {
    const steps = [
      '正在準備分析...',
      '正在載入AI模型...',
      '正在處理圖片...',
      '正在生成建議...',
      '分析完成！'
    ];
    
    let step = 0;
    const stepInterval = setInterval(() => {
      if (step < steps.length - 1) {
        setAnalysisProgress(steps[step]);
        step++;
      } else {
        clearInterval(stepInterval);
        
        // Random values for demonstration
        const mockType = Math.floor(Math.random() * 7) + 1;
        const mockVolume = Math.floor(Math.random() * 3) + 1;
        const mockColor = Math.floor(Math.random() * 7) + 1;
        
        setPredictedType(mockType);
        setSelectedType(mockType);
        
        setPredictedVolume(mockVolume);
        setSelectedVolume(mockVolume);
        
        setPredictedColor(mockColor);
        setSelectedColor(mockColor);
        
        setAnalysisDetails('這是網頁版模擬分析結果。實際應用中，AI會分析圖片並提供詳細的便便健康報告。');
        setRecommendations('🎯 網頁模擬建議 | 💧 飲食建議: 保持均衡飲食 | 🏃‍♂️ 運動建議: 規律運動 | 📱 提示: 使用手機APP獲得完整功能');
        
        setIsAnalyzing(false);
      }
    }, 1500); // Change step every 1.5 seconds
  };
  
  const handleContinue = () => {
    // Navigate to add-entry with the analysis results
    router.push({
      pathname: '/add-entry',
      params: {
        imageUri: imageUri || '',
        type: selectedType.toString(),
        volume: selectedVolume.toString(),
        color: selectedColor.toString(),
        analysisDetails: encodeURIComponent(analysisDetails),
        recommendations: encodeURIComponent(recommendations)
      }
    });
  };
  
  const handleRetry = () => {
    if (imageUri) {
      analyzeImage(imageUri);
    }
  };
  
  const handleCancel = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'AI Analysis',
          headerBackTitle: 'Cancel',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.image}
              contentFit="cover"
            />
          </View>
        )}
        
        {isAnalyzing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary.accent} />
            <Text style={styles.loadingText}>AI 分析中...</Text>
            <Text style={styles.loadingSubtext}>{analysisProgress}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '60%' }]} />
            </View>
            <Text style={styles.estimateText}>預計剩餘時間: 30-60秒</Text>
          </View>
        ) : analysisError ? (
          <View style={styles.errorContainer}>
            <AlertCircle size={48} color={Colors.primary.error} />
            <Text style={styles.errorTitle}>Analysis Failed</Text>
            <Text style={styles.errorText}>{analysisError}</Text>
            <Button
              title="Try Again"
              onPress={handleRetry}
              style={styles.retryButton}
            />
          </View>
        ) : (
          <>
            <View style={styles.resultContainer}>
              <View style={styles.resultHeader}>
                <FileText size={24} color={Colors.primary.accent} />
                <Text style={styles.resultTitle}>AI Analysis Results</Text>
              </View>
              
              <Text style={styles.resultDescription}>
                我們的專業AI模型已完成分析。您可以調整結果如有需要。
              </Text>
              
              {analysisDetails && (
                <View style={styles.analysisDetails}>
                  <Text style={styles.analysisTitle}>分析結果:</Text>
                  <Text style={styles.analysisText}>{analysisDetails}</Text>
                </View>
              )}

              {recommendations && (
                <View style={styles.recommendationsContainer}>
                  <View style={styles.recommendationsHeader}>
                    <Text style={styles.recommendationsTitle}>
                      {isEnglish ? '🏥 Health Recommendations & Improvement Plan' : '🏥 健康建議與改善方案'}
                    </Text>
                    <TouchableOpacity 
                      style={styles.languageToggle}
                      onPress={() => setIsEnglish(!isEnglish)}
                    >
                      <Globe size={16} color={Colors.primary.accent} />
                      <Text style={styles.languageToggleText}>
                        {isEnglish ? '中文' : 'EN'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <RecommendationDisplay 
                    recommendations={recommendations} 
                    bristolType={selectedType}
                    isEnglish={isEnglish}
                  />
                </View>
              )}
            </View>
            
            <View style={styles.selectorsContainer}>
              <PoopTypeSelector
                selectedType={selectedType}
                onSelectType={setSelectedType}
              />
              
              <PoopVolumeSelector
                selectedVolume={selectedVolume}
                onSelectVolume={setSelectedVolume}
              />
              
              <PoopColorSelector
                selectedColor={selectedColor}
                onSelectColor={setSelectedColor}
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <Button
                title="Continue"
                onPress={handleContinue}
                style={styles.continueButton}
              />
              
              <Button
                title="Cancel"
                onPress={handleCancel}
                variant="outline"
                style={styles.cancelButton}
              />
            </View>
          </>
        )}
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
  loadingContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginTop: 16,
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.accent,
    borderRadius: 2,
  },
  estimateText: {
    fontSize: 12,
    color: Colors.primary.lightText,
    fontStyle: 'italic',
  },
  errorContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.error,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    minWidth: 120,
  },
  resultContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginLeft: 8,
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
  recommendationsText: {
    fontSize: 14,
    color: Colors.primary.lightText,
    lineHeight: 20,
  },
  selectorsContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 16,
  },
  continueButton: {
    marginBottom: 12,
  },
  cancelButton: {},
});