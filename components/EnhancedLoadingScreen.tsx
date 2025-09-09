import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Mini game component - Simplified and more forgiving
const PoopRunnerGame = ({ isPlaying }: { isPlaying: boolean }) => {
  const [obstacles, setObstacles] = useState<Array<{id: number, x: number}>>([]);
  const [score, setScore] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const jumpAnim = useRef(new Animated.Value(0)).current;
  const gameLoopRef = useRef<any>(null);
  const obstacleIdRef = useRef(0);
  const frameCount = useRef(0);
  const firstObstacleAdded = useRef(false); // Track if first obstacle was added

  // Simple jump animation
  const jump = useCallback(() => {
    if (isJumping || gameOver) return;
    
    setIsJumping(true);
    
    // Simple jump animation with good height
    Animated.sequence([
      Animated.timing(jumpAnim, {
        toValue: -80,  // Good jump height
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(jumpAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsJumping(false);
    });
  }, [isJumping, gameOver, jumpAnim]);

  // Main game loop
  useEffect(() => {
    if (!isPlaying || gameOver) return;

    gameLoopRef.current = setInterval(() => {
      frameCount.current += 1;
      
      // Update obstacles
      setObstacles(prev => {
        let updated: Array<{id: number, x: number}> = prev.map(obs => ({
          id: obs.id,
          x: obs.x - 3  // Constant speed for simplicity
        })).filter(obs => obs.x > -50);

        // Add first obstacle quickly (at 60 frames = 1 second)
        if (!firstObstacleAdded.current && frameCount.current === 60) {
          updated.push({
            id: obstacleIdRef.current++,
            x: SCREEN_WIDTH
          });
          firstObstacleAdded.current = true;
        } else if (firstObstacleAdded.current) {
          // Add obstacles with random spacing
          const lastObstacle = updated[updated.length - 1];
          const minDistance = 100; // Minimum distance between obstacles
          const randomChance = Math.random();
          
          // Only add if there's enough space and random chance hits
          if ((!lastObstacle || lastObstacle.x < SCREEN_WIDTH - minDistance) && randomChance < 0.02) {
            updated.push({
              id: obstacleIdRef.current++,
              x: SCREEN_WIDTH
            });
          }
        }

        return updated;
      });

      // Update score
      if (frameCount.current % 10 === 0) {
        setScore(prev => prev + 1);
      }
    }, 16);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [isPlaying, gameOver]);

  // Separate collision detection to avoid complexity
  useEffect(() => {
    if (gameOver || !isPlaying) return;

    // Store current jump value to avoid listener issues
    let currentJumpValue = 0;
    const listener = jumpAnim.addListener(({ value }) => {
      currentJumpValue = value;
    });

    // Check collisions periodically
    const collisionCheck = setInterval(() => {
      obstacles.forEach(obs => {
        // Very simple collision: if obstacle is in poop zone and poop is not jumping
        if (obs.x > 40 && obs.x < 70) {
          if (currentJumpValue > -20) {  // Only collide if very close to ground
            setGameOver(true);
          }
        }
      });
    }, 50);
    
    return () => {
      jumpAnim.removeListener(listener);
      clearInterval(collisionCheck);
    };
  }, [obstacles, gameOver, isPlaying, jumpAnim]);

  // Reset game
  const resetGame = () => {
    setObstacles([]);
    setScore(0);
    setGameOver(false);
    frameCount.current = 0;
    obstacleIdRef.current = 0;
    firstObstacleAdded.current = false; // Reset first obstacle flag
  };

  if (!isPlaying) return null;

  return (
    <TouchableOpacity 
      style={styles.gameContainer} 
      onPress={jump}
      activeOpacity={1}
    >
      <Text style={styles.gameTitle}>💩 Poop Runner</Text>
      <Text style={styles.score}>Score: {score}</Text>

      {/* Ground */}
      <View style={styles.ground} />

      {/* Poop character */}
      <Animated.View 
        style={[
          styles.poop,
          {
            transform: [{ translateY: jumpAnim }]
          }
        ]}
      >
        <Text style={styles.poopEmoji}>💩</Text>
      </Animated.View>

      {/* Obstacles */}
      {obstacles.map(obs => (
        <View
          key={obs.id}
          style={[
            styles.obstacle,
            { left: obs.x }
          ]}
        >
          <Text style={styles.obstacleEmoji}>
            {obs.id % 2 === 0 ? '🧻' : '🚽'}
          </Text>
        </View>
      ))}

      {/* Game Over */}
      {gameOver && (
        <View style={styles.gameOverContainer}>
          <Text style={styles.gameOverText}>Game Over!</Text>
          <Text style={styles.finalScore}>Score: {score}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={resetGame}>
            <Text style={styles.retryText}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Instructions */}
      {!gameOver && score === 0 && (
        <Text style={styles.instructions}>Tap to jump!</Text>
      )}
    </TouchableOpacity>
  );
};

// Animated poop progress bar
const PoopProgressBar = ({ progress }: { progress: number }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const poopPosition = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedValue, {
        toValue: progress,
        duration: 500,
        useNativeDriver: false,
      }),
      Animated.timing(poopPosition, {
        toValue: progress,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, [progress, animatedValue, poopPosition]);

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressTrack}>
        <Animated.View 
          style={[
            styles.progressFill,
            {
              width: animatedValue.interpolate({
                inputRange: [0, 100],
                outputRange: ['0%', '100%']
              })
            }
          ]}
        />
        
        <Animated.View 
          style={[
            styles.progressPoop,
            {
              transform: [{
                translateX: poopPosition.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, SCREEN_WIDTH - 80]
                })
              }]
            }
          ]}
        >
          <Text style={styles.progressPoopEmoji}>💩</Text>
        </Animated.View>

        <View style={styles.progressToilet}>
          <Text style={styles.progressToiletEmoji}>🚽</Text>
        </View>
      </View>

      <Text style={styles.progressText}>{Math.round(progress)}%</Text>
    </View>
  );
};

// Main loading component
interface EnhancedLoadingProps {
  analysisProgress: string;
  showGame?: boolean;
}

export const EnhancedLoadingScreen: React.FC<EnhancedLoadingProps> = ({ 
  analysisProgress, 
  showGame = true 
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    { text: 'Preparing analysis...', emoji: '🔍', progress: 10 },
    { text: 'Verifying image content...', emoji: '🦉', progress: 25 },
    { text: 'Analyzing poop characteristics...', emoji: '🤖', progress: 50 },
    { text: 'Evaluating health indicators...', emoji: '🏥', progress: 75 },
    { text: 'Generating recommendations...', emoji: '💊', progress: 90 },
    { text: 'Almost done!', emoji: '✨', progress: 95 }
  ];

  // Simulate progress
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return Math.min(prev + Math.random() * 2, 95);
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  // Update step based on progress
  useEffect(() => {
    const stepIndex = steps.findIndex(step => {
      const stepKey = step.text.toLowerCase().split('...')[0];
      return analysisProgress.toLowerCase().includes(stepKey);
    });
    if (stepIndex !== -1) {
      setCurrentStep(stepIndex);
      setProgress(steps[stepIndex].progress);
    }
  }, [analysisProgress]);

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleEmoji}>{steps[currentStep].emoji}</Text>
        <Text style={styles.titleText}>AI Health Analysis</Text>
      </View>

      <Text style={styles.stepText}>{analysisProgress}</Text>

      <PoopProgressBar progress={progress} />

      <View style={styles.funFactContainer}>
        <Text style={styles.funFactTitle}>💡 Did you know?</Text>
        <Text style={styles.funFactText}>
          {progress < 30 
            ? "Your poop can tell you a lot about your digestive health!"
            : progress < 60
            ? "The Bristol Stool Chart is used by doctors worldwide!"
            : progress < 90
            ? "Healthy poop should be brown and well-formed!"
            : "Almost there! Preparing your personalized recommendations..."
          }
        </Text>
      </View>

      {showGame && progress < 95 && (
        <View style={styles.gameWrapper}>
          <Text style={styles.gameHint}>Play while you wait! 🎮</Text>
          <PoopRunnerGame isPlaying={true} />
        </View>
      )}

      <Text style={styles.estimatedTime}>
        Estimated time: {Math.max(1, Math.round((100 - progress) / 2))} seconds
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  titleEmoji: {
    fontSize: 32,
    marginRight: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  stepText: {
    fontSize: 16,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 30,
  },
  progressTrack: {
    height: 40,
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8B4513',
    borderRadius: 20,
  },
  progressPoop: {
    position: 'absolute',
    top: -5,
    left: -10,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPoopEmoji: {
    fontSize: 36,
  },
  progressToilet: {
    position: 'absolute',
    right: -5,
    top: -5,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressToiletEmoji: {
    fontSize: 36,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.accent,
  },
  funFactContainer: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  funFactTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
    marginBottom: 4,
  },
  funFactText: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  estimatedTime: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.primary.lightText,
    fontStyle: 'italic',
  },
  gameWrapper: {
    marginBottom: 20,
  },
  gameHint: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.primary.accent,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  gameContainer: {
    height: 200,
    backgroundColor: '#87CEEB',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  gameTitle: {
    position: 'absolute',
    top: 10,
    left: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    zIndex: 10,
  },
  score: {
    position: 'absolute',
    top: 10,
    right: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
    zIndex: 10,
  },
  ground: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: '#8B7355',
  },
  poop: {
    position: 'absolute',
    bottom: 50,
    left: 50,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  poopEmoji: {
    fontSize: 32,
  },
  obstacle: {
    position: 'absolute',
    bottom: 50,
    width: 30,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  obstacleEmoji: {
    fontSize: 28,
  },
  gameOverContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameOverText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 10,
  },
  finalScore: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  instructions: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#FFF',
    fontSize: 14,
  },
});