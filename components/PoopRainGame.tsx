import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Dimensions,
  Modal
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FallingPoop {
  id: number;
  x: number;
  y: Animated.Value;
  speed: number;
  size: number;
  type: string;
  points: number;
}

export const PoopRainGame = ({ 
  isVisible, 
  onHide 
}: { 
  isVisible: boolean;
  onHide?: () => void;
}) => {
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [poops, setPoops] = useState<FallingPoop[]>([]);
  const [gameActive, setGameActive] = useState(true);
  const poopIdRef = useRef(0);
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  // 創建新的大便
  const createPoop = () => {
    const types = [
      { emoji: '💩', points: 10, size: 30 },
      { emoji: '✨', points: 20, size: 25 }, // 金色大便
      { emoji: '🌈', points: 30, size: 35 }, // 彩虹大便
      { emoji: '🚀', points: 50, size: 28 }, // 火箭大便
    ];
    
    const selectedType = types[Math.floor(Math.random() * types.length)];
    const poop: FallingPoop = {
      id: poopIdRef.current++,
      x: Math.random() * (SCREEN_WIDTH - 40),
      y: new Animated.Value(-50),
      speed: 2000 + Math.random() * 2000, // 2-4 秒掉落
      size: selectedType.size,
      type: selectedType.emoji,
      points: selectedType.points,
    };

    return poop;
  };

  // 處理點擊
  const handlePoopTap = (poop: FallingPoop) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // 更新分數和連擊
    setScore(prev => prev + poop.points * (1 + Math.floor(combo / 5)));
    setCombo(prev => prev + 1);
    
    // 移除被點擊的大便
    setPoops(prev => prev.filter(p => p.id !== poop.id));
    
    // 創建爆炸效果
    createExplosion(poop.x, poop.y._value);
  };

  // 爆炸動畫效果
  const createExplosion = (x: number, y: number) => {
    // 這裡可以添加粒子效果
  };

  // 遊戲循環
  useEffect(() => {
    if (!isVisible || !gameActive) return;

    // 產生大便的間隔
    const spawnInterval = setInterval(() => {
      const newPoop = createPoop();
      setPoops(prev => [...prev, newPoop]);
      
      // 動畫
      const animation = Animated.timing(newPoop.y, {
        toValue: SCREEN_HEIGHT + 100,
        duration: newPoop.speed,
        useNativeDriver: true,
      });
      
      animation.start(({ finished }) => {
        if (finished) {
          // 錯過的大便重置連擊
          setCombo(0);
          setPoops(prev => prev.filter(p => p.id !== newPoop.id));
        }
      });
      
      animationsRef.current.push(animation);
    }, 500); // 每 0.5 秒產生一個

    return () => {
      clearInterval(spawnInterval);
      // 清理所有動畫
      animationsRef.current.forEach(anim => anim.stop());
      animationsRef.current = [];
    };
  }, [isVisible, gameActive]);

  // 重置連擊計時器
  useEffect(() => {
    if (combo > 0) {
      const timer = setTimeout(() => {
        setCombo(0);
      }, 3000); // 3秒後重置連擊
      
      return () => clearTimeout(timer);
    }
  }, [combo]);

  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {/* 分數顯示 */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>Score: {score}</Text>
        {combo > 0 && (
          <Text style={styles.comboText}>Combo x{combo}!</Text>
        )}
      </View>

      {/* 提示文字 */}
      <Text style={styles.hintText}>
        Tap the poops while waiting! 💩
      </Text>

      {/* 掉落的大便 */}
      {poops.map(poop => (
        <Animated.View
          key={poop.id}
          style={[
            styles.poop,
            {
              left: poop.x,
              transform: [{ translateY: poop.y }],
              width: poop.size,
              height: poop.size,
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => handlePoopTap(poop)}
            style={styles.poopTouchable}
            activeOpacity={0.8}
          >
            <Text style={[styles.poopEmoji, { fontSize: poop.size - 5 }]}>
              {poop.type}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* 特殊效果顯示 */}
      {combo >= 10 && (
        <View style={styles.specialEffect}>
          <Text style={styles.specialEffectText}>🔥 ON FIRE! 🔥</Text>
        </View>
      )}
    </View>
  );
};

// 整合到 ChatScreen 的載入畫面組件
export const LoadingWithGame = ({ isLoading }: { isLoading: boolean }) => {
  const [showGame, setShowGame] = useState(false);
  const loadingDots = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      // 顯示遊戲
      const timer = setTimeout(() => {
        setShowGame(true);
      }, 1000); // 1秒後顯示遊戲

      // 載入動畫
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingDots, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(loadingDots, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      return () => {
        clearTimeout(timer);
        loadingDots.stopAnimation();
      };
    } else {
      setShowGame(false);
    }
  }, [isLoading]);

  if (!isLoading) return null;

  return (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingContent}>
        <View style={styles.dotsContainer}>
          <Animated.Text style={[
            styles.loadingDot,
            {
              opacity: loadingDots,
              transform: [{
                translateY: loadingDots.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10]
                })
              }]
            }
          ]}>
            💩
          </Animated.Text>
          <Animated.Text style={[
            styles.loadingDot,
            {
              opacity: loadingDots,
              transform: [{
                translateY: loadingDots.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10]
                })
              }]
            }
          ]}>
            💩
          </Animated.Text>
          <Animated.Text style={[
            styles.loadingDot,
            {
              opacity: loadingDots,
              transform: [{
                translateY: loadingDots.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -10]
                })
              }]
            }
          ]}>
            💩
          </Animated.Text>
        </View>
        <Text style={styles.loadingText}>AI is thinking...</Text>
      </View>
      
      {showGame && <PoopRainGame isVisible={showGame} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  scoreContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    textShadowColor: '#FFF',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  comboText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginTop: 5,
  },
  hintText: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  poop: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  poopTouchable: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  poopEmoji: {
    textAlign: 'center',
  },
  specialEffect: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  specialEffectText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
    zIndex: 101,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  loadingDot: {
    fontSize: 30,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});