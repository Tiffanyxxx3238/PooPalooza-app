import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { usePoopStore } from '@/store/poopStore';
import Colors from '@/constants/colors';
import { poopTypes, poopVolumes, poopFeelings, poopColors } from '@/constants/poopTypes';
import { getWeekRange, getMonthRange } from '@/utils/dateUtils';

export default function StatsScreen() {
  const { entries } = usePoopStore();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week');
  const [filteredEntries, setFilteredEntries] = useState(entries);
  
  useEffect(() => {
    filterEntriesByTimeRange(timeRange);
  }, [timeRange, entries]);
  
  const filterEntriesByTimeRange = (range: 'week' | 'month' | 'all') => {
    const now = new Date();
    
    if (range === 'week') {
      const { startDate, endDate } = getWeekRange(now);
      setFilteredEntries(entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      }));
    } else if (range === 'month') {
      const { startDate, endDate } = getMonthRange(now);
      setFilteredEntries(entries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      }));
    } else {
      setFilteredEntries(entries);
    }
  };
  
  // Calculate statistics
  const calculateTypeStats = () => {
    const typeCounts = poopTypes.map(type => ({
      id: type.id,
      name: type.name,
      count: filteredEntries.filter(entry => entry.type === type.id).length,
      color: type.color,
    }));
    
    return typeCounts.sort((a, b) => b.count - a.count);
  };
  
  const calculateVolumeStats = () => {
    const volumeCounts = poopVolumes.map(volume => ({
      id: volume.id,
      name: volume.name,
      count: filteredEntries.filter(entry => entry.volume === volume.id).length,
    }));
    
    return volumeCounts.sort((a, b) => b.count - a.count);
  };
  
  const calculateFeelingStats = () => {
    const feelingCounts = poopFeelings.map(feeling => ({
      id: feeling.id,
      name: feeling.name,
      icon: feeling.icon,
      count: filteredEntries.filter(entry => entry.feeling === feeling.id).length,
    }));
    
    return feelingCounts.sort((a, b) => b.count - a.count);
  };
  
  const calculateColorStats = () => {
    const colorCounts = poopColors.map(color => ({
      id: color.id,
      name: color.name,
      color: color.color,
      count: filteredEntries.filter(entry => entry.color === color.id).length,
    }));
    
    return colorCounts.sort((a, b) => b.count - a.count);
  };
  
  const calculateAverageDuration = () => {
    if (filteredEntries.length === 0) return 0;
    
    const totalDuration = filteredEntries.reduce((sum, entry) => sum + entry.duration, 0);
    return Math.round(totalDuration / filteredEntries.length);
  };
  
  const calculateFrequency = () => {
    if (filteredEntries.length <= 1) return 'N/A';
    
    const sortedEntries = [...filteredEntries].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const intervals = [];
    for (let i = 1; i < sortedEntries.length; i++) {
      const prevDate = new Date(sortedEntries[i-1].date);
      const currDate = new Date(sortedEntries[i].date);
      
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
      const diffHours = diffTime / (1000 * 60 * 60);
      
      intervals.push(diffHours);
    }
    
    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    
    if (avgInterval < 24) {
      return `${Math.round(avgInterval)} hours`;
    } else {
      return `${Math.round(avgInterval / 24)} days`;
    }
  };
  
  const typeStats = calculateTypeStats();
  const volumeStats = calculateVolumeStats();
  const feelingStats = calculateFeelingStats();
  const colorStats = calculateColorStats();
  const avgDuration = calculateAverageDuration();
  const frequency = calculateFrequency();
  
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };
  
  const getMaxCount = (stats: any[]) => {
    return Math.max(...stats.map(item => item.count), 1);
  };
  
  const typeMaxCount = getMaxCount(typeStats);
  const volumeMaxCount = getMaxCount(volumeStats);
  const feelingMaxCount = getMaxCount(feelingStats);
  const colorMaxCount = getMaxCount(colorStats);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Poop Statistics</Text>
      
      <View style={styles.timeRangeSelector}>
        <Text
          style={[
            styles.timeRangeOption,
            timeRange === 'week' && styles.selectedTimeRange,
          ]}
          onPress={() => setTimeRange('week')}
        >
          This Week
        </Text>
        <Text
          style={[
            styles.timeRangeOption,
            timeRange === 'month' && styles.selectedTimeRange,
          ]}
          onPress={() => setTimeRange('month')}
        >
          This Month
        </Text>
        <Text
          style={[
            styles.timeRangeOption,
            timeRange === 'all' && styles.selectedTimeRange,
          ]}
          onPress={() => setTimeRange('all')}
        >
          All Time
        </Text>
      </View>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{filteredEntries.length}</Text>
          <Text style={styles.summaryLabel}>Total Poops</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{formatDuration(avgDuration)}</Text>
          <Text style={styles.summaryLabel}>Avg Duration</Text>
        </View>
        
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{frequency}</Text>
          <Text style={styles.summaryLabel}>Frequency</Text>
        </View>
      </View>
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Poop Types</Text>
        {typeStats.map(type => (
          <View key={type.id} style={styles.chartItem}>
            <View style={styles.chartLabelContainer}>
              <View style={[styles.colorIndicator, { backgroundColor: type.color }]} />
              <Text style={styles.chartLabel}>{type.name}</Text>
            </View>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    width: `${(type.count / typeMaxCount) * 100}%`,
                    backgroundColor: type.color,
                  }
                ]} 
              />
              <Text style={styles.barValue}>{type.count}</Text>
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Poop Volume</Text>
        {volumeStats.map(volume => (
          <View key={volume.id} style={styles.chartItem}>
            <Text style={styles.chartLabel}>{volume.name}</Text>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    width: `${(volume.count / volumeMaxCount) * 100}%`,
                    backgroundColor: Colors.primary.accent,
                  }
                ]} 
              />
              <Text style={styles.barValue}>{volume.count}</Text>
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Poop Feeling</Text>
        {feelingStats.map(feeling => (
          <View key={feeling.id} style={styles.chartItem}>
            <View style={styles.chartLabelContainer}>
              <Text style={styles.feelingIcon}>{feeling.icon}</Text>
              <Text style={styles.chartLabel}>{feeling.name}</Text>
            </View>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    width: `${(feeling.count / feelingMaxCount) * 100}%`,
                    backgroundColor: Colors.primary.accent,
                  }
                ]} 
              />
              <Text style={styles.barValue}>{feeling.count}</Text>
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Poop Color</Text>
        {colorStats.map(color => (
          <View key={color.id} style={styles.chartItem}>
            <View style={styles.chartLabelContainer}>
              <View style={[styles.colorIndicator, { backgroundColor: color.color }]} />
              <Text style={styles.chartLabel}>{color.name}</Text>
            </View>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.bar, 
                  { 
                    width: `${(color.count / colorMaxCount) * 100}%`,
                    backgroundColor: color.color,
                  }
                ]} 
              />
              <Text style={styles.barValue}>{color.count}</Text>
            </View>
          </View>
        ))}
      </View>
      
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Health Insights</Text>
        <Text style={styles.insightsText}>
          {filteredEntries.length === 0 ? (
            "Start tracking your poops to get personalized health insights!"
          ) : (
            `Based on your ${timeRange} data, your most common poop type is ${typeStats[0]?.name || 'N/A'}. 
            Your average bathroom visit takes ${formatDuration(avgDuration)}.
            
            ${typeStats[0]?.id <= 2 ? "Your stools tend to be on the harder side. Try increasing your fiber and water intake." : ""}
            ${typeStats[0]?.id >= 6 ? "Your stools tend to be on the looser side. Consider reducing caffeine and spicy foods." : ""}
            ${typeStats[0]?.id >= 3 && typeStats[0]?.id <= 5 ? "Your stools are generally healthy! Keep up the good habits." : ""}
            
            ${avgDuration > 300 ? "You're spending quite a long time in the bathroom. This could increase your risk of hemorrhoids." : ""}
            
            Remember to stay hydrated and maintain a balanced diet rich in fiber for optimal digestive health.`
          )}
        </Text>
      </View>
    </ScrollView>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginTop: Platform.OS === 'ios' ? 0 : 16,
    marginBottom: 16,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.card,
    borderRadius: 20,
    marginBottom: 16,
    padding: 4,
  },
  timeRangeOption: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 8,
    borderRadius: 16,
    fontSize: 14,
    color: Colors.primary.lightText,
  },
  selectedTimeRange: {
    backgroundColor: Colors.primary.accent,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.accent,
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.primary.lightText,
  },
  chartContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  chartItem: {
    marginBottom: 12,
  },
  chartLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  chartLabel: {
    fontSize: 14,
    color: Colors.primary.text,
  },
  feelingIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
  },
  bar: {
    height: 16,
    borderRadius: 8,
  },
  barValue: {
    marginLeft: 8,
    fontSize: 14,
    color: Colors.primary.lightText,
  },
  insightsContainer: {
    backgroundColor: Colors.primary.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  insightsText: {
    fontSize: 14,
    color: Colors.primary.text,
    lineHeight: 20,
  },
});