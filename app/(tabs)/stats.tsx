import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { usePoopStore } from '@/store/poopStore';
import Colors from '@/constants/colors';
import { poopTypes, poopVolumes, poopFeelings, poopColors } from '@/constants/poopTypes';
import { getWeekRange, getMonthRange } from '@/utils/dateUtils';
import { TrendingUp } from 'lucide-react-native'; // Add this import

// New component for Line Chart
const LineChart = ({ data, title }: { data: any[], title: string }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <View style={styles.chartWrapper}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.lineChartContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.lineChartItem}>
            <View style={styles.barContainer}>
              <View 
                style={[
                  styles.lineBar, 
                  { 
                    height: `${(item.value / maxValue) * 100}%`,
                    backgroundColor: item.value >= 7 ? '#4caf50' : item.value >= 4 ? '#ff9800' : '#f44336',
                  }
                ]} 
              />
            </View>
            <Text style={styles.lineChartLabel}>{item.day}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// New component for Analysis Card
const AnalysisCard = ({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) => {
  return (
    <View style={styles.analysisCard}>
      <View style={styles.analysisHeader}>
        {icon}
        <Text style={styles.analysisTitle}>{title}</Text>
      </View>
      <Text style={styles.analysisDescription}>{description}</Text>
    </View>
  );
};

// New component for Recommendation Card
const RecommendationCard = ({ title, recommendations }: { title: string, recommendations: string[] }) => {
  return (
    <View style={styles.recommendationCard}>
      <Text style={styles.recommendationTitle}>{title}</Text>
      {recommendations.map((rec, index) => (
        <Text key={index} style={styles.recommendationItem}>• {rec}</Text>
      ))}
    </View>
  );
};

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
  
  // Generate weekly bowel health data
  const generateWeeklyBowelData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const now = new Date();
    const { startDate } = getWeekRange(now);
    
    return days.map((day, index) => {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + index);
      
      const dayEntries = filteredEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.toDateString() === dayDate.toDateString();
      });
      
      // Calculate health score based on Bristol Stool Scale and other factors
      let healthScore = 5; // Default neutral score
      
      if (dayEntries.length > 0) {
        const avgType = dayEntries.reduce((sum, entry) => sum + entry.type, 0) / dayEntries.length;
        const avgFeeling = dayEntries.reduce((sum, entry) => sum + entry.feeling, 0) / dayEntries.length;
        
        // Bristol Stool Scale scoring (types 3-4 are ideal)
        if (avgType >= 3 && avgType <= 4) {
          healthScore = 8;
        } else if (avgType >= 2 && avgType <= 5) {
          healthScore = 6;
        } else {
          healthScore = 3;
        }
        
        // Adjust based on feeling
        if (avgFeeling >= 4) {
          healthScore = Math.min(10, healthScore + 1);
        } else if (avgFeeling <= 2) {
          healthScore = Math.max(1, healthScore - 2);
        }
        
        // Frequency adjustment
        if (dayEntries.length >= 1 && dayEntries.length <= 3) {
          healthScore = Math.min(10, healthScore + 1);
        } else if (dayEntries.length > 3) {
          healthScore = Math.max(1, healthScore - 1);
        }
      }
      
      return {
        day,
        value: Math.round(healthScore),
        date: dayDate.toISOString(),
      };
    });
  };
  
  // Generate health analysis
  const generateHealthAnalysis = () => {
    if (filteredEntries.length === 0) {
      return {
        title: "Start Your Health Journey",
        description: "Begin tracking your bowel movements to receive personalized health insights and recommendations."
      };
    }
    
    const avgType = filteredEntries.reduce((sum, entry) => sum + entry.type, 0) / filteredEntries.length;
    const weeklyData = generateWeeklyBowelData();
    const avgHealthScore = weeklyData.reduce((sum, day) => sum + day.value, 0) / weeklyData.length;
    
    let title = "Good Health Trend";
    let description = "Your bowel health is looking good this week.";
    
    if (avgHealthScore >= 7) {
      title = "Excellent Health Trend";
      description = "Your bowel health is excellent this week! Your digestive system appears to be functioning optimally with regular, well-formed stools.";
    } else if (avgHealthScore >= 5) {
      title = "Good Health Trend";
      description = "Your bowel health is generally good this week. There may be some minor variations, but overall your digestive health is on track.";
    } else {
      title = "Needs Attention";
      description = "Your bowel health could use some attention this week. Consider reviewing your diet, hydration, and stress levels.";
    }
    
    return { title, description };
  };
  
  // Generate diet recommendations
  const generateDietRecommendations = () => {
    if (filteredEntries.length === 0) {
      return {
        title: "General Digestive Health Tips",
        recommendations: [
          "Drink plenty of water throughout the day",
          "Include fiber-rich foods like fruits and vegetables",
          "Maintain regular meal times",
          "Consider probiotic foods like yogurt"
        ]
      };
    }
    
    const avgType = filteredEntries.reduce((sum, entry) => sum + entry.type, 0) / filteredEntries.length;
    const hardStools = filteredEntries.filter(entry => entry.type <= 2).length;
    const looseStools = filteredEntries.filter(entry => entry.type >= 6).length;
    
    let recommendations = [];
    
    if (hardStools > looseStools) {
      recommendations = [
        "Increase fiber intake with whole grains and vegetables",
        "Drink more water throughout the day",
        "Add healthy fats like avocados and nuts",
        "Consider prunes or other natural laxatives"
      ];
    } else if (looseStools > hardStools) {
      recommendations = [
        "Reduce caffeine and spicy foods",
        "Include binding foods like bananas and rice",
        "Stay hydrated but avoid excessive fluids with meals",
        "Consider probiotics to support gut health"
      ];
    } else {
      recommendations = [
        "Maintain your current balanced diet",
        "Continue regular hydration habits",
        "Include diverse fiber sources",
        "Keep up with regular meal timing"
      ];
    }
    
    return {
      title: "Personalized Dietary Recommendations",
      recommendations
    };
  };
  
  // Calculate statistics (existing functions)
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
  
  const weeklyBowelData = generateWeeklyBowelData();
  const healthAnalysis = generateHealthAnalysis();
  const dietRecommendations = generateDietRecommendations();
  
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
      
      {/* Weekly Health Report - Only show when "This Week" is selected */}
      {timeRange === 'week' && (
        <>
          <View style={styles.healthReportHeader}>
            <Text style={styles.healthReportTitle}>Weekly Health Report</Text>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Weekly Bowel Health</Text>
            <View style={styles.card}>
              <LineChart data={weeklyBowelData} title="Bowel Health Score (1-10)" />
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analysis</Text>
            <AnalysisCard
              title={healthAnalysis.title}
              description={healthAnalysis.description}
              icon={<TrendingUp size={20} color="#4caf50" />}
            />
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary Recommendations</Text>
            <RecommendationCard
              title={dietRecommendations.title}
              recommendations={dietRecommendations.recommendations}
            />
          </View>
        </>
      )}
      
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
      
      <View style={styles.bottomSpacer} />
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
  
  // New styles for Weekly Health Report
  healthReportHeader: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.card,
    alignItems: 'center',
    marginBottom: 16,
  },
  healthReportTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.primary.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: Colors.primary.card,
    borderRadius: 16,
    padding: 16,
  },
  
  // Line Chart Styles
  chartWrapper: {
    marginBottom: 16,
  },
  lineChartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    marginTop: 12,
  },
  lineChartItem: {
    flex: 1,
    alignItems: 'center',
  },
  lineBar: {
    width: 20,
    minHeight: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  lineChartLabel: {
    fontSize: 12,
    color: Colors.primary.lightText,
  },
  
  // Analysis Card Styles
  analysisCard: {
    backgroundColor: Colors.primary.card,
    borderRadius: 16,
    padding: 16,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
    marginLeft: 8,
  },
  analysisDescription: {
    fontSize: 14,
    color: Colors.primary.text,
    lineHeight: 20,
  },
  
  // Recommendation Card Styles
  recommendationCard: {
    backgroundColor: Colors.primary.card,
    borderRadius: 16,
    padding: 16,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary.text,
    marginBottom: 12,
  },
  recommendationItem: {
    fontSize: 14,
    color: Colors.primary.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  
  // Existing styles
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
  bottomSpacer: {
    height: 60,
  },
});