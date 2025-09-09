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

      // 總是載入音樂，但根據靜音設定決定是否播放
      await this.loadMusic();
      
      if (!this.isMuted) {
        await this.play();
      }
    } catch (error) {
      console.error('初始化背景音樂失敗:', error);
    }
  }

  async loadMusic() {
    try {
      if (this.sound) {
        await this.sound.unloadAsync();
      }

      // 載入音樂檔案但不自動播放
      const { sound } = await Audio.Sound.createAsync(
        require('../assets/sounds/lo-fi.wav'),
        { 
          isLooping: true,
          volume: 0.1,
          shouldPlay: false  // 改為 false
        }
      );

      this.sound = sound;
    } catch (error) {
      console.error('載入音樂失敗:', error);
    }
  }

  async play() {
    try {
      if (this.sound && !this.isPlaying) {
        await this.sound.playAsync();
        this.isPlaying = true;
      }
    } catch (error) {
      console.error('播放音樂失敗:', error);
    }
  }

  async pause() {
    try {
      if (this.sound && this.isPlaying) {
        await this.sound.pauseAsync();
        this.isPlaying = false;
      }
    } catch (error) {
      console.error('暫停音樂失敗:', error);
    }
  }

  async toggleMute(): Promise<boolean> {
    try {
      this.isMuted = !this.isMuted;
      
      if (this.isMuted) {
        // 靜音時暫停音樂
        await this.pause();
      } else {
        // 取消靜音時播放音樂
        await this.play();
      }
      
      // 儲存設定
      await AsyncStorage.setItem('musicMuted', this.isMuted.toString());
      
      console.log('Music toggled, muted:', this.isMuted);
      return this.isMuted;
    } catch (error) {
      console.error('Toggle mute error:', error);
      return this.isMuted;
    }
  }

  getIsMuted(): boolean {
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