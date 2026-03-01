import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import Svg, { Circle } from 'react-native-svg';

import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
// 確保引入了 withSequence 和 withTiming
import Reanimated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND;

const buttonSize = Math.round(width * 0.13); 
const strokeWidth = 1; 
const circleRadius = (buttonSize - strokeWidth) / 2;
const centerCoord = buttonSize / 2;

// --- 統一使用 Reanimated 建立動畫元件 ---
const ReanimatedCircle = Reanimated.createAnimatedComponent(Circle);
const ReanimatedTouchableOpacity = Reanimated.createAnimatedComponent(TouchableOpacity);

// 接收 animatedProps 來改變 SVG 的填色
const SvgGlassCircle = ({ animatedProps }) => (
  <Svg height={buttonSize} width={buttonSize} style={styles.svgContainer}>
    <ReanimatedCircle
      cx={centerCoord}
      cy={centerCoord}
      r={circleRadius}
      stroke="rgba(255, 255, 255, 0.1)" 
      strokeWidth={strokeWidth}
      animatedProps={animatedProps} 
    />
  </Svg>
);

// --- 核心：Reanimated 高效能縮放與平移卡片 (維持原樣) ---
const ZoomableCard = ({ card, setIsZooming }) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const springConfig = { damping: 25, stiffness: 100 };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      runOnJS(setIsZooming)(true); 
    })
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(event.scale, 3.5));
    })
    .onEnd(() => {
      scale.value = withSpring(1, springConfig);
      translateX.value = withSpring(0, springConfig);
      translateY.value = withSpring(0, springConfig);
      runOnJS(setIsZooming)(false); 
    });

  const panGesture = Gesture.Pan()
    .minPointers(2) 
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0, springConfig);
      translateY.value = withSpring(0, springConfig);
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  return (
    <View style={styles.card}>
      <GestureDetector gesture={composedGesture}>
        <Reanimated.View style={[{ flex: 1 }, animatedStyle]}>
          <Image source={{ uri: card.img }} style={styles.cardImage} />
        </Reanimated.View>
      </GestureDetector>
      
      <BlurView intensity={50} tint="dark" style={styles.topGlassTag}>
        <Text style={styles.tagText}>{card.tag}</Text>
      </BlurView>
    </View>
  );
};

export default function DiscoverScreen({ onSave, cards, setCards, currentIndex, setCurrentIndex }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSwipedAll, setIsSwipedAll] = useState(false);
  const [isZooming, setIsZooming] = useState(false); 
  const swiperRef = useRef(null);
  
  const swipeX = useSharedValue(0);
  const isButtonPressed = useRef(false); // 動畫鎖

  // --- X 按鈕的動畫設定 ---
  const xButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(swipeX.value, [-150, 0], [1.5, 1], 'clamp') }]
  }));
  const xButtonProps = useAnimatedProps(() => ({
    fill: interpolateColor(swipeX.value, [-150, 0], ['rgb(255, 0, 0)', 'rgba(12, 12, 12, 0.55)'])
  }));

  // --- 愛心按鈕的動畫設定 ---
  const heartButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(swipeX.value, [0, 150], [1, 1.5], 'clamp') }]
  }));
  const heartButtonProps = useAnimatedProps(() => ({
    fill: interpolateColor(swipeX.value, [0, 150], ['rgba(12, 12, 12, 0.55)', 'rgb(234, 128, 252)'])
  }));

  const fetchData = async () => {
    setIsLoading(true);
    setIsSwipedAll(false);
    try {
      const response = await fetch(`${API_URL}/api/firebase/datas/`);
      const json = await response.json();
      const formData = json.map(item => ({
        id: item.origin_url, url: item.shopee_url, img: item.img, tag: item.tag
      }));
      setCards(formData);
      setCurrentIndex(0);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => {
    if (cards.length === 0 && !isSwipedAll) fetchData();
  }, []);

  const handleSwiped = (cardIndex) => {
    setCurrentIndex(cardIndex + 1);
    // 卡片完全滑走後，瞬間歸零不亂晃
    swipeX.value = 0; 
    isButtonPressed.current = false; // 解鎖
  };

  // --- 攔截按鈕點擊：放大後馬上俐落縮小 ---
  const handlePressCross = () => {
    if (isButtonPressed.current) return; 
    isButtonPressed.current = true;      
    
    // 花 120ms 放大到 -150，接著花 150ms 乖乖縮回 0，完全不震盪！
    swipeX.value = withSequence(
      withTiming(-150, { duration: 200 }),
      withTiming(0, { duration: 150 })
    );
    swiperRef.current?.swipeLeft();
  };

  const handlePressHeart = () => {
    if (isButtonPressed.current) return; 
    isButtonPressed.current = true;      

    // 花 120ms 放大到 150，接著花 150ms 乖乖縮回 0，完全不震盪！
    swipeX.value = withSequence(
      withTiming(150, { duration: 200 }),
      withTiming(0, { duration: 150 })
    );
    swiperRef.current?.swipeRight();
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EA80FC" />
      </View>
    );
  }

  if (currentIndex >= cards.length || isSwipedAll) {
    return (
      <View style={[styles.screenContainer, styles.center]}>
        <Ionicons name="layers-outline" size={width * 0.15} color="#666" />
        <Text style={styles.errorText}>
            {cards.length === 0 ? '目前沒有商品資料' : '商品已瀏覽完畢'}
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Text style={styles.retryText}>重新載入</Text>
            <Ionicons name="refresh" size={width * 0.045} color="white" style={{ marginLeft: 5 }} />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.screenContainer}>
        <View style={styles.swiperContainer}>
          <Swiper
            ref={swiperRef}
            cards={cards}
            cardIndex={currentIndex}
            onSwiped={handleSwiped}
            onSwipedAll={() => setIsSwipedAll(true)}
            onSwipedRight={(idx) => onSave(cards[idx])}
            // 手指拖曳時的動畫更新 (只有未上鎖時才執行)
            onSwiping={(x) => { 
              if (!isButtonPressed.current) {
                swipeX.value = x; 
              }
            }} 
            onSwipedAborted={() => {
              // 取消滑動時，維持原本好玩的彈簧回彈感
              swipeX.value = withSpring(0, { damping: 20, stiffness: 100 });
              isButtonPressed.current = false; 
            }}
            horizontalSwipe={!isZooming} 
            stackSize={2}
            stackScale={0}
            animateCardOpacity={false}
            backgroundColor={'transparent'}
            cardVerticalMargin={0}
            cardHorizontalMargin={0}
            containerStyle={styles.swiperRoot}
            disableTopSwipe
            disableBottomSwipe
            renderCard={(card) => {
              if (!card) return null;
              return <ZoomableCard card={card} setIsZooming={setIsZooming} />;
            }}
          />
        </View>

        <ReanimatedTouchableOpacity 
          style={[styles.fixedCloseWrapper, xButtonStyle]}
          onPress={handlePressCross}
        >
          <SvgGlassCircle animatedProps={xButtonProps} />
          <View style={styles.iconOverlay}>
            <Ionicons name="close" size={width * 0.08} color="#FFFFFF" />
          </View>
        </ReanimatedTouchableOpacity>
        
        <ReanimatedTouchableOpacity 
          style={[styles.fixedHeartWrapper, heartButtonStyle]}
          onPress={handlePressHeart}
        >
          <SvgGlassCircle animatedProps={heartButtonProps} />
          <View style={styles.iconOverlay}>
            <Ionicons name="heart-outline" size={width * 0.075} color="white" />
          </View>
        </ReanimatedTouchableOpacity>

        <TouchableOpacity 
          onPress={() => cards[currentIndex] && Linking.openURL(cards[currentIndex].url)}
          style={styles.fixedBuyNowWrapper}
        >
          <BlurView intensity={50} tint="dark" style={styles.buyNowGlassButton}>
            <Text style={styles.buyNowText}>馬上購買</Text>
          </BlurView>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: 'rgb(18, 18, 18)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  swiperContainer: { flex: 1, zIndex: 1 },
  swiperRoot: { backgroundColor: 'transparent' },
  card: { width: width, height: height, backgroundColor: '#2C2C2E', overflow: 'hidden', borderRadius: width * 0.09 },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  topGlassTag: { position: 'absolute', bottom: height * 0.23, alignSelf: 'center', zIndex: 10, backgroundColor: 'rgba(12, 12, 12, 0.15)', paddingHorizontal: width * 0.06, paddingVertical: height * 0.012, borderRadius: 100, overflow: 'hidden' },
  tagText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  fixedBuyNowWrapper: { position: 'absolute', bottom: height * 0.15, alignSelf: 'center', zIndex: 20 },
  fixedCloseWrapper: { position: 'absolute', bottom: height * 0.15, left: width * 0.12, zIndex: 20 },
  fixedHeartWrapper: { position: 'absolute', bottom: height * 0.15, right: width * 0.12, zIndex: 20 },
  buyNowGlassButton: { backgroundColor: 'rgba(12, 12, 12, 0.25)', paddingHorizontal: width * 0.1, paddingVertical: height * 0.018, borderRadius: width * 0.09, overflow: 'hidden' },
  buyNowText: { color: '#FFFFFF', fontSize: Math.max(14, width * 0.045), fontWeight: '600' },
  svgContainer: { position: 'absolute' },
  iconOverlay: { width: buttonSize, height: buttonSize, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#888', marginTop: height * 0.012, fontSize: Math.max(14, width * 0.04), marginBottom: height * 0.025 },
  retryButton: { flexDirection: 'row', backgroundColor: '#333', padding: width * 0.03, borderRadius: width * 0.05, alignItems: 'center' },
  retryText: { color: 'white', fontWeight: '500', fontSize: Math.max(12, width * 0.035) },
});