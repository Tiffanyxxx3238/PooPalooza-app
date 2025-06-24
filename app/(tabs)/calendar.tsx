import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { usePoopStore } from '@/store/poopStore';
import Colors from '@/constants/colors';
import PoopCard from '@/components/PoopCard';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

export default function CalendarScreen() {
  const router = useRouter();
  const { entries } = usePoopStore();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Generate days for the current month
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
    
    // Add empty spaces for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push({ day: 0, date: null });
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({ day: i, date });
    }
    
    return days;
  };
  
  const calendarDays = generateCalendarDays();
  
  // Get entries for the selected date
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
  
  const selectedEntries = getEntriesForDate(selectedDate);
  
  // Check if a date has entries
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
    router.push({
      pathname: '/entry-details',
      params: { id }
    });
  };
  
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

  return (
    <View style={styles.container}>
      <View style={styles.calendarContainer}>
        <View style={styles.monthSelector}>
          <TouchableOpacity onPress={handlePrevMonth}>
            <ChevronLeft size={24} color={Colors.primary.text} />
          </TouchableOpacity>
          
          <Text style={styles.monthText}>
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </Text>
          
          <TouchableOpacity onPress={handleNextMonth}>
            <ChevronRight size={24} color={Colors.primary.text} />
          </TouchableOpacity>
        </View>
        
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
      
      <View style={styles.entriesContainer}>
        <Text style={styles.entriesTitle}>
          {selectedDate.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })}
        </Text>
        
        {selectedEntries.length === 0 ? (
          <View style={styles.emptyEntriesContainer}>
            <Text style={styles.emptyEntriesText}>No entries for this date</Text>
          </View>
        ) : (
          <FlatList
            data={selectedEntries}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <PoopCard 
                entry={item} 
                onPress={() => handleEntryPress(item.id)}
              />
            )}
            contentContainerStyle={styles.entriesList}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
  },
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
    paddingTop: Platform.OS === 'ios' ? 0 : 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
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
  },
  dayItem: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderRadius: 20,
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
  entriesContainer: {
    flex: 1,
    padding: 16,
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary.text,
    marginBottom: 16,
  },
  entriesList: {
    paddingBottom: 16,
  },
  emptyEntriesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyEntriesText: {
    fontSize: 16,
    color: Colors.primary.lightText,
  },
});