import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { usePoopStore } from '@/store/poopStore';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { User, LogOut, Settings, HelpCircle, Bell, Shield, Info } from 'lucide-react-native';

export default function ProfileScreen() {
  const router = useRouter();
  const { username, email, logout } = useUserStore();
  const { entries, longestStreak } = usePoopStore();
  
  const handleLogout = () => {
    logout();
    router.replace('/');
  };
  
  const handleBack = () => {
    router.back();
  };

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Profile',
        }}
      />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <User size={40} color={Colors.primary.accent} />
          </View>
          <Text style={styles.username}>{username || 'Guest User'}</Text>
          <Text style={styles.email}>{email || 'guest@example.com'}</Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{entries.length}</Text>
            <Text style={styles.statLabel}>Total Poops</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{longestStreak}</Text>
            <Text style={styles.statLabel}>Longest Streak</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {entries.length > 0 ? Math.round(entries.reduce((sum, entry) => sum + entry.duration, 0) / entries.length / 60) : 0}
            </Text>
            <Text style={styles.statLabel}>Avg Minutes</Text>
          </View>
        </View>
        
        <View style={styles.menuContainer}>
          <TouchableOpacity style={styles.menuItem}>
            <Settings size={24} color={Colors.primary.text} />
            <Text style={styles.menuText}>Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Bell size={24} color={Colors.primary.text} />
            <Text style={styles.menuText}>Notifications</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Shield size={24} color={Colors.primary.text} />
            <Text style={styles.menuText}>Privacy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <HelpCircle size={24} color={Colors.primary.text} />
            <Text style={styles.menuText}>Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.menuItem}>
            <Info size={24} color={Colors.primary.text} />
            <Text style={styles.menuText}>About</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.buttonContainer}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: Colors.primary.lightText,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.accent,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.primary.lightText,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.primary.border,
  },
  menuContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    marginBottom: 24,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  menuText: {
    fontSize: 16,
    color: Colors.primary.text,
    marginLeft: 16,
  },
  buttonContainer: {
    marginBottom: 24,
  },
  logoutButton: {
    borderColor: Colors.primary.error,
  },
  logoutButtonText: {
    color: Colors.primary.error,
  },
  versionText: {
    textAlign: 'center',
    fontSize: 14,
    color: Colors.primary.lightText,
  },
});