// app/(tabs)/calendar.tsx - 改為成就徽章頁面
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ScrollView } from 'react-native';
import Colors from '@/constants/colors';
import { usePoopStore } from '@/store/poopStore';

interface Calendar {
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

export default function CalendarScreen() {
  const { entries } = usePoopStore();
  const [selectedTab, setSelectedTab] = useState<'achievements' | 'challenges'>('achievements');

  // 計算成就進度
  const calculateAchievements = (): Achievement[] => {
    const totalEntries = entries.length;
    const today = new Date();
    const thisWeek = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      return entryDate >= weekAgo;
    }).length;

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
        title: 'Healthy Week',
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
        id: '4',
        title: 'Consistency King',
        description: 'Maintain regular bathroom habits',
        icon: '👑',
        isUnlocked: totalEntries >= 20,
        progress: Math.min(totalEntries, 20),
        maxProgress: 20,
        category: 'health',
        color: '#9C27B0'
      },
      {
        id: '5',
        title: 'Health Guardian',
        description: 'Track for 30 days',
        icon: '🛡️',
        isUnlocked: false,
        progress: Math.min(totalEntries, 30),
        maxProgress: 30,
        category: 'special',
        color: '#607D8B'
      },
      {
        id: '6',
        title: 'Bathroom Master',
        description: 'Complete 50 entries',
        icon: '🎯',
        isUnlocked: false,
        progress: Math.min(totalEntries, 50),
        maxProgress: 50,
        category: 'milestone',
        color: '#795548'
      }
    ];
  };

  const achievements = calculateAchievements();
  const unlockedCount = achievements.filter(a => a.isUnlocked).length;

  const challenges = [
    {
      id: '1',
      title: '7-Day Hydration Challenge',
      description: 'Drink 8 glasses of water daily for a week',
      icon: '💧',
      color: '#2196F3',
      difficulty: 'Easy'
    },
    {
      id: '2',
      title: 'Fiber Focus Week',
      description: 'Include fiber-rich foods in every meal',
      icon: '🥬',
      color: '#4CAF50',
      difficulty: 'Medium'
    },
    {
      id: '3',
      title: 'Mindful Bathroom Breaks',
      description: 'Practice relaxation during bathroom visits',
      icon: '🧘',
      color: '#9C27B0',
      difficulty: 'Easy'
    }
  ];

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

  const renderChallenge = ({ item }: { item: any }) => (
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
        
        <TouchableOpacity style={[styles.startButton, { backgroundColor: item.color }]}>
          <Text style={styles.startButtonText}>Start Challenge</Text>
        </TouchableOpacity>
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

            {/* Challenges List */}
            <View style={styles.section}>
              <FlatList
                data={challenges}
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
});