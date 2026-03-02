import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
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

const TABS = [
  { id: 'Discover', label: '探索',activeIcon: 'search', inactiveIcon: 'search' },
  { id: 'Saved', label: '最愛', activeIcon: 'heart-outline', inactiveIcon: 'heart-outline' },
  { id: 'Category', label: '分類', activeIcon: 'grid-outline', inactiveIcon: 'grid-outline' }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('Discover');
  const [savedItems, setSavedItems] = useState([]);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [openedItem, setOpenedItem] = useState(null);
  // 🌟 修改：新增儲存點擊位置與尺寸的 state
  const [originLayout, setOriginLayout] = useState(null);

  const translateX = useRef(new Animated.Value(0)).current;
  const lastOffset = useRef(0);

  const handleSave = (item) => {
    setSavedItems((prevItems) => {
      const isExisted = prevItems.find((i) => i.img === item.img);
      if (isExisted) return prevItems;
      return [...prevItems, item];
    });
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
        
        // 切換 Tab 時清空開啟的商品與座標
        setOpenedItem(null);
        setOriginLayout(null);
      }
    })
  ).current;

  const handleTabPress = (tabId, index) => {
    setActiveTab(tabId);
    
    // 切換 Tab 時清空開啟的商品與座標
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

  // 🌟 修改：處理打開商品，並接收座標
  const handleOpenItem = (item, layout) => {
    setOpenedItem(item);
    setOriginLayout(layout);
  };

  // 🌟 修改：處理關閉商品
  const handleCloseItem = () => {
    setOpenedItem(null);
    setOriginLayout(null);
  };

  return (
    <SafeAreaProvider>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />

        <View style={styles.contentArea}>
          {activeTab === 'Discover' && (
            <DiscoverScreen 
              onSave={handleSave} 
              cards={cards} 
              setCards={setCards}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex} 
            /> 
          )} 
          
          {/* 🌟 修改：把 SavedScreen 的條件放寬，只要是 Saved Tab 就渲染 */}
          {activeTab === 'Saved' && (
            <SavedScreen 
              savedItems={savedItems} 
              onOpenItem={handleOpenItem} // 傳入我們剛剛寫的 handleOpenItem
            />
          )}

          {activeTab === 'Category' && <CategoryScreen />}
        </View>

        {openedItem && (
          <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
            <OpenSaved 
              itemData={openedItem} 
              onClose={handleCloseItem} 
              originLayout={originLayout} 
            />
          </View>
        )}
        
        {/* ... 底下漸層與導覽列保持完全不變 ... */}
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
        
        {/* 🌟 為了讓開啟商品時導覽列不要擋住或搶焦點，加上 pointerEvents 判斷 */}
        <View style={styles.navContainer} pointerEvents="auto">
          <BlurView intensity={60} tint="dark" style={styles.bottomGlassNav} {...panResponder.panHandlers}>
            <Animated.View style={[styles.slidingBackground, { width: TAB_WIDTH, transform: [{ translateX }] }]} />
            {TABS.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const targetPos = index * TAB_WIDTH;
              const scale = translateX.interpolate({
                inputRange: [targetPos - TAB_WIDTH, targetPos, targetPos + TAB_WIDTH],
                outputRange: [1, 1.3, 1], extrapolate: 'clamp',
              });

              return (
                <TouchableOpacity key={tab.id} style={styles.navItem} onPress={() => handleTabPress(tab.id, index)} activeOpacity={1}>
                  <Animated.View style={{ alignItems: 'center', transform: [{ scale }] }}>
                    <Ionicons name={isActive ? tab.activeIcon : tab.inactiveIcon} size={width * 0.055} color={isActive ? '#EA80FC' : '#FFFFFF'} />
                    <Text style={[styles.navText, isActive && styles.activeNavText]}>{tab.label}</Text>
                  </Animated.View>
                </TouchableOpacity>
              );
            })}
          </BlurView>
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
  bottomGlassNav: { width: NAV_WIDTH, flexDirection: 'row', backgroundColor: 'rgba(12, 12, 12, 0.6)', borderTopWidth: 1, borderBottomWidth: 1, borderLeftWidth: 0.2, borderRightWidth: 0.2, borderTopColor: 'rgba(255, 255, 255, 0.15)', borderBottomColor: 'rgba(255, 255, 255, 0.04)', borderLeftColor: 'rgba(255, 255, 255, 0.05)', borderRightColor: 'rgba(255, 255, 255, 0.05)', padding: PADDING, borderRadius: 100, overflow: 'hidden', alignItems: 'center' },
  slidingBackground: { position: 'absolute', top: PADDING, left: PADDING, height: '100%', backgroundColor: 'rgba(255, 255, 255, 0.06)', borderRadius: 100 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: height * 0.012, zIndex: 2 },
  navText: { fontSize: Math.max(10, width * 0.03), marginTop: height * 0.003, color: 'rgba(255, 255, 255, 1)', fontWeight: '500' },
  activeNavText: { color: '#EA80FC', fontWeight: '500' },
});