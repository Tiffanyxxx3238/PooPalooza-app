import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Dimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FallingPoop {
  id: number;
  x: number;
  y: Animated.Value;
  speed: number;
  size: number;
  hitbox: number;
  type: string;
  points: number;
}

interface ScorePopup {
  id: number;
  x: number;
  y: number;
  points: number;
  opacity: Animated.Value;
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
  const [scorePopups, setScorePopups] = useState<ScorePopup[]>([]);
  const [gameActive, setGameActive] = useState(true);
  const poopIdRef = useRef(0);
  const animationsRef = useRef<Animated.CompositeAnimation[]>([]);

  // 創建新的大便
  const createPoop = () => {
    const types = [
      { emoji: '💩', points: 10, size: 40, hitbox: 70 }, 
      { emoji: '✨', points: 20, size: 35, hitbox: 65 },
      { emoji: '🌈', points: 30, size: 45, hitbox: 75 },
      { emoji: '🚀', points: 50, size: 38, hitbox: 68 },
    ];
    
    const selectedType = types[Math.floor(Math.random() * types.length)];
    const poop: FallingPoop = {
      id: poopIdRef.current++,
      x: Math.random() * (SCREEN_WIDTH - 80) + 40,
      y: new Animated.Value(-50),
      speed: 4000 + Math.random() * 2000, // 4-6秒
      size: selectedType.size,
      hitbox: selectedType.hitbox,
      type: selectedType.emoji,
      points: selectedType.points,
    };

    return poop;
  };

  // 顯示得分彈出動畫
  const showScorePopup = (x: number, yValue: number, points: number) => {
    const popup: ScorePopup = {
      id: Date.now(),
      x,
      y: yValue,
      points,
      opacity: new Animated.Value(1),
    };
    
    setScorePopups(prev => [...prev, popup]);
    
    Animated.timing(popup.opacity, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setScorePopups(prev => prev.filter(p => p.id !== popup.id));
    });
  };

  // 處理點擊
  const handlePoopTap = (poop: FallingPoop) => {
    // 震動反饋
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // 立即移除避免重複點擊
    setPoops(prev => prev.filter(p => p.id !== poop.id));
    
    // 計算分數
    const points = poop.points * (1 + Math.floor(combo / 5));
    setScore(prev => prev + points);
    setCombo(prev => prev + 1);
    
    // 顯示得分動畫
    // @ts-ignore
    showScorePopup(poop.x, poop.y._value, points);
  };

  // 遊戲循環
  useEffect(() => {
    if (!isVisible || !gameActive) return;

    const spawnInterval = setInterval(() => {
      const newPoop = createPoop();
      setPoops(prev => [...prev, newPoop]);
      
      const animation = Animated.timing(newPoop.y, {
        toValue: SCREEN_HEIGHT + 100,
        duration: newPoop.speed,
        useNativeDriver: true,
      });
      
      animation.start(({ finished }) => {
        if (finished) {
          setCombo(0);
          setPoops(prev => prev.filter(p => p.id !== newPoop.id));
        }
      });
      
      animationsRef.current.push(animation);
    }, 800); // 每0.8秒產生一個

    return () => {
      clearInterval(spawnInterval);
      animationsRef.current.forEach(anim => anim.stop());
      animationsRef.current = [];
    };
  }, [isVisible, gameActive]);

  // 重置連擊計時器
  useEffect(() => {
    if (combo > 0) {
      const timer = setTimeout(() => {
        setCombo(0);
      }, 3000);
      
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
              left: poop.x - poop.hitbox / 2,
              transform: [{ translateY: poop.y }],
              width: poop.hitbox,
              height: poop.hitbox,
            }
          ]}
        >
          <TouchableOpacity
            onPress={() => handlePoopTap(poop)}
            style={[styles.poopTouchable, { 
              width: poop.hitbox, 
              height: poop.hitbox 
            }]}
            activeOpacity={1}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <View style={styles.poopContent}>
              <Text style={[styles.poopEmoji, { fontSize: poop.size }]}>
                {poop.type}
              </Text>
              {/* 調試用 - 顯示點擊區域 */}
              {__DEV__ && (
                <View style={[styles.debugHitbox, { 
                  width: poop.hitbox, 
                  height: poop.hitbox 
                }]} />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      ))}

      {/* 得分彈出動畫 */}
      {scorePopups.map(popup => (
        <Animated.View
          key={popup.id}
          style={[
            styles.scorePopup,
            {
              left: popup.x - 20,
              top: popup.y,
              opacity: popup.opacity,
              transform: [
                {
                  translateY: popup.opacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-30, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.scorePopupText}>+{popup.points}</Text>
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
      const timer = setTimeout(() => {
        setShowGame(true);
      }, 1000);

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
    justifyContent: 'center',
    alignItems: 'center',
  },
  poopContent: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  poopEmoji: {
    textAlign: 'center',
  },
  debugHitbox: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: 'rgba(255, 0, 0, 0.2)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
  },
  scorePopup: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 215, 0, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  scorePopupText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
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