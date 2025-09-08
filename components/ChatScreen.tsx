import React, { useState, useCallback } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, Alert } from 'react-native';
import { GiftedChat, Bubble, InputToolbar, IMessage } from 'react-native-gifted-chat';
import axios, { AxiosResponse } from 'axios';
import { API_CONFIG } from './config';
import { LoadingWithGame } from './PoopRainGame';

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

// 客戶端文字格式化函數
const formatBotMessage = (text: string): string => {
  return text
    .replace(/\*\*\*/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '• ')
    .replace(/^(建議|症狀|原因|注意|重要|提醒|Suggestion|Symptom|Cause|Attention|Important|Reminder|提案|症状|原因|注意|重要|思い出させる|제안|증상|원인|주의|중요|알림)/gm, '━━━ $1 ━━━')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => {
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
    .replace(/^• /gm, '• ')
    .replace(/^([0-9]+)\./gm, '$1. ')
    .trim()
    .replace(/\n{3,}/g, '\n\n');
};

// 渲染彩色文字組件
const ColoredText = ({ text }: { text: string }) => {
  const lines = text.split('\n\n');
  
  return (
    <View style={styles.coloredTextContainer}>
      {lines.map((line: string, index: number) => {
        if (line.trim() === '') return null;
        
        if (line.startsWith('━━━')) {
          return (
            <View key={index} style={styles.sectionDivider}>
              <Text style={styles.sectionTitle}>{line.replace(/━━━/g, '').trim()}</Text>
            </View>
          );
        }
        
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
    
    // CORRECT URL with /api/assistant
    console.log('🚀 發送請求到: https://poopalooza-server.onrender.com/api/assistant');
    console.log('📝 問題:', question);
    
    // THE CORRECT URL - Notice the /api/ prefix
    axios.post<ApiResponse>(
      'https://poopalooza-server.onrender.com/api/assistant', // ← MUST BE /api/assistant
      { question },  // ← Your server expects { question } which is correct
      { 
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )
    .then((res: AxiosResponse<ApiResponse>) => {
      setIsTyping(false);
      console.log('✅ API 回應成功:', res.data);
      
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
      {/* 精緻的標題欄 - 仿造實際聊天 app */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.headerTitle}>AI Health Assistant</Text>
            <Text style={styles.subtitle}>Free Digestive Health Consultation</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.headerSeparator} />
      </View>
      
      <GiftedChat
        messages={messages}
        onSend={onSend}
        user={{ _id: 1 }}
        isTyping={false}  // 關閉內建的 typing indicator
        renderBubble={props => (
          <View style={styles.bubbleWrapper}>
            {/* 強制左對齊容器 */}
            {props.position === 'left' ? (
              <View style={styles.leftMessageWrapper}>
                <View style={styles.botMessageContainer}>
                  {/* 機器人頭像和標題 */}
                  <View style={styles.botHeader}>
                    <View style={styles.botAvatarWrapper}>
                      <Text style={styles.botAvatar}>💩</Text>
                    </View>
                    <View style={styles.botInfo}>
                      <Text style={styles.botName}>PoopBot Health Assistant</Text>
                      <Text style={styles.botTimestamp}>
                        {new Date(props.currentMessage.createdAt).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </Text>
                    </View>
                  </View>
                  
                  {/* 訊息內容氣泡 */}
                  <View style={styles.botMessageBubble}>
                    <ColoredText text={props.currentMessage.text} />
                  </View>
                </View>
              </View>
            ) : (
              <Bubble
                {...props}
                wrapperStyle={{
                  right: { 
                    backgroundColor: '#8B4513',
                    borderRadius: 18,
                    marginVertical: 2,
                    marginLeft: 50,
                    marginRight: 12,
                    paddingHorizontal: 2,
                    paddingVertical: 2,
                    maxWidth: '75%',
                    minHeight: 40,
                    elevation: 1,
                    shadowColor: '#8B4513',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                  },
                }}
                textStyle={{
                  right: { 
                    color: '#FFFFFF',
                    fontSize: 16,
                    lineHeight: 20,
                    fontWeight: '400',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  },
                }}
                renderTime={() => null}
              />
            )}
            
            {/* 用戶訊息時間標籤 */}
            {props.position === 'right' && (
              <View style={styles.userTimeWrapper}>
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
          <View style={styles.inputContainer}>
            <InputToolbar 
              {...props} 
              containerStyle={styles.inputToolbar}
              primaryStyle={styles.inputPrimary}
              renderSend={sendProps => (
                <TouchableOpacity 
                  style={styles.sendButton}
                  onPress={() => sendProps.onSend && sendProps.onSend({ text: sendProps.text?.trim() || '' }, true)}
                >
                  <Text style={styles.sendButtonText}>Send</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
        placeholder="Ask me about your digestive health..."
        showAvatarForEveryMessage={false}
        showUserAvatar={false}
        alwaysShowSend={true}
        scrollToBottom={true}
        messagesContainerStyle={styles.messagesContainer}
        bottomOffset={0}
        keyboardShouldPersistTaps="never"
        minInputToolbarHeight={60}
        renderTime={() => null}
      />
      
      {/* 大便掉落遊戲覆蓋層 - 放在 GiftedChat 外面 */}
      {isTyping && (
        <View style={styles.gameOverlay}>
          <LoadingWithGame isLoading={isTyping} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5E6C4',
  },
  
  // 精緻的標題欄設計
  headerContainer: {
    backgroundColor: '#F5E6C4',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  titleSection: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#A67C52',
    fontWeight: '400',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  closeButtonText: { 
    color: '#FFFFFF', 
    fontSize: 20, 
    lineHeight: 20,
    fontWeight: '300',
  },
  headerSeparator: {
    height: 0.5,
    backgroundColor: '#E0D0B0',
    marginHorizontal: 16,
  },
  
  // 訊息容器
  messagesContainer: {
    paddingHorizontal: 0, // 移除水平間距
    paddingVertical: 8,
    backgroundColor: '#F5E6C4',
  },
  
  bubbleWrapper: {
    marginVertical: 1,
    width: '100%', // 確保容器佔滿寬度
  },
  
  // 強制左對齊的包裝器
  leftMessageWrapper: {
    width: '100%',
    alignItems: 'flex-start', // 強制內容靠左
    paddingLeft: 0, // 移除左邊距
    paddingRight: 60, // 右邊留空間給用戶訊息
  },
  
  // 機器人訊息設計 - 更像真實聊天 app
  botMessageContainer: {
    backgroundColor: 'transparent',
    marginVertical: 4,
    marginLeft: 4, // 減少左邊距
    width: 'auto', // 自動寬度
    maxWidth: '90%', // 增加最大寬度
  },
  
  botHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 0,
  },
  
  botAvatarWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0D0B0',
  },
  
  botAvatar: {
    fontSize: 16,
  },
  
  botInfo: {
    flex: 1,
  },
  
  botName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B4513',
    marginBottom: 1,
  },
  
  botTimestamp: {
    fontSize: 11,
    color: '#A67C52',
    fontWeight: '400',
  },
  
  // 機器人訊息氣泡
  botMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderTopLeftRadius: 4, // 左上角小圓角，模仿聊天氣泡
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginLeft: 32, // 減少左邊距，更靠近頭像
    elevation: 1,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderWidth: 0.5,
    borderColor: '#F0E6D2',
  },
  
  // 用戶時間顯示
  userTimeWrapper: {
    alignItems: 'flex-end',
    marginTop: 2,
    marginRight: 16,
    marginBottom: 4,
  },
  
  userTimeText: {
    fontSize: 11,
    color: '#A67C52',
    fontWeight: '400',
  },
  
  // 精緻的輸入欄設計
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E0D0B0',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  
  inputToolbar: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    paddingVertical: 4,
    minHeight: 44,
  },
  
  inputPrimary: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  
  sendButton: {
    backgroundColor: '#8B4513',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 60,
  },
  
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  
  // 彩色文字容器
  coloredTextContainer: {
    width: '100%',
  },
  
  // 調整內容樣式
  normalContainer: {
    marginVertical: 2,
  },
  normalText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#2C2C2C',
  },
  
  sectionDivider: {
    backgroundColor: '#F8F5F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E8DCC0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B4513',
  },
  
  suggestionContainer: {
    backgroundColor: '#E8F5E8',
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
  },
  suggestionText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#2E7D32',
    fontWeight: '500',
  },
  
  warningContainer: {
    backgroundColor: '#FFF8E1',
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#FF8F00',
  },
  warningText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#E65100',
    fontWeight: '500',
  },
  
  symptomContainer: {
    backgroundColor: '#F3E5F5',
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#8E24AA',
  },
  symptomText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6A1B9A',
  },
  
  foodContainer: {
    backgroundColor: '#E8F5E8',
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#8BC34A',
  },
  foodText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#558B2F',
  },
  
  exerciseContainer: {
    backgroundColor: '#E3F2FD',
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#42A5F5',
  },
  exerciseText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#1565C0',
  },
  
  waterContainer: {
    backgroundColor: '#E0F2F1',
    padding: 10,
    borderRadius: 8,
    marginVertical: 3,
    borderLeftWidth: 3,
    borderLeftColor: '#26C6DA',
  },
  waterText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#00838F',
  },
  
  listContainer: {
    backgroundColor: '#F8F5F0',
    padding: 8,
    borderRadius: 6,
    marginVertical: 2,
    marginLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#D7CCC8',
  },
  listText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#5D4E37',
  },
  
  // 遊戲覆蓋層樣式
  gameOverlay: {
    position: 'absolute',
    top: 60,  // 避開標題欄
    left: 0,
    right: 0,
    bottom: 60,  // 避開輸入欄
    backgroundColor: 'rgba(245, 230, 196, 0.95)',
    zIndex: 1000,
  },
});