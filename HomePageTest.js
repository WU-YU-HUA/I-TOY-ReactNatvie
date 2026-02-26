import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
    Dimensions,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// --- 引入 Reanimated 與 手勢套件 ---
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    interpolate,
    interpolateColor,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

// --- 你的原始 Screen 引入 (請確保路徑正確) ---
import CategoryScreen from './Category';
import DiscoverScreen from './Discover';
import SavedScreen from './Saved';

const { width, height } = Dimensions.get('window');

// --- 尺寸計算 ---
const NAV_WIDTH = width * 0.8; 
const PADDING = width * 0.01; 
const TAB_WIDTH = (NAV_WIDTH - (PADDING * 2)) / 3; 

const TABS = [
  { id: 'Discover', activeIcon: 'search', inactiveIcon: 'search' },
  { id: 'Saved', activeIcon: 'heart-outline', inactiveIcon: 'heart-outline' },
  { id: 'Category', activeIcon: 'grid-outline', inactiveIcon: 'grid-outline' }
];

// 讓圖示能支援 Reanimated 顏色與縮放動畫
const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);

// 將你原本 Animated 的 friction: 6, tension: 60 轉換為 Reanimated 對應的 Q 彈參數
const SPRING_CONFIG = {
  damping: 12,   // 對應 friction (阻尼，數值越小越彈)
  stiffness: 60, // 對應 tension (剛度，數值控制回彈速度)
};

export default function App() {
  const [activeTab, setActiveTab] = useState('Discover');
  const [savedItems, setSavedItems] = useState([]);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 用來記錄與控制滑塊位置的 SharedValue
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0); // 記錄拖曳起始點

  const handleSave = (item) => {
    setSavedItems((prevItems) => {
      const isExisted = prevItems.find((i) => i.img === item.img);
      if (isExisted) return prevItems;
      return [...prevItems, item];
    });
  };

  // --- 動畫更新 Tab 狀態 (跑在 JS Thread) ---
  const updateActiveTab = (index) => {
    setActiveTab(TABS[index].id);
  };

  // --- 點擊切換邏輯 ---
  const handleTabPress = (tabId, index) => {
    setActiveTab(tabId);
    translateX.value = withSpring(index * TAB_WIDTH, SPRING_CONFIG);
  };

  // --- 手勢滑動邏輯 (完全取代原本的 PanResponder) ---
  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      // 拖曳時即時跟隨手指
      let nextPos = startX.value + event.translationX;
      const maxPos = TAB_WIDTH * 2;
      // 限制拖曳範圍在導覽列內
      translateX.value = Math.max(0, Math.min(nextPos, maxPos));
    })
    .onEnd(() => {
      // 鬆手時，計算最靠近的 Tab Index
      const index = Math.round(translateX.value / TAB_WIDTH);
      const targetPos = index * TAB_WIDTH;
      
      // 彈簧吸附到目標位置
      translateX.value = withSpring(targetPos, SPRING_CONFIG);
      // 同步更新 React State
      runOnJS(updateActiveTab)(index);
    });

  // --- 滑動背景方塊的動畫樣式 ---
  const animatedBackgroundStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    // 必須用 GestureHandlerRootView 包裹以啟用手勢
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />

        {/* --- 保留你的內容區 --- */}
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
          {activeTab === 'Saved' && <SavedScreen savedItems={savedItems} />}
          {activeTab === 'Category' && <CategoryScreen />}
        </View>
        
        {/* --- 保留你的上下漸層 --- */}
        <LinearGradient
          colors={['rgba(0,0,0,0.9)', 'rgba(0,0,0,0.6)', 'transparent']}
          locations={[0, 0.5, 1]}
          style={styles.topGlobalGradient}
          pointerEvents="none"
        />

        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.9)']}
          locations={[0, 0.4, 1]}
          style={styles.bottomGlobalGradient}
          pointerEvents="none"
        />

        {/* --- 導覽列 --- */}
        <View style={styles.navContainer}>
          <GestureDetector gesture={panGesture}>
            <BlurView intensity={60} tint="dark" style={styles.bottomGlassNav}>
              
              {/* --- 影片中透明且較大的滑動方塊 --- */}
              <Animated.View 
                style={[
                  styles.slidingBackground, 
                  { width: TAB_WIDTH },
                  animatedBackgroundStyle 
                ]} 
              />

              {TABS.map((tab, index) => {
                const targetPos = index * TAB_WIDTH;

                // --- 放大鏡與顏色過渡動畫 ---
                const animatedItemStyle = useAnimatedStyle(() => {
                  // 計算滑塊距離目前 Tab 的遠近
                  const distance = Math.abs(translateX.value - targetPos);
                  
                  // 放大倍率：滑塊靠近時放大到 1.3 倍
                  const scale = interpolate(distance, [0, TAB_WIDTH], [1.3, 1], 'clamp');
                  
                  // 顏色變化：滑塊靠近時變成亮紫色，遠離時變淡灰
                  const color = interpolateColor(
                    distance, 
                    [0, TAB_WIDTH], 
                    ['#EA80FC', 'rgba(204, 204, 204, 0.5)']
                  );

                  return {
                    transform: [{ scale }],
                    color: color
                  };
                });

                return (
                  <TouchableOpacity 
                    key={tab.id}
                    style={styles.navItem} 
                    onPress={() => handleTabPress(tab.id, index)}
                    activeOpacity={1} // 點擊不閃爍，交給動畫處理
                  >
                    <Animated.View style={{ alignItems: 'center' }}>
                      <AnimatedIcon 
                        name={activeTab === tab.id ? tab.activeIcon : tab.inactiveIcon}
                        size={width * 0.055}
                        style={animatedItemStyle} // 套用放大鏡與顏色
                      />
                      <Animated.Text style={[styles.navText, animatedItemStyle]}>
                        {tab.id}
                      </Animated.Text>
                    </Animated.View>
                  </TouchableOpacity>
                );
              })}
            </BlurView>
          </GestureDetector>
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  contentArea: { 
    flex: 1 
  },
  topGlobalGradient: {
    position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.1, zIndex: 50,
  },
  bottomGlobalGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.15, zIndex: 50,
  },
  navContainer: {
    position: 'absolute', bottom: height * 0.04, width: '100%', alignItems: 'center', zIndex: 100,
  },
  bottomGlassNav: {
    width: NAV_WIDTH, 
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.6)', 
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderLeftWidth: 0.2, 
    borderRightWidth: 0.2,
    borderTopColor: 'rgba(255, 255, 255, 0.15)', 
    borderBottomColor: 'rgba(255, 255, 255, 0.04)', 
    borderLeftColor: 'rgba(255, 255, 255, 0.05)',
    borderRightColor: 'rgba(255, 255, 255, 0.05)',
    padding: PADDING, 
    borderRadius: 100, 
    overflow: 'hidden', 
    alignItems: 'center', 
  },
  slidingBackground: {
    position: 'absolute',
    top: PADDING,
    left: PADDING,
    height: '100%', // 撐滿高度，形成大方塊的感覺
    backgroundColor: 'rgba(255, 255, 255, 0.12)', // 透明的滑動方塊
    borderRadius: 100, 
  },
  navItem: {
    flex: 1, 
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.012,
    zIndex: 2, // 必須大於 slidingBackground 的 zIndex
  },
  navText: { 
    fontSize: Math.max(10, width * 0.03), 
    marginTop: height * 0.003, 
    fontWeight: '500' 
  }
});