import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppProvider, useAppContext } from '../../src/context/AppContext';
// 1. 確保這行取消註解，路徑指向你的 OnboardingFlow 組件
import OnboardingFlow from '../../src/screens/OnboardFlow';

function TabLayoutContent() {
  const { isFirstLaunch } = useAppContext(); 

  // 1. 還在從 Context 讀取狀態時，先顯示載入中
  if (isFirstLaunch === null) {
    return (
      <View style={{ flex: 1, backgroundColor: '#151515', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7AC1C9" />
      </View>
    );
  }

  // 2. 🌟 關鍵修正：取消註解！
  // 如果是首次啟動（或沒有 Token），顯示註冊流程蓋板
  if (isFirstLaunch) {
    return <OnboardingFlow />; 
  }

  // 3. 正常情況：當 completeFirstLaunch() 被呼叫，isFirstLaunch 變 false
  // 這裡會自動重新渲染，顯示底部的 Tab 導覽
  return (
    <NativeTabs
      iconColor={{
        default: 'rgba(255, 255, 255, 0.7)',
        selected: '#ffffff',
      }}
      labelStyle={{
        default: { color: 'rgba(255, 255, 255, 0.6)', fontSize: 10, fontWeight: '500' },
        selected: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
      }}
      backgroundColor="rgba(25, 25, 25, 0.85)"
      blurEffect="systemMaterialDark"
      minimizeBehavior="never"
    >
      <NativeTabs.Trigger name="index" options={{ title: 'Explore', icon: { sf: 'magnifyingglass' } }} />
      <NativeTabs.Trigger name="saved" options={{ title: 'Saved', icon: { sf: 'heart' } }} />
      <NativeTabs.Trigger name="fixed" options={{ title: 'Profile', icon: { sf: 'person.fill' } }} />
    </NativeTabs>
  );
}

export default function TabLayout() {
  return (
    <AppProvider>
      <TabLayoutContent />
    </AppProvider>
  );
}