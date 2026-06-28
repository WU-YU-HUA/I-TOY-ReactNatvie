import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Easing,
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
import TextTicker from 'react-native-text-ticker';

import CategoryFilterPicker from '../components/FilterButton';
import { useAppContext } from '../context/AppContext';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND;

// 🌟 限制最大尺寸
const buttonSize = Math.min(Math.round(width * 0.13), 60); 
const filterButtonSize = Math.min(Math.round(width * 0.15), 70); 
const trendingButtonSize = Math.min(Math.round(width * 0.16), 75); 
const spacing = 20;

// 🌟 以畫面中心點為基準，計算四個按鈕的絕對偏移量
const centerX = width / 2;
const innerOffset = Math.min(width * 0.25, 120); 
// 🌟 iPad 防重疊：外側按鈕最大距離加寬到 200
const outerOffset = Math.min(width * 0.42, 200); 

const ReanimatedTouchableOpacity = Reanimated.createAnimatedComponent(TouchableOpacity);
const AnimatedIonicons = Reanimated.createAnimatedComponent(Ionicons);

// --- ZoomableCard 元件 ---
const ZoomableCard = ({ card, setIsZooming, isZoomingAnim, onDoubleTap }) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [currentImgIndex, setCurrentImgIndex] = useState(0);
  
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

  const handleSingleTap = useCallback((side) => {
    if (!card.img || card.img.length <= 1) return;
    if (side === 'right') {
      setCurrentImgIndex((prev) => (prev + 1) % card.img.length);
    } else {
      setCurrentImgIndex((prev) => (prev - 1 + card.img.length) % card.img.length);
    }
  }, [card.img]);

  const singleTapGesture = Gesture.Tap()
    .numberOfTaps(1)
    .onEnd((event) => {
      const side = event.x < width / 2 ? 'left' : 'right';
      runOnJS(handleSingleTap)(side);
    });

  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDistance(30)
    .onEnd((event) => {
      if (onDoubleTap) {
        const side = event.x < width / 2 ? 'left' : 'right';
        runOnJS(onDoubleTap)(side);
      }
    });

  const tapGestures = Gesture.Exclusive(doubleTapGesture, singleTapGesture);
  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, tapGestures);

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

  const currentImageUri = card.img[currentImgIndex] || card.img[0];

  return (
    <View style={styles.card}>
      <GestureDetector gesture={composedGesture}>
        <Reanimated.View style={[{ flex: 1, borderRadius: Math.min(width * 0.09, 40), overflow: 'hidden', justifyContent: 'center' }, animatedStyle]}>
          <Image source={{ uri: currentImageUri }} style={[StyleSheet.absoluteFillObject, { resizeMode: 'cover' }]} />
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />
          <View 
            style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0, 0, 0, 0.4)' }]} 
          />

          <View style={styles.contentContainer}>
            {card.img && card.img.length > 1 && (
              <View style={styles.paginationContainer}>
                {card.img.map((_, idx) => (
                  <View key={idx} style={[styles.paginationDot, currentImgIndex === idx ? styles.paginationDotActive : styles.paginationDotInactive]} />
                ))}
              </View>
            )}

            <Image source={{ uri: currentImageUri }} style={styles.cardImage} />
            
            {!!card.tag && (
              <Reanimated.View style={[styles.tagWrapper, tagAnimatedStyle]}>
                <TextTicker
                  style={styles.tagText}
                  duration={10000}        
                  loop={true}            
                  bounce={false}          
                  repeatSpacer={50}       
                  marqueeDelay={3000}     
                  easing={Easing.linear}
                >
                  {card.tag}
                </TextTicker>
              </Reanimated.View>
            )}
          </View>
        </Reanimated.View>
      </GestureDetector>
    </View>
  );
};

export default function DiscoverScreen({ onSave }) {
  
  const { 
    cards, 
    setCards, 
    currentIndex, 
    setCurrentIndex, 
    reFetch, 
    setReFetch,
    categories,
    selectedCategoryPaths,
    toggleCategoryPath,
    setSelectedCategoryPaths 
  } = useAppContext();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSwipedAll, setIsSwipedAll] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [isDescVisible, setIsDescVisible] = useState(false);

  const swiperRef = useRef(null);
  const swipeX = useSharedValue(0);
  const isButtonPressed = useRef(false);
  const lockTimeout = useRef(null);
  const isZoomingAnim = useSharedValue(0);

  const fetchData = async () => {
    setIsLoading(true);
    setIsSwipedAll(false);
    
    try {
      const params = new URLSearchParams();
      if (selectedCategoryPaths && selectedCategoryPaths.length > 0) {
        selectedCategoryPaths.forEach(path => params.append('categories', path));
      }

      const url = `${API_URL}/api/firebase/datas/?${params.toString()}`;
      
      const response = await fetch(url);
      const json = await response.json();

      const formData = json.map(item => ({
        id: item.asin,
        url: item.affiliate_url,
        img: Array.isArray(item.img) ? item.img : [item.img], 
        tag: item.tag,
        price: item.price,
        description: item.description,
        category: item.category,
        choice: item.choice,
        on_sale: item.on_sale,
        updated: item.updated
      }));
      
      setCards(formData);
      setCurrentIndex(0);

    } catch (error) {
      console.error("❌ [fetchData] 請求失敗，錯誤訊息:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFilters = (newPaths) => {
    if (setSelectedCategoryPaths) {
      setSelectedCategoryPaths(newPaths);
    } else if (toggleCategoryPath) {
      const toAdd = newPaths.filter(p => !selectedCategoryPaths.includes(p));
      const toRemove = selectedCategoryPaths.filter(p => !newPaths.includes(p));
      [...toAdd, ...toRemove].forEach(path => toggleCategoryPath(path));
    }
    setCurrentIndex(0);
    setReFetch(true); 
  };

  useFocusEffect(
    useCallback(() => {
      if (reFetch) {
        fetchData();
        setReFetch(false); 
      }
      return () => {
        setIsDescVisible(false);
      };
    }, [reFetch, selectedCategoryPaths]) 
  );

  useEffect(() => {
    if ((!cards || cards.length === 0) && !isSwipedAll) {
      fetchData(); 
    }
  }, []);

  const uiAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - isZoomingAnim.value,
  }));

  const xButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(swipeX.value, [-150, 0], [1.3, 1.0], 'clamp') }],
    backgroundColor: interpolateColor(swipeX.value, [-150, 0], ['rgb(255, 59, 48)', 'rgb(12, 12, 12)'])
  }));

  const xIconStyle = useAnimatedStyle(() => ({
    color: interpolateColor(swipeX.value, [-150, 0], ['#000000', 'rgb(255, 59, 48)'])
  }));

  const heartButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(swipeX.value, [0, 150], [1.0, 1.3], 'clamp') }],
    backgroundColor: interpolateColor(swipeX.value, [0, 150], ['rgb(12, 12, 12)', 'rgb(0, 255, 255)'])
  }));

  const heartIconStyle = useAnimatedStyle(() => ({
    color: interpolateColor(swipeX.value, [0, 150], ['rgb(0, 255, 255)', '#000000'])
  }));

  const like_item = async (id) =>{
    if (!id) return;
    try{
      const url = `${API_URL}/api/firebase/like/${id}/`
      await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    } catch(error){
      console.error("Like Error:", error);
    }
  }

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

  const handleDoubleTap = (side) => {
    if (side === 'left') handlePressCross();
    else handlePressHeart();
  };

  const handleShare = async () => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;
    try {
      await Share.share({
        message: `快來看看這個酷東西：${currentCard.tag || '推薦商品'}！\n\n購買連結：${currentCard.url}`,
        url: currentCard.url,
        title: currentCard.tag || '商品分享'
      });
    } catch (error) {
      console.error('分享發生錯誤:', error.message);
    }
  };

  const handleGoBack = () => {
    if (currentIndex > 0) {
      const newIndex = Math.max(0, currentIndex - 1);
      setCurrentIndex(newIndex);
      swiperRef.current?.jumpToCardIndex?.(newIndex); 
    }
  };

if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#EA80FC" />
      </View>
    );
  }

  if (!cards || currentIndex >= cards.length || isSwipedAll) {
    return (
      <View style={[styles.screenContainer, styles.center]}>
        <Ionicons name="layers-outline" size={width * 0.15} color="#666" />
        <Text style={styles.errorText}>{(!cards || cards.length === 0) ? '目前沒有商品資料' : '商品已瀏覽完畢'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
          <Text style={styles.retryText}>重新載入</Text>
          <Ionicons name="refresh" size={width * 0.045} color="white" style={{ marginLeft: 5 }} />
        </TouchableOpacity>

        <View style={styles.staticFilterWrapper}>
          <CategoryFilterPicker 
            data={categories} 
            selectedPaths={selectedCategoryPaths} 
            onSave={handleSaveFilters} 
            customTrigger={
              <View style={styles.filterCircleButton}>
                <Ionicons name="filter" size={28} color="#FFF" />
                <Text style={styles.filterCircleText}>Filter</Text>
              </View>
            }
          />
        </View>
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
            onSwipedRight={(idx) => {
              const item = cards[idx];
              if (item){
                onSave(item);
                like_item(item.id);
              }
            }}
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
          <View style={styles.headerInteractiveContainer} pointerEvents="box-none">
            <View style={styles.headerRow}>
              <Text style={styles.savedTitle}>Explore</Text>
            </View>
          </View>

          <ReanimatedTouchableOpacity style={[styles.fixedHeartWrapper, heartButtonStyle]} onPress={handlePressHeart}>
            <AnimatedIonicons name="heart-outline" size={buttonSize * 0.6} style={heartIconStyle} />
          </ReanimatedTouchableOpacity>

          <TouchableOpacity style={styles.fixedShareWrapper} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={buttonSize * 0.6} color="#00ff77" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.fixedUpWrapper} onPress={() => setIsDescVisible(!isDescVisible)}>
              <Ionicons name={isDescVisible ? 'chevron-down' : 'chevron-up'} size={filterButtonSize * 0.6} color="#FFFFFF" />
              <Text style={styles.filterCircleText}>{isDescVisible ? 'CLOSE' : 'INFO'}</Text>
          </TouchableOpacity>

          <View style={styles.staticFilterWrapper}>
            <CategoryFilterPicker 
              data={categories} 
              selectedPaths={selectedCategoryPaths} 
              onSave={handleSaveFilters}
              customTrigger={
                <View style={styles.filterCircleButton}>
                  <Ionicons name="filter" size={filterButtonSize * 0.4} color="#FFF" />
                  <Text style={styles.filterCircleText}>Filter</Text>
                </View>
              }
            />
          </View>

          <TouchableOpacity style={[styles.fixedBackWrapper, { transform: [{ scaleX: -1 }] }]} onPress={handleGoBack}>
              <Ionicons name="refresh-outline" size={buttonSize * 0.5} color="#ffe100"/>
          </TouchableOpacity>

          <ReanimatedTouchableOpacity style={[styles.fixedCloseWrapper, xButtonStyle]} onPress={handlePressCross}>
            <AnimatedIonicons name="close" size={buttonSize * 0.6} style={xIconStyle} />
          </ReanimatedTouchableOpacity>

          <TouchableOpacity
            onPress={() => cards[currentIndex] && Linking.openURL(cards[currentIndex].url)}
            style={styles.fixedBuyNowWrapper}
          >
          {cards[currentIndex]?.on_sale && (
            <View style={styles.saleTagContainer}>
              <View style={styles.saleTagBody}>
                <Text style={styles.saleTagText}>SALE</Text>
                <View style={styles.saleTagHole} />
              </View>
              <View style={styles.saleTagPoint} />
            </View>
          )}

            <View style={styles.buyNowSolidButton}>
              <Text style={styles.buyNowText}>
                {cards[currentIndex]?.price ? `$${Number(cards[currentIndex].price).toLocaleString()}` : 'Buy Now'}
              </Text>
              
              {cards[currentIndex]?.price && cards[currentIndex]?.updated && (
                <Text style={styles.updatedText}>
                  {cards[currentIndex].updated}
                </Text>
              )}
            </View>
          </TouchableOpacity>
          {/* <View style={styles.fixedAmazonContainer}>
            <Text style={styles.AmazonText}>As an Amazon Associate I earn from qualifying purchases.</Text>
          </View> */}
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
  card: { width: width, height: height, backgroundColor: '#2C2C2E', borderRadius: Math.min(width * 0.09, 40), overflow: 'hidden' },

  headerInteractiveContainer: {
    position: 'absolute', top: 0, width: '100%', zIndex: 30, 
    paddingTop: height * 0.08, paddingHorizontal: 25, backgroundColor: 'rgba(18, 18, 18, 1)', paddingBottom: 10,
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  savedTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  
  contentContainer: { flex: 1, justifyContent: 'flex-start', alignItems: 'center', width: '100%', paddingTop: height * 0.15 },
  paginationContainer: { position: 'absolute', top: height * 0.18 + 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: Math.min(width * 0.5, 200), alignSelf: 'center', zIndex: 10, gap: 6 },
  paginationDot: { width: 12, height: 4, borderRadius: 2 },
  paginationDotActive: { backgroundColor: 'white' },
  paginationDotInactive: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  
  cardImage: { width: '100%', height: height * 0.55, resizeMode: 'contain' },
  tagWrapper: { marginTop: 12, paddingHorizontal: 15, width: '100%', alignItems: 'center' },
  tagText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16, textAlign: 'center', textShadowColor: 'rgba(0, 0, 0, 0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },

  fixedBuyNowWrapper: { position: 'absolute', bottom: height * 0.14, alignSelf: 'center', zIndex: 20 },
  
  fixedCloseWrapper: { position: 'absolute', bottom: height * 0.14, left: centerX - innerOffset - (buttonSize / 2), zIndex: 20, width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2, justifyContent: 'center', alignItems: 'center' },
  fixedHeartWrapper: { position: 'absolute', bottom: height * 0.14, left: centerX + innerOffset - (buttonSize / 2), zIndex: 20, width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2, justifyContent: 'center', alignItems: 'center' },
  
  fixedBackWrapper: { position: 'absolute', bottom: height * 0.14, left: centerX - outerOffset - (buttonSize / 2), zIndex: 20, width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(12, 12, 12, 0.9)' },
  fixedShareWrapper: { position: 'absolute', bottom: height * 0.14, left: centerX + outerOffset - (buttonSize / 2), zIndex: 20, width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(12, 12, 12, 0.9)' },
  
  // 🌟 INFO 按鈕：定在螢幕底部 32% 高度處 (確保在圖片下方 padding 的空間裡)
  fixedUpWrapper: { 
    position: 'absolute', 
    bottom: height * 0.32, 
    right: width * 0.02, 
    zIndex: 20, 
    width: filterButtonSize, 
    height: filterButtonSize, 
    borderRadius: filterButtonSize / 2, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(51, 51, 51, 1)', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  },

  buyNowSolidButton: { 
    backgroundColor: 'rgb(12, 12, 12)', 
    paddingHorizontal: Math.min(width * 0.05, 30), 
    paddingVertical: height * 0.015, 
    borderRadius: Math.min(width * 0.09, 40),
    alignItems: 'center',
    justifyContent: 'center'
  },
  buyNowText: { color: '#FFFFFF', fontSize: Math.min(Math.max(14, width * 0.045), 20), fontWeight: '500', letterSpacing: 0.7 },
  
  updatedText: {
    color: '#888888',
    fontSize: 10,
    marginTop: 2,
  },
  
  saleTagContainer: {
    position: 'absolute',
    top: -5,
    left: -30, 
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ rotate: '18deg' }],
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 5,
  },
  saleTagPoint: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 9, 
    borderTopWidth: 9, 
    borderBottomWidth: 9, 
    borderLeftColor: '#E62A2A', 
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  saleTagBody: {
    backgroundColor: '#E62A2A',
    height: 18, 
    justifyContent: 'center',
    paddingLeft: 6, 
    paddingRight: 3, 
    borderTopLeftRadius: 4, 
    borderBottomLeftRadius: 4, 
    borderTopRightRadius: 0, 
    borderBottomRightRadius: 0, 
    flexDirection: 'row',
    alignItems: 'center',
  },
  saleTagHole: {
    width: 3, 
    height: 3, 
    backgroundColor: '#FFF',
    borderRadius: 2, 
    marginLeft: 4, 
  },
  saleTagText: {
    color: '#FFFFFF',
    fontSize: 8, 
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  errorText: { color: '#888', marginTop: 10, fontSize: 16, marginBottom: 20 },
  retryButton: { flexDirection: 'row', backgroundColor: '#333', padding: 12, borderRadius: 20, alignItems: 'center' },
  retryText: { color: 'white', fontWeight: '500' },

  // 🌟 Filter 按鈕：疊加在 INFO 的上方
  staticFilterWrapper: {
    position: 'absolute',
    bottom: height * 0.32 + filterButtonSize + 15, 
    right: width * 0.02, 
    zIndex: 90,
  },
  filterCircleButton: {
    width: filterButtonSize,
    height: filterButtonSize,
    borderRadius: filterButtonSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(51, 51, 51, 1)', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  },
  filterCircleText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: -2,
  },
  fixedAmazonContainer: {
    position: 'absolute',
    bottom: height * 0.14 - 30, 
    alignSelf: 'center', 
    zIndex: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  AmazonText: {
    color: '#fcfcfc',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});