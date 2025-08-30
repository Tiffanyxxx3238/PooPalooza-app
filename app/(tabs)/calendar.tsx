// app/(tabs)/calendar.tsx - 成就徽章頁面
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView, Alert } from 'react-native';
import Colors from '@/constants/colors';
import { usePoopStore } from '@/store/poopStore';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progress?: number;
  maxProgress?: number;
  category: 'daily' | 'streak' | 'health' | 'milestone' | 'special';
  color: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  progress: number;
  maxProgress: number;
}

export default function CalendarScreen() {
  const { entries } = usePoopStore();
  const [selectedTab, setSelectedTab] = useState<'achievements' | 'challenges'>('achievements');
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);

  // 初始化挑戰
  useEffect(() => {
    const initialChallenges: Challenge[] = [
      {
        id: '1',
        title: '7-Day Hydration Challenge',
        description: 'Drink 8 glasses of water daily for a week',
        icon: '💧',
        color: '#2196F3',
        difficulty: 'Easy',
        isActive: false,
        progress: 0,
        maxProgress: 7
      },
      {
        id: '2',
        title: 'Fiber Focus Week',
        description: 'Include fiber-rich foods in every meal',
        icon: '🥬',
        color: '#4CAF50',
        difficulty: 'Medium',
        isActive: false,
        progress: 0,
        maxProgress: 7
      },
      {
        id: '3',
        title: 'Mindful Bathroom Breaks',
        description: 'Practice relaxation during bathroom visits',
        icon: '🧘',
        color: '#9C27B0',
        difficulty: 'Easy',
        isActive: false,
        progress: 0,
        maxProgress: 5
      }
    ];
    setActiveChallenges(initialChallenges);
  }, []);

  // 計算成就進度
  const calculateAchievements = (): Achievement[] => {
    const totalEntries = entries.length;
    const today = new Date();
    const thisWeek = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return entryDate >= weekAgo;
    }).length;

    // 計算連續天數
    const calculateStreak = (): number => {
      if (entries.length === 0) return 0;
      
      const sortedEntries = entries
        .map(entry => new Date(entry.date).toDateString())
        .filter((date, index, array) => array.indexOf(date) === index) // 去重複
        .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

      let streak = 1;
      const today = new Date().toDateString();
      
      if (sortedEntries[0] !== today && 
          sortedEntries[0] !== new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString()) {
        return 0; // 如果最新記錄不是今天或昨天，連續天數為0
      }

      for (let i = 1; i < sortedEntries.length; i++) {
        const currentDate = new Date(sortedEntries[i]);
        const previousDate = new Date(sortedEntries[i - 1]);
        const diffInDays = (previousDate.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000);
        
        if (diffInDays === 1) {
          streak++;
        } else {
          break;
        }
      }
      return streak;
    };

    const currentStreak = calculateStreak();

    return [
      {
        id: '1',
        title: 'First Drop',
        description: 'Record your first poop entry',
        icon: '💩',
        isUnlocked: totalEntries >= 1,
        category: 'milestone',
        color: '#4CAF50'
      },
      {
        id: '2',
        title: 'Week Warrior',
        description: 'Track your bathroom visits for 7 days',
        icon: '📅',
        isUnlocked: thisWeek >= 7,
        progress: Math.min(thisWeek, 7),
        maxProgress: 7,
        category: 'streak',
        color: '#2196F3'
      },
      {
        id: '3',
        title: 'Consistency Champion',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        isUnlocked: currentStreak >= 3,
        progress: Math.min(currentStreak, 3),
        maxProgress: 3,
        category: 'streak',
        color: '#FF5722'
      },
      {
        id: '4',
        title: 'Poop Tracker Pro',
        description: 'Record 10 entries in total',
        icon: '🏆',
        isUnlocked: totalEntries >= 10,
        progress: Math.min(totalEntries, 10),
        maxProgress: 10,
        category: 'milestone',
        color: '#FF9800'
      },
      {
        id: '5',
        title: 'Consistency King',
        description: 'Maintain regular bathroom habits (20 entries)',
        icon: '👑',
        isUnlocked: totalEntries >= 20,
        progress: Math.min(totalEntries, 20),
        maxProgress: 20,
        category: 'health',
        color: '#9C27B0'
      },
      {
        id: '6',
        title: 'Health Guardian',
        description: 'Track for 30 entries',
        icon: '🛡️',
        isUnlocked: totalEntries >= 30,
        progress: Math.min(totalEntries, 30),
        maxProgress: 30,
        category: 'special',
        color: '#607D8B'
      },
      {
        id: '7',
        title: 'Bathroom Master',
        description: 'Complete 50 entries',
        icon: '🎯',
        isUnlocked: totalEntries >= 50,
        progress: Math.min(totalEntries, 50),
        maxProgress: 50,
        category: 'milestone',
        color: '#795548'
      },
      {
        id: '8',
        title: 'Week Streak Master',
        description: 'Maintain a 7-day streak',
        icon: '⚡',
        isUnlocked: currentStreak >= 7,
        progress: Math.min(currentStreak, 7),
        maxProgress: 7,
        category: 'streak',
        color: '#FFC107'
      }
    ];
  };

  const achievements = calculateAchievements();
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  // 開始挑戰
  const startChallenge = (challengeId: string) => {
    Alert.alert(
      'Start Challenge',
      'Are you ready to begin this challenge?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Start',
          onPress: () => {
            setActiveChallenges(prev => 
              prev.map(challenge => 
                challenge.id === challengeId 
                  ? { 
                      ...challenge, 
                      isActive: true, 
                      startDate: new Date().toISOString(),
                      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7天後
                    }
                  : challenge
              )
            );
            Alert.alert('Challenge Started!', 'Good luck with your challenge!');
          },
        },
      ]
    );
  };

  // 更新挑戰進度
  const updateChallengeProgress = (challengeId: string) => {
    setActiveChallenges(prev => 
      prev.map(challenge => 
        challenge.id === challengeId && challenge.isActive
          ? { 
              ...challenge, 
              progress: Math.min(challenge.progress + 1, challenge.maxProgress)
            }
          : challenge
      )
    );
    Alert.alert('Progress Updated!', 'Keep going! 💪');
  };

  // 重置挑戰
  const resetChallenge = (challengeId: string) => {
    Alert.alert(
      'Reset Challenge',
      'Are you sure you want to reset this challenge?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            setActiveChallenges(prev => 
              prev.map(challenge => 
                challenge.id === challengeId 
                  ? { 
                      ...challenge, 
                      isActive: false, 
                      progress: 0,
                      startDate: undefined,
                      endDate: undefined
                    }
                  : challenge
              )
            );
          },
        },
      ]
    );
  };

  const renderAchievement = ({ item }: { item: Achievement }) => (
    <View style={[
      styles.achievementCard,
      { backgroundColor: item.isUnlocked ? item.color + '20' : Colors.primary.lightBackground }
    ]}>
      <View style={[
        styles.achievementIcon,
        { backgroundColor: item.isUnlocked ? item.color : '#E0E0E0' }
      ]}>
        <Text style={styles.achievementEmoji}>{item.icon}</Text>
        {item.isUnlocked && (
          <View style={styles.unlockedBadge}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </View>
      
      <View style={styles.achievementContent}>
        <Text style={[
          styles.achievementTitle,
          { color: item.isUnlocked ? Colors.primary.text : Colors.primary.lightText }
        ]}>
          {item.title}
        </Text>
        <Text style={styles.achievementDescription}>
          {item.description}
        </Text>
        
        {item.maxProgress && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${((item.progress || 0) / item.maxProgress) * 100}%`,
                    backgroundColor: item.isUnlocked ? item.color : '#BDBDBD'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {item.progress || 0}/{item.maxProgress}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderChallenge = ({ item }: { item: Challenge }) => (
    <View style={[styles.challengeCard, { backgroundColor: item.color + '20' }]}>
      <View style={[styles.challengeIcon, { backgroundColor: item.color }]}>
        <Text style={styles.challengeEmoji}>{item.icon}</Text>
      </View>
      
      <View style={styles.challengeContent}>
        <View style={styles.challengeHeader}>
          <Text style={styles.challengeTitle}>{item.title}</Text>
          <View style={[styles.difficultyBadge, { backgroundColor: item.color }]}>
            <Text style={styles.difficultyText}>{item.difficulty}</Text>
          </View>
        </View>
        <Text style={styles.challengeDescription}>{item.description}</Text>
        
        {item.isActive && (
          <View style={styles.challengeProgressContainer}>
            <View style={styles.challengeProgressBar}>
              <View 
                style={[
                  styles.challengeProgressFill,
                  { 
                    width: `${(item.progress / item.maxProgress) * 100}%`,
                    backgroundColor: item.color
                  }
                ]} 
              />
            </View>
            <Text style={styles.challengeProgressText}>
              {item.progress}/{item.maxProgress} days
            </Text>
          </View>
        )}
        
        <View style={styles.challengeButtons}>
          {!item.isActive ? (
            <TouchableOpacity 
              style={[styles.startButton, { backgroundColor: item.color }]}
              onPress={() => startChallenge(item.id)}
            >
              <Text style={styles.startButtonText}>Start Challenge</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.activeButtons}>
              <TouchableOpacity 
                style={[styles.updateButton, { backgroundColor: item.color }]}
                onPress={() => updateChallengeProgress(item.id)}
                disabled={item.progress >= item.maxProgress}
              >
                <Text style={styles.updateButtonText}>
                  {item.progress >= item.maxProgress ? 'Complete!' : '+1 Day'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.resetButton}
                onPress={() => resetChallenge(item.id)}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'achievements' && styles.activeTab
            ]}
            onPress={() => setSelectedTab('achievements')}
          >
            <Text style={[
              styles.tabText,
              selectedTab === 'achievements' && styles.activeTabText
            ]}>
              Achievements
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tab,
              selectedTab === 'challenges' && styles.activeTab
            ]}
            onPress={() => setSelectedTab('challenges')}
          >
            <Text style={[
              styles.tabText,
              selectedTab === 'challenges' && styles.activeTabText
            ]}>
              Challenges
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {selectedTab === 'achievements' ? (
          <>
            {/* Achievement Summary */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryIcon}>
                <Text style={styles.summaryEmoji}>🏆</Text>
              </View>
              <Text style={styles.summaryTitle}>Progress Overview</Text>
              <Text style={styles.summaryText}>
                {unlockedCount} of {achievements.length} achievements unlocked
              </Text>
              <View style={styles.overallProgress}>
                <View style={styles.overallProgressBar}>
                  <View 
                    style={[
                      styles.overallProgressFill,
                      { width: `${(unlockedCount / achievements.length) * 100}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.overallProgressText}>
                  {Math.round((unlockedCount / achievements.length) * 100)}%
                </Text>
              </View>
            </View>

            {/* Achievements List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Achievements</Text>
              <FlatList
                data={achievements}
                keyExtractor={(item) => item.id}
                renderItem={renderAchievement}
                scrollEnabled={false}
                contentContainerStyle={styles.achievementsList}
              />
            </View>
          </>
        ) : (
          <>
            {/* Challenges Header */}
            <View style={styles.challengesHeader}>
              <Text style={styles.challengesTitle}>🎯 Daily Challenges</Text>
              <Text style={styles.challengesSubtitle}>
                Test yourself by completing these challenges
              </Text>
            </View>

            {/* Active Challenges Count */}
            {activeChallenges.filter(c => c.isActive).length > 0 && (
              <View style={styles.activeChallengesInfo}>
                <Text style={styles.activeChallengesText}>
                  🔥 {activeChallenges.filter(c => c.isActive).length} active challenge(s)
                </Text>
              </View>
            )}

            {/* Challenges List */}
            <View style={styles.section}>
              <FlatList
                data={activeChallenges}
                keyExtractor={(item) => item.id}
                renderItem={renderChallenge}
                scrollEnabled={false}
                contentContainerStyle={styles.challengesList}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
  },
  header: {
    backgroundColor: Colors.primary.card,
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.lightBackground,
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: Colors.primary.accent,
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.lightText,
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: Colors.primary.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryEmoji: {
    fontSize: 30,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: Colors.primary.lightText,
    marginBottom: 16,
  },
  overallProgress: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  overallProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.primary.lightBackground,
    borderRadius: 4,
  },
  overallProgressFill: {
    height: '100%',
    backgroundColor: Colors.primary.accent,
    borderRadius: 4,
  },
  overallProgressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary.accent,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  achievementsList: {
    gap: 12,
  },
  achievementCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  achievementIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  achievementEmoji: {
    fontSize: 24,
  },
  unlockedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: Colors.primary.lightText,
    marginBottom: 12,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.primary.lightBackground,
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary.lightText,
  },
  challengesHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  challengesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
  },
  challengesSubtitle: {
    fontSize: 16,
    color: Colors.primary.lightText,
    textAlign: 'center',
  },
  activeChallengesInfo: {
    backgroundColor: Colors.primary.accent + '20',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  activeChallengesText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary.accent,
  },
  challengesList: {
    gap: 16,
  },
  challengeCard: {
    padding: 20,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  challengeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  challengeEmoji: {
    fontSize: 24,
  },
  challengeContent: {
    alignItems: 'center',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    flex: 1,
    textAlign: 'center',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  challengeDescription: {
    fontSize: 14,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 16,
  },
  challengeProgressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  challengeProgressBar: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.primary.lightBackground,
    borderRadius: 4,
    marginBottom: 8,
  },
  challengeProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  challengeProgressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary.text,
    textAlign: 'center',
  },
  challengeButtons: {
    width: '100%',
    alignItems: 'center',
  },
  startButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  activeButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  updateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 1,
    maxWidth: 120,
  },
  updateButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  resetButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#FF5722',
    flex: 1,
    maxWidth: 80,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});