import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { Droplet, AlertCircle, CheckCircle, Info } from 'lucide-react-native';

const poopTypes = [
  {
    title: 'Type 1 - Hard Pellets 💠',
    description: 'Small, hard lumps like nuts. Difficult to pass.',
    advice: 'You may be dehydrated. Drink more water and increase fiber.',
    icon: <AlertCircle size={20} color={Colors.primary.warning} />,
  },
  {
    title: 'Type 2 - Lumpy Sausage 🪵',
    description: 'Firm and segmented like a lumpy log.',
    advice: 'Could indicate mild constipation. Add more veggies and movement.',
    icon: <Info size={20} color={Colors.primary.text} />,
  },
  {
    title: 'Type 3 - Perfect Log ✅',
    description: 'Smooth, soft sausage shape. Easy to pass.',
    advice: 'This is healthy poop! Keep up the good work!',
    icon: <CheckCircle size={20} color={Colors.primary.accent} />,
  },
  {
    title: 'Type 4 - Soft Snake 🐍',
    description: 'Soft, smooth, and well-formed. Normal and healthy.',
    advice: 'Stay consistent with hydration and fiber.',
    icon: <CheckCircle size={20} color={Colors.primary.accent} />,
  },
  {
    title: 'Type 5 - Soft Blobs 🫧',
    description: 'Soft blobs with clear edges. May come out quickly.',
    advice: 'Could be mild urgency or low fiber. Track your meals.',
    icon: <Info size={20} color={Colors.primary.text} />,
  },
  {
    title: 'Type 6 - Fluffy Pieces 🍚',
    description: 'Fluffy with ragged edges. Mushy stool.',
    advice: 'Possible mild diarrhea. Stay hydrated and monitor digestion.',
    icon: <AlertCircle size={20} color={Colors.primary.warning} />,
  },
  {
    title: 'Type 7 - Liquid 💧',
    description: 'Entirely watery with no solid pieces.',
    advice: 'You may be sick or have food poisoning. Rest and hydrate.',
    icon: <AlertCircle size={20} color={Colors.primary.error} />,
  },
];

export default function GuideToHealthyPoopScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Guide to Healthy Poop' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.intro}>
          Learn about the Bristol Stool Chart and what your poop says about your health!
        </Text>
        {poopTypes.map((item, index) => (
          <View key={index} style={styles.card}>
            <View style={styles.cardHeader}>
              {item.icon}
              <Text style={styles.title}>{item.title}</Text>
            </View>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.advice}>{item.advice}</Text>
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
  advice: {
    fontSize: 14,
    color: Colors.primary.accent,
    fontStyle: 'italic',
  },
});