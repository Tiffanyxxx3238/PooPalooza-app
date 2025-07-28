import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { Droplet, AlertCircle, Smile, Frown, Flame, Leaf } from 'lucide-react-native';

const poopInsights = [
  {
    title: 'Dark Brown 💩',
    icon: <Smile size={20} color={Colors.primary.accent} />,
    description: 'Normal and healthy poop color.',
    tip: 'Keep eating fiber-rich foods and stay hydrated.',
  },
  {
    title: 'Light Brown / Yellowish 🍯',
    icon: <Leaf size={20} color={Colors.primary.warning} />,
    description: 'May indicate fat malabsorption or gallbladder issues.',
    tip: 'Consider checking your digestive enzyme levels.',
  },
  {
    title: 'Green 💚',
    icon: <Flame size={20} color="#28a745" />,
    description: 'Often due to eating leafy greens or rapid digestion.',
    tip: 'It’s usually okay. If frequent, track diet and stress.',
  },
  {
    title: 'Black 🖤',
    icon: <AlertCircle size={20} color={Colors.primary.error} />,
    description: 'May suggest internal bleeding or iron supplements.',
    tip: 'If not due to medication, consult a doctor immediately.',
  },
  {
    title: 'Red ❤️',
    icon: <AlertCircle size={20} color={Colors.primary.error} />,
    description: 'Possible bleeding or red-colored food.',
    tip: 'Check for blood. If unsure, seek medical advice.',
  },
  {
    title: 'White / Clay 💀',
    icon: <Frown size={20} color={Colors.primary.warning} />,
    description: 'Could indicate liver or bile duct issues.',
    tip: 'Requires medical attention to rule out blockage.',
  },
  {
    title: 'Smelly or Floating 🫧',
    icon: <Droplet size={20} color={Colors.primary.text} />,
    description: 'May signal fat digestion problems or infection.',
    tip: 'Track dietary fats. Consider medical testing if frequent.',
  },
];

export default function PoopAnalysisTipsScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'What Your Poop Says About You' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Your poop color and texture can tell you a lot about your health. Let’s break it down!
        </Text>
        {poopInsights.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              {item.icon}
              <Text style={styles.title}>{item.title}</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.tip}>{item.tip}</Text>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  intro: {
    fontSize: 16,
    color: Colors.primary.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.primary.lightText,
    marginBottom: 4,
  },
  tip: {
    fontSize: 14,
    color: Colors.primary.accent,
    fontStyle: 'italic',
  },
});