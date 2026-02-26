import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false, // 隱藏頂部標題列
        tabBarStyle: { display: 'none' }, // 隱藏預設的底部標籤列
      }}>
      <Tabs.Screen name="index" />
    </Tabs>
  );
}