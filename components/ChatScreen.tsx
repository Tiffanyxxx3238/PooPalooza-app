import React, { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Alert } from 'react-native';
import { GiftedChat, Bubble, InputToolbar, IMessage } from 'react-native-gifted-chat';
import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from './config'; // 引入配置

interface ChatScreenProps {
  onClose: () => void;
}

interface ApiResponse {
  answer: string;
  model?: string;
  status?: string;
  plan?: string;
  requestCount?: number;
  message?: string;
  timestamp?: string;
}

// 客戶端文字格式化函數 - 添加顏色和區塊，支援多語言
const formatBotMessage = (text: string): string => {
  return text
    // 移除多餘的星號和格式標記
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '• ')
    
    // 添加區塊分隔線（多語言支援）
    .replace(/^(建議|症狀|原因|注意|重要|提醒|Suggestion|Symptom|Cause|Attention|Important|Reminder|提案|症状|原因|注意|重要|思い出させる|제안|증상|원인|주의|중요|알림)/gm, '━━━ $1 ━━━')
    
    // 改善段落間距
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
      // 為重要資訊添加特殊標記（多語言關鍵詞）
      if (line.includes('建議') || line.includes('推薦') || 
          line.includes('suggest') || line.includes('recommend') || 
          line.includes('提案') || line.includes('推奨') ||
          line.includes('제안') || line.includes('추천')) {
        return `💡 ${line}`;
      } else if (line.includes('注意') || line.includes('警告') || line.includes('避免') ||
                 line.includes('warning') || line.includes('avoid') || line.includes('caution') ||
                 line.includes('警告') || line.includes('避ける') ||
                 line.includes('주의') || line.includes('경고') || line.includes('피하다')) {
        return `⚠️ ${line}`;
      } else if (line.includes('症狀') || line.includes('表現') ||
                 line.includes('symptom') || line.includes('sign') ||
                 line.includes('症状') || line.includes('徴候') ||
                 line.includes('증상') || line.includes('징후')) {
        return `🔍 ${line}`;
      } else if (line.includes('飲食') || line.includes('食物') ||
                 line.includes('diet') || line.includes('food') || line.includes('eat') ||
                 line.includes('食事') || line.includes('食べ物') ||
                 line.includes('식단') || line.includes('음식')) {
        return `🍎 ${line}`;
      } else if (line.includes('運動') || line.includes('活動') ||
                 line.includes('exercise') || line.includes('activity') || line.includes('workout') ||
                 line.includes('運動') || line.includes('活動') ||
                 line.includes('운동') || line.includes('활동')) {
        return `🏃 ${line}`;
      } else if (line.includes('水分') || line.includes('喝水') ||
                 line.includes('water') || line.includes('drink') || line.includes('hydrat') ||
                 line.includes('水分') || line.includes('飲む') ||
                 line.includes('물') || line.includes('수분')) {
        return `💧 ${line}`;
      }
      return line;
    })
    .join('\n\n')
    
    // 確保列表項目格式正確
    .replace(/^• /gm, '• ')
    .replace(/^([0-9]+)\./gm, '$1. ')
    
    // 清理多餘空白
    .trim()
    
    // 限制連續空行
    .replace(/\n{3,}/g, '\n\n');
};

// 渲染彩色文字組件
const ColoredText = ({ text }: { text: string }) => {
  const lines = text.split('\n\n');
  
  return (
    <View style={styles.coloredTextContainer}>
      {lines.map((line: string, index: number) => {
        if (line.trim() === '') return null;
        
        // 區塊分隔線
        if (line.startsWith('━━━')) {
          return (
            <View key={index} style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>{line.replace(/━━━/g, '').trim()}</Text>
            </View>
          );
        }
        
        // 不同類型的內容使用不同顏色
        let textStyle = styles.normalText;
        let containerStyle = styles.normalContainer;
        
        if (line.startsWith('💡')) {
          textStyle = styles.suggestionText;
          containerStyle = styles.suggestionContainer;
        } else if (line.startsWith('⚠️')) {
          textStyle = styles.warningText;
          containerStyle = styles.warningContainer;
        } else if (line.startsWith('🔍')) {
          textStyle = styles.symptomText;
          containerStyle = styles.symptomContainer;
        } else if (line.startsWith('🍎')) {
          textStyle = styles.foodText;
          containerStyle = styles.foodContainer;
        } else if (line.startsWith('🏃')) {
          textStyle = styles.exerciseText;
          containerStyle = styles.exerciseContainer;
        } else if (line.startsWith('💧')) {
          textStyle = styles.waterText;
          containerStyle = styles.waterContainer;
        } else if (line.startsWith('•') || line.match(/^\d+\./)) {
          textStyle = styles.listText;
          containerStyle = styles.listContainer;
        }
        
        return (
          <View key={index} style={containerStyle}>
            <Text style={textStyle}>{line}</Text>
          </View>
        );
      })}
    </View>
  );
};

export default function ChatScreen({ onClose }: ChatScreenProps) {
  const [messages, setMessages] = useState<IMessage[]>([
    {
      _id: 1,
      text: 'Hi there! I\'m PoopBot, your friendly digestive health assistant! 💩\n\nI\'m here to help you with questions about bowel health, diet, exercise, and lifestyle habits.\n\nWhat would you like to know today?',
      createdAt: new Date(),
      user: { _id: 2, name: 'PoopBot', avatar: '💩' },
    },
  ]);

  const [isTyping, setIsTyping] = useState(false);

  const onSend = useCallback((msgs: IMessage[] = []) => {
    setMessages(prev => GiftedChat.append(prev, msgs));
    const question = msgs[0].text;
    
    setIsTyping(true);
    
    console.log('🚀 發送請求到:', `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSISTANT}`);
    console.log('📝 問題:', question);
    
    // 使用配置中的 URL
    axios.post<ApiResponse>(
      `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ASSISTANT}`, 
      { question },
      { 
        timeout: API_CONFIG.TIMEOUT,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    .then((res: AxiosResponse<ApiResponse>) => {
      setIsTyping(false);
      console.log('✅ API 回應成功:', res.data);
      
      // 格式化回應文字
      const formattedAnswer = formatBotMessage(res.data.answer);
      
      const botMessage: IMessage = {
        _id: Date.now(),
        text: formattedAnswer,
        createdAt: new Date(),
        user: { 
          _id: 2, 
          name: 'PoopBot',
          avatar: '💩'
        },
      };
      
      setMessages(prev => GiftedChat.append(prev, [botMessage]));
      
      if (res.data.plan === 'free' && res.data.requestCount) {
        console.log(`📊 免費版本使用次數: ${res.data.requestCount}`);
      }
    })
    .catch((error) => {
      setIsTyping(false);
      console.error('❌ API 調用錯誤:', error);
      
      let errorMessage = 'Sorry, something went wrong. Please try again later.';
      
      // 錯誤處理
      if (error.response?.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.\n\nFree version has usage limits.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. AI service might be temporarily unavailable.\n\nPlease try again later.';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Cannot connect to server.\n\nPlease check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timeout.\n\nServer might be starting up (takes 30-60 seconds), please try again.';
      }
      
      const errorBotMessage: IMessage = {
        _id: Date.now() + 1,
        text: errorMessage,
        createdAt: new Date(),
        user: { 
          _id: 2, 
          name: 'PoopBot',
          avatar: '💩'
        },
      };
      
      setMessages(prev => GiftedChat.append(prev, [errorBotMessage]));
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>PooPa Health Assistant</Text>
          <Text style={styles.subtitle}>Free AI Health Consultation</Text>
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>
      </View>
      
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: 1 }}
        isTyping={isTyping}
        renderBubble={props => (
          <View>
            <Bubble
              {...props}
          wrapperStyle={{
                  right: { 
                    backgroundColor: '#CDA581',
                    borderRadius: 25,
                    marginVertical: 2,
                    marginHorizontal: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    minWidth: 80,
                    minHeight: 40,
                    maxWidth: '75%',
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.15,
                    shadowRadius: 2,
                  },
                left: { 
                  backgroundColor: 'transparent',
                  borderRadius: 0,
                  marginVertical: 4,
                },
              }}
          textStyle={{
                  right: { 
                    color: '#fff',
                    fontSize: 16,
                    lineHeight: 24,
                    fontWeight: '500',
                    textAlign: 'center',    // ★ 這裡讓文字水平置中
                  },
                  left: { /* ... */ },
                }}
              containerStyle={{
                right: {
                  marginBottom: 4, // 為時間留出空間
                }
              }}
              renderMessageText={props => {
                if (props.position === 'left') {
                  return (
                    <View style={styles.aiMessageWrapper}>
                      <View style={styles.aiMessageHeader}>
                        <Text style={styles.aiMessageHeaderText}>💩 PoopBot Health Assistant</Text>
                        <Text style={styles.timestampText}>
                          {new Date(props.currentMessage.createdAt).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </Text>
                      </View>
                      <View style={styles.aiMessageContent}>
                        <ColoredText text={props.currentMessage.text} />
                      </View>
                    </View>
                  );
                }
                return (
                  <Text style={props.textStyle?.right || {}}>
                    {props.currentMessage.text}
                  </Text>
                );
              }}
              renderTime={() => null} // 隱藏默認時間
            />
            {/* 用戶訊息的自定義時間顯示 */}
            {props.position === 'right' && (
              <View style={styles.userTimeContainer}>
                <Text style={styles.userTimeText}>
                  {new Date(props.currentMessage.createdAt).toLocaleTimeString('zh-TW', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </Text>
              </View>
            )}
          </View>
        )}
        renderInputToolbar={props => (
          <InputToolbar 
            {...props} 
            containerStyle={styles.inputToolbar}
            primaryStyle={styles.inputPrimary}
          />
        )}
        placeholder="Ask me about your digestive health..."
        showAvatarForEveryMessage={false}
        showUserAvatar={false}
        alwaysShowSend={true}
        scrollToBottom={true}
        messagesContainerStyle={styles.messagesContainer}
        bottomOffset={0}
        keyboardShouldPersistTaps="never"
        minInputToolbarHeight={64}
        renderTime={() => null} // 隱藏默認時間，使用自定義時間
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingHorizontal: 15,
    paddingBottom: 12,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    zIndex: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#999',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  closeText: { 
    color: '#fff', 
    fontSize: 24, 
    lineHeight: 24,
    fontWeight: '300',
  },
  messagesContainer: {
    paddingHorizontal: 4,
    paddingBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  inputToolbar: {
    borderTopWidth: 1,
    borderTopColor: '#DDD',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    minHeight: 64,
  },
  inputPrimary: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  
  // AI 訊息樣式 - 確保不被截斷
  aiMessageWrapper: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 2,
    marginHorizontal: 4,
    marginBottom: 8,
    width: '100%', // 確保寬度足夠
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  aiMessageHeader: {
    backgroundColor: '#4A90E2',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  aiMessageHeaderText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  timestampText: {
    fontSize: 11,
    color: '#E3F2FD',
    marginLeft: 10,
  },
  aiMessageContent: {
    padding: 15,
    width: '100%', // 確保內容寬度足夠
  },
  
  // 彩色文字容器
  coloredTextContainer: {
    width: '100%', // 確保容器寬度足夠
  },
  
  // 區塊分隔樣式
  sectionDivider: {
    backgroundColor: '#E8EAF6',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3F51B5',
  },
  
  // 不同類型內容的樣式
  normalContainer: {
    marginVertical: 3,
    width: '100%',
  },
  normalText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
  },
  
  suggestionContainer: {
    backgroundColor: '#E8F5E8',
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    width: '100%',
  },
  suggestionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#2E7D32',
    fontWeight: '500',
  },
  
  warningContainer: {
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9800',
    width: '100%',
  },
  warningText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#E65100',
    fontWeight: '500',
  },
  
  symptomContainer: {
    backgroundColor: '#F3E5F5',
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#9C27B0',
    width: '100%',
  },
  symptomText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#6A1B9A',
  },
  
  foodContainer: {
    backgroundColor: '#E8F5E8',
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#8BC34A',
    width: '100%',
  },
  foodText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#558B2F',
  },
  
  exerciseContainer: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    width: '100%',
  },
  exerciseText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#1565C0',
  },
  
  waterContainer: {
    backgroundColor: '#E0F2F1',
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    borderLeftWidth: 4,
    borderLeftColor: '#00BCD4',
    width: '100%',
  },
  waterText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#00838F',
  },
  
  listContainer: {
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 6,
    marginVertical: 2,
    marginLeft: 10,
    width: '100%',
  },
  listText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#555',
  },
  
  // 用戶時間樣式
  userTimeContainer: {
    alignItems: 'flex-end',
    marginTop: 2,
    marginRight: 12,
    marginBottom: 8,
  },
  userTimeText: {
    fontSize: 12,
    color: '#999', // 調整時間文字顏色以配合淺奶茶色主題
    fontWeight: '400',
  },
});