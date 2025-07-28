export default {
  primary: {
    background: "#F5E6C4", // Light beige background
    card: "#F0D6A7", // Darker beige for cards
    accent: "#8B4513", // Brown accent
    text: "#5D4037", // Dark brown text
    lightText: "#8D6E63", // Light brown text
    button: "#A0522D", // Button color
    buttonText: "#FFFFFF", // Button text color
    border: "#D7CCA3", // Border color
    success: "#4CAF50", // Success color
    warning: "#FFC107", // Warning color
    error: "#F44336", // Error color
    chart: {
      line: "#8b5a2b",
      grid: "#e6d7b8",
      dot: "#a67c52",
    }
  }
  
};

// constants/colors.ts

const LightColors = {
  background: '#FFFFFF',
  card: '#F4F4F4',
  text: '#111',
  lightText: '#888',
  accent: '#3e64ff',
  border: '#DDD',
  error: '#FF4D4F',
};

const DarkColors = {
  background: '#000000',
  card: '#1a1a1a',
  text: '#EEE',
  lightText: '#AAA',
  accent: '#3e64ff',
  border: '#333',
  error: '#FF6B6B',
};

export const getThemeColors = (theme: 'light' | 'dark') => {
  return theme === 'dark' ? DarkColors : LightColors;
};