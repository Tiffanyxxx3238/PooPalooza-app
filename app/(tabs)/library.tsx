import React, { useState, useMemo, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Platform, 
  TextInput,
  ScrollView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePoopStore } from '@/store/poopStore';
import Colors from '@/constants/colors';
import PoopCard from '@/components/PoopCard';
import API_URL  from '@/config';
import { useUserStore } from '@/store/userStore';

// 簡化的圖標組件
const ChevronLeft = () => <Text style={{fontSize: 24, color: Colors.primary.text}}>‹</Text>;
const ChevronRight = () => <Text style={{fontSize: 24, color: Colors.primary.text}}>›</Text>;
const Calendar = () => <Text style={{fontSize: 18}}>📅</Text>;
const List = () => <Text style={{fontSize: 18}}>📋</Text>;
const Eye = () => <Text style={{fontSize: 20}}>👁️</Text>;
const EyeOff = () => <Text style={{fontSize: 20}}>🙈</Text>;
const FileDown = () => <Text style={{fontSize: 20}}>📤</Text>;
const Search = () => <Text style={{fontSize: 20, color: Colors.primary.lightText}}>🔍</Text>;

type ViewMode = 'calendar' | 'library';

export default function LibraryScreen() {
  const router = useRouter();
  const { entries: localEntries } = usePoopStore();

  // Get the logged-in user's ID from userStore
  const { user_id } = useUserStore();

  // Database state
  const [dbPoopRecords, setDbPoopRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 修改为字符串以匹配数据库中的实际数据
  const currentUserId = user_id;
  
  // Use database records if available, otherwise use local
  const entries = dbPoopRecords;
  
  // Calendar state
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [showImages, setShowImages] = useState(false);
  
  // Library state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<string>('all');
  
  // 從資料庫獲取記錄
  const fetchPoopRecords = async () => {
    try {
      const apiUrl = API_URL || 'https://poopalooza-backend-api-af34f62d7c87.herokuapp.com';
      console.log('API_URL from config:', API_URL);
      console.log('Using API URL:', apiUrl);
      console.log('Current user ID:', currentUserId);
      console.log('Fetching poop records from:', `${apiUrl}/poop-records`);
      setError(null);
      
      const response = await fetch(`${API_URL}/poop-records`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Raw data from API:', data);
      console.log('Data length:', data.length);
      

      const userRecords = data.filter((record: any) => {
        return record.user_id === currentUserId;
      });
      
      console.log('Filtered user records:', userRecords.length);
      
      const transformedRecords = userRecords.map((record: any) => {
        const transformed = {
          id: record.record_id ? record.record_id.toString() : Math.random().toString(),
          date: record.record_time || new Date().toISOString(),
          type: record.bristol_scale ? `Type ${record.bristol_scale}` : 'Type 4',
          difficulty: record.consistency || 'medium',
          notes: record.ai_diagnosis_summary || '',
          color: record.color || 'brown',
          hasBlood: record.has_blood || false,
          hasMucus: record.has_mucus || false,
          image: record.image_url || null,
          // 保留原始數據以供詳細頁面使用
          originalRecord: record
        };
        console.log('Transformed record:', transformed);
        return transformed;
      });
      
      console.log('Final transformed records:', transformedRecords.length);
      setDbPoopRecords(transformedRecords);
      
    } catch (error) {
      console.error('Error fetching poop records:', error);
      setError(error.message || 'Failed to fetch records');
      
      // 如果從數據庫獲取失敗，使用本地數據
      if (localEntries && localEntries.length > 0) {
        console.log('Falling back to local entries:', localEntries.length);
        setDbPoopRecords(localEntries);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data on mount
  useEffect(() => {
    fetchPoopRecords();
  }, []);
  
  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPoopRecords();
    setRefreshing(false);
  };
  
  // Calendar utilities
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };
  
  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };
  
  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, date: null });
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ day: i, date });
    }
    
    return days;
  };
  
  // Data processing
  const getEntriesForDate = (date: Date) => {
    if (!date) return [];
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  const filteredAndSearchedEntries = useMemo(() => {
    let result = [...entries];
    
    // Apply search filter
    if (searchQuery.trim()) {
      result = result.filter(entry => 
        entry.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        entry.difficulty?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply difficulty filter
    if (filterBy !== 'all') {
      result = result.filter(entry => entry.difficulty === filterBy);
    }
    
    // Sort by date (newest first)
    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, searchQuery, filterBy]);
  
  const hasEntries = (date: Date | null) => {
    if (!date) return false;
    return entries.some(entry => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getDate() === date.getDate() &&
        entryDate.getMonth() === date.getMonth() &&
        entryDate.getFullYear() === date.getFullYear()
      );
    });
  };
  
  // Monthly stats
  const getMonthlyStats = () => {
    const monthEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return (
        entryDate.getMonth() === currentMonth.getMonth() &&
        entryDate.getFullYear() === currentMonth.getFullYear()
      );
    });
    
    const totalDays = getDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());
    const typeCounts = monthEntries.reduce((acc, entry) => {
      const type = entry.type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonType = Object.entries(typeCounts).length > 0 
      ? Object.entries(typeCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0]
      : 'N/A';
    
    return {
      totalEntries: monthEntries.length,
      averagePerDay: (monthEntries.length / totalDays).toFixed(1),
      mostCommonType,
    };
  };
  
  // Event handlers
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const handleDayPress = (date: Date | null) => {
    if (date) {
      setSelectedDate(date);
    }
  };
  
  const handleEntryPress = (id: string) => {
    // Find the entry
    const entry = entries.find(e => e.id === id);
    if (entry) {
      // Navigate to the database details page with entry data
      router.push({
        pathname: '/entry-details-db',
        params: { 
          entry: JSON.stringify(entry)
        }
      });
    }
  };
  
  const toggleShowImages = () => {
    setShowImages(!showImages);
  };
  
  const handleExport = () => {
    alert('Export functionality would be implemented here');
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  // Helper functions
  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  const isSelectedDate = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };
  
  const calendarDays = generateCalendarDays();
  const selectedEntries = getEntriesForDate(selectedDate);
  const monthlyStats = getMonthlyStats();

  // Loading screen
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.primary.accent} />
        <Text style={styles.loadingText}>Loading records...</Text>
        {error && (
          <Text style={styles.errorText}>
            Error: {error}
          </Text>
        )}
      </View>
    );
  }

  // Error state
  if (error && entries.length === 0) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Failed to load records</Text>
        <Text style={styles.errorSubtext}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchPoopRecords}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render Calendar View
  const renderCalendarView = () => (
    <ScrollView 
      style={styles.scrollView} 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      }
    >
      {/* Calendar Header with Stats */}
      <View style={styles.calendarContainer}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
            <ChevronLeft />
          </TouchableOpacity>
          
          <Text style={styles.monthText}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <ChevronRight />
          </TouchableOpacity>
        </View>
        
        {/* Monthly Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{monthlyStats.totalEntries}</Text>
            <Text style={styles.statLabel}>Entries</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{monthlyStats.averagePerDay}</Text>
            <Text style={styles.statLabel}>Avg/Day</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{monthlyStats.mostCommonType}</Text>
            <Text style={styles.statLabel}>Most Common</Text>
          </View>
        </View>
        
        {/* Calendar Grid */}
        <View style={styles.weekdaysContainer}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <Text key={index} style={styles.weekdayText}>{day}</Text>
          ))}
        </View>
        
        <View style={styles.daysContainer}>
          {calendarDays.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.dayItem,
                item.day === 0 && styles.emptyDay,
                isToday(item.date) && styles.todayItem,
                isSelectedDate(item.date) && styles.selectedDayItem,
              ]}
              onPress={() => handleDayPress(item.date)}
              disabled={item.day === 0}
            >
              {item.day !== 0 && (
                <>
                  <Text style={[
                    styles.dayText,
                    isToday(item.date) && styles.todayText,
                    isSelectedDate(item.date) && styles.selectedDayText,
                  ]}>
                    {item.day}
                  </Text>
                  
                  {hasEntries(item.date) && (
                    <View style={[
                      styles.entryIndicator,
                      isSelectedDate(item.date) && styles.selectedEntryIndicator,
                    ]} />
                  )}
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Selected Date Entries */}
      <View style={styles.selectedDateSection}>
        <Text style={styles.dateTitle}>
          {selectedDate.toLocaleDateString('default', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </Text>
        
        {selectedEntries.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateText}>No entries for this date</Text>
          </View>
        ) : (
          <View style={styles.entriesContainer}>
            {selectedEntries.map((entry) => (
              <PoopCard 
                key={entry.id}
                entry={entry} 
                onPress={() => handleEntryPress(entry.id)}
                showImage={showImages}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );

  // Render Library View
  const renderLibraryView = () => (
    <View style={styles.libraryContainer}>
      {/* Search and Filter Section */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Search />
          <TextInput
            style={styles.searchInput}
            placeholder="Search entries..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.primary.lightText}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Text style={styles.clearSearch}>×</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          {['all', 'easy', 'medium', 'difficult'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                filterBy === filter && styles.activeFilterButton,
              ]}
              onPress={() => setFilterBy(filter)}
            >
              <Text style={[
                styles.filterButtonText,
                filterBy === filter && styles.activeFilterButtonText,
              ]}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* Debug Information */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Total entries: {entries.length} | Filtered: {filteredAndSearchedEntries.length}
          </Text>
        </View>
      )}
      
      {/* Entries List */}
      {filteredAndSearchedEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {entries.length === 0 
              ? 'No entries yet' 
              : (searchQuery || filterBy !== 'all' ? 'No matching entries' : 'No entries')
            }
          </Text>
          <Text style={styles.emptySubtext}>
            {entries.length === 0 
              ? 'Start tracking your poops to see them here'
              : (searchQuery || filterBy !== 'all' 
                ? 'Try adjusting your search or filter'
                : 'Check your database connection'
              )
            }
          </Text>
          {entries.length === 0 && (
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryButtonText}>Refresh</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredAndSearchedEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PoopCard 
              entry={item} 
              onPress={() => handleEntryPress(item.id)}
              showImage={showImages}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          }
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>
            {viewMode === 'calendar' ? 'Calendar' : 'Library'}
          </Text>
          {viewMode === 'library' && (
            <Text style={styles.resultCount}>
              {filteredAndSearchedEntries.length} of {entries.length} entries
            </Text>
          )}
        </View>
        
        <View style={styles.headerRight}>
          {/* View Mode Toggle */}
          <View style={styles.viewToggle}>
            <TouchableOpacity 
              style={[
                styles.toggleButton,
                viewMode === 'calendar' && styles.activeToggleButton
              ]}
              onPress={() => setViewMode('calendar')}
            >
              <Calendar />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.toggleButton,
                viewMode === 'library' && styles.activeToggleButton
              ]}
              onPress={() => setViewMode('library')}
            >
              <List />
            </TouchableOpacity>
          </View>
          
          {/* Control Buttons */}
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={toggleShowImages}
          >
            {showImages ? <Eye /> : <EyeOff />}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleExport}
          >
            <FileDown />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Dynamic Content */}
      {viewMode === 'calendar' ? renderCalendarView() : renderLibraryView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
  },
  
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.primary.lightText,
  },
  
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
  },
  
  errorSubtext: {
    marginTop: 5,
    fontSize: 14,
    color: Colors.primary.lightText,
    textAlign: 'center',
  },
  
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary.accent,
    borderRadius: 20,
  },
  
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  debugContainer: {
    padding: 10,
    backgroundColor: '#ffffcc',
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  
  debugText: {
    fontSize: 12,
    color: '#666',
  },
  
  scrollView: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
    backgroundColor: Colors.primary.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  
  headerLeft: {
    flex: 1,
  },
  
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  
  resultCount: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginTop: 2,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  
  // View Toggle
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.primary.background,
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    minWidth: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  activeToggleButton: {
    backgroundColor: Colors.primary.accent,
  },
  
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  
  // Calendar Styles
  calendarContainer: {
    backgroundColor: Colors.primary.card,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  monthText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  
  navButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.primary.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.accent,
  },
  
  statLabel: {
    fontSize: 12,
    color: Colors.primary.lightText,
    marginTop: 2,
  },
  
  // Calendar Grid
  weekdaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  
  weekdayText: {
    width: 40,
    textAlign: 'center',
    fontSize: 14,
    color: Colors.primary.lightText,
    fontWeight: 'bold',
  },
  
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  
  dayItem: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 20,
    position: 'relative',
  },
  
  emptyDay: {
    backgroundColor: 'transparent',
  },
  
  todayItem: {
    backgroundColor: Colors.primary.border,
  },
  
  selectedDayItem: {
    backgroundColor: Colors.primary.accent,
  },
  
  dayText: {
    fontSize: 16,
    color: Colors.primary.text,
  },
  
  todayText: {
    fontWeight: 'bold',
  },
  
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  
  entryIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary.accent,
    position: 'absolute',
    bottom: 6,
  },
  
  selectedEntryIndicator: {
    backgroundColor: '#FFFFFF',
  },
  
  // Selected Date Section
  selectedDateSection: {
    padding: 16,
    paddingBottom: 100,
  },
  
  dateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  
  entriesContainer: {
    gap: 12,
  },
  
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  
  emptyStateText: {
    fontSize: 16,
    color: Colors.primary.lightText,
    marginBottom: 16,
    textAlign: 'center',
  },
  
  // Library Styles
  libraryContainer: {
    flex: 1,
  },
  
  // Search and Filter
  searchSection: {
    padding: 16,
    backgroundColor: Colors.primary.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: Colors.primary.text,
  },
  
  clearSearch: {
    fontSize: 20,
    color: Colors.primary.lightText,
    paddingHorizontal: 8,
  },
  
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.primary.background,
    borderWidth: 1,
    borderColor: Colors.primary.border,
  },
  
  activeFilterButton: {
    backgroundColor: Colors.primary.accent,
    borderColor: Colors.primary.accent,
  },
  
  filterButtonText: {
    fontSize: 12,
    color: Colors.primary.text,
    fontWeight: '600',
  },
  
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  
  // Library List
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  
  emptySubtext: {
    fontSize: 16,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 24,
  },
});