import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PoopEntry } from '@/types/poop';

interface PoopState {
  entries: PoopEntry[];
  currentTimer: number | null;
  timerStartTime: number | null;
  isTimerRunning: boolean;
  longestStreak: number;
  addEntry: (entry: PoopEntry) => void;
  removeEntry: (id: string) => void;
  updateEntry: (id: string, entry: Partial<PoopEntry>) => void;
  startTimer: () => void;
  stopTimer: () => number;
  resetTimer: () => void;
  getEntries: () => PoopEntry[];
  getEntriesByDateRange: (startDate: string, endDate: string) => PoopEntry[];
}

export const usePoopStore = create<PoopState>()(
  persist(
    (set, get) => ({
      entries: [],
      currentTimer: null,
      timerStartTime: null,
      isTimerRunning: false,
      longestStreak: 0,

      addEntry: (entry) => {
        set((state) => {
          const newEntries = [...state.entries, entry];
          
          // Calculate streak
          const sortedEntries = [...newEntries].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          
          let currentStreak = 1;
          let longestStreak = state.longestStreak;
          
          for (let i = 1; i < sortedEntries.length; i++) {
            const prevDate = new Date(sortedEntries[i-1].date);
            const currDate = new Date(sortedEntries[i].date);
            
            const diffTime = Math.abs(prevDate.getTime() - currDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              currentStreak++;
            } else {
              break;
            }
          }
          
          if (currentStreak > longestStreak) {
            longestStreak = currentStreak;
          }
          
          return { 
            entries: newEntries,
            longestStreak
          };
        });
      },

      removeEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter((entry) => entry.id !== id),
        }));
      },

      updateEntry: (id, updatedEntry) => {
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, ...updatedEntry } : entry
          ),
        }));
      },

      startTimer: () => {
        set({
          timerStartTime: Date.now(),
          isTimerRunning: true,
        });
      },

      stopTimer: () => {
        const { timerStartTime } = get();
        if (!timerStartTime) return 0;
        
        const duration = Math.floor((Date.now() - timerStartTime) / 1000);
        set({
          currentTimer: duration,
          isTimerRunning: false,
        });
        return duration;
      },

      resetTimer: () => {
        set({
          currentTimer: null,
          timerStartTime: null,
          isTimerRunning: false,
        });
      },

      getEntries: () => {
        return get().entries;
      },

      getEntriesByDateRange: (startDate, endDate) => {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        
        return get().entries.filter((entry) => {
          const entryDate = new Date(entry.date).getTime();
          return entryDate >= start && entryDate <= end;
        });
      },
    }),
    {
      name: 'poop-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);