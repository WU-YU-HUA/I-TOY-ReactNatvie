import React from 'react';
import { Dimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function SwipeWrapper({ children, onBack }) {
  const translateX = useSharedValue(0);

  // 如果沒有 onBack (第一頁)，就不啟用手勢
  if (!onBack) return <>{children}</>;

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      // 只允許向右滑動 (x > 0)
      if (event.translationX > 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX > width * 0.3 || event.velocityX > 500) {
        // 成功觸發：畫面滑出螢幕右側後，再執行 JS 的返回邏輯
        translateX.value = withTiming(width, { duration: 200 }, () => {
          runOnJS(onBack)();
          // 切換後將位置重置，避免下一頁進來時位置不對
          translateX.value = 0; 
        });
      } else {
        // 取消觸發：彈回原位
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}