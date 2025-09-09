import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { usePoopStore } from '@/store/poopStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { User, Bell, Moon, Star, Share2, HelpCircle, LogOut } from 'lucide-react-native';
import backgroundMusicService from '@/services/backgroundMusicService';

export default function ProfileScreen() {
  const router = useRouter();
  const { username, email, logout } = useUserStore();
  const { entries, longestStreak } = usePoopStore();
  
  // 所有開關的狀態
  const [isMusicOn, setIsMusicOn] = useState(true);
  const [achievementAlerts, setAchievementAlerts] = useState(true);
  const [stickersInAlerts, setStickersInAlerts] = useState(true);
  const [sharingEnabled, setSharingEnabled] = useState(false);
  
  useEffect(() => {
    setIsMusicOn(!backgroundMusicService.getIsMuted());
  }, []);
  
  const avgMinutes =
    entries.length > 0
      ? Math.round(
          entries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / entries.length / 60
        )
      : 0;

  const handleLogout = () => {
    logout();
    router.replace('/');
  };
  
  const handleMusicToggle = async () => {
    try {
      console.log('Toggle pressed, current state:', isMusicOn);
      const muted = await backgroundMusicService.toggleMute();
      setIsMusicOn(!muted);
      console.log('New state:', !muted ? 'ON' : 'OFF');
    } catch (error) {
      console.error('Failed to toggle music:', error);
      setIsMusicOn(!isMusicOn);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
            {/* 測試區域 - 加在這裡 */}
      <View style={{ padding: 20, backgroundColor: 'yellow', marginBottom: 20 }}>
        <Text>測試開關（應該要能切換）：</Text>
        <Switch
          value={isMusicOn}
          onValueChange={(value) => {
            console.log('測試開關改變為:', value);
            setIsMusicOn(value);
          }}
        />
        <Text>當前值：{isMusicOn ? '開' : '關'}</Text>
      </View>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* 使用者資訊 */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <User size={40} color={Colors.primary.accent} />
          </View>
          <Text style={styles.username}>{username || 'Guest User'}</Text>
          <Text style={styles.email}>{email || 'guest@example.com'}</Text>
        </View>

        <View style={styles.statsContainer}>
          <Stat label="Total Poops" value={entries.length} />
          <Divider />
          <Stat label="Longest Streak" value={longestStreak} />
          <Divider />
          <Stat label="Avg Minutes" value={avgMinutes} />
        </View>
        
        {/* 音樂設定 */}
        <Section title="Sound Settings">
          <Row 
            label="Background Music 🎵"
            switchValue={isMusicOn}
            onPress={handleMusicToggle}
          />
        </Section>
        
        {/* 通知設定 */}
        <Section title="Notifications">
          <Row
            label="Poop Reminders"
            onPress={() => router.push('/reminder-settings')}
          />
          <Row
            label="Notification Sounds"
            onPress={() => router.push('/notification-sounds')}
          />
          <Row 
            label="Achievement Alerts" 
            switchValue={achievementAlerts}
            onPress={() => setAchievementAlerts(!achievementAlerts)}
          />
          <Row 
            label="Stickers in Alerts" 
            switchValue={stickersInAlerts}
            onPress={() => setStickersInAlerts(!stickersInAlerts)}
          />
        </Section>

        {/* 外觀設定 */}
        <Section title="Appearance">
          <Row label="Theme" right="Light" icon={<Moon size={18} color={Colors.primary.text} />} />
          <Row 
            label="Sharing Enabled" 
            switchValue={sharingEnabled}
            onPress={() => setSharingEnabled(!sharingEnabled)}
          />
        </Section>

        {/* 一般設定 */}
        <Section title="General">
          <Row label="Sync with Health" right="On" />
          <Row label="iCloud Backup" right="On" />
          <Row label="Reset Time" right="12:00 AM" />
        </Section>

        {/* 支援 */}
        <Section title="Support">
          <Row label="Help Center" icon={<HelpCircle size={18} color={Colors.primary.text} />} />
          <Row label="Rate Us" icon={<Star size={18} color={Colors.primary.text} />} />
          <Row label="Share App" icon={<Share2 size={18} color={Colors.primary.text} />} />
        </Section>

        {/* 登出按鈕 */}
        <View style={styles.logoutContainer}>
          <Button
            title="Log Out"
            onPress={handleLogout}
            variant="outline"
            style={styles.logoutButton}
            textStyle={styles.logoutButtonText}
          />
        </View>

        <Text style={styles.versionText}>PooPalooza v1.0.0</Text>
      </ScrollView>
    </>
  );
}

// 統計欄位
function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// 分隔線
function Divider() {
  return <View style={styles.statDivider} />;
}

// 區塊標題 + 包裝
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBox}>{children}</View>
    </View>
  );
}

// 每行設定列
function Row({
  label,
  right,
  icon,
  switchValue,
  onPress,
}: {
  label: string;
  right?: string;
  icon?: React.ReactNode;
  switchValue?: boolean;
  onPress?: () => void;
}) {
  return (
    <View style={styles.rowWrapper}>
      <View style={styles.row}>
        <View style={styles.rowLeft}>
          {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        {switchValue !== undefined ? (
          <Switch 
            value={switchValue}
            onValueChange={(newValue) => {
              console.log(`Switch ${label} 改變為: ${newValue}`);
              if (onPress) {
                onPress();
              }
            }}
          />
        ) : right ? (
          <Text style={styles.rowRight}>{right}</Text>
        ) : onPress ? (
          <TouchableOpacity onPress={onPress}>
            <Text style={styles.rowRight}>{'>'}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.primary.background },
  content: { padding: 16, paddingBottom: 40 },

  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary.card,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  username: { fontSize: 24, fontWeight: 'bold', color: Colors.primary.text, marginBottom: 4 },
  email: { fontSize: 16, color: Colors.primary.lightText },

  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: Colors.primary.accent, marginBottom: 4 },
  statLabel: { fontSize: 14, color: Colors.primary.lightText },
  statDivider: { width: 1, height: '100%', backgroundColor: Colors.primary.border },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: Colors.primary.text, marginBottom: 8 },
  sectionBox: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 8,
  },
  rowWrapper: {
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontSize: 16, color: Colors.primary.text },
  rowRight: { fontSize: 16, color: Colors.primary.lightText },

  logoutContainer: { marginVertical: 24 },
  logoutButton: { borderColor: Colors.primary.error },
  logoutButtonText: { color: Colors.primary.error },
  versionText: { textAlign: 'center', fontSize: 14, color: Colors.primary.lightText },
});