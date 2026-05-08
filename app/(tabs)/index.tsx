import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useAppContext } from '../../src/context/AppContext';
import DiscoverScreen from '../../src/screens/Discover';

export default function Index() {
  const {
    isCategoriesLoaded, 
    isLocalDataLoaded, // 🌟 確認本機篩選條件已讀取
    handleSave,
  } = useAppContext();

  // 🌟 必須等兩個都讀完，才能放行渲染 DiscoverScreen
  if (!isCategoriesLoaded || !isLocalDataLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: 'rgb(12, 12, 12)', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EA80FC" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <DiscoverScreen onSave={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(12, 12, 12)',
  },
});