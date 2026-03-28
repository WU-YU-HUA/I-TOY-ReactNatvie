import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Linking,
  Platform,
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

import { Image as ExpoImage } from 'expo-image';
import { useAppContext } from '../context/AppContext';

const { width, height } = Dimensions.get('window');
const API_URL = process.env.EXPO_PUBLIC_BACKEND;
const buttonSize = Math.round(width * 0.13);
const spacing = 20;

const ReanimatedTouchableOpacity = Reanimated.createAnimatedComponent(TouchableOpacity);
const AnimatedIonicons = Reanimated.createAnimatedComponent(Ionicons);

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
        <Reanimated.View style={[{ flex: 1, borderRadius: width * 0.09, overflow: 'hidden', justifyContent: 'center' }, animatedStyle]}>
          <Image
            source={{ uri: currentImageUri }}
            style={[StyleSheet.absoluteFillObject, { resizeMode: 'cover' }]}
          />
          <BlurView intensity={100} tint="dark" style={StyleSheet.absoluteFillObject} />

          <View style={styles.contentContainer}>
            {card.img && card.img.length > 1 && (
              <View style={styles.paginationContainer}>
                {card.img.map((_, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.paginationDot,
                      currentImgIndex === idx ? styles.paginationDotActive : styles.paginationDotInactive
                    ]}
                  />
                ))}
              </View>
            )}

            <Image source={{ uri: currentImageUri }} style={styles.cardImage} />
            
            {!!card.icon && (
              <Reanimated.View style={[styles.brandIconWrapper, tagAnimatedStyle]}>
                <ExpoImage 
                  source={{ uri: card.icon }} 
                  style={styles.brandIcon} 
                  cachePolicy="disk"
                  contentFit="cover"
                  transition={200}
                />
              </Reanimated.View>
            )}
            
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
  // --- 取出定義好的清單 ---
  const { 
    reFetch, setReFetch, 
    selectedCategories, selectedStyles, 
    toggleCategory, toggleStyle,
    FILTER_CATEGORY_OPTIONS, FILTER_STYLE_OPTIONS
  } = useAppContext(); 
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSwipedAll, setIsSwipedAll] = useState(false);
  const [isZooming, setIsZooming] = useState(false);
  const [isDescVisible, setIsDescVisible] = useState(false);
  
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

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
      if (selectedBrands?.size > 0) {
        selectedBrands.forEach(brand => params.append('brands', brand));
      }
      if (selectedCategories.length > 0) {
        selectedCategories.forEach(cat => params.append('categories', cat));
      }
      if (selectedStyles.length > 0) {
        selectedStyles.forEach(style => params.append('styles', style));
      }
      
      const url = `${API_URL}/api/firebase/datas/?${params.toString()}`;
      const response = await fetch(url);
      const json = await response.json();

      const formData = json.map(item => ({
        id: item.id,
        url: item.shopee_url,
        img: Array.isArray(item.img) ? item.img : [item.img], 
        tag: item.tag,
        price: item.price,
        description: item.description,
        category: item.category,
        style: item.style,
        brand: item.brand,
        icon: item.brand_icon
      }));
      
      const currentCard = cards[currentIndex];

      if (currentCard && (selectedBrands.size === 0 || selectedBrands.has(currentCard.brand))) {
        const filteredFormData = formData.filter(item => item.id !== currentCard.id);
        setCards([currentCard, ...filteredFormData]);
        setCurrentIndex(0); 
      } else {
        setCards(formData);
        setCurrentIndex(0);
      }

    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (reFetch) {
        fetchData();
        setReFetch(false); 
      }

      return () => {
        setIsDescVisible(false);
        setIsFilterExpanded(false);
      };
    }, [reFetch, selectedBrands, selectedCategories, selectedStyles])
  );

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

  const xIconStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      swipeX.value,
      [-150, 0],
      ['#000000', 'rgb(255, 59, 48)']
    )
  }));

  const heartButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(swipeX.value, [0, 150], [1.0, 1.5], 'clamp') }],
    backgroundColor: interpolateColor(
      swipeX.value,
      [0, 150],
      ['rgb(12, 12, 12)', 'rgb(0, 255, 255)']
    )
  }));

  const heartIconStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      swipeX.value,
      [0, 150],
      ['rgb(0, 255, 255)', '#000000']
    )
  }));

  const like_item = async (id) =>{
    if (!id) return;
    try{
      const url = `${API_URL}/api/firebase/like/${id}/`
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch(error){
      console.error("Like Error:", error);
    }
  }

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

  const handleDoubleTap = (side) => {
    if (side === 'left') {
      handlePressCross();
    } else {
      handlePressHeart();
    }
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
        {isFilterExpanded && (
          <TouchableOpacity 
            style={styles.fullScreenDismiss} 
            activeOpacity={1} 
            onPress={() => setIsFilterExpanded(false)} 
          />
        )}

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
              <Text style={styles.savedTitle}>探索</Text>
              
              <View style={styles.filterGroup}>
                <View style={styles.filterContainer}>
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setIsFilterExpanded(!isFilterExpanded)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.filterText}>篩選</Text>
                    <Ionicons
                      name="filter"
                      size={16}
                      color="rgba(255, 255, 255, 0.6)"
                    />
                  </TouchableOpacity>

                  {isFilterExpanded && (
                    <View style={styles.filterDropdown}>
                      <Text style={styles.dropdownSectionTitle}>分類</Text>
                      {/* --- 改用來自 Context 的常數陣列 --- */}
                      {FILTER_CATEGORY_OPTIONS.map((item) => {
                        const isChecked = selectedCategories.includes(item);
                        return (
                          <TouchableOpacity 
                            key={`cat-${item}`} 
                            style={styles.checkboxRow}
                            onPress={() => toggleCategory(item)}
                          >
                            <Text style={styles.filterOptionText}>{item}</Text>
                            <Ionicons 
                              name={isChecked ? "checkbox" : "square-outline"} 
                              size={18} 
                              color={isChecked ? "#00ffff" : "rgba(255,255,255,0.4)"} 
                            />
                          </TouchableOpacity>
                        );
                      })}

                      <View style={styles.dropdownDivider} />

                      <Text style={styles.dropdownSectionTitle}>風格</Text>
                      {/* --- 改用來自 Context 的常數陣列 --- */}
                      {FILTER_STYLE_OPTIONS.map((item) => {
                        const isChecked = selectedStyles.includes(item);
                        return (
                          <TouchableOpacity 
                            key={`style-${item}`} 
                            style={styles.checkboxRow}
                            onPress={() => toggleStyle(item)}
                          >
                            <Text style={styles.filterOptionText}>{item}</Text>
                            <Ionicons 
                              name={isChecked ? "checkbox" : "square-outline"} 
                              size={18} 
                              color={isChecked ? "#00ffff" : "rgba(255,255,255,0.4)"} 
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>
            </View>

            {cards.length > 0 && (
              <Text style={styles.categorySubtitle}>
                {cards[currentIndex]?.brand || '載入中...'}
              </Text>
            )}
          </View>

          <ReanimatedTouchableOpacity style={[styles.fixedHeartWrapper, heartButtonStyle]} onPress={handlePressHeart}>
            <AnimatedIonicons name="heart-outline" size={width * 0.08} style={heartIconStyle} />
          </ReanimatedTouchableOpacity>

          <TouchableOpacity style={styles.fixedShareWrapper} onPress={handleShare}>
            <Ionicons name="share-social-outline" size={width * 0.08} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.fixedUpWrapper} onPress={() => setIsDescVisible(!isDescVisible)}>
            <Ionicons name={isDescVisible ? 'chevron-down' : 'chevron-up'} size={width * 0.08} color="#FFFFFF" />
          </TouchableOpacity>

          <ReanimatedTouchableOpacity style={[styles.fixedCloseWrapper, xButtonStyle]} onPress={handlePressCross}>
            <AnimatedIonicons name="close" size={width * 0.08} style={xIconStyle} />
          </ReanimatedTouchableOpacity>

          <TouchableOpacity
            onPress={() => cards[currentIndex] && Linking.openURL(cards[currentIndex].url)}
            style={styles.fixedBuyNowWrapper}
          >
            <View style={styles.buyNowSolidButton}>
              <Text style={styles.buyNowText}>
                {cards[currentIndex]?.price 
                  ? `$${Number(cards[currentIndex].price).toLocaleString()}` 
                  : '馬上購買'}
              </Text>
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
  
  fullScreenDismiss: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25, 
    backgroundColor: 'transparent',
  },

  swiperContainer: { flex: 1, zIndex: 1 },
  swiperRoot: { backgroundColor: 'transparent' },
  card: { width: width, height: height, backgroundColor: '#2C2C2E', borderRadius: width * 0.09, overflow: 'hidden' },

  headerInteractiveContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 30, 
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingHorizontal: 25,
    backgroundColor: 'rgba(18, 18, 18, 1)',
    paddingBottom: 15,
  },
  
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  filterGroup: {
    flexDirection: 'row',
  },
  filterContainer: {
    position: 'relative',
    zIndex: 40,
    top: height * 0.005 
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  filterDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 8,
    backgroundColor: 'rgba(28, 28, 30, 0.98)',
    borderRadius: 15,
    paddingVertical: 10,
    width: 140, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dropdownSectionTitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 10,
    marginHorizontal: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  filterOptionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },

  savedTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  categorySubtitle: {
    fontSize: 22,
    color: 'rgb(255,255,255)',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    fontWeight: '700',
    textAlign: 'center',
    bottom: height*0.02
  },

  contentContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    paddingTop: height * 0.18
  },

  paginationContainer: {
    position: 'absolute',
    top: height * 0.15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
    gap: 6
  },
  paginationDot: {
    height: 4,
    borderRadius: 2,
  },
  paginationDotActive: {
    backgroundColor: '#FFFFFF',
    width: 16,
  },
  paginationDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: 8,
  },

  cardImage: {
    width: width,
    aspectRatio: 0.8,
    maxHeight: height * 0.7,
    resizeMode: 'flex'
  },
  
  brandIconWrapper: {
    position: 'absolute',
    bottom: height * 0.26, 
    left: width * 0.03,    
    zIndex: 10,
  },
  brandIcon: {
    width: width * 0.2,            
    height: width * 0.2,            
    borderRadius: width * 0.2 * 0.12,      
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

  fixedBuyNowWrapper: { position: 'absolute', bottom: height * 0.12, alignSelf: 'center', zIndex: 20 },
  fixedCloseWrapper: { position: 'absolute', bottom: height * 0.12, left: width * 0.12, zIndex: 20, width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2, justifyContent: 'center', alignItems: 'center' },

  fixedHeartWrapper: {
    position: 'absolute',
    bottom: height * 0.12,
    right: width * 0.12,
    zIndex: 20,
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fixedShareWrapper: {
    position: 'absolute',
    bottom: height * 0.18 + (buttonSize + spacing) * 2,
    right: width * 0.02,
    zIndex: 20,
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.9)'
  },
  fixedUpWrapper: {
    position: 'absolute',
    bottom: height * 0.18 + buttonSize + spacing,
    right: width * 0.02,
    zIndex: 20,
    width: buttonSize,
    height: buttonSize,
    borderRadius: buttonSize / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(12, 12, 12, 0.9)'
  },

  buyNowSolidButton: { backgroundColor: 'rgb(12, 12, 12)', paddingHorizontal: width * 0.1, paddingVertical: height * 0.018, borderRadius: width * 0.09 },
  buyNowText: { color: '#FFFFFF', fontSize: Math.max(14, width * 0.045), fontWeight: '500' },

  errorText: { color: '#888', marginTop: 10, fontSize: 16, marginBottom: 20 },
  retryButton: { flexDirection: 'row', backgroundColor: '#333', padding: 12, borderRadius: 20, alignItems: 'center' },
  retryText: { color: 'white', fontWeight: '500' },
});