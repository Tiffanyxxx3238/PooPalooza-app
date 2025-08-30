import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import PoopTypeSelector from '@/components/PoopTypeSelector';
import PoopVolumeSelector from '@/components/PoopVolumeSelector';
import { poopTypes, poopVolumes, poopColors } from '@/constants/poopTypes';
import { FileText, Check, AlertCircle, Eye } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

// 在 import 區塊後加入
const HEALTH_ADVISOR_API_URL = 'https://poop-analysis-recommendation-system.onrender.com'; 
// Configuration for detection
const DETECTION_CONFIG = {
  test_owl_first: true,  // 是否先進行 OWL-ViT 預檢測
  show_owl_confidence: true,  // 是否顯示 OWL-ViT 信心度
};

// Helper functions
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
// Component to display structured recommendations
const RecommendationDisplay = ({ recommendations, bristolType, isEnglish }: { 
  recommendations: string, 
  bristolType: number, 
  isEnglish: boolean 
}) => {
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
        zh: '🔴 嚴重腹瀉緊急 | 💧 緊急處理: 立即補充水分與電解質防止脫水，暫時避免乳製品、高脂肪、辛辣及高纖維食物，攝取易消化食物（白飯、香蕉、吐司） | 🏥 就醫建議: 若腹瀉超過48小時或有脫水、血便等症狀應儘速就醫 | ⚠️ 危險信號: 水狀無固體需立即關注',
        en: '🔴 Severe Diarrhea Emergency | 💧 Emergency Care: Immediately replenish fluids and electrolytes to prevent dehydration, temporarily avoid dairy, high-fat, spicy and high-fiber foods, eat easily digestible foods (white rice, bananas, toast) | 🏥 Medical Advice: If diarrhea persists over 48 hours or symptoms of dehydration/bloody stool appear, seek medical attention immediately | ⚠️ Danger Sign: Watery with no solid pieces requires immediate attention'
      }
    };
    return translations[String(bristolType)] ? (isEnglish ? translations[String(bristolType)].en : translations[String(bristolType)].zh) : recommendations;
  };

  // Use translated advice if available, otherwise use original
  const displayAdvice = recommendations; 

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
// 🦉 OWL-ViT 檢測顯示組件
const OwlDetectionDisplay = ({ owlConfidence, detectionMethod }: { 
  owlConfidence: number, 
  detectionMethod: string 
}) => {
  if (detectionMethod !== "dual_model" && detectionMethod !== "owl_vit_only" && detectionMethod !== "owl_vit") {
    return null;
  }
  
  return (
    <View style={styles.owlDetectionContainer}>
      <View style={styles.owlHeader}>
        <Text style={styles.owlIcon}>🦉</Text>
        <Text style={styles.owlTitle}>Object Verification</Text>
      </View>
      <View style={styles.owlConfidenceBar}>
        <View 
          style={[
            styles.owlConfidenceFill, 
            { 
              width: `${owlConfidence * 100}%`,
              backgroundColor: owlConfidence > 0.5 ? '#10B981' : '#F59E0B'
            }
          ]} 
        />
      </View>
      <Text style={styles.owlConfidenceText}>
        Poop Detection Confidence: {(owlConfidence * 100).toFixed(1)}%
      </Text>
      {detectionMethod === "dual_model" && (
        <Text style={styles.owlNote}>
          ✅ Verified as poop - proceeding with detailed analysis
        </Text>
      )}
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
      'Normal_Brown': '#8B4513',
      'Dark_Tone': '#654321',
      'Light_Tone': '#D2B48C',
      'Yellowish': '#DAA520',
      'Greenish': '#8FBC8F',
      'Reddish': '#CD5C5C',
      'Very_Dark': '#2F2F2F',
      'Black': '#000000',
    };
    return colorMapping[colorType] || '#8B4513';
  };

  // 健康狀態對應的顏色
  const getHealthStatusColor = (status: string) => {
    if (status.includes('正常') || status.includes('Normal')) {
      return { bg: '#DCFCE7', border: '#4ADE80', text: '#14532D' };
    } else if (status.includes('注意') || status.includes('Warning') || status.includes('Attention')) {
      return { bg: '#FEF3C7', border: '#FCD34D', text: '#92400E' };
    } else if (status.includes('異常') || status.includes('Alert') || status.includes('Abnormal')) {
      return { bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' };
    }
    return { bg: '#F3F4F6', border: '#D1D5DB', text: '#374151' };
  };

  return (
    <View style={styles.enhancedColorContainer}>
      <Text style={styles.enhancedColorTitle}>🎨 Detailed Color Analysis</Text>
      
      {Object.entries(colorAnalysis.summary).map(([type, info]: [string, any], index) => {
        const healthColors = getHealthStatusColor(info.health_status || 'Normal');
        const visualColor = getVisualColor(info.color || info.detected_color_type || 'Normal_Brown');
        
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
              <View 
                style={[
                  styles.colorDot,
                  { backgroundColor: visualColor }
                ]} 
              />
              <View style={styles.colorAnalysisTextContainer}>
                <Text style={[styles.colorAnalysisName, { color: healthColors.text }]}>
                  {info.color_name || info.color || 'Normal Brown'}
                </Text>
                <Text style={[styles.colorAnalysisType, { color: healthColors.text }]}>
                  Type: {type}
                </Text>
              </View>
              <View style={styles.healthStatusBadge}>
                <Text style={[styles.healthStatusText, { color: healthColors.text }]}>
                  {info.health_status || 'Normal'}
                </Text>
              </View>
            </View>
            
            {info.description && (
              <Text style={styles.colorDescription}>
                📋 {info.description}
              </Text>
            )}
            
            {info.confidence !== undefined && (
              <Text style={styles.colorConfidence}>
                🎯 Detection Confidence: {(info.confidence * 100).toFixed(1)}%
              </Text>
            )}
          </View>
        );
      })}
      
      {colorAnalysis.overall_color_health && (
        <View style={styles.overallColorHealth}>
          <Text style={styles.overallColorTitle}>🏥 Overall Color Health Assessment</Text>
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
    { id: 1, name: 'Brown', color: '#8B4513', description: 'Normal & Healthy' },
    { id: 2, name: 'Dark Brown', color: '#654321', description: 'Possible Dehydration' },
    { id: 3, name: 'Light Brown', color: '#D2B48C', description: 'Fast Digestion' },
    { id: 4, name: 'Yellow', color: '#DAA520', description: 'High Fat Content' },
    { id: 5, name: 'Green', color: '#8FBC8F', description: 'Bile or Vegetables' },
    { id: 6, name: 'Red', color: '#CD5C5C', description: 'Needs Attention' },
    { id: 7, name: 'Black', color: '#2F2F2F', description: 'Needs Examination' },
  ];

  return (
    <View style={styles.enhancedColorSelector}>
      <View style={styles.selectorHeader}>
        <Text style={styles.selectorTitle}>💩 Poop Color</Text>
        {detectedColor && (
          <Text style={styles.aiDetectedLabel}>
            🤖 AI Detected: {colors[detectedColor - 1]?.name}
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
              
              {isAIDetected && (
                <View style={styles.aiDetectedMark}>
                  <Text style={styles.aiDetectedMarkText}>🤖</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
      
      {colorAnalysis?.color_advice_summary && (
        <View style={styles.colorAdviceContainer}>
          <Text style={styles.colorAdviceTitle}>💡 Color Advice</Text>
          <Text style={styles.colorAdviceText}>
            {colorAnalysis.color_advice_summary}
          </Text>
        </View>
      )}
    </View>
  );
};

// 食物影響顯示組件
const FoodInfluenceDisplay = ({ foodInfluence }: { foodInfluence: any }) => {
  if (!foodInfluence || !foodInfluence.likely_influenced) {
    return null;
  }
  
  return (
    <View style={styles.foodInfluenceContainer}>
      <Text style={styles.foodInfluenceTitle}>🍎 Possible Food Influence</Text>
      <Text style={styles.foodInfluenceText}>
        Possibility of Influence: {foodInfluence.likelihood}
      </Text>
      <Text style={styles.foodInfluenceText}>
        Possible Foods: {foodInfluence.possible_foods?.slice(0, 3).join(', ')} etc.
      </Text>
      <Text style={styles.foodInfluenceText}>
        Duration:  {foodInfluence.duration}
      </Text>
      <Text style={styles.foodInfluenceAdvice}>
        {foodInfluence.recommendation}
      </Text>
    </View>
  );
};

// 顏色健康警告組件
const ColorHealthAlerts = ({ healthAlerts }: { healthAlerts: any[] }) => {
  if (!healthAlerts || healthAlerts.length === 0) {
    return null;
  }
  
  return (
    <View style={styles.healthAlertsContainer}>
      <Text style={styles.healthAlertsTitle}>⚠️ Color Health Alerts</Text>
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
// 🦉 改進的非大便檢測顯示組件
const SmartNonPoopDetectionDisplay = ({ result, onRetake, onSelectOther }: { 
  result: any, 
  onRetake: () => void, 
  onSelectOther: () => void 
}) => {
  const getDisplayContent = () => {
    // 根據檢測方法顯示不同內容
    if (result.detection_method === 'owl_vit') {
      return {
        icon: '🦉',
        title: 'Not Poop Detected',
        message: `AI Verification: This doesn't appear to be poop (Confidence: ${((result.owl_confidence || 0) * 100).toFixed(1)}%)`,
        suggestion: 'Please upload a clear photo of actual poop for health analysis',
        color: '#F59E0B'
      };
    }
    
    switch (result.type) {
      case 'no_objects':
        return {
          icon: '🔍',
          title: '未檢測到物體',
          message: result.message,
          suggestion: result.suggestion,
          color: '#F59E0B'
        };
        
      case 'wrong_objects':
        return {
          icon: '🚫',
          title: '檢測到其他物體',
          message: result.message,
          suggestion: result.suggestion,
          color: '#EF4444'
        };
        
      default:
        return {
          icon: '❓',
          title: '無法識別',
          message: result.message,
          suggestion: result.suggestion,
          color: '#6B7280'
        };
    }
  };
  
  const displayContent = getDisplayContent();
  
  return (
    <View style={[styles.nonPoopContainer, { borderColor: displayContent.color }]}>
      <Text style={{ fontSize: 48 }}>{displayContent.icon}</Text>
      <Text style={[styles.nonPoopTitle, { color: displayContent.color }]}>
        {displayContent.title}
      </Text>
      <Text style={styles.nonPoopMessage}>
        {displayContent.message}
      </Text>
      
      {/* 顯示 OWL-ViT 信心度 */}
      {result.owl_confidence !== undefined && (
        <View style={styles.owlConfidenceContainer}>
          <Text style={styles.owlConfidenceLabel}>Object Detection Score:</Text>
          <View style={styles.owlConfidenceBarSmall}>
            <View 
              style={[
                styles.owlConfidenceFillSmall,
                { 
                  width: `${result.owl_confidence * 100}%`,
                  backgroundColor: result.owl_confidence > 0.2 ? '#F59E0B' : '#EF4444'
                }
              ]}
            />
          </View>
          <Text style={styles.owlConfidenceValue}>
            {(result.owl_confidence * 100).toFixed(1)}%
          </Text>
        </View>
      )}
      
      {/* 顯示檢測到的物體 */}
      {result.detected_objects && result.detected_objects.length > 0 && (
        <View style={styles.detectedObjectsContainer}>
          <Text style={styles.detectedObjectsTitle}>檢測到的物體：</Text>
          {result.detected_objects.slice(0, 3).map((obj: any, index: number) => (
            <Text key={index} style={styles.detectedObjectItem}>
              • {obj.class} ({(obj.confidence * 100).toFixed(1)}%)
            </Text>
          ))}
        </View>
      )}
      
      {/* 基本顏色分析 */}
      {result.basic_color_info && (
        <View style={styles.basicColorAnalysisContainer}>
          <Text style={styles.basicColorAnalysisTitle}>🎨 基本顏色分析</Text>
          <View style={styles.colorInfoRow}>
            <View 
              style={[
                styles.colorPreview,
                { backgroundColor: result.basic_color_info.hex || result.basic_color_info.hex_color || '#8B4513' }
              ]} 
            />
            <View style={styles.colorInfoText}>
              <Text style={styles.basicColorName}>
                {result.basic_color_info.color_name || 'Unknown Color'}
              </Text>
              <Text style={styles.basicColorNote}>
                {result.basic_color_info.note || 'Color analysis result'}
              </Text>
            </View>
          </View>
        </View>
      )}
      
      <Text style={styles.suggestionText}>{displayContent.suggestion}</Text>
      
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
};

// 低信心度結果顯示組件
const LowConfidenceDisplay = ({ result, onRetry, onContinueAnyway }: { 
  result: any, 
  onRetry: () => void, 
  onContinueAnyway: () => void 
}) => (
  <View style={styles.lowConfidenceContainer}>
    <AlertCircle size={48} color={Colors.primary.accent} />
    <Text style={styles.lowConfidenceTitle}>Photo Needs Improvement</Text>
    <Text style={styles.lowConfidenceMessage}>
      Photo quality is not clear enough. We recommend retaking for more accurate analysis results
    </Text>
    
    <Text style={styles.suggestionText}>{result.suggestion}</Text>
    
    <View style={styles.improvementTips}>
      <Text style={styles.improvementTitle}>Improvement Tips：</Text>
      <Text style={styles.improvementTip}>• Ensure photo is clear and focused</Text>
      <Text style={styles.improvementTip}>• Provide sufficient lighting</Text>
      <Text style={styles.improvementTip}>• Avoid shadows covering the subject</Text>
      <Text style={styles.improvementTip}>• Maintain appropriate shooting distance</Text>
    </View>
    
    <View style={styles.actionButtonsContainer}>
      <Button
        title="Retry Analysis"
        onPress={onRetry}
        style={styles.retryButton}
      />
      <Button
        title="Use Current Result"
        onPress={onContinueAnyway}
        variant="outline"
        style={styles.continueAnywayButton}
      />
    </View>
  </View>
);

// 部分分析結果顯示組件
const PartialAnalysisDisplay = ({ result, onContinueWithPartial, onRetake }: { 
  result: any, 
  onContinueWithPartial: () => void, 
  onRetake: () => void 
}) => (
  <View style={styles.partialAnalysisContainer}>
    <Check size={48} color={Colors.primary.success || '#10B981'} />
    <Text style={styles.partialAnalysisTitle}>Analysis Complete</Text>
    <Text style={styles.partialAnalysisMessage}>
      Basic analysis completed. You can continue recording or retake for a clearer photo
    </Text>
    
    <Text style={styles.suggestionText}>{result.suggestion}</Text>
    
    <View style={styles.actionButtonsContainer}>
      <Button
        title="Use This Result"
        onPress={onContinueWithPartial}
        style={styles.continueBasicButton}
      />
      <Button
        title="Retake Photo"
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
  
  // 分析狀態
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState('Preparing analysis...');
  
  // 預測和選擇的值
  const [predictedType, setPredictedType] = useState<number>(4);
  const [predictedVolume, setPredictedVolume] = useState<number>(2);
  const [predictedColor, setPredictedColor] = useState<number>(1);
  
  const [selectedType, setSelectedType] = useState<number>(4);
  const [selectedVolume, setSelectedVolume] = useState<number>(2);
  const [selectedColor, setSelectedColor] = useState<number>(1);
  
  // 分析結果
  const [analysisDetails, setAnalysisDetails] = useState<string>('');
  const [recommendations, setRecommendations] = useState<string>('');
  
  // 增強分析數據
  const [colorAnalysis, setColorAnalysis] = useState<any>(null);
  const [volumeAnalysis, setVolumeAnalysis] = useState<any>(null);
  const [healthAlerts, setHealthAlerts] = useState<any[]>([]);
  const [foodInfluenceData, setFoodInfluenceData] = useState<any>(null);
  
  // 🦉 OWL-ViT 相關狀態
  const [owlConfidence, setOwlConfidence] = useState<number>(0);
  const [detectionMethod, setDetectionMethod] = useState<string>('');

  // 錯誤處理相關狀態
  const [nonPoopDetectionResult, setNonPoopDetectionResult] = useState<any>(null);
  const [lowConfidenceResult, setLowConfidenceResult] = useState<any>(null);
  const [partialAnalysisResult, setPartialAnalysisResult] = useState<any>(null);

  useEffect(() => {
    if (params.imageUri) {
      setImageUri(params.imageUri);
      analyzeImage(params.imageUri);
    }
  }, [params.imageUri]);

  // 定義 AI 建議的類型
interface AIHealthAdvice {
  healthStatus?: {
    level: 'excellent' | 'good' | 'attention' | 'warning' | 'critical';
    summary: string;
    score: number;
    confidence?: number;
    mainConcern?: string;
    positiveAspects?: string;
  };
  dietaryAdvice?: {
    immediateActions?: string[];
    recommendations?: string[];
    avoidFoods?: string[];
    waterIntake?: string;
    mealPlan?: {
      breakfast: string;
      lunch: string;
      dinner: string;
      snacks?: string;
    };
  };
  lifestyleAdvice?: {
    exercise?: {
      type: string;
      duration: string;
      frequency: string;
      bestTime?: string;
    };
    stress?: {
      techniques?: string[];
      dailyPractice?: string;
    };
  };
  warningSignals?: string[];
  followUp?: {
    nextCheck: string;
    frequency: string;
  };
  personalizedTips?: string[];
  motivationalMessage?: string;
  urgencyLevel?: string;
}

const fetchAIHealthAdvice = async (
  bristolType: number,
  colorAnalysis: any,
  volumeAnalysis: any
): Promise<string> => {
  try {
    console.log('🤖 Fetching AI health advice from:', HEALTH_ADVISOR_API_URL);
    console.log('Sending Bristol Type:', bristolType);
    
    const response = await fetch(`${HEALTH_ADVISOR_API_URL}/api/health-advice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bristolType,
        colorAnalysis: colorAnalysis || {},
        volumeAnalysis: volumeAnalysis || {},
        userProfile: null,
        previousRecords: []
      })
    });

    const data = await response.json();
    
    // DEBUG: Log the entire response structure
    console.log('Full API Response:', JSON.stringify(data, null, 2));
    
    // Check different possible response structures
    if (data.success && data.advice) {
      console.log('Found advice in data.advice');
      return formatComprehensiveAIAdvice(data.advice);
    } else if (data.advice) {
      console.log('Found advice directly');
      return formatComprehensiveAIAdvice(data.advice);
    } else if (data) {
      console.log('Using entire data as advice');
      return formatComprehensiveAIAdvice(data);
    }
    
    console.error('Response structure:', Object.keys(data));
    throw new Error('No advice in response');
    
  } catch (error) {
    console.error('Failed to get AI advice:', error);
    throw error;
  }
};

const formatComprehensiveAIAdvice = (aiAdvice: any): string => {
  if (!aiAdvice) return '';
  
  let text = '';
  
  // Health Status Section - Clear and prominent
  if (aiAdvice.healthStatus) {
    const { level, summary, score, mainConcern, positiveAspects } = aiAdvice.healthStatus;
    const levelEmojis: Record<string, string> = {
      'excellent': '🎉', 'good': '🟢', 'attention': '🟡', 
      'warning': '🟠', 'critical': '🔴'
    };
    
    // Score and status in one line
    text += `${levelEmojis[level] || '📊'} Health Score: ${score}/100 (${level.toUpperCase()})\n\n`;
    
    // Key points with clear labels
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
  
  // Immediate Actions - High priority, easy to scan
  if (aiAdvice.dietaryAdvice?.immediateActions?.length > 0) {
    text += '🚨 DO NOW (Today):\n';
    aiAdvice.dietaryAdvice.immediateActions.forEach((action: string, index: number) => {
      text += `${index + 1}. ${action}\n`;
    });
    text += '\n';
  }
  
  // Daily Plan - Structured and clear
  text += '📅 DAILY PLAN:\n\n';
  
  // Diet in bullet points
  if (aiAdvice.dietaryAdvice?.recommendations?.length > 0) {
    text += '🍽️ Diet Changes:\n';
    aiAdvice.dietaryAdvice.recommendations.slice(0, 3).forEach((rec: string, index: number) => {
      text += `• ${rec}\n`;
    });
    text += '\n';
  }
  
  // Water - Simple and clear
  if (aiAdvice.dietaryAdvice?.waterIntake) {
    text += `💧 Water: ${aiAdvice.dietaryAdvice.waterIntake}\n\n`;
  }
  
  // Exercise - Formatted for clarity
  if (aiAdvice.lifestyleAdvice?.exercise) {
    const ex = aiAdvice.lifestyleAdvice.exercise;
    text += '🏃 Exercise:\n';
    text += `• Type: ${ex.type}\n`;
    text += `• Duration: ${ex.duration}\n`;
    text += `• Frequency: ${ex.frequency}\n`;
    if (ex.specific) {
      text += `• Special tip: ${ex.specific}\n`;
    }
    text += '\n';
  }
  
  // Natural Remedies - Optional but helpful
  if (aiAdvice.naturalRemedies?.length > 0) {
    const remedy = aiAdvice.naturalRemedies[0];
    text += `🌿 Natural Remedy:\n`;
    text += `Try ${remedy.name} - ${remedy.method}\n`;
    text += `Benefit: ${remedy.benefit}\n\n`;
  }
  
  // Quick Tips - Easy to remember
  if (aiAdvice.personalizedTips?.length > 0) {
    text += '💡 QUICK TIPS:\n';
    aiAdvice.personalizedTips.slice(0, 3).forEach((tip: string, index: number) => {
      // Shorten tips if they're too long
      const shortTip = tip.length > 80 ? tip.substring(0, 77) + '...' : tip;
      text += `${index + 1}. ${shortTip}\n`;
    });
    text += '\n';
  }
  
  // Follow-up - Important but brief
  if (aiAdvice.followUp?.nextCheck) {
    text += `📆 Next Check: ${aiAdvice.followUp.nextCheck}\n`;
  }
  
  // Doctor consultation if needed - Alert style
  if (aiAdvice.doctorConsultation?.needed) {
    text += `\n🏥 DOCTOR VISIT RECOMMENDED\n`;
    text += `Reason: ${aiAdvice.doctorConsultation.reason}\n`;
  }
  
  // Motivational message - End on positive note
  if (aiAdvice.motivationalMessage) {
    // Shorten if too long
    const shortMessage = aiAdvice.motivationalMessage.length > 150 
      ? aiAdvice.motivationalMessage.substring(0, 147) + '...' 
      : aiAdvice.motivationalMessage;
    text += `\n💪 ${shortMessage}`;
  }
  
  return text.trim();
};

  const analyzeImage = async (uri: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    // 確保清除所有錯誤狀態
    setNonPoopDetectionResult(null);
    setLowConfidenceResult(null);
    setPartialAnalysisResult(null);
    setAnalysisProgress('Preparing analysis...');
    
    // 重置分析結果
    setColorAnalysis(null);
    setVolumeAnalysis(null);
    setHealthAlerts([]);
    setFoodInfluenceData(null);
    setOwlConfidence(0);
    setDetectionMethod('');
    
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
// 🦉 增強的 API 調用函數（包含 OWL-ViT）
  const analyzeWithPoopAPI = async (imageUri: string) => {
    try {
      console.log('Calling enhanced poop-api with OWL-ViT for analysis...');
      console.log('API URL: https://poop-api.onrender.com/analyze');
      console.log('Image URI:', imageUri);
      
      setAnalysisProgress('Verifying image content with AI...');
      
      const imageType = getImageType(imageUri);
      const fileName = getFileName(imageUri);
      
      console.log(`🔍 Detected image type: ${imageType}, filename: ${fileName}`);
      
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: imageType,
        name: fileName
      } as any);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        setAnalysisProgress('Request timeout, using backup analysis...');
      }, 300000); // 5分鐘

      // 🦉 可選：先進行 OWL-ViT 預檢測
      if (DETECTION_CONFIG.test_owl_first) {
        try {
          setAnalysisProgress('Performing object detection...');
          
          const owlController = new AbortController();
          const owlTimeoutId = setTimeout(() => {
            owlController.abort();
          }, 30000); // 30秒
          
          const owlResponse = await fetch('https://poop-api.onrender.com/test_owl_vit', {
            method: 'POST',
            body: formData,
            signal: owlController.signal
          });
          
          clearTimeout(owlTimeoutId);
          
          if (owlResponse.ok) {
            const owlResult = await owlResponse.json();
            console.log('🦉 OWL-ViT pre-check:', owlResult);
            
            if (!owlResult.is_poop) {
              // 不是大便，直接返回
              setIsAnalyzing(false);
              setNonPoopDetectionResult({
                type: 'wrong_objects',
                error: "Not poop detected by OWL-ViT",
                message: `AI confidence: ${(owlResult.max_score * 100).toFixed(1)}% - This doesn't appear to be poop`,
                suggestion: "Please upload a clear photo of actual poop",
                owl_confidence: owlResult.max_score,
                detection_method: "owl_vit"
              });
              clearTimeout(timeoutId);
              return;
            }
            
            // 保存 OWL-ViT 信心度
            setOwlConfidence(owlResult.max_score);
          }
        } catch (owlError) {
          console.log('OWL-ViT pre-check skipped:', owlError);
        }
      }

      // 主要分析請求
      setAnalysisProgress('Analyzing poop characteristics...');
      
      try {
        console.log('🔍 開始上傳圖片進行分析...');
        
        const response = await fetch('https://poop-api.onrender.com/analyze', {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          
          console.log('📋 API Response Details:', {
            status: response.status,
            errorText: errorText
          });
          
          if (response.status === 400) {
            try {
              const errorJson = JSON.parse(errorText);
              console.log('✅ 解析到400回應:', errorJson);
              
              // 🦉 處理 OWL-ViT 檢測到非大便的情況
              if (errorJson.detection_method === "owl_vit") {
                handleNonPoopDetection(errorJson);
                return;
              }
              
              // 處理其他結構化錯誤
              if (errorJson.error && (
                  errorJson.error === "No objects detected" ||
                  errorJson.error === "No poop detected" ||
                  errorJson.error === "Low confidence detection" ||
                  errorJson.error === "Unclear image content"
              )) {
                handleStructuredError(errorJson);
                return;
              }
              
              throw new Error(`API error: ${response.status} - ${errorJson.message || errorJson.error}`);
              
            } catch (parseError) {
              console.warn('無法解析400錯誤JSON:', parseError);
              throw new Error(`Server response format error: ${errorText}`);
            }
          }
          
          if (response.status === 503) {
            console.log('🔄 Service unavailable (503), using fallback');
            setAnalysisProgress('Service temporarily unavailable, using backup analysis...');
            throw new Error('Service temporarily unavailable');
          }
          
          throw new Error(`API error: ${response.status} - ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ SUCCESS! API response:', result);
        
        setAnalysisProgress('Analysis complete! Processing results...');
        
        // 🦉 處理增強的分析結果
        processEnhancedAnalysisResult(result);
        
      } catch (fetchError: unknown) {
        clearTimeout(timeoutId);
        console.error('❌ API請求失敗:', fetchError);
        
        if (fetchError instanceof Error && fetchError.name === 'AbortError') {
          setAnalysisProgress('Request timeout, using general AI...');
        } else {
          setAnalysisProgress('API request failed, using backup analysis...');
        }
        
        throw fetchError;
      }
      
    } catch (error: unknown) {
      console.error('❌ Enhanced Poop API analysis error:', error);
      
      if (error instanceof Error && 
          (error.message.includes('Server temporarily unavailable') || 
           error.message.includes('503') ||
           error.message.includes('timeout'))) {
        
        console.log('🔄 檢測到服務器問題，使用智能備用分析');
        setAnalysisProgress('Server issue detected, using backup analysis...');
        
        try {
          await mockAnalysisWithRealData();
          return;
        } catch (mockError) {
          console.error('備用分析也失敗:', mockError);
          setAnalysisError('Analysis failed, please try again');
          setIsAnalyzing(false);
          return;
        }
      }
      
      setAnalysisProgress('Using fallback analysis...');
      try {
        await mockAnalysisWithRealData();
      } catch (fallbackError) {
        setAnalysisError('All analysis methods failed, please try again');
        setIsAnalyzing(false);
      }
    }
  };
// 🦉 處理非大便檢測
  const handleNonPoopDetection = (result: any) => {
    setIsAnalyzing(false);
    setNonPoopDetectionResult({
      type: 'non_poop',
      error: result.error,
      message: result.message,
      suggestion: result.suggestion,
      owl_confidence: result.owl_confidence,
      detection_method: result.detection_method,
      basic_color_info: result.color_analysis || result.basic_color_info
    });
  };

  // 🦉 處理增強分析結果
  const processEnhancedAnalysisResult = (result: any) => {
    try {
      // 保存檢測方法和 OWL-ViT 信心度
      if (result.detection_method) {
        setDetectionMethod(result.detection_method);
      }
      
      if (result.confidence) {
        const owlConf = result.confidence.owl_vit || 0;
        const yoloConf = result.confidence.yolo || 0;
        const smartConf = result.confidence.smart || 0;
        
        setOwlConfidence(owlConf);
        
        // 顯示雙模型信心度
        let detailsText = `🎯 Detection Confidence:\n`;
        
        if (owlConf > 0) {
          detailsText += `🦉 OWL-ViT: ${(owlConf * 100).toFixed(1)}% (Poop verified)\n`;
        }
        
        if (yoloConf > 0) {
          detailsText += `🤖 YOLO: ${(yoloConf * 100).toFixed(1)}%\n`;
        }
        
        if (smartConf > 0) {
          detailsText += `🧠 Smart Analysis: ${(smartConf * 100).toFixed(1)}%\n`;
        }
        
        detailsText += `Detection Method: ${result.detection_method}\n\n`;
        detailsText += `Main Type: ${result.main_type}`;
        
        setAnalysisDetails(detailsText);
      }
      
      // 處理其餘的分析結果
      processEnhancedPoopAPIResponse(result);
      
    } catch (error) {
      console.error('Error processing enhanced analysis result:', error);
      processEnhancedPoopAPIResponse(result); // 降級處理
    }
  };

  // 修復版錯誤處理函數
  const handleStructuredError = (errorResponse: any) => {
    console.log('📋 Handling structured error:', errorResponse);
    
    setAnalysisError(null);
    setNonPoopDetectionResult(null);
    setLowConfidenceResult(null);
    setPartialAnalysisResult(null);
    
    setIsAnalyzing(false);
    
    switch (errorResponse.error) {
      case "No objects detected":
      case "No poop detected":
        setNonPoopDetectionResult({
          type: errorResponse.error === "No objects detected" ? 'no_objects' : 'wrong_objects',
          error: errorResponse.error,
          message: errorResponse.message,
          suggestion: errorResponse.suggestion,
          detected_objects: errorResponse.detected_objects || [],
          basic_color_info: errorResponse.basic_color_info || errorResponse.color_analysis,
          owl_confidence: errorResponse.owl_confidence,
          detection_method: errorResponse.detection_method
        });
        break;
        
      case "Low confidence detection":
        setLowConfidenceResult({
          type: 'low_confidence',
          error: errorResponse.error,
          message: errorResponse.message,
          suggestion: errorResponse.suggestion,
          detected_results: errorResponse.detected_results || [],
          basic_color_info: errorResponse.basic_color_info
        });
        break;
        
      case "Unclear image content":
        setPartialAnalysisResult({
          type: 'unclear_content',
          error: errorResponse.error,
          message: errorResponse.message,
          suggestion: errorResponse.suggestion,
          basic_color_info: errorResponse.basic_color_info
        });
        break;
        
      default:
        setAnalysisError(`Analysis issue: ${errorResponse.message || errorResponse.error}`);
        break;
    }
  };
// 處理增強的 API 響應
  async function processEnhancedPoopAPIResponse(result: any) {
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
      const smartAnalysis = result.smart_analysis || {};
      
      console.log('Main type from API:', mainType);
      console.log('Volume analysis:', volumeAnalysis);
      console.log('Color analysis:', colorAnalysis);

      // Bristol type 映射
      const bristolTypeMap: { [key: string]: number } = {
        'Constipated': 2,
        'Normal': 4,
        'Loose': 6,
        'type1': 1, 'type2': 2, 'type3': 3, 'type4': 4,
        'type5': 5, 'type6': 6, 'type7': 7,
        'hard': 1, 'lumpy': 2, 'cracked': 3, 'smooth': 4, 
        'soft': 5, 'mushy': 6, 'liquid': 7,
        'constipation': 2, 'normal': 4, 'diarrhea': 6, 'loose': 6,
        'detected_poop': 4, 'smart_detected': 4
      };

      // 體積映射
      const volumeMap: { [key: string]: number } = {
        'Small': 1, 'small': 1,
        'Medium': 2, 'medium': 2, 'normal': 2,
        'Large': 3, 'large': 3, 'big': 3
      };

      // 顏色映射
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

      // 計算 Bristol 類型
      const bristolType = bristolTypeMap[mainType] || bristolTypeMap[mainType.toLowerCase()] || 4;
      console.log('Mapped Bristol type:', bristolType, 'from:', mainType);

      // 計算體積等級
      let volume = 2;
      if (volumeAnalysis && volumeAnalysis.overall_volume_class) {
        const volumeClass = volumeAnalysis.overall_volume_class;
        volume = volumeMap[volumeClass] || volumeMap[volumeClass.toLowerCase()] || 2;
        console.log('Mapped volume:', volume, 'from:', volumeClass);
      }

      // 計算顏色等級
      let color = 1;
      let colorAdvice = '';
      let foodInfluenceInfo = null;

      // 優先從 colorAnalysis 獲取顏色
      if (colorAnalysis && colorAnalysis.summary && Object.keys(colorAnalysis.summary).length > 0) {
        const firstEntry = Object.values(colorAnalysis.summary)[0] as any;
        if (firstEntry) {
          const colorType = firstEntry.color || firstEntry.detected_color_type || firstEntry.color_type;
          if (colorType) {
            color = colorMap[colorType] || colorMap[colorType.toLowerCase()] || 1;
            console.log('Mapped color from colorAnalysis:', color, 'from:', colorType);
          }
        }
      }
      // 否則從 smartAnalysis 獲取
      else if (smartAnalysis && smartAnalysis.color_analysis) {
        const colorType = smartAnalysis.color_analysis.detected_color_type || smartAnalysis.color_analysis.color;
        if (colorType) {
          color = colorMap[colorType] || colorMap[colorType.toLowerCase()] || 1;
          console.log('Mapped color from smartAnalysis:', color, 'from:', colorType);
        }
      }

      console.log('🎯 Final selector mappings:');
      console.log('- Bristol Type:', bristolType);
      console.log('- Volume:', volume);
      console.log('- Color:', color);

      // 設置增強分析數據
      setColorAnalysis(colorAnalysis || smartAnalysis?.color_analysis || null);
      setVolumeAnalysis(volumeAnalysis || null);
      setHealthAlerts((colorAnalysis && colorAnalysis.health_alerts) || []);
      setFoodInfluenceData(foodInfluenceInfo);

      // 如果沒有在 processEnhancedAnalysisResult 中設置，這裡設置分析詳情
      if (!analysisDetails || !analysisDetails.includes('OWL-ViT')) {
        let analysisText = `🎯 Main Detection Type: ${mainType}\n`;

        if (colorAnalysis && colorAnalysis.summary && Object.keys(colorAnalysis.summary).length > 0) {
          analysisText += `\n🎨 Color Analysis Results:\n`;
          Object.entries(colorAnalysis.summary).forEach(([type, info]: [string, any]) => {
            if (info && (info.color_name || info.color)) {
              analysisText += `  • ${type}: ${info.color_name || info.color}`;
              if (info.health_status) {
                analysisText += ` (${info.health_status})`;
              }
              analysisText += `\n`;
            }
          });
        } else if (smartAnalysis && smartAnalysis.color_analysis) {
          analysisText += `\n🎨 Color Analysis: ${smartAnalysis.color_analysis.color_name || 'Unknown'}\n`;
        }

        if (volumeAnalysis && volumeAnalysis.overall_volume_class) {
          analysisText += `\n📏 Volume Analysis: ${volumeAnalysis.overall_volume_class}\n`;
        }

        setAnalysisDetails(analysisText);
      }

      // 設置選擇器的值
      setPredictedType(bristolType);
      setPredictedVolume(volume);
      setPredictedColor(color);
      
      setSelectedType(bristolType);
      setSelectedVolume(volume);
      setSelectedColor(color);

      // 生成建議 - ALWAYS try AI first
      try {
        console.log('Getting AI recommendations for Bristol Type:', bristolType);
        const aiAdvice = await fetchAIHealthAdvice(bristolType, colorAnalysis, volumeAnalysis);
        
        if (aiAdvice && aiAdvice.length > 10) { // Ensure we got real advice
          console.log('Using AI-generated advice');
          setRecommendations(aiAdvice);
        } else {
          throw new Error('AI advice too short or empty');
        }
      } catch (error) {
        console.error('AI advice failed:', error);
        // Fallback to template only if AI completely fails
        const fallback = getAdviceForType(mainType) + 
          '\n[Note: Using template advice - AI service temporarily unavailable]';
        setRecommendations(fallback);
      }

      setIsAnalyzing(false);

      console.log('✅ Successfully processed API response and updated selectors');

    } catch (error: unknown) {
      console.error('Error processing enhanced poop API response:', error);
      
      if (error instanceof Error) {
        setAnalysisError(`Error processing analysis results: ${error.message}`);
      } else {
        setAnalysisError('Unable to process analysis results, please try again');
      }
      
      setIsAnalyzing(false);
    }
  }

  // 生成個人化建議
  const generateEnhancedPersonalizedAdvice = (
    mainType: string, 
    otherTypes: any, 
    rawStats: any, 
    volume: number,
    colorAnalysis: any,
    volumeAnalysis: any
  ): string => {
    try {
      const mainTypeAdvice = getAdviceForType(mainType || 'Normal');
      
      let personalizedAdvice = mainTypeAdvice;
      
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
      
      if (colorAnalysis && colorAnalysis.summary && Object.keys(colorAnalysis.summary).length > 0) {
        try {
          const hasAbnormalColors = Object.values(colorAnalysis.summary).some((info: any) => {
            if (!info || !info.health_status) return false;
            return info.health_status !== 'Normal' && info.health_status !== 'Healthy';
          });
          
          if (hasAbnormalColors) {
            personalizedAdvice += `\n\n🎨 Color Health Assessment:`;
            
            Object.entries(colorAnalysis.summary).forEach(([type, info]: [string, any]) => {
              if (info && info.health_status && info.color_name && 
                  info.health_status !== 'Normal' && info.health_status !== 'Healthy') {
                personalizedAdvice += `\n• ${type}: ${info.color_name} - ${info.health_status}`;
              }
            });
          }
        } catch (colorError) {
          console.warn('Error generating color advice:', colorError);
        }
      }
      
      personalizedAdvice += `\n\n📊 Tracking Recommendations: We recommend recording poop changes over the next 3-7 days, paying special attention to improvements in color and shape`;
      
      return personalizedAdvice;
      
    } catch (error) {
      console.error('Error in generateEnhancedPersonalizedAdvice:', error);
      return getAdviceForType(mainType || 'Normal');
    }
  };
// Get advice for specific type
  const getAdviceForType = (type: string): string => {
    const adviceMap: { [key: string]: string } = {
      'Constipated': '🔴 Constipation State | 💧 Diet Advice: Increase dietary fiber intake (whole grains, vegetables, fruits, legumes), drink 2000ml+ water daily | 🏃‍♂️ Lifestyle: Regular exercise to promote bowel movement, abdominal massage',
      'Normal': '🎉 Normal State | 💧 Diet Advice: Continue balanced diet, adequate fiber and water intake | 💪 Lifestyle: Maintain regular exercise and routine',
      'Loose': '🟠 Diarrhea State | 💧 Diet Advice: Reduce high-fat, spicy foods, eat small frequent meals with probiotics | ⏰ Lifestyle: Regular meals, avoid overeating',
      'detected_poop': '🎯 Basic Advice | 💧 Diet: Maintain balanced diet | 🏃‍♂️ Exercise: Regular exercise',
      'smart_detected': '🧠 Smart Analysis | 💧 Diet: Maintain balanced diet | 🏃‍♂️ Exercise: Regular exercise | 📸 Suggestion: Take clearer photos for better analysis',
      'type1': '🔴 Severe Constipation Alert | 💧 Diet Advice: Increase dietary fiber intake (whole grains, vegetables, fruits, legumes), drink 2000ml+ water daily | 🏃‍♂️ Lifestyle: Regular exercise to promote bowel movement, abdominal massage',
      'type2': '🟡 Mild Constipation | 💧 Diet Advice: Emphasize fiber and water intake, reduce high-fat and processed foods | 🧘‍♀️ Lifestyle: Maintain regular schedule to reduce stress',
      'type3': '🟢 Slightly Dry but Near Normal | 💧 Diet Advice: Maintain current fiber and water intake, moderately increase fruits and vegetables | 🚶‍♀️ Lifestyle: Keep exercising and regular living',
      'type4': '🎉 Perfect Stool State | 💧 Diet Advice: Continue balanced diet, adequate fiber and water intake | 💪 Lifestyle: Maintain regular exercise and routine',
      'type5': '🟡 Slightly Soft - Attention Needed | 💧 Diet Advice: Check if fiber or water intake is excessive, avoid irritating foods | 🍽️ Lifestyle: Maintain regular diet and exercise',
      'type6': '🟠 Mild Diarrhea Warning | 💧 Diet Advice: Reduce high-fat, spicy foods, eat small frequent meals with probiotics | ⏰ Lifestyle: Regular meals, avoid overeating',
      'type7': '🔴 Severe Diarrhea Emergency | 💧 Emergency Care: Immediately replenish fluids and electrolytes, eat easily digestible foods | 🏥 Medical Advice: Seek medical attention if persists over 48 hours'
    };

    return adviceMap[type] || '🎯 Basic Advice | 💧 Diet: Maintain balanced diet | 🏃‍♂️ Exercise: Regular exercise';
  };

  // 增強版體積建議
  const getEnhancedVolumeAdvice = (volumeClass: string, volumeAnalysis: any): string => {
    try {
      if (!volumeClass) {
        return '';
      }
      
      const baseAdvice: { [key: string]: string } = {
        'Small': '📏 Small Volume Advice: Possible insufficient intake or digestion issues',
        'small': '📏 Small Volume Advice: Possible insufficient intake or digestion issues',
        'Medium': '📏 Normal Volume: Maintain current eating habits',
        'medium': '📏 Normal Volume: Maintain current eating habits',
        'normal': '📏 Normal Volume: Maintain current eating habits',
        'Large': '📏 Large Volume Advice: Possible excessive intake or prolonged digestion',
        'large': '📏 Large Volume Advice: Possible excessive intake or prolonged digestion',
        'big': '📏 Large Volume Advice: Possible excessive intake or prolonged digestion'
      };
      
      let advice = baseAdvice[volumeClass] || baseAdvice[volumeClass.toLowerCase()] || '';
      
      if (volumeAnalysis && volumeAnalysis.detailed_data) {
        advice += '\n• Detailed Advice: ';
        const volumeClassLower = volumeClass.toLowerCase();
        
        if (volumeClassLower.includes('small')) {
          advice += 'Increase healthy fats like nuts, avocado, ensure adequate nutrition';
        } else if (volumeClassLower.includes('large') || volumeClassLower.includes('big')) {
          advice += 'Consider eating smaller portions, increase digestion time, avoid large meals';
        } else {
          advice += 'Continue balanced diet';
        }
      }
      
      return advice;
      
    } catch (error) {
      console.warn('Error in getEnhancedVolumeAdvice:', error);
      return '📏 Volume Analysis: Maintain balanced eating habits';
    }
  };

  // Enhanced mock analysis with realistic data
  const mockAnalysisWithRealData = async () => {
    setAnalysisProgress('Using general AI for analysis...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const mockType = 4;
    const mockVolume = 2;
    const mockColor = 1;
    
    const mockAdvice = `🟢 Near Normal State | 💧 Diet Advice: Maintain current fiber and water intake, moderately increase fruits and vegetables | 🚶‍♀️ Lifestyle Advice: Keep exercising and regular living | ✅ Status Description: Recommend continuing good lifestyle habits`;
      
    setPredictedType(mockType);
    setSelectedType(mockType);
    
    setPredictedVolume(mockVolume);
    setSelectedVolume(mockVolume);
    
    setPredictedColor(mockColor);
    setSelectedColor(mockColor);
    
    setAnalysisDetails('🎯 AI analysis based on image features\n📊 Using general health model for evaluation\n💡 Recommend combining with personal health conditions for reference');
    setRecommendations(mockAdvice);
    
    setColorAnalysis({
      summary: { 
        Normal: { 
          color: 'Normal_Brown', 
          color_name: 'Normal Brown', 
          health_status: 'Normal',
          detected_color_type: 'Normal_Brown',
          rgb_color: [139, 69, 19],
          hex_color: '#8B4513'
        } 
      },
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
      'Preparing analysis...',
      'Connecting to AI server...',
      'Processing image...',
      'Generating recommendations...',
      'Analysis Complete！'
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
        
        setAnalysisDetails('This is a web version simulation result. In actual application, AI will analyze images and provide detailed poop health reports.');
        setRecommendations('🎯 Web Simulation Advice | 💧 Diet Advice: Maintain balanced diet | 🏃‍♂️ Exercise Advice: Regular exercise | 📱 Tip: Use mobile APP for complete features');
        
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
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Camera Permission Required', 'Please allow camera access in settings');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImageUri = result.assets[0].uri;
        console.log('重新拍攝的圖片:', newImageUri);
        
        setImageUri(newImageUri);
        analyzeImage(newImageUri);
      }
    } catch (error) {
      console.error('重新拍照失敗:', error);
      Alert.alert('Error', 'Cannot launch camera, please try again later');
    }
  };

  const handleSelectOther = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Photo Library Permission Required', 'Please allow photo library access in settings');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newImageUri = result.assets[0].uri;
        console.log('從相簿選擇的圖片:', newImageUri);
        
        setImageUri(newImageUri);
        analyzeImage(newImageUri);
      }
    } catch (error) {
      console.error('選擇照片失敗:', error);
      Alert.alert('Error', 'Cannot open photo library, please try again later');
    }
  };

  const handleContinueWithLowConfidence = (result: any) => {
    try {
      console.log('處理低信心度結果:', result);
      
      if (!result) {
        console.error('沒有提供結果給 handleContinueWithLowConfidence');
        setAnalysisError('Cannot process detection results');
        return;
      }

      if (result.detected_results && Array.isArray(result.detected_results) && result.detected_results.length > 0) {
        const detection = result.detected_results[0];
        
        if (!detection) {
          console.warn('檢測結果為空');
          setAnalysisError('Detection results invalid');
          return;
        }
        
        setSelectedType(4);
        setSelectedVolume(2);
        setSelectedColor(1);
        
        const detectionClass = detection.class || 'Unknown Object';
        const confidence = detection.confidence ? (detection.confidence * 100).toFixed(1) : 'Unknown';

        setAnalysisDetails(`⚠️ Low Confidence Analysis Result\nDetected: ${detectionClass}\nConfidence: ${confidence}%\nNote: Recommend improving shooting conditions for more accurate analysis`);
        setRecommendations('🎯 Basic Advice | 💧 Diet: Maintain balanced diet | 🏃‍♂️ Exercise: Regular exercise | 📸 Suggestion: Please shoot under better lighting conditions next time');
        
        setColorAnalysis({
          summary: { 
            LowConfidence: { 
              color: 'Normal_Brown', 
              color_name: 'Basic Detection', 
              health_status: 'Needs Better Image',
              confidence: detection.confidence || 0.3
            } 
          },
          health_alerts: [],
          food_influence_summary: {},
          overall_color_health: 'Photo Needs Improvement，建議重新拍攝'
        });
        setVolumeAnalysis({ overall_volume_class: 'Medium' });
        setHealthAlerts([]);
        setFoodInfluenceData(null);
        
        setLowConfidenceResult(null);
        setIsAnalyzing(false);
        console.log('✅ 低信心度結果處理完成');
      } else {
        console.warn('沒有有效的檢測結果');
        setAnalysisError('No useful information in detection results, please retake photo');
      }
    } catch (error) {
      console.error('處理低信心度結果時出錯:', error);
      setAnalysisError('Error occurred while processing detection results');
      setIsAnalyzing(false);
    }
  };

  const handleContinueWithPartial = () => {
    try {
      console.log('處理部分分析結果:', partialAnalysisResult);
      
      if (!partialAnalysisResult) {
        console.error('沒有部分分析結果可用');
        setAnalysisError('Cannot process partial analysis results');
        return;
      }

      if (partialAnalysisResult.detected_objects && 
          Array.isArray(partialAnalysisResult.detected_objects) && 
          partialAnalysisResult.detected_objects.length > 0) {
        
        const bestDetection = partialAnalysisResult.detected_objects[0];
        
        if (!bestDetection) {
          console.warn('最佳檢測結果為空');
          setAnalysisError('Partial analysis results invalid');
          return;
        }
        
        setSelectedType(4);
        setSelectedVolume(2);
        setSelectedColor(1);
        
        const detectionClass = bestDetection.class || 'Unknown Object';
        const confidence = bestDetection.confidence ? (bestDetection.confidence * 100).toFixed(1) : 'Unknown';

        setAnalysisDetails(`🎯 Partial Analysis Result\nDetected: ${detectionClass}\nConfidence: ${confidence}%\nNote: Cannot perform complete analysis due to image quality limitations`);
        setRecommendations('🎯 Basic Advice | 💧 Diet: Maintain balanced diet | 🏃‍♂️ Exercise: Regular exercise | 📸 Suggestion: Take clearer photos next time for complete analysis');
        
        setColorAnalysis({
          summary: { 
            Partial: { 
              color: 'Normal_Brown', 
              color_name: 'Partial Detection', 
              health_status: 'Needs Clearer Image',
              confidence: bestDetection.confidence || 0.5
            } 
          },
          health_alerts: [],
          food_influence_summary: {},
          overall_color_health: 'Partial analysis completed, recommend taking clearer photos'
        });
        setVolumeAnalysis({ overall_volume_class: 'Medium' });
        setHealthAlerts([]);
        setFoodInfluenceData(null);
        
        setPartialAnalysisResult(null);
        setIsAnalyzing(false);
        console.log('✅ 部分分析結果處理完成');
      } else {
        console.warn('部分分析結果中沒有有效的檢測物件');
        setAnalysisError('No available information in partial analysis results, please retake photo');
      }
    } catch (error) {
      console.error('處理部分分析結果時出錯:', error);
      setAnalysisError('Error occurred while processing partial analysis results');
      setIsAnalyzing(false);
    }
  };
const renderContent = () => {
    // 載入中狀態
    if (isAnalyzing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary.accent} />
          <Text style={styles.loadingText}>AI Analysis in Progress...</Text>
          <Text style={styles.loadingSubtext}>{analysisProgress}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '60%' }]} />
          </View>
          <Text style={styles.estimateText}>Estimated remaining time: 30-60 seconds</Text>
        </View>
      );
    }

    // 非大便檢測結果
    if (nonPoopDetectionResult) {
      return (
        <SmartNonPoopDetectionDisplay
          result={nonPoopDetectionResult}
          onRetake={handleRetake}
          onSelectOther={handleSelectOther}
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
          onRetake={handleRetake}
        />
      );
    }

    // 一般錯誤
    if (analysisError) {
      return (
        <View style={styles.errorContainer}>
          <AlertCircle size={48} color={Colors.primary.error} />
          <Text style={styles.errorTitle}>Analysis Failed</Text>
          <Text style={styles.errorText}>{analysisError}</Text>
          <Button title="Retry Analysis" onPress={handleRetry} style={styles.retryButton} />
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

        {/* 🦉 OWL-ViT 檢測顯示 */}
        {DETECTION_CONFIG.show_owl_confidence && owlConfidence > 0 && (
          <OwlDetectionDisplay 
            owlConfidence={owlConfidence} 
            detectionMethod={detectionMethod}
          />
        )}

        {/* 詳細分析 */}
        <View style={styles.resultContainer}>
          <View style={styles.resultHeader}>
            <FileText size={20} color={Colors.primary.accent} />
            <Text style={styles.resultTitle}>AI Health Analysis Results</Text>
          </View>
          <Text style={styles.resultDescription}>
            Based on AI model analysis, here is your poop health status and recommendations:
          </Text>

          {/* 分析詳情 */}
          {analysisDetails && (
            <View style={styles.analysisDetails}>
              <Text style={styles.analysisTitle}>Analysis Details</Text>
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
              </View>
              <RecommendationDisplay 
                recommendations={recommendations} 
                bristolType={selectedType}
                isEnglish={false}
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
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title:'AI Health Analysis',
          headerBackTitle: 'Cancel',
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
  // 🦉 OWL-ViT 相關樣式
  owlDetectionContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  owlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  owlIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  owlTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#166534',
  },
  owlConfidenceBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  owlConfidenceFill: {
    height: '100%',
    borderRadius: 4,
  },
  owlConfidenceText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  owlNote: {
    fontSize: 12,
    color: '#166534',
    fontStyle: 'italic',
  },
  owlConfidenceContainer: {
    marginTop: 12,
    marginBottom: 12,
  },
  owlConfidenceLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  owlConfidenceBarSmall: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    marginBottom: 4,
    overflow: 'hidden',
  },
  owlConfidenceFillSmall: {
    height: '100%',
    borderRadius: 3,
  },
  owlConfidenceValue: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: 'bold',
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