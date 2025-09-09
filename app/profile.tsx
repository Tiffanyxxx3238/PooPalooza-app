import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { usePoopStore } from '@/store/poopStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { ChevronRight } from 'lucide-react-native';
import backgroundMusicService from '@/services/backgroundMusicService';
import {
  User, Bell, Volume2, Trophy, ImageIcon, Paintbrush, AppWindow, Smartphone, Watch,
  Users, Mic, Ruler, Droplet, Mail, Calendar, BadgeCheck, Store, FileText, Lightbulb, Upload, AlarmClock, Heart, Cloud, Activity, Wrench, HelpCircle,
  Star, Share2
} from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { username, email, logout } = useUserStore();
  const { entries, longestStreak } = usePoopStore();
  
  // 所有 Switch 的狀態
  const [achievementAlerts, setAchievementAlerts] = useState(true);
  const [stickersInAlerts, setStickersInAlerts] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [sounds, setSounds] = useState(!backgroundMusicService.getIsMuted());
  const [fitbit, setFitbit] = useState(false);
  const [showTips, setShowTips] = useState(true);
useEffect(() => {
  setSounds(!backgroundMusicService.getIsMuted());
}, []);
const avgMinutes =
  entries.length > 0
    ? Math.round(entries.reduce((sum, entry) => sum + (entry.duration || 0), 0) / entries.length / 60)
    : 0;

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Profile' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <User size={40} color={Colors.primary.accent} />
          </View>
          <Text style={styles.username}>{username || 'Guest User'}</Text>
          <Text style={styles.email}>{email || 'guest@example.com'}</Text>
        </View>

        <Section title="Notifications">
          <Row label="Poop Reminders" icon={<Bell size={18} color={Colors.primary.text} />} onPress={() => router.push('/reminder-settings')} />
          <Row label="Notification Sounds" icon={<Volume2 size={18} color={Colors.primary.text} />} onPress={() => router.push('/notification-sounds')} />
          <Row 
            label="Achievement Alerts" 
            switchValue={achievementAlerts}
            icon={<Trophy size={18} color={Colors.primary.text} />}
            onPress={() => setAchievementAlerts(!achievementAlerts)}
          />
          <Row 
            label="Stickers in Alerts" 
            switchValue={stickersInAlerts}
            icon={<ImageIcon size={18} color={Colors.primary.text} />}
            onPress={() => setStickersInAlerts(!stickersInAlerts)}
          />
        </Section>

        <Section title="Appearance">
          <Row label="Theme" right="Light" icon={<Paintbrush size={18} color={Colors.primary.text} />} onPress={() => router.push('/theme')}/>
          <Row label="App Icon" right="💩" icon={<AppWindow size={18} color={Colors.primary.text} />} onPress={() => router.push('/app-icon')} />
          <Row label="Home Screen" icon={<Smartphone size={18} color={Colors.primary.text} />} onPress={() => router.push('/home-screen')} />
          <Row label="Apple Watch" icon={<Watch size={18} color={Colors.primary.text} />} onPress={() => router.push('/apple-watch')} />
          <Row 
            label="Sharing" 
            switchValue={sharing}
            icon={<Users size={18} color={Colors.primary.text} />}
            onPress={() => setSharing(!sharing)}
          />
        </Section>

        <Section title="General">
          <Row label="Siri Shortcuts" icon={<Mic size={18} color={Colors.primary.text} />} onPress={() => router.push('/siri')} />
          <Row label="Units" right="ml, kg" icon={<Ruler size={18} color={Colors.primary.text} />} onPress={() => router.push('/units')} />
          <Row label="Week Start" right="Sunday" icon={<Calendar size={18} color={Colors.primary.text} />} onPress={() => router.push('/week-start')}/>
          <Row label="Day Reset Time" right="12:00 AM 🔒" icon={<AlarmClock size={18} color={Colors.primary.text} />} />
          <Row 
            label="Sounds" 
            switchValue={sounds}
            icon={<Volume2 size={18} color={Colors.primary.text} />}
            onPress={async () => {
              const newSoundState = !sounds;
              setSounds(newSoundState);
              
              // 控制音樂
              if (newSoundState) {
                await backgroundMusicService.play();
              } else {
                await backgroundMusicService.pause();
              }
              
              // 儲存設定
              await backgroundMusicService.toggleMute();
            }}
          />
          <Row label="Apple Health Sync" right="On" icon={<Heart size={18} color={Colors.primary.text} />} onPress={() => router.push('/apple-health')}/>
          <Row label="iCloud Sync" right="On" icon={<Cloud size={18} color={Colors.primary.text} />} onPress={() => router.push('/icloud')} />
          <Row 
            label="Fitbit" 
            switchValue={fitbit}
            icon={<Activity size={18} color={Colors.primary.text} />}
            onPress={() => setFitbit(!fitbit)}
          />
          <Row label="Advanced" icon={<Wrench size={18} color={Colors.primary.text} />} onPress={() => router.push('/advanced')} />
        </Section>

        <Section title="Poop Education">
          <Row
            label="Guide to Healthy Poop"
            icon={<Lightbulb size={18} color={Colors.primary.text} />}
            onPress={() => router.push('/guide-to-healthy-poop')}
          />
          <Row
            label="What Your Poop Says About You"
            icon={<Droplet size={18} color={Colors.primary.text} />}
            onPress={() => router.push('/poop-analysis-tips')}
          />
        </Section>

        <Section title="Support">
          <Row label="Contact Support" icon={<Mail size={18} color={Colors.primary.text} />} onPress={() => router.push('/contact-support')} />
          <Row label="Customer Dashboard" icon={<Users size={18} color={Colors.primary.text} />} onPress={() => router.push('/customer-dashboard')} />
          <Row label="Send Debug Report" icon={<FileText size={18} color={Colors.primary.text} />} onPress={() => router.push('/debug-report')} />
          <Row label="Rate Our App" icon={<Star size={18} color={Colors.primary.text} />} onPress={() => router.push('/rate')} />
          <Row label="Export" icon={<Upload size={18} color={Colors.primary.text} />} onPress={() => router.push('/export')} />
          <Row label="Share" icon={<Share2 size={18} color={Colors.primary.text} />} onPress={() => router.push('/share')} />
          <Row 
            label="Show Tips" 
            icon={<Lightbulb size={18} color={Colors.primary.text} />}
            switchValue={showTips}
            onPress={() => setShowTips(!showTips)}
          />
          <Row label="Premium Features" icon={<BadgeCheck size={18} color={Colors.primary.text} />} onPress={() => router.push('/premium')} />
          <Row label="About Us" icon={<Store size={18} color={Colors.primary.text} />} onPress={() => router.push('/about-us')} />
        </Section>

        <View style={styles.logoutContainer}>
          <Button title="Log Out" onPress={handleLogout} variant="outline" style={styles.logoutButton} textStyle={styles.logoutButtonText} />
        </View>

        <Text style={styles.versionText}>PooPalooza v1.0.0</Text>
      </ScrollView>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBox}>{children}</View>
    </View>
  );
}

function Row({
  label,
  right,
  icon,
  switchValue,
  onPress,
}: {
  label: string;
  right?: string | React.ReactNode;
  icon?: React.ReactNode;
  switchValue?: boolean;
  onPress?: () => void;
}) {
  const showChevron = !!onPress && switchValue === undefined;

  return (
    <View style={styles.rowWrapper}>
      {switchValue !== undefined ? (
        // Switch 版本
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
            <Text style={styles.rowLabel}>{label}</Text>
          </View>
          <Switch 
            value={switchValue}
            onValueChange={() => {
              if (onPress) onPress();
            }}
          />
        </View>
      ) : (
        // 按鈕版本
        <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.row}>
          <View style={styles.rowLeft}>
            {icon && <View style={{ marginRight: 10 }}>{icon}</View>}
            <Text style={styles.rowLabel}>{label}</Text>
          </View>
          <View style={styles.rowRightContent}>
            {typeof right === 'string' ? <Text style={styles.rowRight}>{right}</Text> : right}
            {showChevron && (
              <ChevronRight
                size={18}
                color={Colors.primary.lightText}
                style={{ marginLeft: 8 }}
              />
            )}
          </View>
        </TouchableOpacity>
      )}
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
  rowRightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontSize: 16, color: Colors.primary.text },
  rowRight: { fontSize: 16, color: Colors.primary.lightText },
  logoutContainer: { marginVertical: 24 },
  logoutButton: { borderColor: Colors.primary.error },
  logoutButtonText: { color: Colors.primary.error },
  versionText: { textAlign: 'center', fontSize: 14, color: Colors.primary.lightText },
});