import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAppContext } from '../../src/context/AppContext';
import DiscoverScreen from '../../src/screens/Discover';

export default function Index() {
  const {
    isCategoriesLoaded, // 🌟 改為監聽 Category 是否載入完畢
    handleSave,
  } = useAppContext();

  // 如果分類還沒讀完，顯示載入中
  if (!isCategoriesLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: 'rgb(12, 12, 12)', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EA80FC" />
      </View>
    );
  }

  // 讀完分類後，正式顯示探索畫面
  // 參數變得超乾淨，只傳 onSave 即可！
  return (
    <View style={{ flex: 1, backgroundColor: 'rgb(12, 12, 12)' }}>
      <DiscoverScreen onSave={handleSave} />
    </View>
  );
}