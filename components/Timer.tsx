import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { usePoopStore } from '@/store/poopStore';
import Colors from '@/constants/colors';
import { Clock } from 'lucide-react-native';

export default function Timer() {
  const { isTimerRunning, timerStartTime, startTimer, stopTimer, resetTimer } = usePoopStore();
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning && timerStartTime) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - timerStartTime) / 1000);
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    
    return () => clearInterval(interval);
  }, [isTimerRunning, timerStartTime]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimerToggle = () => {
    if (isTimerRunning) {
      stopTimer();
    } else {
      startTimer();
    }
  };

  const handleReset = () => {
    resetTimer();
  };

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Clock size={24} color={Colors.primary.text} />
        <Text style={styles.timerText}>{formatTime(elapsedTime)}</Text>
      </View>
      
      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.button, isTimerRunning ? styles.stopButton : styles.startButton]}
          onPress={handleTimerToggle}
        >
          <Text style={styles.buttonText}>
            {isTimerRunning ? 'Stop' : 'Start'}
          </Text>
        </Pressable>
        
        {isTimerRunning && (
          <Pressable
            style={[styles.button, styles.resetButton]}
            onPress={handleReset}
          >
            <Text style={styles.buttonText}>Reset</Text>
          </Pressable>
        )}
      </View>
      
      {elapsedTime > 300 && (
        <Text style={styles.warningText}>
          ⚠️ You've been here for over 5 minutes. Be careful of hemorrhoids!
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginLeft: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: Colors.primary.success,
  },
  stopButton: {
    backgroundColor: Colors.primary.error,
  },
  resetButton: {
    backgroundColor: Colors.primary.warning,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  warningText: {
    color: Colors.primary.error,
    textAlign: 'center',
    marginTop: 12,
    fontSize: 12,
  },
});