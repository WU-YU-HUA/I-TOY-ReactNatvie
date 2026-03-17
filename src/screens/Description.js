import { BlurView } from 'expo-blur';
import React, { useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Reanimated, { interpolate, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

export default function DescriptionPanel({ visible, onClose, description }) {
  const [shouldRender, setShouldRender] = useState(visible);
  const animValue = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      setShouldRender(true);
      animValue.value = withSpring(1, { damping: 15, stiffness: 250, overshootClamping: true });
    } else {
      animValue.value = withTiming(0, { duration: 200 }, (finished) => {
        if (finished) runOnJS(setShouldRender)(false);
      });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(animValue.value, [0, 1], [0.05, 1]);
    const translateX = interpolate(animValue.value, [0, 1], [width * 0.49, 0]);
    const translateY = interpolate(animValue.value, [0, 1], [height * 0.22, 0]);
    const opacity = interpolate(animValue.value, [0, 0.5, 1], [0, 1, 1]);

    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scale },
      ]
    };
  });

  if (!shouldRender) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* 點擊背景空白處關閉面板 */}
      <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

      <Reanimated.View 
        style={[styles.glassContainer, animatedStyle]} 
        pointerEvents="auto"
      >
        {/* 吸收點擊事件的擋箭牌，防止點擊面板內部時觸發外層的 onClose */}
        <Pressable style={StyleSheet.absoluteFillObject} />

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
    alignItems: 'flex-start',
    zIndex: 999,
    elevation: 999,
  },
  glassContainer: {
    marginLeft: width * 0.01,
    marginBottom: height * 0.02,
    width: width * 0.83,
    height: height * 0.5,
    borderRadius: width * 0.09,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
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