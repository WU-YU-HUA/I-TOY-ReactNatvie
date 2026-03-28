import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppProvider, useAppContext } from '../../src/context/AppContext';
// 改為引入我們建立的流程控制器
// import OnboardingFlow from '../../src/screens/OnboardingFlow';

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

  // 2. 如果是 APP 首次啟動，顯示蓋板歡迎畫面流程
  // if (isFirstLaunch) {
  //   return <OnboardingFlow />; 
  // }

  // 3. 正常情況：直接顯示原生 Tab 導覽列 (預設會停在 index)
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
      <NativeTabs.Trigger name="index" options={{ title: '探索', icon: { sf: 'magnifyingglass' } }} />
      <NativeTabs.Trigger name="saved" options={{ title: '收藏', icon: { sf: 'heart' } }} />
      <NativeTabs.Trigger name="category" options={{ title: '分類', icon: { sf: 'square.grid.2x2' } }} />
      <NativeTabs.Trigger name="fixed" options={{ title: '開發中', icon: { sf: 'wrench.fill' } }} />
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