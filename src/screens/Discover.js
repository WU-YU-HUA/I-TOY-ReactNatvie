import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated, // 確保載入 React Native 內建的 Animated
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
import Reanimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND;

const buttonSize = Math.round(width * 0.13); 
const strokeWidth = 1; 
const circleRadius = (buttonSize - strokeWidth) / 2;
const centerCoord = buttonSize / 2;

// --- 關鍵修正區 ---
const RNAnimatedCircle = Animated.createAnimatedComponent(Circle);
const RNAnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const SvgGlassCircle = ({ animatedFillStyle }) => (
  <Svg height={buttonSize} width={buttonSize} style={styles.svgContainer}>
    <RNAnimatedCircle
      cx={centerCoord}
      cy={centerCoord}
      r={circleRadius}
      stroke="rgba(255, 255, 255, 0.1)" 
      strokeWidth={strokeWidth}
      style={animatedFillStyle} 
    />
  </Svg>
);

// --- 核心：Reanimated 高效能縮放卡片 ---
const ZoomableCard = ({ card, setIsZooming }) => {
  const scale = useSharedValue(1);

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      runOnJS(setIsZooming)(true); 
    })
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(event.scale, 3.5));
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 15 });
      runOnJS(setIsZooming)(false); 
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.card}>
      <GestureDetector gesture={pinchGesture}>
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
  
  const swipeX = useRef(new Animated.Value(0)).current;

  const xButtonScale = swipeX.interpolate({ inputRange: [-150, 0], outputRange: [1.5, 1], extrapolate: 'clamp' });
  const xButtonFill = swipeX.interpolate({ inputRange: [-150, 0], outputRange: ['rgba(255, 0, 0, 0.7)', 'rgba(0, 0, 0, 0.55)'], extrapolate: 'clamp' });
  const heartButtonScale = swipeX.interpolate({ inputRange: [0, 150], outputRange: [1, 1.5], extrapolate: 'clamp' });
  const heartButtonFill = swipeX.interpolate({ inputRange: [0, 150], outputRange: ['rgba(0, 0, 0, 0.55)', 'rgba(234, 128, 252, 0.9)'], extrapolate: 'clamp' });

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
    swipeX.setValue(0);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EA80FC" />
      </View>
    );
  }

  // --- 補回這裡：沒有卡片時的 Reload 畫面 ---
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
            onSwiping={(x) => swipeX.setValue(x)}
            onSwipedAborted={() => {
              Animated.spring(swipeX, { toValue: 0, speed: 40, bounciness: 2, useNativeDriver: false }).start();
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

        <RNAnimatedTouchableOpacity 
          style={[styles.fixedCloseWrapper, { transform: [{ scale: xButtonScale }] }]}
          onPress={() => swiperRef.current?.swipeLeft()}
        >
          <SvgGlassCircle animatedFillStyle={{ fill: xButtonFill }} />
          <View style={styles.iconOverlay}>
            <Ionicons name="close" size={width * 0.08} color="#FFFFFF" />
          </View>
        </RNAnimatedTouchableOpacity>
        
        <RNAnimatedTouchableOpacity 
          style={[styles.fixedHeartWrapper, { transform: [{ scale: heartButtonScale }] }]}
          onPress={() => swiperRef.current?.swipeRight()}
        >
          <SvgGlassCircle animatedFillStyle={{ fill: heartButtonFill }} />
          <View style={styles.iconOverlay}>
            <Ionicons name="heart-outline" size={width * 0.075} color="white" />
          </View>
        </RNAnimatedTouchableOpacity>

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
  screenContainer: { flex: 1, backgroundColor: '#121212' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  swiperContainer: { flex: 1, zIndex: 1 },
  swiperRoot: { backgroundColor: 'transparent' },
  card: { width: width, height: height, backgroundColor: '#2C2C2E', overflow: 'hidden', borderRadius: width * 0.09 },
  cardImage: { flex: 1, width: '100%', height: '100%', resizeMode: 'cover' },
  topGlassTag: {
    position: 'absolute', top: height * 0.15, alignSelf: 'center', zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.15)', paddingHorizontal: width * 0.06,
    paddingVertical: height * 0.012, borderRadius: 100, overflow: 'hidden'
  },
  tagText: { color: '#FFFFFF', fontWeight: '600', fontSize: Math.max(11, width * 0.033) },
  fixedBuyNowWrapper: { position: 'absolute', bottom: height * 0.18, alignSelf: 'center', zIndex: 20 },
  fixedCloseWrapper: { position: 'absolute', bottom: height * 0.18, left: width * 0.12, zIndex: 20 },
  fixedHeartWrapper: { position: 'absolute', bottom: height * 0.18, right: width * 0.12, zIndex: 20 },
  buyNowGlassButton: { backgroundColor: 'rgba(0, 0, 0, 0.25)', paddingHorizontal: width * 0.1, paddingVertical: height * 0.018, borderRadius: width * 0.09, overflow: 'hidden' },
  buyNowText: { color: '#FFFFFF', fontSize: Math.max(14, width * 0.045), fontWeight: '600' },
  svgContainer: { position: 'absolute' },
  iconOverlay: { width: buttonSize, height: buttonSize, justifyContent: 'center', alignItems: 'center' },
  
  // --- 補回這裡：Reload 畫面的樣式 ---
  errorText: { color: '#888', marginTop: height * 0.012, fontSize: Math.max(14, width * 0.04), marginBottom: height * 0.025 },
  retryButton: { flexDirection: 'row', backgroundColor: '#333', padding: width * 0.03, borderRadius: width * 0.05, alignItems: 'center' },
  retryText: { color: 'white', fontWeight: '500', fontSize: Math.max(12, width * 0.035) },
});