// store/themeStore.ts
import { create } from 'zustand';
import { Appearance } from 'react-native';

type Theme = 'light' | 'dark' | 'system';

interface ThemeStore {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark'; // 實際要用的主題
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
  get resolvedTheme() {
    const userTheme = get().theme;
    if (userTheme === 'system') {
      const colorScheme = Appearance.getColorScheme();
      return colorScheme === 'dark' ? 'dark' : 'light';
    }
    return userTheme;
  },
}));