import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { LinearGradient } from 'expo-linear-gradient';
import ChatScreen from '@/components/ChatScreen';

export default function WelcomeScreen() {
  const router = useRouter();
  const isLoggedIn = useUserStore((state) => state.isLoggedIn);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      router.replace('/(tabs)');
    }
  }, [isLoggedIn]);

  const handleGetStarted = () => {
    router.push('/login');
  };

  const openChat = () => {
    setShowChat(true);
  };

  const closeChat = () => {
    setShowChat(false);
  };

  return (
    <LinearGradient
      colors={['#F5E6C4', '#F0D6A7']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>PooPalooza</Text>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG9vcCUyMGVtb2ppfGVufDB8fDB8fHww&auto=format&fit=crop&w=500&q=60' }}
            style={styles.logoImage}
          />
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.welcomeText}>Welcome to PooPalooza!</Text>
          <Text style={styles.descriptionText}>
            Your cute bathroom companion that helps you track your poop and pee habits for better health insights.
          </Text>
          
          <View style={styles.featuresContainer}>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>📸</Text>
              <Text style={styles.featureText}>Capture and analyze your poop</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>📊</Text>
              <Text style={styles.featureText}>Get health insights and trends</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>🗺️</Text>
              <Text style={styles.featureText}>Find bathrooms nearby</Text>
            </View>
            <View style={styles.featureItem}>
              <Text style={styles.featureEmoji}>⏱️</Text>
              <Text style={styles.featureText}>Track bathroom time</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.buttonContainer}>
          <Button 
            title="Get Started" 
            onPress={handleGetStarted}
            style={styles.button}
          />
        </View>
      </View>

      {/* 浮動聊天按鈕 */}
      <TouchableOpacity 
        style={styles.chatButton}
        onPress={openChat}
        activeOpacity={0.8}
      >
        <Text style={styles.chatButtonEmoji}>🤖</Text>
      </TouchableOpacity>

      {/* 聊天模態框 */}
      <Modal
        visible={showChat}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <ChatScreen onClose={closeChat} />
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.primary.accent,
    marginBottom: 16,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  infoContainer: {
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 16,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresContainer: {
    width: '100%',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: Colors.primary.text,
  },
  buttonContainer: {
    marginBottom: 40,
  },
  button: {
    paddingVertical: 16,
  },
  // 浮動聊天按鈕樣式
  chatButton: {
    position: 'absolute',
    left: 20,
    top: '50%',
    marginTop: -30, // 按鈕高度的一半
    backgroundColor: '#F7A600',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  chatButtonEmoji: {
    fontSize: 30,
  },
});