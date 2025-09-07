import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

interface IconType {
  id: string;
  emoji?: string;
  type?: 'image' | 'emoji';
  src?: string;
  locked?: boolean;
}

const appIconGroups = [
  {
    title: 'Default',
    icons: [
      { id: 'poop_default', emoji: '💩', locked: false },
      { id: 'toilet_default', emoji: '🚽', locked: false },
    ],
  },
  {
    title: 'Colors',
    icons: [
      { id: 'brown', emoji: '💩🟤', locked: false },
      { id: 'green', emoji: '💚💩', locked: true },
      { id: 'rainbow', emoji: '🌈💩', locked: true },
      { id: 'skull', emoji: '💀💩', locked: true },
      { id: 'pastel', emoji: '🧻', locked: true },
    ],
  },
  {
    title: 'Special',
    icons: [
      { id: 'santa', emoji: '🎅💩', locked: true },
      { id: 'ice', emoji: '❄️💩', locked: true },
      { id: 'fire', emoji: '🔥💩', locked: true },
      { id: 'sparkle', emoji: '✨💩', locked: true },
    ],
  },
  {
    title: 'Art',
    icons: [
      { id: 'bucket', emoji: '🪣💩', locked: true },
      { id: 'hydrated', emoji: '🧼💧', locked: true },
      { id: 'paint', emoji: '🎨💩', locked: true },
      { id: 'crown', emoji: '👑💩', locked: true },
    ],
  },
  {
    title: 'Unique',
    icons: [
      { id: 'neon', emoji: '🌌💩', locked: true },
      { id: 'galaxy', emoji: '🪐💩', locked: true },
      { id: 'moon', emoji: '🌙💩', locked: true },
      { id: 'star', emoji: '⭐💩', locked: true },
    ],
  },
  {
    title: 'EmojiKitchen (Special Combos)',
    icons: [
      { 
        id: 'hifive_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20250430/u1f64c/u1f64c_u1f4a9.png',
        emoji: '💩', // Fallback
        locked: true 
      },
      { 
        id: 'shirt_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20241021/u1f33a/u1f33a_u1f4a9.png',
        emoji: '🌺💩', // Fallback
        locked: true 
      },
      {
        id: 'flower_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20230127/u1f338/u1f338_u1f4a9.png',
        emoji: '🌺💩',
        locked: true
      },
      {
        id: 'sexy_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20230216/u1f4a9/u1f4a9_u1f339.png',
        emoji: '🌹💩',
        locked: true
      },
      {
        id: 'punch_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20250430/u1f44a/u1f44a_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'whatever_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20220815/u1f937/u1f937_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'great_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20231128/u1f44d/u1f44d_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'fly_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20231113/u1fa82/u1fa82_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'snow_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20230216/u1f4a9/u1f4a9_u26c4.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'typhoon_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f4a9/u1f4a9_u1f32a-ufe0f.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'volcano_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20240206/u1f30b/u1f30b_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'star_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20240530/u1f30c/u1f30c_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'rainbow_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f4a9/u1f4a9_u1f308.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'boomb_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20231113/u1f4a5/u1f4a5_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'alien_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f4a9/u1f4a9_u1f47d.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'fever_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f912/u1f912_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'cool_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f4a9/u1f4a9_u1f60e.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'money_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f4a9/u1f4a9_u1f911.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'cowboy_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20230216/u1f4a9/u1f4a9_u1f920.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'clown_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f4a9/u1f4a9_u1f921.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'sleep1_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f634/u1f634_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'sleep2_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f62a/u1f62a_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'disappear_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20241023/u1fae5/u1fae5_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'shykiss_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f61a/u1f61a_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'lovekiss_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f618/u1f618_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'kiss_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f619/u1f619_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'love_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f970/u1f970_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'laught_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u1f923/u1f923_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'celebrate_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20230216/u1f4a9/u1f4a9_u1f973.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'tear_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20211115/u1f979/u1f979_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'threeeye_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20240530/u2622-ufe0f/u2622-ufe0f_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'god_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20240530/u1f4a9/u1f4a9_u2668-ufe0f.png',
        emoji: '💩',
        locked: true
      },
      {
        id: 'catchmouse_poop',
        type: 'image' as const,
        src: 'https://www.gstatic.com/android/keyboard/emojikitchen/20231113/u1faa4/u1faa4_u1f4a9.png',
        emoji: '💩',
        locked: true
      },
    ],
  },
];

export default function AppIconScreen() {
  const [selected, setSelected] = useState('poop_default');
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  const handleImageError = (iconId: string) => {
    setImageLoadErrors(prev => new Set([...prev, iconId]));
  };

  const renderIcon = (icon: IconType) => {
    const hasImageError = imageLoadErrors.has(icon.id);
    const shouldShowImage = icon.type === 'image' && icon.src && !hasImageError;

    return (
      <TouchableOpacity
        key={icon.id}
        onPress={() => !icon.locked && setSelected(icon.id)}
        style={[
          styles.iconCard,
          selected === icon.id && styles.iconCardSelected,
          icon.locked && styles.iconCardLocked,
        ]}
        activeOpacity={icon.locked ? 1 : 0.7}
      >
        {shouldShowImage ? (
          <Image 
            source={{ uri: icon.src }}
            style={styles.iconImage}
            resizeMode="contain"
            onError={() => handleImageError(icon.id)}
          />
        ) : (
          <Text style={styles.iconText}>{icon.emoji}</Text>
        )}
        {icon.locked && <Text style={styles.lock}>🔒</Text>}
      </TouchableOpacity>
    );
  };

  const getPreviewContent = () => {
    const icon = appIconGroups
      .flatMap((group) => group.icons)
      .find((i) => i.id === selected);
    
    if (!icon) return <Text style={{ fontSize: 64 }}>💩</Text>;
    
    const hasImageError = imageLoadErrors.has(icon.id);
    const shouldShowImage = icon.type === 'image' && icon.src && !hasImageError;
    
    if (shouldShowImage) {
      return (
        <Image 
          source={{ uri: icon.src }}
          style={{ width: 80, height: 80 }}
          resizeMode="contain"
          onError={() => handleImageError(icon.id)}
        />
      );
    }
    
    return <Text style={{ fontSize: 64 }}>{icon.emoji || '💩'}</Text>;
  };

  return (
    <>
      <Stack.Screen options={{ title: 'App Icon' }} />
      <ScrollView style={styles.container}>
        <View style={styles.preview}>
          <View style={styles.previewContainer}>
            {getPreviewContent()}
          </View>
          <Text style={styles.previewLabel}>Tap to preview</Text>
        </View>

        {appIconGroups.map((group) => (
          <View key={group.title}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <View style={styles.grid}>
              {group.icons.map((icon) => renderIcon(icon))}
            </View>
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            🔓 Complete achievements to unlock special icons!
          </Text>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 16,
    backgroundColor: Colors.primary.background || '#fff',
  },
  preview: { 
    alignItems: 'center', 
    marginBottom: 24,
    marginTop: 10,
  },
  previewContainer: {
    width: 120,
    height: 120,
    backgroundColor: '#f8f8f8',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  previewLabel: {
    marginTop: 8,
    fontSize: 12,
    color: '#999',
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginVertical: 8,
    color: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  iconCard: {
    width: 64,
    height: 64,
    backgroundColor: '#f2f2f2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCardSelected: {
    borderWidth: 2,
    borderColor: Colors.primary.accent || '#007AFF',
    backgroundColor: '#fff',
  },
  iconCardLocked: {
    opacity: 0.5,
  },
  iconText: { 
    fontSize: 28 
  },
  iconImage: {
    width: 40,
    height: 40,
  },
  lock: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    fontSize: 14,
  },
  footer: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
});