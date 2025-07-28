import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Button from '@/components/Button';
import Colors from '@/constants/colors';
import { Bug } from 'lucide-react-native';

export default function SendDebugReportScreen() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!description.trim()) {
      Alert.alert('Oops!', 'Please describe the issue you encountered.');
      return;
    }

    setSending(true);

    try {
      // 模擬發送除錯報告的 API 行為
      await new Promise((resolve) => setTimeout(resolve, 1500));

      Alert.alert('Thank you!', 'Your debug report has been sent successfully.');
      setDescription('');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to send report. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Send Debug Report' }} />

      <View style={styles.header}>
        <Bug size={32} color={Colors.primary.accent} />
        <Text style={styles.title}>Help Us Squash Bugs</Text>
        <Text style={styles.subtitle}>
          Found something strange? Let us know so we can fix it.
        </Text>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Describe what happened..."
        placeholderTextColor={Colors.primary.lightText}
        multiline
        numberOfLines={6}
        value={description}
        onChangeText={setDescription}
      />

      <Button
        title={sending ? 'Sending...' : 'Send Report'}
        onPress={handleSend}
        disabled={sending}
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
  input: {
    backgroundColor: Colors.primary.card,
    color: Colors.primary.text,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 150,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  button: {
    paddingVertical: 14,
  },
});