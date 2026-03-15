import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import React, { useEffect, useState } from 'react';

export default function TabLayout() {
  const segments = useSegments();
  const router = useRouter();

  // 用來確保已經讀取完 AsyncStorage 才開始顯示畫面與記錄新路徑
  const [isReady, setIsReady] = useState(false);

  // 1. App 開啟時，讀取最後一次所在的 Tab
  useEffect(() => {
    const loadLastTab = async () => {
      try {
        const lastTab = await AsyncStorage.getItem('@last_active_tab');

        // 如果有紀錄，並且不是首頁(index)，就讓他跳轉過去
        if (lastTab && lastTab !== 'index') {
          router.replace(`/(tabs)/${lastTab}` as any);
        }
      } catch (error) {
        console.error('讀取最後分頁失敗:', error);
      } finally {
        setIsReady(true);
      }
    };

    loadLastTab();
  }, []);

  // 2. 當切換 Tab (路由改變) 時，儲存當前的 Tab 名稱
  useEffect(() => {
    if (!isReady) return; // 等到初始讀取完畢後才開始記錄，避免把舊紀錄洗掉

    // 在 (tabs) 下，segments 會類似: ['(tabs)', 'saved'] 或 ['(tabs)', 'index']
    const currentTab = segments[1] || 'index';

    AsyncStorage.setItem('@last_active_tab', currentTab).catch((error) => {
      console.error('儲存分頁狀態失敗:', error);
    });
  }, [segments, isReady]);

  // 在讀取舊狀態期間，可以先回傳 null 防止畫面閃爍 (或替換成 Loading 元件)
  if (!isReady) {
    return null;
  }

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
      <NativeTabs.Trigger
        name="fixed"
        options={{
          title: '開發中',
          icon: { sf: 'wrench.fill' }
        }}
      />
    </NativeTabs>
  );
}
