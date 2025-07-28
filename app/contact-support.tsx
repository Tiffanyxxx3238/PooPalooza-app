import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { Stack } from 'expo-router';
import { Mail, MessageSquare, Globe } from 'lucide-react-native';
import Colors from '@/constants/colors';

export default function ContactSupportScreen() {
  const openEmail = () => {
    Linking.openURL('mailto:support@poopalooza.app');
  };

  const openWebsite = () => {
    Linking.openURL('https://poopalooza.app/support');
  };

  const openMessenger = () => {
    Linking.openURL('https://m.me/poopalooza');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Contact Support' }} />

      <Text style={styles.title}>Need Help?</Text>
      <Text style={styles.subtitle}>We're here for you. Choose one of the contact methods below:</Text>

      <TouchableOpacity style={styles.card} onPress={openEmail}>
        <Mail color={Colors.primary.accent} size={28} />
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>Email Us</Text>
          <Text style={styles.cardSubtitle}>support@poopalooza.app</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={openMessenger}>
        <MessageSquare color={Colors.primary.accent} size={28} />
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>Messenger</Text>
          <Text style={styles.cardSubtitle}>Chat with our team</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={openWebsite}>
        <Globe color={Colors.primary.accent} size={28} />
        <View style={styles.cardTextContainer}>
          <Text style={styles.cardTitle}>Visit Website</Text>
          <Text style={styles.cardSubtitle}>FAQs, guides, and more</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: Colors.primary.text,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: Colors.primary.lightText,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTextContainer: {
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.primary.lightText,
  },
});