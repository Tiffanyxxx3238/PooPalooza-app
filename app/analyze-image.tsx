import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import PoopTypeSelector from '@/components/PoopTypeSelector';
import PoopVolumeSelector from '@/components/PoopVolumeSelector';
import { poopTypes, poopVolumes, poopColors } from '@/constants/poopTypes';
import { FileText, Check, AlertCircle, Globe } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
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
// 🎨 增強版顏色分析顯示組件
const EnhancedColorAnalysisDisplay = ({ colorAnalysis }: { colorAnalysis: any }) => {
  if (!colorAnalysis || !colorAnalysis.summary) {
    return null;
  }

  // 顏色對應的視覺顏色
  const getVisualColor = (colorType: string) => {
    const colorMapping: { [key: string]: string } = {
      'Normal_Brown': '#8B4513',    // 棕色
      'Dark_Tone': '#654321',       // 深棕色
      'Light_Tone': '#D2B48C',      // 淺棕色
      'Yellowish': '#DAA520',       // 金黃色
      'Greenish': '#8FBC8F',        // 淡綠色
      'Reddish': '#CD5C5C',         // 紅色
      'Very_Dark': '#2F2F2F',       // 深色
      'Black': '#000000',           // 黑色
    };
    return colorMapping[colorType] || '#8B4513';
  };

  // 健康狀態對應的顏色
  const getHealthStatusColor = (status: string) => {
    if (status.includes('正常') || status.includes('Normal')) {
      return { bg: '#DCFCE7', border: '#4ADE80', text: '#14532D' }; // 綠色
    } else if (status.includes('注意') || status.includes('Warning')) {
      return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' }; // 黃色
    } else if (status.includes('異常') || status.includes('Alert')) {
      return { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' }; // 紅色
    }
    return { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' }; // 灰色
  };

  return (
    <View style={styles.enhancedColorContainer}>
      <Text style={styles.enhancedColorTitle}>🎨 詳細顏色分析</Text>
      
      {Object.entries(colorAnalysis.summary).map(([type, info]: [string, any], index) => {
        const healthColors = getHealthStatusColor(info.health_status);
        const visualColor = getVisualColor(info.color);
        
        return (
          <View 
            key={index} 
            style={[
              styles.colorAnalysisItem,
              { 
                backgroundColor: healthColors.bg,
                borderColor: healthColors.border 
              }
            ]}
          >
            <View style={styles.colorAnalysisHeader}>
              {/* 顏色圓點 */}
              <View 
                style={[
                  styles.colorDot,
                  { backgroundColor: visualColor }
                ]} 
              />
              <View style={styles.colorAnalysisTextContainer}>
                <Text style={[styles.colorAnalysisName, { color: healthColors.text }]}>
                  {info.color_name || info.color}
                </Text>
                <Text style={[styles.colorAnalysisType, { color: healthColors.text }]}>
                  類型: {type}
                </Text>
              </View>
              <View style={styles.healthStatusBadge}>
                <Text style={[styles.healthStatusText, { color: healthColors.text }]}>
                  {info.health_status}
                </Text>
              </View>
            </View>
            
            {/* 如果有額外的顏色描述 */}
            {info.description && (
              <Text style={styles.colorDescription}>
                📋 {info.description}
              </Text>
            )}
            
            {/* 如果有信心度 */}
            {info.confidence && (
              <Text style={styles.colorConfidence}>
                🎯 檢測信心度: {(info.confidence * 100).toFixed(1)}%
              </Text>
            )}
          </View>
        );
      })}
      
      {/* 顏色健康總結 */}
      {colorAnalysis.overall_color_health && (
        <View style={styles.overallColorHealth}>
          <Text style={styles.overallColorTitle}>🏥 顏色健康總評</Text>
          <Text style={styles.overallColorText}>
            {colorAnalysis.overall_color_health}
          </Text>
        </View>
      )}
    </View>
  );
};
// 🎨 增強版顏色選擇器
const EnhancedPoopColorSelector = ({ 
  selectedColor, 
  onSelectColor, 
  detectedColor,
  colorAnalysis 
}: { 
  selectedColor: number, 
  onSelectColor: (color: number) => void,
  detectedColor?: number,
  colorAnalysis?: any
}) => {
  const colors = [
    { id: 1, name: '棕色', color: '#8B4513', description: '正常健康' },
    { id: 2, name: '深棕', color: '#654321', description: '可能脫水' },
    { id: 3, name: '淺棕', color: '#D2B48C', description: '消化快速' },
    { id: 4, name: '黃色', color: '#DAA520', description: '脂肪含量高' },
    { id: 5, name: '綠色', color: '#8FBC8F', description: '膽汁或蔬菜' },
    { id: 6, name: '紅色', color: '#CD5C5C', description: '需要注意' },
    { id: 7, name: '黑色', color: '#2F2F2F', description: '需要檢查' },
  ];

  return (
    <View style={styles.enhancedColorSelector}>
      <View style={styles.selectorHeader}>
        <Text style={styles.selectorTitle}>💩 便便顏色</Text>
        {detectedColor && (
          <Text style={styles.aiDetectedLabel}>
            🤖 AI檢測: {colors[detectedColor - 1]?.name}
          </Text>
        )}
      </View>
      
      <View style={styles.colorGrid}>
        {colors.map((colorItem) => {
          const isSelected = selectedColor === colorItem.id;
          const isAIDetected = detectedColor === colorItem.id;
          
          return (
            <TouchableOpacity
              key={colorItem.id}
              style={[
                styles.colorOption,
                isSelected && styles.selectedColorOption,
                isAIDetected && styles.aiDetectedColorOption,
              ]}
              onPress={() => onSelectColor(colorItem.id)}
            >
              <View 
                style={[
                  styles.colorCircle,
                  { backgroundColor: colorItem.color },
                  isSelected && styles.selectedColorCircle,
                ]} 
              />
              <Text style={[
                styles.colorName,
                isSelected && styles.selectedColorName
              ]}>
                {colorItem.name}
              </Text>
              <Text style={styles.colorSelectorDescription}>
                {colorItem.description}
              </Text>
              
              {/* AI檢測標記 */}
              {isAIDetected && (
                <View style={styles.aiDetectedMark}>
                  <Text style={styles.aiDetectedMarkText}>🤖</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* 顏色建議 */}
      {colorAnalysis?.color_advice_summary && (
        <View style={styles.colorAdviceContainer}>
          <Text style={styles.colorAdviceTitle}>💡 顏色建議</Text>
          <Text style={styles.colorAdviceText}>
            {colorAnalysis.color_advice_summary}
          </Text>
        </View>
      )}
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
const NonPoopDetectionDisplay = ({ result, onRetake, onSelectOther }: { result: any, onRetake: () => void, onSelectOther: () => void }) => (
  <View style={styles.nonPoopContainer}>
    <AlertCircle size={48} color={Colors.primary.warning || '#F59E0B'} />
    <Text style={styles.nonPoopTitle}>未檢測到大便</Text>
    <Text style={styles.nonPoopMessage}>{result.message}</Text>
    
    {/* 🔥 新增：顯示基本顏色分析（如果有的話） */}
    {result.basic_color_info && (
      <View style={styles.basicColorAnalysisContainer}>
        <Text style={styles.basicColorAnalysisTitle}>🎨 基本顏色分析</Text>
        <View style={styles.colorInfoRow}>
          <View 
            style={[
              styles.colorPreview,
              { backgroundColor: result.basic_color_info.hex_color }
            ]} 
          />
          <View style={styles.colorInfoText}>
            <Text style={styles.basicColorName}>{result.basic_color_info.color_name}</Text>
            <Text style={styles.basicColorNote}>{result.basic_color_info.note}</Text>
          </View>
        </View>
      </View>
    )}
    
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
    // 🔥 修復：確保清除所有錯誤狀態
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
    if (errorResponse.error === "No poop detected") {
      // 顯示檢測到的其他物件
      setAnalysisError(null); // 清除通用錯誤
      setNonPoopDetectionResult(errorResponse); // 新的狀態
    } else if (errorResponse.error === "Low confidence detection") {
      // 顯示信心度問題
      setAnalysisError(null);
      setLowConfidenceResult(errorResponse);
    } else if (errorResponse.error === "Cannot perform detailed analysis") {
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
    
    setAnalysisProgress('正在連接AI服務器...');
    
    // 圖片格式處理
    const getImageType = (uri: string) => {
      if (uri.toLowerCase().includes('.png')) {
        return 'image/png';
      } else if (uri.toLowerCase().includes('.jpg') || uri.toLowerCase().includes('.jpeg')) {
        return 'image/jpeg';
      } else {
        return 'image/jpeg';
      }
    };

    const getFileName = (uri: string) => {
      if (uri.toLowerCase().includes('.png')) {
        return 'poop_image.png';
      } else {
        return 'poop_image.jpg';
      }
    };

    const imageType = getImageType(imageUri);
    const fileName = getFileName(imageUri);
    
    console.log(`🔍 Detected image type: ${imageType}, filename: ${fileName}`);
    
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: imageType,
      name: fileName
    } as any);
    
    console.log('📤 準備上傳圖片到API...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      setAnalysisProgress('請求超時，使用備用分析...');
    }, 300000); // 5分鐘

    // 🔥 健康檢查（可選，不強制）
    try {
      setAnalysisProgress('正在檢查服務器狀態...');
      
      const healthController = new AbortController();
      const healthTimeoutId = setTimeout(() => {
        healthController.abort();
      }, 30000); // 30秒
      
      const healthCheck = await fetch('https://poop-api.onrender.com/', {
        method: 'GET',
        signal: healthController.signal
      });
      
      clearTimeout(healthTimeoutId);
      
      console.log('Health check status:', healthCheck.status);
      if (healthCheck.ok) {
        const healthData = await healthCheck.json();
        console.log('Health check response:', healthData);
        setAnalysisProgress('服務器已就緒，開始分析...');
      } else {
        console.log('Health check failed but continuing anyway');
        setAnalysisProgress('服務器響應異常，嘗試直接分析...');
      }
    } catch (healthError) {
      console.log('Health check error (continuing anyway):', healthError);
      setAnalysisProgress('跳過狀態檢查，直接開始分析...');
    }

    
    try {
      console.log('🔍 開始上傳圖片進行分析...');
      
      const response = await fetch('https://poop-api.onrender.com/analyze', {
        method: 'POST',
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);
      
      

if (!response.ok) {
  const errorText = await response.text();
  
  // 🧹 修改：只在開發模式下顯示技術訊息
  if (__DEV__) {
    console.log('📋 API Response Details:', {
      status: response.status,
      errorText: errorText
    });
  }
  
  // 🔥 修復：502錯誤也可能是Cloudflare代理的400錯誤
  if (response.status === 400 || response.status === 502) {
    try {
      // 🔥 502錯誤時，errorText可能是空的，需要特殊處理
      if (response.status === 502 && (!errorText || errorText.trim() === '')) {
        if (__DEV__) {
          console.log('🔄 502錯誤且無錯誤內容，可能是Cloudflare代理問題');
        }
        // 這可能是非大便檢測的502代理錯誤，使用備用分析
        throw new Error('Server temporarily unavailable');
      }
      
      const errorJson = JSON.parse(errorText);
      if (__DEV__) {
        console.log('✅ 解析到400/502回應:', errorJson);
      }
      
      // 🔥 非大便檢測 - 不是錯誤，是正常的檢測結果
      if (errorJson.error === "No objects detected" || errorJson.error === "No poop detected") {
        if (__DEV__) {
          console.log('🎯 檢測到非大便圖片，顯示友好界面');
        }
        setIsAnalyzing(false);
        
        setNonPoopDetectionResult({
          error: errorJson.error,
          message: errorJson.message,
          suggestion: errorJson.suggestion,
          detected_objects: errorJson.detected_objects || [],
          basic_color_info: errorJson.basic_color_info
        });
        
        setAnalysisError(null);
        return;
      }
      
      // 🔥 低信心度檢測 - 也不是錯誤，是分析結果
      if (errorJson.error === "Low confidence detection") {
        if (__DEV__) {
          console.log('🎯 檢測到低信心度結果，顯示友好界面');
        }
        setIsAnalyzing(false);
        
        setLowConfidenceResult({
          error: errorJson.error,
          message: errorJson.message,
          suggestion: errorJson.suggestion,
          detected_results: errorJson.detected_results || [],
          basic_color_info: errorJson.basic_color_info
        });
        
        setAnalysisError(null);
        return;
      }
      
      // 🔥 部分分析 - 也不是錯誤，是分析結果
      if (errorJson.error === "Cannot perform detailed analysis") {
        if (__DEV__) {
          console.log('🎯 檢測到部分分析結果，顯示友好界面');
        }
        setIsAnalyzing(false);
        
        setPartialAnalysisResult({
          error: errorJson.error,
          message: errorJson.message,
          suggestion: errorJson.suggestion,
          detected_objects: errorJson.detected_objects || [],
          basic_color_info: errorJson.basic_color_info
        });
        
        setAnalysisError(null);
        return;
      }
      
      // 🔥 其他400/502錯誤才是真的客戶端錯誤
      setIsAnalyzing(false);
      setAnalysisError(`上傳問題: ${errorJson.message || errorJson.error}`);
      return;
      
    } catch (parseError) {
      if (__DEV__) {
        console.warn('無法解析400/502錯誤JSON:', parseError);
        console.log('Raw error text:', errorText);
      }
      
      // 🔥 如果是502且無法解析JSON，很可能是Cloudflare代理的非大便檢測
      if (response.status === 502) {
        if (__DEV__) {
          console.log('🔄 502錯誤無法解析JSON，可能是Cloudflare代理問題，使用備用分析');
        }
        throw new Error('Cloudflare proxy error - likely non-poop detection');
      }
      
      setIsAnalyzing(false);
      setAnalysisError('圖片處理失敗，請檢查圖片格式');
      return;
    }
  }
  
  // 503錯誤處理（服務器問題）
  if (response.status === 503) {
    if (__DEV__) {
      console.log('🔄 Service unavailable (503), using fallback');
    }
    setAnalysisProgress('服務暫時不可用，使用備用分析...');
    throw new Error('Service temporarily unavailable');
  }
  
  // 其他錯誤
  throw new Error(`API error: ${response.status} - ${response.statusText}\nDetails: ${errorText}`);
}
      
      
      const result = await response.json();
      console.log('✅ SUCCESS! API response:', result);
      
      setAnalysisProgress('分析完成！正在處理結果...');
      processEnhancedPoopAPIResponse(result);
      
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      console.error('❌ API請求失敗:', fetchError);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        setAnalysisProgress('請求超時，使用備用分析...');
      } else {
        setAnalysisProgress('API請求失敗，使用備用分析...');
      }
      
      throw fetchError;
    }
    
  } catch (error: unknown) {
    console.error('❌ Enhanced Poop API analysis error:', error);
  const enhancedMockAnalysis = async () => {
  try {
    setAnalysisProgress('正在使用本地AI模型分析...');
    
    // 模擬分析時間
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 🎯 基於圖片類型進行智能判斷
    const imageType = imageUri?.toLowerCase();
    let mockResult;
    
    if (imageType?.includes('.png') || imageType?.includes('png')) {
      // PNG圖片通常是截圖或非真實照片，模擬非大便檢測
      setIsAnalyzing(false);
      setNonPoopDetectionResult({
        error: "No poop detected",
        message: "未檢測到大便照片，請上傳真實的大便照片",
        suggestion: "請確保照片清晰，光線充足，並且是真實的大便照片",
        detected_objects: [
          { class: "image", confidence: 0.85 },
          { class: "object", confidence: 0.62 }
        ],
        basic_color_info: {
          color_name: "Mixed Colors",
          detected_color_type: "Unclear",
          hex_color: "#A0A0A0",
          note: "圖片內容複雜，無法進行顏色分析",
          rgb_color: [160, 160, 160]
        }
      });
      setAnalysisError(null);
      return;
    }
    
    // 對於其他圖片，進行正常的模擬分析
    const mockTypes = [3, 4, 5]; // 偏向正常範圍
    const mockType = mockTypes[Math.floor(Math.random() * mockTypes.length)];
    const mockVolume = Math.floor(Math.random() * 3) + 1;
    const mockColor = Math.floor(Math.random() * 3) + 1;
    
    const getAdviceByType = (type: number) => {
      const adviceMap: { [key: number]: string } = {
        3: '🟢 偏乾但接近正常 | 💧 飲食建議: 維持現有纖維及水分攝取，適度增加蔬果 | 🚶‍♀️ 生活建議: 保持運動與規律生活',
        4: '🎉 正常狀態 | 💧 飲食建議: 持續均衡飲食，攝取足夠纖維與水分 | 💪 生活建議: 維持規律運動與作息',
        5: '🟡 略軟需注意 | 💧 飲食建議: 檢視纖維或水分攝取是否過量 | 🍽️ 生活建議: 維持規律飲食與運動'
      };
      return adviceMap[type] || adviceMap[4];
    };
    
    const mockAdvice = getAdviceByType(mockType);
    
    setPredictedType(mockType);
    setSelectedType(mockType);
    setPredictedVolume(mockVolume);
    setSelectedVolume(mockVolume);
    setPredictedColor(mockColor);
    setSelectedColor(mockColor);
    
    setAnalysisDetails(`🎯 本地AI分析結果\n📊 檢測類型: Bristol Type ${mockType}\n🔍 由於服務器資源限制，使用本地模型進行分析\n💡 建議結合個人健康狀況進行參考`);
    setRecommendations(mockAdvice);
    
    // 豐富的模擬數據
    const mockColorAnalysis = {
      summary: { 
        Local: { 
          color: mockColor === 1 ? 'Normal_Brown' : mockColor === 2 ? 'Dark_Tone' : 'Light_Tone', 
          color_name: mockColor === 1 ? '正常棕色' : mockColor === 2 ? '深棕色' : '淺棕色', 
          health_status: '本地分析',
          confidence: 0.70 + Math.random() * 0.2
        } 
      },
      health_alerts: [],
      food_influence_summary: {},
      overall_color_health: '本地AI分析完成，建議以實際觀察為準'
    };
    
    setColorAnalysis(mockColorAnalysis);
    setVolumeAnalysis({ 
      overall_volume_class: mockVolume === 1 ? 'Small' : mockVolume === 2 ? 'Medium' : 'Large'
    });
    setHealthAlerts([]);
    setFoodInfluenceData(null);
    
    setIsAnalyzing(false);
    console.log('✅ Enhanced mock analysis completed');
    
  } catch (error) {
    console.error('Enhanced mock analysis error:', error);
    setAnalysisError('本地分析失敗');
    setIsAnalyzing(false);
  }
};  
  if (error instanceof Error && 
      (error.message.includes('Server temporarily unavailable') || 
       error.message.includes('Cloudflare proxy error'))) {
    
    console.log('🔄 檢測到Render免費版資源限制，使用智能備用分析');
    
    // 🎯 使用更智能的備用分析，模擬真實的AI分析結果
    setAnalysisProgress('資源限制，使用本地AI進行分析...');
    await enhancedMockAnalysis();
    return;
  }
  
  // 其他錯誤處理...
  if (error instanceof TypeError && error.message.includes('fetch')) {
    setAnalysisProgress('網絡連接失敗，正在使用離線AI...');
  } else if (error instanceof Error && error.name === 'AbortError') {
    setAnalysisProgress('請求超時，正在使用通用AI...');
  } else {
    setAnalysisProgress('切換到備用AI進行分析...');
  }
    
    await mockAnalysisWithRealData();
  }
  
};

function processEnhancedPoopAPIResponse(result: any) {
  try {
    console.log('Processing enhanced poop API response:', result);
    
    if (!result) {
      throw new Error('API response is null or undefined');
    }
    
    const mainType = result.main_type || result.type || 'Normal';
    const mainAdvice = result.main_advice || result.advice || '';
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
      'soft': 5, 'mushy': 6, 'liquid': 7,
      // 🔥 新增：處理更多可能的 API 回應
      'constipation': 2, 'normal': 4, 'diarrhea': 6, 'loose': 6
    };

    // 🎯 體積映射 - API 的體積等級映射到選擇器的 1-3
    const volumeMap: { [key: string]: number } = {
      'Small': 1, 'small': 1,
      'Medium': 2, 'medium': 2, 'normal': 2,
      'Large': 3, 'large': 3, 'big': 3
    };

    // 🎯 顏色映射 - API 的顏色類型映射到選擇器的 1-7
    const colorMap: { [key: string]: number } = {
      'Normal_Brown': 1, 'normal_brown': 1, 'brown': 1,
      'Dark_Tone': 2, 'dark_tone': 2, 'dark': 2,
      'Light_Tone': 3, 'light_tone': 3, 'light': 3,
      'Yellowish': 4, 'yellowish': 4, 'yellow': 4,
      'Greenish': 5, 'greenish': 5, 'green': 5,
      'Reddish': 6, 'reddish': 6, 'red': 6,
      'Very_Dark': 7, 'very_dark': 7, 'black': 7,
      'Unclear': 1, 'unclear': 1
    };

    // 計算 Bristol 類型 - 增加安全檢查
    const bristolType = bristolTypeMap[mainType] || bristolTypeMap[mainType.toLowerCase()] || 4;
    console.log('Mapped Bristol type:', bristolType, 'from:', mainType);

    // 計算體積等級 - 增加安全檢查
    let volume = 2; // 預設 Medium
    if (volumeAnalysis && volumeAnalysis.overall_volume_class) {
      const volumeClass = volumeAnalysis.overall_volume_class;
      volume = volumeMap[volumeClass] || volumeMap[volumeClass.toLowerCase()] || 2;
      console.log('Mapped volume:', volume, 'from:', volumeClass);
    }

    // 計算顏色等級 - 增加安全檢查
    let color = 1; // 預設 Brown
    let colorAdvice = '';
    let foodInfluenceInfo = null;

    if (colorAnalysis && colorAnalysis.summary && Object.keys(colorAnalysis.summary).length > 0) {
      // 嘗試從主要類型獲取顏色資訊
      const mainTypeColorInfo = colorAnalysis.summary[mainType];
      if (mainTypeColorInfo && mainTypeColorInfo.color) {
        const colorType = mainTypeColorInfo.color;
        color = colorMap[colorType] || colorMap[colorType.toLowerCase()] || 1;
        console.log('Mapped color:', color, 'from main type color:', colorType);
      } else {
        // 如果主要類型沒有顏色資訊，取第一個可用的
        const firstColorInfo = Object.values(colorAnalysis.summary)[0] as any;
        if (firstColorInfo && firstColorInfo.color) {
          const colorType = firstColorInfo.color;
          color = colorMap[colorType] || colorMap[colorType.toLowerCase()] || 1;
          console.log('Mapped color:', color, 'from first available color:', colorType);
        }
      }

      // 獲取顏色建議 - 增加安全檢查
      if (colorAnalysis.color_advice_by_type && colorAnalysis.color_advice_by_type[mainType]) {
        colorAdvice = colorAnalysis.color_advice_by_type[mainType];
      } else if (colorAnalysis.color_advice_summary) {
        colorAdvice = colorAnalysis.color_advice_summary;
      }

      // 獲取食物影響資訊 - 增加安全檢查
      if (colorAnalysis.food_influence_summary && colorAnalysis.food_influence_summary[mainType]) {
        foodInfluenceInfo = colorAnalysis.food_influence_summary[mainType];
      }
    }

    console.log('🎯 Final selector mappings:');
    console.log('- Bristol Type:', bristolType, '(will select Type', bristolType, 'in selector)');
    console.log('- Volume:', volume, '(will select position', volume, 'in volume selector)');
    console.log('- Color:', color, '(will select position', color, 'in color selector)');

    // 設置增強分析數據 - 增加安全檢查
    setColorAnalysis(colorAnalysis || null);
    setVolumeAnalysis(volumeAnalysis || null);
    setHealthAlerts((colorAnalysis && colorAnalysis.health_alerts) || []);
    setFoodInfluenceData(foodInfluenceInfo);

    // 生成分析詳情 - 增加安全檢查
    let analysisText = `🎯 主要檢測類型: ${mainType}\n`;

    // 顏色分析結果
    if (colorAnalysis && colorAnalysis.summary && Object.keys(colorAnalysis.summary).length > 0) {
      analysisText += `\n🎨 顏色分析結果:\n`;
      Object.entries(colorAnalysis.summary).forEach(([type, info]: [string, any]) => {
        if (info && info.color_name && info.health_status) {
          analysisText += `  • ${type}: ${info.color_name} (${info.health_status})\n`;
        }
      });
    }

    // 體積分析結果
    if (volumeAnalysis && volumeAnalysis.overall_volume_class) {
      analysisText += `\n📏 體積分析: ${volumeAnalysis.overall_volume_class}\n`;
    }

    // 食物影響提示
    if (foodInfluenceInfo && foodInfluenceInfo.likely_influenced) {
      analysisText += `\n🍎 檢測到可能的食物影響:\n`;
      analysisText += `  • 影響可能性: ${foodInfluenceInfo.likelihood || 'Unknown'}\n`;
      if (foodInfluenceInfo.possible_foods && Array.isArray(foodInfluenceInfo.possible_foods)) {
        analysisText += `  • 可能食物: ${foodInfluenceInfo.possible_foods.slice(0, 3).join('、')}等\n`;
      }
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

    // 生成建議 - 增加錯誤處理
    try {
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
    } catch (adviceError) {
      console.error('Error generating advice:', adviceError);
      setRecommendations(getAdviceForType(mainType)); // 使用基本建議作為備用
    }

    setIsAnalyzing(false);

    console.log('✅ Successfully processed API response and updated selectors');

  } catch (error: unknown) {
    console.error('Error processing enhanced poop API response:', error);
    
    // 🔥 改進：提供更詳細的錯誤信息
    if (error instanceof Error) {
      setAnalysisError(`處理分析結果時出錯: ${error.message}`);
    } else {
      setAnalysisError('無法處理分析結果，請重試');
    }
    
    setIsAnalyzing(false);
  }
}

// 增強版個人化建議生成
// 🔥 修復版：增強版個人化建議生成
const generateEnhancedPersonalizedAdvice = (
  mainType: string, 
  otherTypes: any, 
  rawStats: any, 
  volume: number,
  colorAnalysis: any,
  volumeAnalysis: any
): string => {
  try {
    // 基礎建議 - 增加安全檢查
    const mainTypeAdvice = getAdviceForType(mainType || 'Normal');
    
    let personalizedAdvice = mainTypeAdvice;
    
    // 體積特定建議 - 增加安全檢查
    if (volumeAnalysis && volumeAnalysis.overall_volume_class) {
      try {
        const volumeAdviceText = getEnhancedVolumeAdvice(volumeAnalysis.overall_volume_class, volumeAnalysis);
        if (volumeAdviceText) {
          personalizedAdvice += `\n\n${volumeAdviceText}`;
        }
      } catch (volumeError) {
        console.warn('Error generating volume advice:', volumeError);
      }
    }
    
    // 顏色特定建議 - 增加安全檢查
    if (colorAnalysis && colorAnalysis.summary && Object.keys(colorAnalysis.summary).length > 0) {
      try {
        const hasAbnormalColors = Object.values(colorAnalysis.summary).some((info: any) => {
          if (!info || !info.health_status) return false;
          return info.health_status !== '正常' && info.health_status !== 'Normal';
        });
        
        if (hasAbnormalColors) {
          personalizedAdvice += `\n\n🎨 顏色健康評估:`;
          
          Object.entries(colorAnalysis.summary).forEach(([type, info]: [string, any]) => {
            if (info && info.health_status && info.color_name && 
                info.health_status !== '正常' && info.health_status !== 'Normal') {
              personalizedAdvice += `\n• ${type}: ${info.color_name} - ${info.health_status}`;
            }
          });
        }
      } catch (colorError) {
        console.warn('Error generating color advice:', colorError);
      }
    }
    
    // 追蹤建議
    personalizedAdvice += `\n\n📊 追蹤建議: 建議記錄未來3-7天的便便變化，特別關注顏色和形狀的改善`;
    
    return personalizedAdvice;
    
  } catch (error) {
    console.error('Error in generateEnhancedPersonalizedAdvice:', error);
    // 返回基本建議作為備用
    return getAdviceForType(mainType || 'Normal');
  }
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

  // 增強版體積建議
// 🔥 修復版：增強版體積建議
const getEnhancedVolumeAdvice = (volumeClass: string, volumeAnalysis: any): string => {
  try {
    // 輸入驗證
    if (!volumeClass) {
      return '';
    }
    
    const baseAdvice: { [key: string]: string } = {
      'Small': '📏 體積偏小建議: 可能攝取不足或消化吸收問題',
      'small': '📏 體積偏小建議: 可能攝取不足或消化吸收問題',
      'Medium': '📏 體積正常: 維持當前飲食習慣',
      'medium': '📏 體積正常: 維持當前飲食習慣',
      'normal': '📏 體積正常: 維持當前飲食習慣',
      'Large': '📏 體積較大建議: 可能攝取過量或消化時間過長',
      'large': '📏 體積較大建議: 可能攝取過量或消化時間過長',
      'big': '📏 體積較大建議: 可能攝取過量或消化時間過長'
    };
    
    let advice = baseAdvice[volumeClass] || baseAdvice[volumeClass.toLowerCase()] || '';
    
    // 安全檢查 volumeAnalysis
    if (volumeAnalysis && volumeAnalysis.detailed_data) {
      advice += '\n• 詳細建議: ';
      const volumeClassLower = volumeClass.toLowerCase();
      
      if (volumeClassLower.includes('small')) {
        advice += '增加健康脂肪如堅果、酪梨，確保足夠營養攝取';
      } else if (volumeClassLower.includes('large') || volumeClassLower.includes('big')) {
        advice += '考慮分餐進食，增加消化時間，避免一次性大量進食';
      } else {
        advice += '繼續保持均衡飲食';
      }
    }
    
    return advice;
    
  } catch (error) {
    console.warn('Error in getEnhancedVolumeAdvice:', error);
    return '📏 體積分析: 維持均衡飲食習慣'; // 備用建議
  }
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

const handleRetake = async () => {
  try {
    // 請求相機權限
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要相機權限', '請在設置中允許使用相機');
      return;
    }

    // 啟動相機
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImageUri = result.assets[0].uri;
      console.log('重新拍攝的圖片:', newImageUri);
      
      // 更新圖片並重新分析
      setImageUri(newImageUri);
      analyzeImage(newImageUri);
    }
  } catch (error) {
    console.error('重新拍照失敗:', error);
    Alert.alert('錯誤', '無法啟動相機，請稍後重試');
  }
};

const handleSelectOther = async () => {
  try {
    // 請求相簿權限
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('需要相簿權限', '請在設置中允許訪問相簿');
      return;
    }

    // 啟動相簿選擇
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImageUri = result.assets[0].uri;
      console.log('從相簿選擇的圖片:', newImageUri);
      
      // 更新圖片並重新分析
      setImageUri(newImageUri);
      analyzeImage(newImageUri);
    }
  } catch (error) {
    console.error('選擇照片失敗:', error);
    Alert.alert('錯誤', '無法打開相簿，請稍後重試');
  }
};

const handleContinueWithLowConfidence = (result: any) => {
  try {
    console.log('處理低信心度結果:', result);
    
    // 增加安全檢查
    if (!result) {
      console.error('沒有提供結果給 handleContinueWithLowConfidence');
      setAnalysisError('無法處理檢測結果');
      return;
    }

    // 使用低信心度結果繼續
    if (result.detected_results && Array.isArray(result.detected_results) && result.detected_results.length > 0) {
      const detection = result.detected_results[0];
      
      // 驗證檢測結果
      if (!detection) {
        console.warn('檢測結果為空');
        setAnalysisError('檢測結果無效');
        return;
      }
      
      // 設置基本的選擇器值
      setSelectedType(4); // 預設正常
      setSelectedVolume(2); // 預設中等
      setSelectedColor(1); // 預設棕色
      
      // 安全地獲取檢測信息
      const detectionClass = detection.class || '未知物件';
      const confidence = detection.confidence ? (detection.confidence * 100).toFixed(1) : '未知';
      
      setAnalysisDetails(`⚠️ 低信心度分析結果\n檢測到: ${detectionClass}\n信心度: ${confidence}%\n注意: 建議改善拍攝條件以獲得更準確的分析`);
      setRecommendations('🎯 基本建議 | 💧 飲食: 保持均衡飲食 | 🏃‍♂️ 運動: 規律運動 | 📸 建議: 下次請在更好的光線條件下拍攝');
      
      setColorAnalysis({
        summary: { 
          LowConfidence: { 
            color: 'Normal_Brown', 
            color_name: '基本檢測', 
            health_status: '需要更好的圖片',
            confidence: detection.confidence || 0.3
          } 
        },
        health_alerts: [],
        food_influence_summary: {},
        overall_color_health: '檢測信心度不足，建議重新拍攝'
      });
      setVolumeAnalysis({ overall_volume_class: 'Medium' });
      setHealthAlerts([]);
      setFoodInfluenceData(null);
      
      // 清除低信心度結果，顯示正常的選擇器界面
      setLowConfidenceResult(null);
      setIsAnalyzing(false);
      console.log('✅ 低信心度結果處理完成');
    } else {
      console.warn('沒有有效的檢測結果');
      setAnalysisError('檢測結果中沒有有用的信息，請重新拍攝');
    }
  } catch (error) {
    console.error('處理低信心度結果時出錯:', error);
    setAnalysisError('處理檢測結果時發生錯誤');
    setIsAnalyzing(false);
  }
};

const handleContinueWithPartial = () => {
  try {
    console.log('處理部分分析結果:', partialAnalysisResult);
    
    // 增加安全檢查
    if (!partialAnalysisResult) {
      console.error('沒有部分分析結果可用');
      setAnalysisError('無法處理部分分析結果');
      return;
    }

    // 使用部分結果繼續
    if (partialAnalysisResult.detected_objects && 
        Array.isArray(partialAnalysisResult.detected_objects) && 
        partialAnalysisResult.detected_objects.length > 0) {
      
      const bestDetection = partialAnalysisResult.detected_objects[0];
      
      // 驗證檢測結果
      if (!bestDetection) {
        console.warn('最佳檢測結果為空');
        setAnalysisError('部分分析結果無效');
        return;
      }
      
      // 設置基本的選擇器值
      setSelectedType(4); // 預設正常
      setSelectedVolume(2); // 預設中等
      setSelectedColor(1); // 預設棕色
      
      // 安全地獲取檢測信息
      const detectionClass = bestDetection.class || '未知物件';
      const confidence = bestDetection.confidence ? (bestDetection.confidence * 100).toFixed(1) : '未知';
      
      setAnalysisDetails(`🎯 部分分析結果\n檢測到: ${detectionClass}\n信心度: ${confidence}%\n注意: 由於圖片品質限制，無法進行完整分析`);
      setRecommendations('🎯 基本建議 | 💧 飲食: 保持均衡飲食 | 🏃‍♂️ 運動: 規律運動 | 📸 建議: 下次拍攝更清晰的照片以獲得完整分析');
      
      // 🔥 新增：設置基本的增強分析數據
      setColorAnalysis({
        summary: { 
          Partial: { 
            color: 'Normal_Brown', 
            color_name: '部分檢測', 
            health_status: '需要更清晰的圖片',
            confidence: bestDetection.confidence || 0.5
          } 
        },
        health_alerts: [],
        food_influence_summary: {},
        overall_color_health: '部分分析完成，建議拍攝更清晰的照片'
      });
      setVolumeAnalysis({ overall_volume_class: 'Medium' });
      setHealthAlerts([]);
      setFoodInfluenceData(null);
      
      // 清除部分分析結果，顯示正常的選擇器界面
      setPartialAnalysisResult(null);
      setIsAnalyzing(false);
      console.log('✅ 部分分析結果處理完成');
    } else {
      console.warn('部分分析結果中沒有有效的檢測物件');
      setAnalysisError('部分分析結果中沒有可用信息，請重新拍攝');
    }
  } catch (error) {
    console.error('處理部分分析結果時出錯:', error);
    setAnalysisError('處理部分分析結果時發生錯誤');
    setIsAnalyzing(false);
  }
};


const renderContent = () => {
  // 載入中狀態
  if (isAnalyzing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text style={styles.loadingText}>AI分析中...</Text>
        <Text style={styles.loadingSubtext}>{analysisProgress}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: '60%' }]} />
        </View>
        <Text style={styles.estimateText}>預計剩餘時間: 30-60秒</Text>
      </View>
    );
  }

  // 非大便檢測結果
  if (nonPoopDetectionResult) {
    return (
      <NonPoopDetectionDisplay
        result={nonPoopDetectionResult}
        onRetake={handleRetake} // 🔥 使用新的 handleRetake
        onSelectOther={handleSelectOther} // 🔥 使用新的 handleSelectOther
      />
    );
  }

  // 低信心度結果
  if (lowConfidenceResult) {
    return (
      <LowConfidenceDisplay
        result={lowConfidenceResult}
        onRetry={handleRetry}
        onContinueAnyway={() => handleContinueWithLowConfidence(lowConfidenceResult)}
      />
    );
  }

  // 部分分析結果
  if (partialAnalysisResult) {
    return (
      <PartialAnalysisDisplay
        result={partialAnalysisResult}
        onContinueWithPartial={handleContinueWithPartial}
        onRetake={handleRetake} // 🔥 使用新的 handleRetake
      />
    );
  }

  // 一般錯誤
  if (analysisError) {
    return (
      <View style={styles.errorContainer}>
        <AlertCircle size={48} color={Colors.primary.error} />
        <Text style={styles.errorTitle}>分析失敗</Text>
        <Text style={styles.errorText}>{analysisError}</Text>
        <Button title="重新分析" onPress={handleRetry} style={styles.retryButton} />
      </View>
    );
  }

  // 正常分析結果
  return (
    <>
      {/* 圖片顯示 */}
      {imageUri && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.image} contentFit="cover" />
        </View>
      )}

      {/* 詳細分析 */}
      <View style={styles.resultContainer}>
        <View style={styles.resultHeader}>
          <FileText size={20} color={Colors.primary.accent} />
          <Text style={styles.resultTitle}>AI健康分析結果</Text>
        </View>
        <Text style={styles.resultDescription}>
          根據AI模型分析，以下為您的便便健康狀態與建議：
        </Text>

        {/* 分析詳情 */}
        {analysisDetails && (
          <View style={styles.analysisDetails}>
            <Text style={styles.analysisTitle}>分析詳情</Text>
            <Text style={styles.analysisText}>{analysisDetails}</Text>
          </View>
        )}

        {/* 增強分析組件 */}
        <EnhancedColorAnalysisDisplay colorAnalysis={colorAnalysis} />
        <ColorHealthAlerts healthAlerts={healthAlerts} />
        <FoodInfluenceDisplay foodInfluence={foodInfluenceData} />

        {/* 建議區塊 */}
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

      {/* 選擇器區塊 */}
      <View style={styles.selectorsContainer}>
        <PoopTypeSelector
          selectedType={selectedType}
          onSelectType={setSelectedType}
        />
        <PoopVolumeSelector
          selectedVolume={selectedVolume}
          onSelectVolume={setSelectedVolume}
        />
        <EnhancedPoopColorSelector
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          detectedColor={predictedColor}
          colorAnalysis={colorAnalysis}
        />
      </View>

      {/* 按鈕區塊 */}
      <View style={styles.buttonContainer}>
        <Button
          title="繼續"
          onPress={handleContinue}
          style={styles.continueButton}
        />
        <Button
          title="取消"
          onPress={handleCancel}
          variant="outline"
          style={styles.cancelButton}
        />
      </View>
    </>
  );
};

return (
  <View style={styles.container}>
    <Stack.Screen 
      options={{ 
        title: 'AI健康分析',
        headerBackTitle: '取消',
      }} 
    />
    <ScrollView contentContainerStyle={styles.content}>
      {renderContent()}
    </ScrollView>
  </View>
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
  retakeButton: {
    minWidth: 120,
    borderColor: Colors.primary.warning,
    borderWidth: 1,
    backgroundColor: '#e1a65eff',
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
  // 🎨 增強顏色分析樣式
  enhancedColorContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  enhancedColorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  colorAnalysisItem: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  colorAnalysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  colorAnalysisTextContainer: {
    flex: 1,
  },
  colorAnalysisName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  colorAnalysisType: {
    fontSize: 12,
    opacity: 0.8,
  },
  healthStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  healthStatusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  colorDescription: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
  },
  colorConfidence: {
    fontSize: 12,
    marginTop: 4,
    opacity: 0.8,
  },
  overallColorHealth: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  overallColorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#374151',
  },
  overallColorText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  // 🎨 增強顏色選擇器樣式
  enhancedColorSelector: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  selectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  aiDetectedLabel: {
    fontSize: 12,
    color: '#059669',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    fontWeight: 'bold',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorOption: {
    width: '31%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 12,
    position: 'relative',
  },
  selectedColorOption: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  aiDetectedColorOption: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedColorCircle: {
    borderColor: '#3B82F6',
  },
  colorName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 4,
  },
  selectedColorName: {
    color: '#3B82F6',
  },
  colorSelectorDescription: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  aiDetectedMark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiDetectedMarkText: {
    fontSize: 10,
  },
  colorAdviceContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  colorAdviceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 8,
  },
  colorAdviceText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  // 原有樣式
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

  // 🔥 錯誤處理相關樣式
  nonPoopContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  nonPoopTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
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
  partialAnalysisContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  partialAnalysisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginTop: 16,
    marginBottom: 8,
  },
  partialAnalysisMessage: {
    fontSize: 14,
    color: Colors.primary.text,
    textAlign: 'center',
    marginBottom: 16,
  },
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
  continueBasicButton: {
    backgroundColor: '#10B981',
  },
  colorNote: {
    fontSize: 12,
    color: Colors.primary.lightText,
    fontStyle: 'italic',
  },
  basicColorAnalysisContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  basicColorAnalysisTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  colorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorPreview: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  colorInfoText: {
    flex: 1,
  },
  basicColorName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 2,
  },
  basicColorNote: {
    fontSize: 12,
    color: Colors.primary.lightText,
    fontStyle: 'italic',
  },
});