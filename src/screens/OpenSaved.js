import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React, { useEffect, useLayoutEffect, useState } from 'react';
import { Dimensions, Image, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
const buttonSize = Math.round(width * 0.13); 
const GAP = width*0.1 // 🌟 卡片之間的黑色間距寬度

const ZoomableCard = ({ card, setIsZooming, screenAnim, isZoomingAnim, isActive }) => {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const springConfig = { damping: 25, stiffness: 100, overshootClamping: true}; // overshootClamping: true 過於回彈問題

  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      if (isZoomingAnim) isZoomingAnim.value = withTiming(1, { duration: 150 }); 
      if (setIsZooming) runOnJS(setIsZooming)(true);
    })
    .onUpdate((event) => { scale.value = Math.max(1, Math.min(event.scale, 3.5)); })
    .onEnd(() => {
      scale.value = withSpring(1, springConfig);
      translateX.value = withSpring(0, springConfig);
      translateY.value = withSpring(0, springConfig);
      if (isZoomingAnim) isZoomingAnim.value = withTiming(0, { duration: 150 }); 
      if (setIsZooming) runOnJS(setIsZooming)(false); 
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
    transform: [ { translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value } ],
  }));

  const tagAnimatedStyle = useAnimatedStyle(() => {
    if (!isActive || !screenAnim || !isZoomingAnim) return { opacity: 1 };
    const isVisible = screenAnim.value > 0.95 ? 1 : 0;
    return { opacity: isVisible * (1 - isZoomingAnim.value) };
  });

  const content = (
    <View style={styles.card}>
      <Reanimated.View style={[{ flex: 1, borderRadius: width * 0.09, overflow: 'hidden' }, isActive ? animatedStyle : {}]}>
        <Image source={{ uri: card.img }} style={styles.cardImage} />
      </Reanimated.View>
      
      {!!card.tag && (
        <Reanimated.View style={[StyleSheet.absoluteFill, tagAnimatedStyle]} pointerEvents="box-none">
          <BlurView intensity={50} tint="dark" style={styles.topGlassTag}>
            <Text style={styles.tagText}>{card.tag}</Text>
          </BlurView>
        </Reanimated.View>
      )}
    </View>
  );

  return isActive ? (
    <GestureDetector gesture={composedGesture}>{content}</GestureDetector>
  ) : (
    content
  );
};

export default function OpenSaved({ itemData, prevItemData, nextItemData, onClose, originLayout, onRemoveSaved, onSave, onNext, onPrev }) {
  const [isZooming, setIsZooming] = useState(false);
  const [isSaved, setIsSaved] = useState(true);

  const screenAnim = useSharedValue(0);
  const swipeTranslateY = useSharedValue(0); 
  const swipeTranslateX = useSharedValue(0); 
  const isZoomingAnim = useSharedValue(0); 

  // 🌟 1. 負責打開卡片時的「放大動畫」(你剛剛不小心刪掉的就是這段)
  useEffect(() => {
    screenAnim.value = withTiming(1, { duration: 200 });
  }, []);

  // 🌟 2. 負責切換照片時的「完美歸零」(用 useLayoutEffect 解決警告與閃爍)
  useLayoutEffect(() => {
    swipeTranslateX.value = 0;
  }, [itemData]);

  const handleClose = () => {
    swipeTranslateY.value = withTiming(0, { duration: 200 }); 
    screenAnim.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onClose)();
    });
  };

  const handleToggleHeart = () => {
    if (isSaved) {
      if (onRemoveSaved) onRemoveSaved(itemData);
      setIsSaved(false);
    } else {
      if (onSave) onSave(itemData);
      setIsSaved(true);
    }
  };

  const swipeDownGesture = Gesture.Pan()
    .maxPointers(1) 
    .activeOffsetY([-10, 10]) 
    .failOffsetX([-20, 20]) 
    .onUpdate((event) => {
      if (event.translationY > 0) {
        swipeTranslateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > height * 0.15 || event.velocityY > 800) {
        runOnJS(handleClose)();
      } else {
        swipeTranslateY.value = withTiming(0, { duration: 200 });
      }
    });

  const swipeHorizontalGesture = Gesture.Pan()
    .maxPointers(1)
    .activeOffsetX([-15, 15]) 
    .failOffsetY([-20, 20]) 
    .onUpdate((event) => {
      if ((event.translationX < 0 && !onNext) || (event.translationX > 0 && !onPrev)) {
        swipeTranslateX.value = event.translationX / 3;
      } else {
        swipeTranslateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX < -width * 0.15 || event.velocityX < -600) {
        if (onNext) {
          // 🌟 成功切換下一張
          swipeTranslateX.value = withTiming(-(width + GAP), { duration: 250 }, () => {
            runOnJS(onNext)();
          });
        } else {
          // 🌟 無下一張時沉穩回彈
          swipeTranslateX.value = withSpring(0, { damping: 30, stiffness: 150, overshootClamping: true }); 
        }
      } else if (event.translationX > width * 0.15 || event.velocityX > 600) {
        if (onPrev) {
          // 🌟 成功切換上一張
          swipeTranslateX.value = withTiming(width + GAP, { duration: 250 }, () => {
            runOnJS(onPrev)();
          });
        } else {
          // 🌟 無上一張時沉穩回彈
          swipeTranslateX.value = withSpring(0, { damping: 30, stiffness: 150, overshootClamping: true });
        }
      } else {
        // 🌟 滑動距離不夠放棄切換，沉穩回彈
        swipeTranslateX.value = withSpring(0, { damping: 30, stiffness: 150, overshootClamping: true });
      }
    });

  const screenGestures = Gesture.Race(swipeDownGesture, swipeHorizontalGesture);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    pointerEvents: screenAnim.value > 0.8 ? 'auto' : 'none',
  }));

  const screenAnimatedStyle = useAnimatedStyle(() => {
    let swipeScale = 1 - (swipeTranslateY.value / (height * 0.15)) * 0.1;
    if (swipeScale < 0.9) swipeScale = 0.9;

    if (originLayout) {
      const currentWidth = interpolate(screenAnim.value, [0, 1], [originLayout.width, width]);
      const currentHeight = interpolate(screenAnim.value, [0, 1], [originLayout.height, height]);
      const currentX = interpolate(screenAnim.value, [0, 1], [originLayout.x, 0]);
      const currentY = interpolate(screenAnim.value, [0, 1], [originLayout.y, 0]);
      const currentRadius = interpolate(screenAnim.value, [0, 1], [12, width * 0.09]); 

      return {
        position: 'absolute',
        left: currentX,
        top: currentY + swipeTranslateY.value, 
        width: currentWidth,
        height: currentHeight,
        borderRadius: currentRadius,
        transform: [{ scale: swipeScale }],
        overflow: 'hidden',
      };
    }

    const fallbackScale = (0.9 + 0.1 * screenAnim.value) * swipeScale;
    return {
      opacity: screenAnim.value, 
      width: '100%',
      height: '100%',
      transform: [
        { translateY: height * (1 - screenAnim.value) + swipeTranslateY.value },
        { scale: fallbackScale } 
      ],
    };
  });

  const trackAnimatedStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
      flexDirection: 'row',
      width: width * 3 + GAP * 2,
      transform: [{ translateX: swipeTranslateX.value - (width + GAP) }],
    };
  });

  const uiAnimatedStyle = useAnimatedStyle(() => {
    const isVisible = screenAnim.value > 0.95 ? 1 : 0;
    return { opacity: isVisible * (1 - isZoomingAnim.value) };
  });

  if (!itemData || !itemData.img) return null;

  return (
    <GestureHandlerRootView style={styles.rootOverlay} pointerEvents="box-none">
      <GestureDetector gesture={screenGestures}>
        <Reanimated.View style={[styles.screenContainer, screenAnimatedStyle, containerAnimatedStyle]}>
          
          <Reanimated.View style={trackAnimatedStyle}>
            {/* 左側：上一張 */}
            <View style={{ width, height: '100%' }}>
              {prevItemData && <ZoomableCard card={prevItemData} isActive={false} />}
            </View>

            <View style={{ width: GAP, height: '100%' }} />

            {/* 中間：目前卡片 */}
            <View style={{ width, height: '100%' }}>
              <ZoomableCard 
                card={itemData} 
                setIsZooming={setIsZooming} 
                screenAnim={screenAnim} 
                isZoomingAnim={isZoomingAnim}
                isActive={true} 
              />
            </View>

            <View style={{ width: GAP, height: '100%' }} />

            {/* 右側：下一張 */}
            <View style={{ width, height: '100%' }}>
              {nextItemData && <ZoomableCard card={nextItemData} isActive={false} />}
            </View>
          </Reanimated.View>

          <Reanimated.View style={[StyleSheet.absoluteFill, uiAnimatedStyle]} pointerEvents="box-none">
            
            <TouchableOpacity style={styles.fixedBackWrapper} onPress={handleClose} activeOpacity={0.7}>
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(12, 12, 12, 0.7)', transform: [{ scale: 1.3 }] }]}>
                <Ionicons name="chevron-back" size={width * 0.08} color="#FFFFFF" style={{ right: 1 }} />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.fixedHeartWrapper, { transform: [{ scale: 1.3 }] }]} 
              onPress={handleToggleHeart}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: isSaved ? 'rgb(234, 128, 252)' : 'rgba(12, 12, 12, 0.7)' }]}>
                <Ionicons name={isSaved ? "heart" : "heart-outline"} size={width * 0.075} color="white" />
              </View>
            </TouchableOpacity>
            
            {!!itemData.url && (
              <TouchableOpacity onPress={() => Linking.openURL(itemData.url)} style={styles.fixedBuyNowWrapper}>
                <BlurView intensity={50} tint="dark" style={styles.buyNowGlassButton}>
                  <Text style={styles.buyNowText}>馬上購買</Text>
                </BlurView>
              </TouchableOpacity>
            )}
            
          </Reanimated.View>
        </Reanimated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootOverlay: { ...StyleSheet.absoluteFillObject, zIndex: 90 },
  screenContainer: { backgroundColor: 'rgb(18, 18, 18)', overflow: 'hidden', borderRadius: width * 0.09 },
  card: { width: '100%', height: '100%', backgroundColor: '#2C2C2E', overflow: 'hidden', borderRadius: width * 0.09 },
  cardImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  topGlassTag: { position: 'absolute', bottom: height * 0.23, alignSelf: 'center', zIndex: 10, backgroundColor: 'rgba(12, 12, 12, 0.15)', paddingHorizontal: width * 0.04, paddingVertical: height * 0.012, borderRadius: 100, overflow: 'hidden', maxWidth: width * 0.9 },
  tagText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14, textAlign: 'center' },
  fixedBuyNowWrapper: { position: 'absolute', bottom: height * 0.15, alignSelf: 'center', zIndex: 20 },
  buyNowGlassButton: { backgroundColor: 'rgba(12, 12, 12, 0.25)', paddingHorizontal: width * 0.1, paddingVertical: height * 0.018, borderRadius: width * 0.09, overflow: 'hidden' },
  buyNowText: { color: '#FFFFFF', fontSize: Math.max(14, width * 0.045), fontWeight: '600' },
  fixedBackWrapper: { position: 'absolute', bottom: height * 0.15, left: width * 0.12, zIndex: 20 },
  fixedHeartWrapper: { position: 'absolute', bottom: height * 0.15, right: width * 0.12, zIndex: 20 },
  iconCircle: { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)' },
});