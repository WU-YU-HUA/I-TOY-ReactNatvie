import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlassView } from 'expo-glass-effect'; // 🌟 使用 GlassView
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CategoryScreen from './Category';
import DiscoverScreen from './Discover';
import OpenSaved from './OpenSaved';
import SavedScreen from './Saved';

const { width, height } = Dimensions.get('window');

const NAV_WIDTH = width * 0.8;
const PADDING = width * 0.01;
const TAB_WIDTH = (NAV_WIDTH - (PADDING * 2)) / 3;
const API_URL = process.env.EXPO_PUBLIC_BACKEND;

const TABS = [
  { id: 'Discover', label: '探索', activeIcon: 'search', inactiveIcon: 'search' },
  { id: 'Saved', label: '收藏', activeIcon: 'heart-outline', inactiveIcon: 'heart-outline' },
  { id: 'Category', label: '分類', activeIcon: 'grid-outline', inactiveIcon: 'grid-outline' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Discover');
  const [savedItems, setSavedItems] = useState([]);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [openedItem, setOpenedItem] = useState(null);
  const [originLayout, setOriginLayout] = useState(null);

  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [isBrandsLoaded, setIsBrandsLoaded] = useState(false);

  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const loadSelectedBrands = async () => {
      try {
        const storedBrands = await AsyncStorage.getItem('@selected_brands');
        if (storedBrands !== null) {
          setSelectedBrands(new Set(JSON.parse(storedBrands)));
        }
      } catch (error) {
        console.error('讀取品牌設定失敗:', error);
      } finally {
        setIsBrandsLoaded(true);
      }
    };

    loadSelectedBrands();
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_URL}/api/firebase/categories/`);
        const json = await response.json();
        setCategories(json);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCategories();
  }, []);

  const toggleBrand = (brandName) => {
    setSelectedBrands((prevSet) => {
      const newSet = new Set(prevSet);
      if (newSet.has(brandName)) {
        newSet.delete(brandName);
      } else {
        newSet.add(brandName);
      }

      AsyncStorage.setItem('@selected_brands', JSON.stringify(Array.from(newSet)))
        .catch(error => console.error('儲存品牌設定失敗:', error));

      return newSet;
    });
  };

  const handleSave = (item) => {
    setSavedItems((prevItems) => {
      const isExisted = prevItems.find((i) => i.img === item.img);
      if (isExisted) return prevItems;
      return [item, ...prevItems];
    });
  };

  const handleRemoveSaved = (itemToRemove) => {
    setSavedItems((prevItems) => prevItems.filter((i) => i.img !== itemToRemove.img));
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 5,
      onPanResponderGrant: () => {
        translateX.setOffset(lastOffset.current);
        translateX.setValue(0);
      },
      onPanResponderMove: Animated.event(
        [null, { dx: translateX }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (evt, gestureState) => {
        translateX.flattenOffset();
        let currentPos = lastOffset.current + gestureState.dx;
        const maxPos = TAB_WIDTH * 2;
        currentPos = Math.max(0, Math.min(currentPos, maxPos));

        const index = Math.round(currentPos / TAB_WIDTH);
        const targetPos = index * TAB_WIDTH;

        Animated.spring(translateX, {
          toValue: targetPos,
          friction: 6,
          tension: 60,
          useNativeDriver: false,
        }).start();

        lastOffset.current = targetPos;
        setActiveTab(TABS[index].id);
        setOpenedItem(null);
        setOriginLayout(null);
      }
    })
  ).current;

  const handleTabPress = (tabId, index) => {
    setActiveTab(tabId);
    setOpenedItem(null);
    setOriginLayout(null);

    const targetPos = index * TAB_WIDTH;
    Animated.spring(translateX, {
      toValue: targetPos,
      friction: 6,
      tension: 60,
      useNativeDriver: false,
    }).start();

    lastOffset.current = targetPos;
  };

  const handleOpenItem = (item, layout) => {
    setOpenedItem(item);
    setOriginLayout(layout);
  };

  const handleCloseItem = () => {
    setOpenedItem(null);
    setOriginLayout(null);
  };

  const currentList = activeTab === 'Saved' ? savedItems : cards;
  const openItemIndex = openedItem ? currentList.findIndex(i => i.img === openedItem.img) : -1;

  const handleNextItem = () => {
    if (openItemIndex >= 0 && openItemIndex < currentList.length - 1) {
      setOpenedItem(currentList[openItemIndex + 1]);
      setOriginLayout(null);
    }
  };

  const handlePrevItem = () => {
    if (openItemIndex > 0) {
      setOpenedItem(currentList[openItemIndex - 1]);
      setOriginLayout(null);
    }
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.contentArea}>
          {activeTab === 'Discover' && (
            isBrandsLoaded ? (
              <DiscoverScreen
                onSave={handleSave}
                cards={cards}
                setCards={setCards}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                selectedBrands={selectedBrands}
              />
            ) : (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#EA80FC" />
              </View>
            )
          )}

          {activeTab === 'Saved' && (
            <SavedScreen
              savedItems={savedItems}
              onOpenItem={handleOpenItem}
            />
          )}

          {activeTab === 'Category' && (
            <CategoryScreen
              categories={categories}
              selectedBrands={selectedBrands}
              onToggleBrand={toggleBrand}
            />
          )}
        </View>

        {openedItem && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            <OpenSaved
              prevItemData={openItemIndex > 0 ? currentList[openItemIndex - 1] : null}
              nextItemData={openItemIndex >= 0 && openItemIndex < currentList.length - 1 ? currentList[openItemIndex + 1] : null}
              itemData={openedItem}
              onClose={handleCloseItem}
              originLayout={originLayout}
              onRemoveSaved={handleRemoveSaved}
              onSave={handleSave}
              onNext={openItemIndex >= 0 && openItemIndex < currentList.length - 1 ? handleNextItem : undefined}
              onPrev={openItemIndex > 0 ? handlePrevItem : undefined}
            />
          </View>
        )}

        <LinearGradient
          colors={['rgba(12,12,12,0.9)', 'rgba(12,12,12,0.6)', 'transparent']}
          locations={[0, 0.5, 1]}
          style={styles.topGlobalGradient}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', 'rgba(12,12,12,0.6)', 'rgba(12,12,12,0.9)']}
          locations={[0, 0.4, 1]}
          style={styles.bottomGlobalGradient}
          pointerEvents="none"
        />

        <View style={styles.navContainer} pointerEvents="auto">
          {/* 🌟 底部導航欄改用 GlassView 並套用 PanResponder */}
          <GlassView
            intensity={40}
            tint="dark"
            style={styles.bottomGlassNav}
            {...panResponder.panHandlers}
          >
            {/* 🌟 滑動背景改為玻璃效果 */}
            <Animated.View style={[styles.slidingWrapper, { width: TAB_WIDTH, transform: [{ translateX }] }]}>
              <GlassView
                intensity={50} // 調整玻璃的模糊強度
                tint="light"   // 讓滑塊比底部的深色玻璃亮一點
                style={styles.slidingGlass}
              />
            </Animated.View>

            {TABS.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const targetPos = index * TAB_WIDTH;
              const scale = translateX.interpolate({
                inputRange: [targetPos - TAB_WIDTH, targetPos, targetPos + TAB_WIDTH],
                outputRange: [1, 1.2, 1],
                extrapolate: 'clamp',
              });

              return (
                <TouchableOpacity key={tab.id} style={styles.navItem} onPress={() => handleTabPress(tab.id, index)} activeOpacity={1}>
                  <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
                    <Ionicons name={isActive ? tab.activeIcon : tab.inactiveIcon} size={width * 0.055} color={isActive ? '#EA80FC' : 'rgba(255,255,255,0.7)'} />
                    <Text style={[styles.navText, isActive && styles.activeNavText]}>{tab.label}</Text>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </GlassView>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgb(12, 12, 12)' },
  contentArea: { flex: 1 },
  topGlobalGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.1, zIndex: 50 },
  bottomGlobalGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.15, zIndex: 50 },
  navContainer: { position: 'absolute', bottom: height * 0.04, width: '100%', alignItems: 'center', zIndex: 100 },

  // 🌟 GlassView 樣式調整
  bottomGlassNav: {
    width: NAV_WIDTH,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: PADDING,
    borderRadius: 40,
    overflow: 'hidden',
    alignItems: 'center'
  },

  // 🌟 滑動背景的外層動畫容器
  slidingWrapper: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING, // 用 bottom 確保高度跟 TabBar 內距完美貼合
    left: PADDING,
    borderRadius: 30,
    overflow: 'hidden', // 確保玻璃效果不會漏出圓角外
  },

  // 🌟 滑動玻璃的本體樣式
  slidingGlass: {
    flex: 1,
    backgroundColor: 'rgba(234, 128, 252, 0.2)', // 保留粉紫色，帶有透明度
    borderWidth: 1,
    borderColor: 'rgba(234, 128, 252, 0.4)',     // 加上一點邊框反光感
    borderRadius: 30,
  },

  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: height * 0.015, zIndex: 2 },
  navText: { fontSize: Math.max(10, width * 0.028), marginTop: 4, color: 'rgba(255, 255, 255, 0.6)', fontWeight: '500' },
  activeNavText: { color: '#EA80FC', fontWeight: '700' },
});