import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 15;
const PADDING_HORIZONTAL = 20;
// 計算每張卡片的寬度（與 Saved.js 相同）
const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - COLUMN_GAP) / 2;
const RATIO_RADIUS = 0.12;

export default function CategoryScreen({ categories }) {
  // 防呆保護
  if (!categories || Object.keys(categories).length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'white' }}>載入中...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.screenContainer} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {Object.entries(categories).map(([categoryName, items]) => (
        <View key={categoryName} style={styles.categorySection}>
          
          {/* 分類標題 (Male / Female) */}
          <View style={styles.titleWrapper}>
            <Text style={styles.categoryTitle}>{categoryName}</Text>
            <Text style={styles.categorySubtitle}>{items.length} brands</Text>
          </View>
          
          {/* 圖卡網格區塊 */}
          <View style={styles.gridContainer}>
            {items.map((item, index) => (
              <View key={item.brand + index} style={styles.cardContainer}>
                
                {/* 圖片卡片 */}
                <TouchableOpacity activeOpacity={0.8} style={styles.card}>
                  <Image 
                    source={{ uri: item.icon }} 
                    style={styles.cardImage} 
                  />
                </TouchableOpacity>

                {/* 品牌名稱 */}
                {/* <View style={styles.tagWrapper}>
                  <Text style={styles.tagText} numberOfLines={2}>
                    {item.brand}
                  </Text>
                </View> */}
                
              </View>
            ))}

            {/* 如果該分類的數量是奇數，補一個透明的 View 讓排版靠左對齊 */}
            {items.length % 2 !== 0 && (
              <View style={[styles.cardContainer, { backgroundColor: 'transparent' }]} />
            )}
          </View>

        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: 'rgb(12, 12, 12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenContainer: { 
    flex: 1, 
    backgroundColor: 'rgb(12, 12, 12)' 
  },
  scrollContent: {
    paddingTop: 60, // 配合上方預留空間
    paddingBottom: 130, // 避免被底部導覽列擋住
  },
  categorySection: {
    marginBottom: 30,
  },
  titleWrapper: {
    paddingHorizontal: PADDING_HORIZONTAL,
    marginBottom: 15,
  },
  categoryTitle: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#EA80FC', // 紫色標題
    marginBottom: 4
  },
  categorySubtitle: {
    fontSize: 14, 
    color: 'rgba(255,255,255,0.6)',
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    paddingHorizontal: PADDING_HORIZONTAL 
  },
  cardContainer: { 
    width: CARD_WIDTH, 
    marginBottom: COLUMN_GAP + 10 
  },
  card: { 
    width: CARD_WIDTH, 
    height: CARD_WIDTH, // 與 Saved.js 一樣的長寬比
    borderRadius: CARD_WIDTH * RATIO_RADIUS, 
    backgroundColor: '#1C1C1E', 
    overflow: 'hidden' 
  },
  cardImage: { 
    width: '100%', 
    height: '100%', 
    // 💡 小建議：如果 Logo 被裁切得太嚴重，可以把 'cover' 改成 'contain'
    resizeMode: 'contain' 
  },
  tagWrapper: { 
    width: '100%', 
    height: 48, 
    marginTop: 8, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#1C1C1E', 
    borderRadius: 8, 
    paddingHorizontal: 6 
  },
  tagText: { 
    color: 'rgba(255, 255, 255, 0.9)', 
    fontSize: 12, 
    fontWeight: '600', 
    textAlign: 'center', 
    letterSpacing: 0.5 
  },
});