import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native'; // 新增匯入 Text

const { width } = Dimensions.get('window');

// 1. 計算卡片寬度
// 螢幕寬度 - (左右邊距 20*2) - (中間空隙 15) / 2
const COLUMN_GAP = 15;
const PADDING_HORIZONTAL = 20;
const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - COLUMN_GAP) / 2;

export default function CategoryScreen({savedItems = []}) {
  return (
    <View style={styles.container}>
      {/* 放上你要的文字，我順便幫你加了 ... 讓它更有未完待續的感覺 */}
      <Text style={styles.text}>To be Continued...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,                  // 讓這個 View 佔滿整個螢幕空間
    justifyContent: 'center', // 垂直方向置中
    alignItems: 'center',     // 水平方向置中
    backgroundColor: '#424242',  // 給個白底避免預設背景色干擾
  },
  text: {
    fontSize: 24,             // 字體稍微放大一點
    fontWeight: 'bold',       // 粗體
    color: '#d4c8c8',            // 用灰色看起來比較柔和
  }
});