import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Swiper from 'react-native-deck-swiper';
import DescriptionPanel from './Description';

import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, {
  interpolate,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND;
const buttonSize = Math.round(width * 0.13);

const ReanimatedTouchableOpacity = Reanimated.createAnimatedComponent(TouchableOpacity);

const ZoomableCard = ({ card, setIsZooming, isZoomingAnim, onDoubleTap }) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const springConfig = { damping: 25, stiffness: 500, overshootClamping: true };

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      isZoomingAnim.value = withTiming(1, { duration: 150 });
      runOnJS(setIsZooming)(true);
    })
    .onUpdate((event) => {
      scale.value = Math.max(1, Math.min(event.scale, 3.5));
    })
    .onEnd(() => {
      scale.value = withSpring(1, springConfig);
      translateX.value = withSpring(0, springConfig);
      translateY.value = withSpring(0, springConfig);
      isZoomingAnim.value = withTiming(0, { duration: 150 });
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

  // 修改雙擊邏輯：判斷點擊位置
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDistance(30)
    .onEnd((event) => {
      if (onDoubleTap) {
        // 如果點擊位置在螢幕寬度的一半左邊，傳回 'left'，否則 'right'
        const side = event.x < width / 2 ? 'left' : 'right';
        runOnJS(onDoubleTap)(side);
      }
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value }
    ],
  }));

  const tagAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - isZoomingAnim.value,
  }));

  return (
    <View style={styles.card}>
      <GestureDetector gesture={composedGesture}>
        <Reanimated.View style={[{ flex: 1, borderRadius: width * 0.09, overflow: 'hidden', justifyContent: 'center' }, animatedStyle]}>

          <Image
            source={{ uri: card.img }}
            style={[StyleSheet.absoluteFillObject, { resizeMode: 'cover' }]}
          />
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />

          <View style={styles.contentContainer}>
            <Image source={{ uri: card.img }} style={styles.cardImage} />

            {!!card.tag && (
              <Reanimated.View style={[styles.tagWrapper, tagAnimatedStyle]}>
                <Text numberOfLines={1} style={styles.tagText}>
                  {card.tag}
                </Text>
              </Reanimated.View>
            )}
          </View>

        </Reanimated.View>
      </GestureDetector>
    </View>
  );
};

export default function DiscoverScreen({ onSave, cards, setCards, currentIndex, setCurrentIndex, selectedBrands }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSwipedAll, setIsSwipedAll] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [isDescVisible, setIsDescVisible] = useState(false);
  const swiperRef = useRef(null);

  const swipeX = useSharedValue(0);
  const isButtonPressed = useRef(false);
  const lockTimeout = useRef(null);
  const isZoomingAnim = useSharedValue(0);

  const uiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - isZoomingAnim.value,
  }));

  const xButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(swipeX.value, [-150, 0], [1.5, 1.0], 'clamp') }],
    backgroundColor: interpolateColor(
      swipeX.value,
      [-150, 0],
      ['rgb(255, 59, 48)', 'rgb(12, 12, 12)']
    )
  }));

  const heartButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(swipeX.value, [0, 150], [1.0, 1.5], 'clamp') }],
    backgroundColor: interpolateColor(
      swipeX.value,
      [0, 150],
      ['rgb(12, 12, 12)', 'rgb(234, 128, 252)']
    )
  }));

  const fetchData = async () => {
    setIsLoading(true);
    setIsSwipedAll(false);
    try {
      const params = new URLSearchParams();
      if (selectedBrands?.size > 0) {
        selectedBrands.forEach(brand => params.append('brands', brand));
      }
      const url = `${API_URL}/api/firebase/datas/?${params.toString()}`;
      const response = await fetch(url);
      const json = await response.json();

      const formData = json.map(item => ({
        id: item.origin_url,
        url: item.shopee_url,
        img: item.img,
        tag: item.tag,
        description: item.description,
      }));

      setCards(formData);
      setCurrentIndex(0);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (cards.length === 0 && !isSwipedAll) fetchData();
  }, []);

  const handleSwiped = (cardIndex) => {
    setCurrentIndex(cardIndex + 1);
    if (!isButtonPressed.current) swipeX.value = 0;
  };

  const handlePressCross = () => {
    if (isButtonPressed.current) return;
    isButtonPressed.current = true;
    if (lockTimeout.current) clearTimeout(lockTimeout.current);
    lockTimeout.current = setTimeout(() => { isButtonPressed.current = false; }, 300);

    swipeX.value = withSequence(withTiming(-150, { duration: 150 }), withTiming(0, { duration: 150 }));
    setTimeout(() => swiperRef.current?.swipeLeft(), 20);
  };

  const handlePressHeart = () => {
    if (isButtonPressed.current) return;
    isButtonPressed.current = true;
    if (lockTimeout.current) clearTimeout(lockTimeout.current);
    lockTimeout.current = setTimeout(() => { isButtonPressed.current = false; }, 300);

    swipeX.value = withSequence(withTiming(150, { duration: 150 }), withTiming(0, { duration: 150 }));
    setTimeout(() => swiperRef.current?.swipeRight(), 20);
  };

  // 處理雙擊分流邏輯
  const handleDoubleTap = (side) => {
    if (side === 'left') {
      handlePressCross();
    } else {
      handlePressHeart();
    }
  };

  // Share Button
  const handleShare = async () => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    try {
      await Share.share({
        // iOS 和 Android 共通：設定你要分享的文字和網址
        message: `快來看看這個酷東西：${currentCard.tag || '推薦商品'}！\n\n購買連結：${currentCard.url}`,
        // iOS 專用：如果加上 url 屬性，iOS 分享面板有時候能抓到比較好看的預覽
        url: currentCard.url,
        title: currentCard.tag || '商品分享'
      });
    } catch (error) {
      console.error('分享發生錯誤:', error.message);
    }
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
        <Text style={styles.errorText}>{cards.length === 0 ? '目前沒有商品資料' : '商品已瀏覽完畢'}</Text>
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
            onSwiping={(x) => { if (!isButtonPressed.current) swipeX.value = x; }}
            onSwipedAborted={() => { if (!isButtonPressed.current) swipeX.value = withSpring(0); }}
            horizontalSwipe={!isZooming}
            stackSize={2}
            stackScale={0}
            stackSeparation={0}
            animateCardOpacity={false}
            backgroundColor={'transparent'}
            cardVerticalMargin={0}
            cardHorizontalMargin={0}
            containerStyle={styles.swiperRoot}
            disableTopSwipe
            disableBottomSwipe
            renderCard={(card) => card ? (
              <ZoomableCard
                card={card}
                setIsZooming={setIsZooming}
                isZoomingAnim={isZoomingAnim}
                onDoubleTap={handleDoubleTap}
              />
            ) : null}
          />
        </View>

        <Reanimated.View style={[StyleSheet.absoluteFill, uiAnimatedStyle, { zIndex: 20 }]} pointerEvents="box-none">
          <TouchableOpacity style={styles.fixedUpWrapper} onPress={() => setIsDescVisible(true)}>
            <Ionicons name="chevron-up" size={width * 0.08} color="#FFFFFF" />
          </TouchableOpacity>

          <ReanimatedTouchableOpacity style={[styles.fixedCloseWrapper, xButtonStyle]} onPress={handlePressCross}>
            <Ionicons name="close" size={width * 0.08} color="#FFFFFF" />
          </ReanimatedTouchableOpacity>

          <TouchableOpacity style={styles.fixedShareWrapper} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={width * 0.08} color="#FFFFFF" />
          </TouchableOpacity>

          <ReanimatedTouchableOpacity style={[styles.fixedHeartWrapper, heartButtonStyle]} onPress={handlePressHeart}>
            <Ionicons name="heart-outline" size={width * 0.08} color="#FFFFFF" />
          </ReanimatedTouchableOpacity>

          <TouchableOpacity
            onPress={() => cards[currentIndex] && Linking.openURL(cards[currentIndex].url)}
            style={styles.fixedBuyNowWrapper}
          >
            <View style={styles.buyNowSolidButton}>
              <Text style={styles.buyNowText}>馬上購買</Text>
            </View>
          </TouchableOpacity>
        </Reanimated.View>

        <DescriptionPanel 
          visible={isDescVisible} 
          onClose={() => setIsDescVisible(false)} 
          description={cards[currentIndex]?.description} 
        />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: 'rgb(18, 18, 18)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  swiperContainer: { flex: 1, zIndex: 1 },
  swiperRoot: { backgroundColor: 'transparent' },
  card: { width: width, height: height, backgroundColor: '#2C2C2E', borderRadius: width * 0.09, overflow: 'hidden' },

  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingTop: height * 0.22
  },

  cardImage: {
    width: width,
    aspectRatio: 1,
    maxHeight: height * 0.6,
    resizeMode: 'contain'
  },

  tagWrapper: {
    marginTop: 12,
    paddingHorizontal: 15,
    width: '100%',
    alignItems: 'center'
  },

  tagText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },

  fixedBuyNowWrapper: { position: 'absolute', bottom: height * 0.15, alignSelf: 'center', zIndex: 20 },
  fixedCloseWrapper: { position: 'absolute', bottom: height * 0.15, left: width * 0.12, zIndex: 20, width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2, justifyContent: 'center', alignItems: 'center' },
  fixedHeartWrapper: { position: 'absolute', bottom: height * 0.15, right: width * 0.12, zIndex: 20, width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2, justifyContent: 'center', alignItems: 'center' },
  fixedUpWrapper: { position: 'absolute', bottom: height * 0.15 + buttonSize + 10, left: width * 0.12, zIndex: 20, width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(12, 12, 12)' },
  fixedShareWrapper: { position: 'absolute', bottom: height * 0.15 + buttonSize + 10, right: width * 0.12, zIndex: 20, width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgb(12, 12, 12)' },

  buyNowSolidButton: { backgroundColor: 'rgb(12, 12, 12)', paddingHorizontal: width * 0.1, paddingVertical: height * 0.018, borderRadius: width * 0.09 },
  buyNowText: { color: '#FFFFFF', fontSize: Math.max(14, width * 0.045), fontWeight: '500' },

  errorText: { color: '#888', marginTop: 10, fontSize: 16, marginBottom: 20 },
  retryButton: { flexDirection: 'row', backgroundColor: '#333', padding: 12, borderRadius: 20, alignItems: 'center' },
  retryText: { color: 'white', fontWeight: '500' },
});