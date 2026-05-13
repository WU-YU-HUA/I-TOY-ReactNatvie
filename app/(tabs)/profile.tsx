import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAppContext } from '../../src/context/AppContext';
import ProfileScreen from '../../src/screens/Profile'; // 👈 直接 import 剛寫好的 Screen

export default function Fixed() {
  const { isLocalDataLoaded } = useAppContext();

  // 確保 Context 資料讀取完畢
  if (!isLocalDataLoaded) {
    return (
      <View style={styles.loadingWrapper}>
        <ActivityIndicator size="large" color="#7AC1C9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ProfileScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151515',
  },
  loadingWrapper: {
    flex: 1,
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center',
  },
});