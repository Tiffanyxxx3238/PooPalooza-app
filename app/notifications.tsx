import { View, Text, StyleSheet, Switch } from 'react-native';
import Colors from '@/constants/colors';
import { useState } from 'react';

export default function NotificationSettings() {
  const [healthTips, setHealthTips] = useState(true);
  const [poopReminder, setPoopReminder] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Preferences</Text>

      <View style={styles.item}>
        <Text style={styles.label}>Daily Health Tips</Text>
        <Switch value={healthTips} onValueChange={setHealthTips} />
      </View>

      <View style={styles.item}>
        <Text style={styles.label}>Poop Reminders</Text>
        <Switch value={poopReminder} onValueChange={setPoopReminder} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.primary.background,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
    color: Colors.primary.text,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    color: Colors.primary.text,
  },
});