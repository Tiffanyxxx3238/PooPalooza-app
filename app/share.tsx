import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, Image } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { Share2, Send, Link } from 'lucide-react-native';

export default function ShareScreen() {
  const handleShare = async () => {
    try {
      await Share.share({
        message:
          '💩 Check out PooPalooza – the cutest health companion for tracking your poop & pee! 🧻\n\nDownload now:\nhttps://poopalooza.app',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share the app.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Share PooPalooza' }} />

      <View style={styles.illustrationContainer}>
        <Image
          //source={require('@/assets/share-poop.png')}
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>Spread the 💩 love!</Text>
        <Text style={styles.subtitle}>Tell your friends about PooPalooza</Text>
      </View>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Share2 size={22} color="#fff" />
        <Text style={styles.shareText}>Share Now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.primary.lightText,
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.accent,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  shareText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '600',
  },
});