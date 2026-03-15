import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import Reanimated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function DescriptionPanel({ visible, onClose, description }) {
  const [shouldRender, setShouldRender] = useState(visible);
  const animValue = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      animValue.value = withSpring(1, { damping: 15, stiffness: 120, overshootClamping: true });
    } else {
      animValue.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setShouldRender)(false);
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    // 讓面板從右下方 (約略是 chevron-up 按鈕的位置) 放大飛出來
    const scale = interpolate(animValue.value, [0, 1], [0.1, 1]);
    const translateX = interpolate(animValue.value, [0, 1], [width * 0.4, 0]);
    const translateY = interpolate(animValue.value, [0, 1], [height * 0.4, 0]);
    const opacity = interpolate(animValue.value, [0, 0.8, 1], [0, 1, 1]);

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scale },
      ],
      // 設定變形原點靠右下角，視覺上更符合從按鈕彈出
      transformOrigin: 'bottom right',
    };
  });

  if (!shouldRender) return null;


  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* 背景改為透明或無色，因為我們只要框框內有 Blur */}

      {/* Liquid Glass 面板，尺寸與 Discover.js 的 ImageCard 一致 */}
      <Reanimated.View style={[styles.glassContainer, animatedStyle]} pointerEvents="auto">
        <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFillObject} />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>商品介紹</Text>
          <Text style={styles.descriptionText}>
            {description || '尚無商品描述'}
          </Text>
        </ScrollView>
      </Reanimated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-start', // 向左貼齊
    zIndex: 999, // 確保蓋在卡片上面
    elevation: 999,
  },
  glassContainer: {
    marginLeft: width * 0.01,
    marginTop: height * 0.06,
    width: width * 0.83, // 稍微縮小寬度，讓右側按鈕可以被點擊
    height: height * 0.45,
    // 與 Discover.js 卡片相同的大小與圓角
    borderRadius: width * 0.09,
    overflow: 'hidden',
    // Liquid Glass 特效
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // 取消原本寫死的 left: 0，改由 overlay 的 alignItems 控制
  },
  scrollContent: {
    paddingTop: height * 0.03,
    paddingHorizontal: 30,
    paddingBottom: height * 0.1,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  descriptionText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 26,
    letterSpacing: 0.5,
  },
});
