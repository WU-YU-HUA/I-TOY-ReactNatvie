import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';

export default function TabLayout() {
  return (
    <NativeTabs
      iconColor={{
        default: 'rgba(255, 255, 255, 0.7)',
        selected: '#EA80FC',
      }}
      labelStyle={{
        default: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 10, fontWeight: '500' },
        selected: { color: '#EA80FC', fontSize: 10, fontWeight: '700' },
      }}
      backgroundColor="rgba(25, 25, 25, 0.85)"
      blurEffect="systemMaterialDark"
      minimizeBehavior="never"
    >
      <NativeTabs.Trigger 
        name="index" 
        options={{ 
          title: '探索', 
          icon: { sf: 'magnifyingglass' } 
        }} 
      />
      <NativeTabs.Trigger 
        name="saved" 
        options={{ 
          title: '收藏', 
          icon: { sf: 'heart' } 
        }} 
      />
      <NativeTabs.Trigger 
        name="category" 
        options={{ 
          title: '分類', 
          icon: { sf: 'square.grid.2x2' } 
        }} 
      />
    </NativeTabs>
  );
}