import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { usePoopStore } from '@/store/poopStore';
import Colors from '@/constants/colors';
import PoopCard from '@/components/PoopCard';
import { Plus, Eye, EyeOff, FileDown } from 'lucide-react-native';
import Button from '@/components/Button';

export default function LibraryScreen() {
  const router = useRouter();
  const { entries } = usePoopStore();
  const [showImages, setShowImages] = useState(false);
  
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  
  const handleAddNew = () => {
    router.push('/add-entry');
  };
  
  const handleEntryPress = (id: string) => {
    router.push({
      pathname: '/entry-details',
      params: { id }
    });
  };
  
  const toggleShowImages = () => {
    setShowImages(!showImages);
  };
  
  const handleExport = () => {
    // In a real app, you would implement export functionality
    alert('Export functionality would be implemented here');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={toggleShowImages}
          >
            {showImages ? (
              <Eye size={20} color={Colors.primary.accent} />
            ) : (
              <EyeOff size={20} color={Colors.primary.accent} />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleExport}
          >
            <FileDown size={20} color={Colors.primary.accent} />
          </TouchableOpacity>
        </View>
      </View>
      
      {sortedEntries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No entries yet</Text>
          <Text style={styles.emptySubtext}>Start tracking your poops to see them here</Text>
          <Button 
            title="Add Your First Poop" 
            onPress={handleAddNew}
            style={styles.addButton}
          />
        </View>
      ) : (
        <FlatList
          data={sortedEntries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PoopCard 
              entry={item} 
              onPress={() => handleEntryPress(item.id)}
              showImage={showImages}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAddNew}
      >
        <Plus size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 0 : 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary.text,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
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
  },
  emptySubtext: {
    fontSize: 16,
    color: Colors.primary.lightText,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    width: 200,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary.accent,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});