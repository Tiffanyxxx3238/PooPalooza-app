/*
// JourneySmokeTest.tsx（先暫時拿來取代 journey 畫面）
import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import MapView from "react-native-maps";

export default function JourneySmokeTest() {
  const initialRegion = {
    latitude: 25.0478,
    longitude: 121.5170,
    latitudeDelta: 0.08,
    longitudeDelta: 0.08,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        // iOS Expo Go 不能用 PROVIDER_GOOGLE
        initialRegion={initialRegion}
        // 先關掉容易踩雷的屬性
        scrollEnabled
        zoomEnabled
        pitchEnabled={false}
        rotateEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { ...StyleSheet.absoluteFillObject },
});*/