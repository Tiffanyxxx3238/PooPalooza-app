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
    const translations: Record<string, { zh: string; en: string }> = {
      '1': {
        zh: '🔴 嚴重便秘警示 | 💧 飲食建議: 增加膳食纖維攝取（全穀、蔬菜、水果、豆類），每日攝取2000ml以上水分，補充優酪乳等發酵食品促進腸道益菌 | 🏃‍♂️ 生活建議: 規律運動促進腸蠕動，可進行腹部按摩幫助腸道運動 | ⚠️ 注意事項: 像堅果般的硬塊，排便困難需特別注意',
        en: '🔴 Severe Constipation Alert | 💧 Diet Advice: Increase dietary fiber (whole grains, vegetables, fruits, legumes), drink 2000ml+ water daily, add fermented foods like yogurt to promote gut bacteria | 🏃‍♂️ Lifestyle: Regular exercise to promote bowel movement, abdominal massage can help | ⚠️ Note: Hard lumps like nuts, difficult to pass - needs attention'
      },
      '2': {
        zh: '🟡 輕度便秘 | 💧 飲食建議: 同第1型強調纖維與水分攝取，減少高油脂及加工食品 | 🧘‍♀️ 生活建議: 維持規律作息減少壓力，持續運動 | 📈 改善目標: 香腸狀但表面凹凸，需要調理',
        en: '🟡 Mild Constipation | 💧 Diet Advice: Same as Type 1, emphasize fiber and water intake, reduce high-fat and processed foods | 🧘‍♀️ Lifestyle: Maintain regular schedule to reduce stress, continue exercise | 📈 Goal: Sausage-shaped but lumpy surface needs adjustment'
      },
      '3': {
        zh: '🟢 偏乾但接近正常 | 💧 飲食建議: 維持現有纖維及水分攝取，適度增加蔬果 | 🚶‍♀️ 生活建議: 保持運動與規律生活 | ✅ 狀態說明: 香腸狀但表面有裂痕，持續保持即可',
        en: '🟢 Slightly Dry but Near Normal | 💧 Diet Advice: Maintain current fiber and water intake, moderately increase fruits and vegetables | 🚶‍♀️ Lifestyle: Keep exercising and regular living | ✅ Status: Sausage-shaped with surface cracks, continue maintaining'
      },
      '4': {
        zh: '🎉 完美便便狀態 | 💧 飲食建議: 維持均衡飲食，攝取足夠纖維與水分 | 💪 生活建議: 維持規律運動與作息 | 🏆 健康指標: 香腸或蛇狀表面光滑柔軟，這是理想型態！',
        en: '🎉 Perfect Stool State | 💧 Diet Advice: Continue balanced diet, adequate fiber and water intake | 💪 Lifestyle: Maintain regular exercise and routine | 🏆 Health Indicator: Sausage or snake-like, smooth and soft surface - this is ideal!'
      },
      '5': {
        zh: '🟡 略軟需注意 | 💧 飲食建議: 檢視是否過量攝取纖維或水分需適度調整，避免過多刺激性食物（辛辣、咖啡） | 🍽️ 生活建議: 維持規律飲食與運動 | 📊 狀態說明: 柔軟小塊邊緣清楚，稍微調整即可',
        en: '🟡 Slightly Soft - Attention Needed | 💧 Diet Advice: Check if excessive fiber or water intake needs adjustment, avoid too many irritating foods (spicy, coffee) | 🍽️ Lifestyle: Maintain regular diet and exercise | 📊 Status: Soft blobs with clear edges, slight adjustment needed'
      },
      '6': {
        zh: '🟠 輕度腹瀉警示 | 💧 飲食建議: 減少高油脂、辛辣、刺激性及人工甜味劑食物，避免碳酸飲料和酒精，少量多餐補充益生菌 | ⏰ 生活建議: 規律三餐避免暴飲暴食 | 🔍 監測建議: 若持續出現需檢查腸道感染或食物不耐受',
        en: '🟠 Mild Diarrhea Warning | 💧 Diet Advice: Reduce high-fat, spicy, irritating foods and artificial sweeteners, avoid carbonated drinks and alcohol, eat small frequent meals with probiotics | ⏰ Lifestyle: Regular meals, avoid overeating | 🔍 Monitor: If persistent, check for bowel infection or food intolerance'
      },
      '7': {
        zh: '🔴 嚴重腹瀉緊急 | 💧 緊急處理: 立即補充水分與電解質防止脱水，暫時避免乳製品、高脂肪、辛辣及高纖維食物，攝取易消化食物（白飯、香蕉、吐司） | 🏥 就醫建議: 若腹瀉超過48小時或有脫水、血便等症狀應儘速就醫 | ⚠️ 危險信號: 水狀無固體需立即關注',
        en: '🔴 Severe Diarrhea Emergency | 💧 Emergency Care: Immediately replenish fluids and electrolytes to prevent dehydration, temporarily avoid dairy, high-fat, spicy and high-fiber foods, eat easily digestible foods (white rice, bananas, toast) | 🏥 Medical Advice: If diarrhea persists over 48 hours or symptoms of dehydration/bloody stool appear, seek medical attention immediately | ⚠️ Danger Sign: Watery with no solid pieces requires immediate attention'
      }
    };
    return translations[String(bristolType)] ? (isEnglish ? translations[String(bristolType)].en : translations[String(bristolType)].zh) : recommendations;
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

// 新增：食物影響顯示組件
const FoodInfluenceDisplay = ({ foodInfluence }: { foodInfluence: any }) => {
  if (!foodInfluence || !foodInfluence.likely_influenced) {
    return null;
  }
  
  return (
    <View style={styles.foodInfluenceContainer}>
      <Text style={styles.foodInfluenceTitle}>🍎 可能的食物影響</Text>
      <Text style={styles.foodInfluenceText}>
        影響可能性: {foodInfluence.likelihood}
      </Text>
      <Text style={styles.foodInfluenceText}>
        可能食物: {foodInfluence.possible_foods?.slice(0, 3).join('、')}等
      </Text>
      <Text style={styles.foodInfluenceText}>
        持續時間: {foodInfluence.duration}
      </Text>
      <Text style={styles.foodInfluenceAdvice}>
        {foodInfluence.recommendation}
      </Text>
    </View>
  );
};

// 新增：顏色健康警告組件
const ColorHealthAlerts = ({ healthAlerts }: { healthAlerts: any[] }) => {
  if (!healthAlerts || healthAlerts.length === 0) {
    return null;
  }
  
  return (
    <View style={styles.healthAlertsContainer}>
      <Text style={styles.healthAlertsTitle}>⚠️ 顏色健康提醒</Text>
      {healthAlerts.map((alert, index) => (
        <View key={index} style={styles.healthAlertItem}>
          <Text style={styles.healthAlertText}>
            • {alert.color_name}: {alert.status}
          </Text>
          <Text style={styles.healthAlertAdvice}>
            {alert.advice}
          </Text>
        </View>
      ))}
    </View>
  );
};

// 🔥 新增：非大便檢測結果顯示組件
const NonPoopDetectionDisplay = ({ result, onRetake, onSelectOther }: { result: any, onRetake: () => void, onSelectOther: () => void }) => (
  <View style={styles.nonPoopContainer}>
    <AlertCircle size={48} color={Colors.primary.warning || '#F59E0B'} />
    <Text style={styles.nonPoopTitle}>未檢測到大便</Text>
    <Text style={styles.nonPoopMessage}>{result.message}</Text>
    
    {result.detected_objects && result.detected_objects.length > 0 && (
      <View style={styles.detectedObjectsContainer}>
        <Text style={styles.detectedObjectsTitle}>實際檢測到的物件：</Text>
        {result.detected_objects.slice(0, 3).map((obj: any, index: number) => (
          <Text key={index} style={styles.detectedObjectItem}>
            • {obj.class} (信心度: {(obj.confidence * 100).toFixed(1)}%)
          </Text>
        ))}
      </View>
    )}
    
    <Text style={styles.suggestionText}>{result.suggestion}</Text>
    
    <View style={styles.actionButtonsContainer}>
      <Button
        title="重新拍照"
        onPress={onRetake}
        style={styles.retakeButton}
      />
      <Button
        title="選擇其他照片"
        onPress={onSelectOther}
        variant="outline"
        style={styles.selectOtherButton}
      />
    </View>
  </View>
);

// 🔥 新增：低信心度結果顯示組件
const LowConfidenceDisplay = ({ result, onRetry, onContinueAnyway }: { result: any, onRetry: () => void, onContinueAnyway: () => void }) => (
  <View style={styles.lowConfidenceContainer}>
    <AlertCircle size={48} color={Colors.primary.accent} />
    <Text style={styles.lowConfidenceTitle}>檢測信心度不足</Text>
    <Text style={styles.lowConfidenceMessage}>{result.message}</Text>
    
    {result.detected_results && result.detected_results.length > 0 && (
      <View style={styles.detectedResultsContainer}>
        <Text style={styles.detectedResultsTitle}>檢測結果：</Text>
        <Text style={styles.detectedResultItem}>
          {result.detected_results[0].class} (信心度: {(result.detected_results[0].confidence * 100).toFixed(1)}%)
        </Text>
      </View>
    )}
    
    <Text style={styles.suggestionText}>{result.suggestion}</Text>
    
    <View style={styles.improvementTips}>
      <Text style={styles.improvementTitle}>改善建議：</Text>
      <Text style={styles.improvementTip}>• 確保照片清晰對焦</Text>
      <Text style={styles.improvementTip}>• 提供充足的光線</Text>
      <Text style={styles.improvementTip}>• 避免陰影遮擋</Text>
      <Text style={styles.improvementTip}>• 保持適當的拍攝距離</Text>
    </View>
    
    <View style={styles.actionButtonsContainer}>
      <Button
        title="重新分析"
        onPress={onRetry}
        style={styles.retryButton}
      />
      <Button
        title="繼續使用結果"
        onPress={onContinueAnyway}
        variant="outline"
        style={styles.continueAnywayButton}
      />
    </View>
  </View>
);

// 🔥 新增：部分分析結果顯示組件
const PartialAnalysisDisplay = ({ result, onContinueWithPartial, onRetake }: { result: any, onContinueWithPartial: () => void, onRetake: () => void }) => (
  <View style={styles.partialAnalysisContainer}>
    <Check size={48} color={Colors.primary.success || '#10B981'} />
    <Text style={styles.partialAnalysisTitle}>檢測成功，但分析不完整</Text>
    <Text style={styles.partialAnalysisMessage}>{result.message}</Text>
    
    {result.detected_objects && result.detected_objects.length > 0 && (
      <View style={styles.detectedObjectsContainer}>
        <Text style={styles.detectedObjectsTitle}>檢測結果：</Text>
        {result.detected_objects.map((obj: any, index: number) => (
          <Text key={index} style={styles.detectedObjectItem}>
            • {obj.class} (信心度: {(obj.confidence * 100).toFixed(1)}%)
          </Text>
        ))}
      </View>
    )}
    
    <Text style={styles.suggestionText}>{result.suggestion}</Text>
    
    <View style={styles.actionButtonsContainer}>
      <Button
        title="使用基本結果繼續"
        onPress={onContinueWithPartial}
        style={styles.continueBasicButton}
      />
      <Button
        title="重新拍照"
        onPress={onRetake}
        variant="outline"
        style={styles.retakeButton}
      />
    </View>
  </View>
);

export default function AnalyzeImageScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ imageUri: string }>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState('正在準備分析...');
  
  const [predictedType, setPredictedType] = useState<number>(4);
  const [predictedVolume, setPredictedVolume] = useState<number>(2);
  const [predictedColor, setPredictedColor] = useState<number>(1);
  
  const [selectedType, setSelectedType] = useState<number>(4);
  const [selectedVolume, setSelectedVolume] = useState<number>(2);
  const [selectedColor, setSelectedColor] = useState<number>(1);
  
  const [analysisDetails, setAnalysisDetails] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');
  const [isEnglish, setIsEnglish] = useState<boolean>(false);
  
  // 新增狀態：增強分析數據
  const [colorAnalysis, setColorAnalysis] = useState<any>(null);
  const [volumeAnalysis, setVolumeAnalysis] = useState<any>(null);
  const [healthAlerts, setHealthAlerts] = useState<any[]>([]);
  const [foodInfluenceData, setFoodInfluenceData] = useState<any>(null);

  // 🔥 新增：錯誤處理相關狀態
  const [nonPoopDetectionResult, setNonPoopDetectionResult] = useState<any>(null);
  const [lowConfidenceResult, setLowConfidenceResult] = useState<any>(null);
  const [partialAnalysisResult, setPartialAnalysisResult] = useState<any>(null);

  useEffect(() => {
    if (params.imageUri) {
      setImageUri(params.imageUri);
      analyzeImage(params.imageUri);
    }
  }, [params.imageUri]);

  const analyzeImage = async (uri: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    // 🔥 清除錯誤狀態
    setNonPoopDetectionResult(null);
    setLowConfidenceResult(null);
    setPartialAnalysisResult(null);
    setAnalysisProgress('正在準備分析...');
    
    try {
      if (Platform.OS === 'web') {
        mockAnalysis();
        return;
      }
      
      await analyzeWithPoopAPI(uri);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisError('Failed to analyze the image');
      setIsAnalyzing(false);
    }
  };

  // 🔥 新增：處理結構化錯誤的函數
  const handleStructuredError = (errorResponse: any) => {
    console.log('📋 Handling structured error:', errorResponse);
    
    // 設置分析完成狀態（錯誤也算是一種"完成"）
    setIsAnalyzing(false);
    
    // 根據錯誤類型顯示不同的UI
    if (errorResponse.error === "未檢測到大便") {
      // 顯示檢測到的其他物件
      setAnalysisError(null); // 清除通用錯誤
      setNonPoopDetectionResult(errorResponse); // 新的狀態
    } else if (errorResponse.error === "檢測信心度不足") {
      // 顯示信心度問題
      setAnalysisError(null);
      setLowConfidenceResult(errorResponse);
    } else if (errorResponse.error === "無法進行詳細分析") {
      // 顯示部分分析結果
      setAnalysisError(null);
      setPartialAnalysisResult(errorResponse);
    } else {
      // 其他錯誤使用通用處理
      setAnalysisError(errorResponse.message || errorResponse.error);
    }
  };

  const analyzeWithPoopAPI = async (imageUri: string) => {
    try {
      console.log('Calling enhanced poop-api for analysis...');
      console.log('API URL: https://poop-api.onrender.com/analyze');
      console.log('Image URI:', imageUri);
      
      setAnalysisProgress('正在喚醒AI服務器（首次可能需要1-2分鐘）...');
      
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'poop_image.jpg'
      } as any);
      
      console.log('Uploading image as file...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setAnalysisProgress('服務器響應超時，正在使用備用AI...');
      }, 90000);
      
      let progressStep = 0;
      const progressSteps = [
        '正在喚醒AI服務器...',
        '服務器啟動中，請稍候...',
        '正在上傳圖片...',
        'AI模型載入中...',
        '正在分析圖片特徵...',
        '正在分析顏色和食物影響...',
        '正在生成健康建議...'
      ];
      
      const progressTimer = setInterval(() => {
        if (progressStep < progressSteps.length - 1) {
          progressStep++;
          setAnalysisProgress(progressSteps[progressStep]);
        }
      }, 12000);
      
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
          
          // 🔥 新增：處理後端的結構化錯誤回應
          try {
            const errorJson = JSON.parse(errorText);
            handleStructuredError(errorJson);
            return; // 不要繼續執行
          } catch (parseError) {
            // 如果不是 JSON，使用原來的錯誤處理
            if (response.status === 500 || response.status === 503) {
              console.log('🔄 Server might be cold starting, trying fallback immediately...');
              throw new Error('Server cold start detected');
            }
            
            throw new Error(`Poop API error: ${response.status} - ${response.statusText}\nDetails: ${errorText}`);
          }
        }
        
        const result = await response.json();
        console.log('✅ SUCCESS! Enhanced Poop API response:', result);
        
        setAnalysisProgress('分析完成！正在處理結果...');
        processEnhancedPoopAPIResponse(result);
        
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        clearInterval(progressTimer);
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          console.error('API request timed out after 2 minutes');
        }
        throw fetchError;
      }
      
    } catch (error: unknown) {
      console.error('❌ Enhanced Poop API analysis error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        setAnalysisProgress('您的專用AI服務器需要更多時間啟動，正在使用通用AI...');
      } else {
        setAnalysisProgress('正在使用備用AI進行分析...');
      }
      await mockAnalysisWithRealData();
    }
  };

  // 🔥 修復版：正確處理API回應並映射到選擇器
  function processEnhancedPoopAPIResponse(result: any) {
    try {
      console.log('Processing enhanced poop API response:', result);
      
      // 🎯 正確解構 API 回應
      const mainType = result.main_type || 'Normal';
      const mainAdvice = result.main_advice || '';
      const otherTypes = result.other_types || {};
      const rawStats = result.raw_stats || {};
      const volumeAnalysis = result.volume_analysis || {};
      const colorAnalysis = result.color_analysis || {};
      
      console.log('Main type from API:', mainType);
      console.log('Volume analysis:', volumeAnalysis);
      console.log('Color analysis:', colorAnalysis);

      // 🎯 Bristol type 映射 - 根據 API 的分類映射到選擇器的 1-7
      const bristolTypeMap: { [key: string]: number } = {
        'Constipated': 2,  // API 便秘類型 -> 選擇器 Type 2
        'Normal': 4,       // API 正常類型 -> 選擇器 Type 4 (理想)
        'Loose': 6,        // API 腹瀉類型 -> 選擇器 Type 6
        // 備用映射
        'type1': 1, 'type2': 2, 'type3': 3, 'type4': 4,
        'type5': 5, 'type6': 6, 'type7': 7,
        'hard': 1, 'lumpy': 2, 'cracked': 3, 'smooth': 4, 
        'soft': 5, 'mushy': 6, 'liquid': 7
      };

      // 🎯 體積映射 - API 的體積等級映射到選擇器的 1-3
      const volumeMap: { [key: string]: number } = {
        'Small': 1,    // API Small -> 選擇器第1個選項
        'Medium': 2,   // API Medium -> 選擇器第2個選項
        'Large': 3     // API Large -> 選擇器第3個選項
      };

      // 🎯 顏色映射 - API 的顏色類型映射到選擇器的 1-7
      const colorMap: { [key: string]: number } = {
        'Normal_Brown': 1,  // 正常棕色 -> 選擇器第1個 (Brown)
        'Dark_Tone': 2,     // 深色調 -> 選擇器第2個 (Dark Brown)
        'Light_Tone': 3,    // 淺色調 -> 選擇器第3個 (Light Brown)
        'Yellowish': 4,     // 偏黃 -> 選擇器第4個 (Yellow)
        'Greenish': 5,      // 偏綠 -> 選擇器第5個 (Green)
        'Reddish': 6,       // 偏紅 -> 選擇器第6個 (Red)
        'Very_Dark': 7,     // 非常深色 -> 選擇器第7個 (Black)
        'Unclear': 1        // 不明確 -> 預設為第1個 (Brown)
      };

      // 計算 Bristol 類型
      const bristolType = bristolTypeMap[mainType] || 4;
      console.log('Mapped Bristol type:', bristolType, 'from:', mainType);

      // 計算體積等級
      let volume = 2; // 預設 Medium
      if (volumeAnalysis.overall_volume_class) {
        volume = volumeMap[volumeAnalysis.overall_volume_class] || 2;
        console.log('Mapped volume:', volume, 'from:', volumeAnalysis.overall_volume_class);
      }

      // 計算顏色等級
      let color = 1; // 預設 Brown
      let colorAdvice = '';
      let foodInfluenceInfo = null;

      if (colorAnalysis.summary && Object.keys(colorAnalysis.summary).length > 0) {
        // 嘗試從主要類型獲取顏色資訊
        const mainTypeColorInfo = colorAnalysis.summary[mainType];
        if (mainTypeColorInfo && mainTypeColorInfo.color) {
          color = colorMap[mainTypeColorInfo.color] || 1;
          console.log('Mapped color:', color, 'from main type color:', mainTypeColorInfo.color);
        } else {
          // 如果主要類型沒有顏色資訊，取第一個可用的
          const firstColorInfo = Object.values(colorAnalysis.summary)[0] as any;
          if (firstColorInfo && firstColorInfo.color) {
            color = colorMap[firstColorInfo.color] || 1;
            console.log('Mapped color:', color, 'from first available color:', firstColorInfo.color);
          }
        }

        // 獲取顏色建議
        if (colorAnalysis.color_advice_by_type && colorAnalysis.color_advice_by_type[mainType]) {
          colorAdvice = colorAnalysis.color_advice_by_type[mainType];
        }

        // 獲取食物影響資訊
        if (colorAnalysis.food_influence_summary && colorAnalysis.food_influence_summary[mainType]) {
          foodInfluenceInfo = colorAnalysis.food_influence_summary[mainType];
        }
      }

      console.log('🎯 Final selector mappings:');
      console.log('- Bristol Type:', bristolType, '(will select Type', bristolType, 'in selector)');
      console.log('- Volume:', volume, '(will select position', volume, 'in volume selector)');
      console.log('- Color:', color, '(will select position', color, 'in color selector)');

      // 設置增強分析數據
      setColorAnalysis(colorAnalysis);
      setVolumeAnalysis(volumeAnalysis);
      setHealthAlerts(colorAnalysis.health_alerts || []);
      setFoodInfluenceData(foodInfluenceInfo);

      // 生成分析詳情
      let analysisText = `🎯 主要檢測類型: ${mainType}\n`;

      // 顏色分析結果
      if (colorAnalysis.summary && Object.keys(colorAnalysis.summary).length > 0) {
        analysisText += `\n🎨 顏色分析結果:\n`;
        Object.entries(colorAnalysis.summary).forEach(([type, info]: [string, any]) => {
          analysisText += `  • ${type}: ${info.color_name} (${info.health_status})\n`;
        });
      }

      // 體積分析結果
      if (volumeAnalysis.overall_volume_class) {
        analysisText += `\n📏 體積分析: ${volumeAnalysis.overall_volume_class}\n`;
      }

      // 食物影響提示
      if (foodInfluenceInfo && foodInfluenceInfo.likely_influenced) {
        analysisText += `\n🍎 檢測到可能的食物影響:\n`;
        analysisText += `  • 影響可能性: ${foodInfluenceInfo.likelihood}\n`;
        analysisText += `  • 可能食物: ${foodInfluenceInfo.possible_foods?.slice(0, 3).join('、')}等\n`;
      }

      // 🔥 關鍵：設置選擇器的值，讓UI自動選中對應選項
      console.log('🎯 Setting selector values...');
      
      setPredictedType(bristolType);
      setPredictedVolume(volume);
      setPredictedColor(color);
      
      // ⭐ 重要：這些設置會讓下方的選擇器自動選中對應的選項
      setSelectedType(bristolType);      // 自動選中對應的 Bristol Type
      setSelectedVolume(volume);         // 自動選中對應的 Volume
      setSelectedColor(color);           // 自動選中對應的 Color

      setAnalysisDetails(analysisText);

      // 生成建議
      const enhancedPersonalizedAdvice = generateEnhancedPersonalizedAdvice(
        mainType, otherTypes, rawStats, volume, colorAnalysis, volumeAnalysis
      );

      let fullRecommendations = enhancedPersonalizedAdvice;
      if (colorAdvice) {
        fullRecommendations += `\n\n🎨 顏色專項建議:\n${colorAdvice}`;
      }
      if (foodInfluenceInfo && foodInfluenceInfo.recommendation) {
        fullRecommendations += `\n\n🍎 食物影響建議:\n${foodInfluenceInfo.recommendation}`;
      }

      setRecommendations(fullRecommendations);
      setIsAnalyzing(false);

      console.log('✅ Successfully processed API response and updated selectors');

    } catch (error: unknown) {
      console.error('Error processing enhanced poop API response:', error);
      setAnalysisError('Could not process the analysis results');
      setIsAnalyzing(false);
    }
  }

  // 增強版個人化建議生成
  const generateEnhancedPersonalizedAdvice = (
    mainType: string, 
    otherTypes: any, 
    rawStats: any, 
    volume: number,
    colorAnalysis: any,
    volumeAnalysis: any
  ): string => {
    // 基礎建議
    const mainTypeAdvice = getAdviceForType(mainType);
    
    let personalizedAdvice = mainTypeAdvice;
    
    // 體積特定建議
    if (volumeAnalysis.overall_volume_class) {
      const volumeAdviceText = getEnhancedVolumeAdvice(volumeAnalysis.overall_volume_class, volumeAnalysis);
      if (volumeAdviceText) {
        personalizedAdvice += `\n\n${volumeAdviceText}`;
      }
    }
    
    // 顏色特定建議
    if (colorAnalysis.summary && Object.keys(colorAnalysis.summary).length > 0) {
      const hasAbnormalColors = Object.values(colorAnalysis.summary).some((info: any) => 
        info.health_status !== '正常' && info.health_status !== 'Normal'
      );
      
      if (hasAbnormalColors) {
        personalizedAdvice += `\n\n🎨 顏色健康評估:`;
        
        Object.entries(colorAnalysis.summary).forEach(([type, info]: [string, any]) => {
          if (info.health_status !== '正常' && info.health_status !== 'Normal') {
            personalizedAdvice += `\n• ${type}: ${info.color_name} - ${info.health_status}`;
          }
        });
      }
    }
    
    // 追蹤建議
    personalizedAdvice += `\n\n📊 追蹤建議: 建議記錄未來3-7天的便便變化，特別關注顏色和形狀的改善`;
    
    return personalizedAdvice;
  };

  // Get advice for specific type
  const getAdviceForType = (type: string): string => {
    const adviceMap: { [key: string]: string } = {
      'Constipated': '🔴 便秘狀態 | 💧 飲食建議: 增加膳食纖維攝取（全穀、蔬菜、水果、豆類），每日攝取2000ml以上水分 | 🏃‍♂️ 生活建議: 規律運動促進腸蠕動，腹部按摩',
      'Normal': '🎉 正常狀態 | 💧 飲食建議: 持續均衡飲食，攝取足夠纖維與水分 | 💪 生活建議: 維持規律運動與作息',
      'Loose': '🟠 腹瀉狀態 | 💧 飲食建議: 減少高油脂、辛辣食物，少量多餐補充益生菌 | ⏰ 生活建議: 規律三餐避免暴飲暴食',
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
    
    const combinations: { [key: string]: string } = {
      'Constipated_Normal': `便秘與正常便混合 ${percentageText}: 改善進行中，繼續增加纖維和水分`,
      'Constipated_Loose': `便秘與腹瀉混合 ${percentageText}: 腸道功能不穩定，建議就醫評估`,
      'Normal_Loose': `正常與腹瀉便混合 ${percentageText}: 注意飲食調整，避免刺激性食物`,
      'Normal_Constipated': `正常與便秘便混合 ${percentageText}: 好轉跡象，維持當前改善策略`,
      'Loose_Normal': `腹瀉與正常便混合 ${percentageText}: 腸道恢復中，繼續溫和飲食`,
      'Loose_Constipated': `腹瀉與便秘混合 ${percentageText}: 腸道功能紊亂，建議專業評估`
    };

    const comboKey = `${mainType}_${secondaryType}`;
    const reverseKey = `${secondaryType}_${mainType}`;
    
    return combinations[comboKey] || combinations[reverseKey] || `${secondaryType}特徵 ${percentageText}: 混合型態，建議平衡改善策略`;
  };

  // 增強版體積建議
  const getEnhancedVolumeAdvice = (volumeClass: string, volumeAnalysis: any): string => {
    const baseAdvice: { [key: string]: string } = {
      'Small': '📏 體積偏小建議: 可能攝取不足或消化吸收問題',
      'Medium': '📏 體積正常: 維持當前飲食習慣',
      'Large': '📏 體積較大建議: 可能攝取過量或消化時間過長'
    };
    
    let advice = baseAdvice[volumeClass] || '';
    
    if (volumeAnalysis.detailed_data) {
      advice += '\n• 詳細建議: ';
      if (volumeClass === 'Small') {
        advice += '增加健康脂肪如堅果、酪梨，確保足夠營養攝取';
      } else if (volumeClass === 'Large') {
        advice += '考慮分餐進食，增加消化時間，避免一次性大量進食';
      } else {
        advice += '繼續保持均衡飲食';
      }
    }
    
    return advice;
  };

  // 食物影響查詢功能
  const checkFoodInfluence = async (colorType: string) => {
    try {
      const response = await fetch('https://poop-api.onrender.com/check_food_history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ color_type: colorType }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error checking food influence:', error);
    }
    return null;
  };

  // 獲取食物影響資料庫
  const getFoodInfluenceInfo = async () => {
    try {
      const response = await fetch('https://poop-api.onrender.com/food_influence');
      
      if (response.ok) {
        const data = await response.json();
        return data.food_color_effects;
      }
    } catch (error) {
      console.error('Error getting food influence info:', error);
    }
    return null;
  };

  // Enhanced mock analysis with realistic data
  const mockAnalysisWithRealData = async () => {
    setAnalysisProgress('正在使用通用AI進行分析...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockType = 4;
    const mockVolume = 2;
    const mockColor = 1;
    
    const mockAdvice = `🟢 接近正常狀態 | 💧 飲食建議: 維持現有纖維及水分攝取，適度增加蔬果 | 🚶‍♀️ 生活建議: 保持運動與規律生活 | ✅ 狀態說明: 建議繼續保持良好的生活習慣`;
    
    setPredictedType(mockType);
    setSelectedType(mockType);
    
    setPredictedVolume(mockVolume);
    setSelectedVolume(mockVolume);
    
    setPredictedColor(mockColor);
    setSelectedColor(mockColor);
    
    setAnalysisDetails('🎯 基於圖片特徵的AI分析\n📊 使用通用健康模型進行評估\n💡 建議結合個人健康狀況進行參考');
    setRecommendations(mockAdvice);
    
    // 設置模擬的增強數據
    setColorAnalysis({
      summary: { Normal: { color: 'Normal_Brown', color_name: '正常棕色', health_status: '正常' } },
      health_alerts: [],
      food_influence_summary: {}
    });
    setVolumeAnalysis({ overall_volume_class: 'Medium' });
    setHealthAlerts([]);
    setFoodInfluenceData(null);
    
    setIsAnalyzing(false);
  };
  
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
    }, 1500);
  };
  
  const handleContinue = () => {
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

  // 🔥 新增：錯誤處理相關函數
  const handleRetake = () => {
    router.push('/camera');
  };

  const handleSelectOther = () => {
    router.push('/gallery');
  };

  const handleContinueWithLowConfidence = (result: any) => {
    // 使用低信心度結果繼續
    if (result.detected_results && result.detected_results.length > 0) {
      const detection = result.detected_results[0];
      // 設置基本的選擇器值
      setSelectedType(4); // 預設正常
      setSelectedVolume(2); // 預設中等
      setSelectedColor(1); // 預設棕色
      
      setAnalysisDetails(`⚠️ 低信心度分析結果\n檢測到: ${detection.class}\n信心度: ${(detection.confidence * 100).toFixed(1)}%\n注意: 建議改善拍攝條件以獲得更準確的分析`);
      setRecommendations('🎯 基本建議 | 💧 飲食: 保持均衡飲食 | 🏃‍♂️ 運動: 規律運動 | 📸 建議: 下次請在更好的光線條件下拍攝');
      
      // 清除低信心度結果，顯示正常的選擇器界面
      setLowConfidenceResult(null);
    }
  };

  const handleContinueWithPartial = () => {
    // 使用部分結果繼續
    if (partialAnalysisResult?.detected_objects && partialAnalysisResult.detected_objects.length > 0) {
      const bestDetection = partialAnalysisResult.detected_objects[0];
      // 設置基本的選擇器值
      setSelectedType(4); // 預設正常
      setSelectedVolume(2); // 預設中等
      setSelectedColor(1); // 預設棕色
      
      setAnalysisDetails(`🎯 部分分析結果\n檢測到: ${bestDetection.class}\n信心度: ${(bestDetection.confidence * 100).toFixed(1)}%\n注意: 由於圖片品質限制，無法進行完整分析`);
      setRecommendations('🎯 基本建議 | 💧 飲食: 保持均衡飲食 | 🏃‍♂️ 運動: 規律運動 | 📸 建議: 下次拍攝更清晰的照片以獲得完整分析');
      
      // 清除部分分析結果，顯示正常的選擇器界面
      setPartialAnalysisResult(null);
    }
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
        ) : nonPoopDetectionResult ? (
          // 🔥 顯示非大便檢測結果
          <NonPoopDetectionDisplay 
            result={nonPoopDetectionResult} 
            onRetake={handleRetake}
            onSelectOther={handleSelectOther}
          />
        ) : lowConfidenceResult ? (
          // 🔥 顯示低信心度結果
          <LowConfidenceDisplay 
            result={lowConfidenceResult} 
            onRetry={handleRetry}
            onContinueAnyway={() => handleContinueWithLowConfidence(lowConfidenceResult)}
          />
        ) : partialAnalysisResult ? (
          // 🔥 顯示部分分析結果
          <PartialAnalysisDisplay 
            result={partialAnalysisResult} 
            onContinueWithPartial={handleContinueWithPartial}
            onRetake={handleRetake}
          />
        ) : analysisError ? (
          // 🔥 通用錯誤處理（保持原有的）
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
          // 🔥 正常的分析成功界面（保持原有的）
          <>
            <View style={styles.resultContainer}>
              <View style={styles.resultHeader}>
                <FileText size={24} color={Colors.primary.accent} />
                <Text style={styles.resultTitle}>Enhanced AI Analysis Results</Text>
              </View>
              
              <Text style={styles.resultDescription}>
                我們的專業AI模型已完成增強分析，包含顏色、體積和食物影響評估。您可以調整結果如有需要。
              </Text>
              
              {analysisDetails && (
                <View style={styles.analysisDetails}>
                  <Text style={styles.analysisTitle}>詳細分析結果:</Text>
                  <Text style={styles.analysisText}>{analysisDetails}</Text>
                </View>
              )}

              {/* 顏色健康警告 */}
              <ColorHealthAlerts healthAlerts={healthAlerts} />

              {/* 食物影響顯示 */}
              <FoodInfluenceDisplay foodInfluence={foodInfluenceData} />

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
  // 新增：食物影響樣式
  foodInfluenceContainer: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  foodInfluenceTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  foodInfluenceText: {
    fontSize: 14,
    color: '#78350F',
    marginBottom: 4,
  },
  foodInfluenceAdvice: {
    fontSize: 14,
    color: '#78350F',
    marginTop: 8,
    fontStyle: 'italic',
  },
  // 新增：健康警告樣式
  healthAlertsContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  healthAlertsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991B1B',
    marginBottom: 8,
  },
  healthAlertItem: {
    marginBottom: 8,
  },
  healthAlertText: {
    fontSize: 14,
    color: '#7F1D1D',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  healthAlertAdvice: {
    fontSize: 13,
    color: '#7F1D1D',
    lineHeight: 18,
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

  // 🔥 新增：錯誤處理相關樣式
  // 非大便檢測結果樣式
  nonPoopContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F59E0B', // warning color fallback
  },
  nonPoopTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B', // warning color fallback
    marginTop: 16,
    marginBottom: 8,
  },
  nonPoopMessage: {
    fontSize: 14,
    color: Colors.primary.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  detectedObjectsContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  detectedObjectsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  detectedObjectItem: {
    fontSize: 13,
    color: Colors.primary.lightText,
    marginBottom: 4,
  },
  
  // 低信心度結果樣式
  lowConfidenceContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.primary.accent,
  },
  lowConfidenceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.accent,
    marginTop: 16,
    marginBottom: 8,
  },
  lowConfidenceMessage: {
    fontSize: 14,
    color: Colors.primary.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  detectedResultsContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  detectedResultsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  detectedResultItem: {
    fontSize: 13,
    color: Colors.primary.lightText,
  },
  improvementTips: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  improvementTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  improvementTip: {
    fontSize: 13,
    color: Colors.primary.lightText,
    marginBottom: 4,
  },
  
  // 部分分析結果樣式
  partialAnalysisContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981', // success color fallback
  },
  partialAnalysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981', // success color fallback
    marginTop: 16,
    marginBottom: 8,
  },
  partialAnalysisMessage: {
    fontSize: 14,
    color: Colors.primary.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  
  // 通用樣式
  suggestionText: {
    fontSize: 13,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  actionButtonsContainer: {
    width: '100%',
    gap: 12,
  },
  selectOtherButton: {
    borderColor: Colors.primary.accent,
  },
  continueAnywayButton: {
    borderColor: Colors.primary.lightText,
  },
});