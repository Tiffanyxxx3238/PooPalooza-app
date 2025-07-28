import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Star, Heart } from 'lucide-react-native';
import Button from '@/components/Button';

export default function RateOurAppScreen() {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('Oops!', 'Please give a rating before submitting.');
      return;
    }

    setSubmitting(true);
    try {
      // 模擬發送評價資料
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert('Thank you!', 'Your feedback has been submitted.');
      setRating(0);
      setFeedback('');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return [...Array(5)].map((_, index) => {
      const filled = index < rating;
      return (
        <TouchableOpacity key={index} onPress={() => setRating(index + 1)}>
          <Star
            size={32}
            color={filled ? Colors.primary.accent : '#ccc'}
            fill={filled ? Colors.primary.accent : 'none'}
            style={styles.star}
          />
        </TouchableOpacity>
      );
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Rate Our App' }} />

      <View style={styles.header}>
        <Heart size={32} color={Colors.primary.accent} />
        <Text style={styles.title}>Love PooPalooza?</Text>
        <Text style={styles.subtitle}>
          Tell us what you think – or just rate us with 💩 and ❤️
        </Text>
      </View>

      <View style={styles.stars}>{renderStars()}</View>

      <TextInput
        style={styles.input}
        placeholder="Optional feedback..."
        placeholderTextColor={Colors.primary.lightText}
        multiline
        numberOfLines={4}
        value={feedback}
        onChangeText={setFeedback}
      />

      <Button
        title={submitting ? 'Submitting...' : 'Submit'}
        onPress={handleSubmit}
        disabled={submitting}
        style={styles.button}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
  },
  content: {
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginTop: 6,
  },
  stars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 20,
  },
  star: {
    marginHorizontal: 6,
  },
  input: {
    backgroundColor: Colors.primary.card,
    color: Colors.primary.text,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 14,
  },
});