import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';

export default function AboutScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>About PooPalooza</Text>
      <Text style={styles.text}>
        💩 PooPalooza is a fun yet scientific way to monitor your digestive health through poop tracking and AI-powered stool image analysis.
      </Text>
      <Text style={styles.text}>
        🧠 Developed by a passionate team of students and healthcare innovators. This app aims to bring awareness and early detection of gut issues.
      </Text>
      <Text style={styles.text}>
        📲 Version 1.0.0 | © 2025 PooPalooza Health Lab
      </Text>
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
    marginBottom: 16,
    color: Colors.primary.text,
  },
  text: {
    fontSize: 16,
    color: Colors.primary.text,
    marginBottom: 12,
    lineHeight: 24,
  },
});