// services/backgroundMusicService.ts
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

class BackgroundMusicService {
  private sound: Audio.Sound | null = null;
  private isPlaying: boolean = false;
  private isMuted: boolean = false;

  async initialize() {
    try {
      // 設定音頻模式
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // 載入使用者的靜音設定
      const mutedSetting = await AsyncStorage.getItem('musicMuted');
      this.isMuted = mutedSetting === 'true';

      if (!this.isMuted) {
        await this.loadAndPlay();
      }
    } catch (error) {
      console.error('初始化背景音樂失敗:', error);
    }
  }

  async loadAndPlay() {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // 載入音樂檔案
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/lo-fi.wav'),  // 注意路徑
        { 
          isLooping: true,
          volume: 0.3,
          shouldPlay: true 
        }
      );

      this.sound = sound;
      this.isPlaying = true;

    } catch (error) {
      console.error('載入音樂失敗:', error);
    }
  }

  async toggleMute() {
    this.isMuted = !this.isMuted;
    await AsyncStorage.setItem('musicMuted', this.isMuted.toString());

    if (this.isMuted && this.sound) {
      await this.sound.pauseAsync();
      this.isPlaying = false;
    } else if (!this.isMuted) {
      if (this.sound) {
        await this.sound.playAsync();
        this.isPlaying = true;
      } else {
        await this.loadAndPlay();
      }
    }

    return this.isMuted;
  }

  getIsMuted() {
    return this.isMuted;
  }

  async cleanup() {
    if (this.sound) {
      await this.sound.unloadAsync();
      this.sound = null;
      this.isPlaying = false;
    }
  }
}

export default new BackgroundMusicService();