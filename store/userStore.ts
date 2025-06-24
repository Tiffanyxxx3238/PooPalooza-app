import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UserState {
  isLoggedIn: boolean;
  username: string | null;
  email: string | null;
  profilePicture: string | null;
  setLoggedIn: (status: boolean) => void;
  setUserInfo: (username: string, email: string, profilePicture?: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      isLoggedIn: false,
      username: null,
      email: null,
      profilePicture: null,
      
      setLoggedIn: (status) => set({ isLoggedIn: status }),
      
      setUserInfo: (username, email, profilePicture) => set({
        username,
        email,
        profilePicture: profilePicture || null,
        isLoggedIn: true,
      }),
      
      logout: () => set({
        isLoggedIn: false,
        username: null,
        email: null,
        profilePicture: null,
      }),
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);