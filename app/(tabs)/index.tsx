// app/(tabs)/index.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// 退兩層找到你的 i-toy.js
import App from '../../src/screens/HomePage';

export default function Index() {
  return (
    // 包上這個，放大縮小功能才會動！
    <GestureHandlerRootView style={{ flex: 1 }}>
      <App />
    </GestureHandlerRootView>
  );
}