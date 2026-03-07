import { Ionicons } from '@expo/vector-icons';
// 🌟 引入 LinearGradient 來模擬玻璃反光質感
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 15;
const PADDING_HORIZONTAL = 20;
const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - COLUMN_GAP) / 2;
const RATIO_RADIUS = 0.12;

const CATEGORY_LABELS = {
  Female: '女裝',
  Male: '男裝'
};

export default function CategoryScreen({ categories, selectedBrands, onToggleBrand }) {
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    if (categories && Object.keys(categories).length > 0 && !activeCategory) {
      const keys = Object.keys(categories);
      setActiveCategory(keys.includes('Female') ? 'Female' : keys[0]);
    }
  }, [categories]);

  if (!categories || Object.keys(categories).length === 0 || !activeCategory) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ color: 'white' }}>載入中...</Text>
      </View>
    );
  }

  const currentItems = categories[activeCategory] || [];

  return (
    <View style={styles.screenContainer}>
      
      <LinearGradient 
        colors={['rgba(12,12,12,0.95)', 'rgba(12,12,12,0.85)', 'rgba(12,12,12,0)']} 
        locations={[0, 0.7, 1]} 
        style={styles.headerBackground}
        pointerEvents="none" 
      />

      <View style={styles.headerInteractiveContainer} pointerEvents="box-none">
        <Text style={styles.savedTitle}>商品分類</Text>
        
        <View style={styles.headerRow}>
          <Text style={styles.categorySubtitle}>共 {currentItems.length} 個品牌</Text>

          <View style={styles.tabContainer}>
            {Object.keys(categories).map((key) => {
              const isActive = activeCategory === key;
              return (
                <TouchableOpacity 
                  key={key} 
                  style={[styles.tabButton, isActive && styles.activeTabButton]}
                  onPress={() => setActiveCategory(key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                    {CATEGORY_LABELS[key] || key}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.categorySection}>
          <View style={styles.gridContainer}>
            {currentItems.map((item, index) => {
              const isSelected = selectedBrands?.has(item.brand);

              return (
                <View key={item.brand + index} style={styles.cardContainer}>
                  
                  {/* 🌟 關鍵修改: 增加一個 Wrapper，並設定 alignItems: 'center' 讓勾勾水平居中 */}
                  <View style={styles.cardVisualWrapper}>
                    <TouchableOpacity 
                      activeOpacity={0.8} 
                      onPress={() => onToggleBrand(item.brand)}
                      style={[
                        styles.card,
                        // 🌟 border 在下方樣式表中已移除
                        isSelected && styles.cardSelected 
                      ]}
                    >
                      <Image 
                        source={{ uri: item.icon }} 
                        style={styles.cardImage} 
                      />
                    </TouchableOpacity>
                    
                    {/* 🌟 粉色液態玻璃勾勾，移到 TouchableOpacity 外面，防止被 overflow:hidden 切掉 */}
                    {isSelected && (
                      <LinearGradient
                        colors={[
                          'rgba(255, 204, 255, 0.95)', // 左上角高光
                          'rgba(234, 128, 252, 0.85)', // 中間粉紫主色
                          'rgba(190, 80, 210, 0.9)',   // 右下角暗部
                        ]}
                        start={[0.1, 0.1]}
                        end={[0.9, 0.9]}
                        // 🌟 bottom 設定為 -10
                        style={styles.checkmarkContainer}
                      >
                        <Ionicons 
                          name="checkmark" 
                          size={CARD_WIDTH * 0.15} 
                          color="#FFFFFF" 
                        />
                      </LinearGradient>
                    )}
                  </View>
                  
                  <Text 
                    style={[styles.tagText, isSelected && styles.activeTagText]} 
                    numberOfLines={2}
                  >
                    {item.brand}
                  </Text>
                  
                </View>
              );
            })}

            {/* 補齊奇數個時的排版 */}
            {currentItems.length % 2 !== 0 && (
              <View style={[styles.cardContainer, { backgroundColor: 'transparent' }]} />
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: 'rgb(12, 12, 12)' },
  loadingContainer: {
    flex: 1,
    backgroundColor: 'rgb(12, 12, 12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBackground: { 
    position: 'absolute', 
    top: 0, 
    width: '100%', 
    height: Platform.OS === 'ios' ? 170 : 150, 
    zIndex: 10 
  },
  headerInteractiveContainer: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 20,
    paddingTop: Platform.OS === 'ios' ? 80 : 60, 
    paddingHorizontal: 25,
  },
  savedTitle: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#FFF', 
    marginBottom: 15
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', 
    alignItems: 'center',
  },
  categorySubtitle: {
    fontSize: 14, 
    color: 'rgba(255,255,255,0.6)',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 12, 
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
  },
  activeTabButton: {
    backgroundColor: '#EA80FC', 
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14, 
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF', 
  },
  scrollContent: {
    paddingTop: Platform.OS === 'ios' ? 170 : 150, 
    paddingBottom: 130, 
  },
  categorySection: {
    marginBottom: 30,
  },
  gridContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    paddingHorizontal: PADDING_HORIZONTAL 
  },
  cardContainer: { 
    width: CARD_WIDTH, 
    marginBottom: COLUMN_GAP, 
    // 🌟 水平居中 Wrapper 和 Text
    alignItems: 'center', 
  },
  // 🌟 新增的 Wrapper，負責水平對齊勾勾
  cardVisualWrapper: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', // 讓勾勾可以相對它進行絕對定位
    // 這裡预設為 visible，所以勾勾超出 bottom 時不會被切掉
  },
  card: { 
    width: CARD_WIDTH, 
    height: CARD_WIDTH, 
    borderRadius: CARD_WIDTH * RATIO_RADIUS, 
    backgroundColor: '#1C1C1E', 
    overflow: 'hidden', // 🌟 保持 hidden 讓圖片有圓角，且不被 selected border 影響大小
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSelected: {
    // 🌟 移除 Border
    borderWidth: 0,
    // 雖然 border 沒了，但為了保持原本卡片佔用的空間不變，
    // 可能需要手動調整邊距，不過看起來這裡不需要，直接設 0 即可。
  },
  cardImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'contain' 
  },
  activeTagText: {
    color: '#EA80FC',
    fontWeight: 'bold',
  },
  tagText: { 
    color: 'rgba(255, 255, 255, 0.9)', 
    fontSize: 12, 
    fontWeight: '600', 
    textAlign: 'center', 
    letterSpacing: 0.5,
    marginTop: 16, // 🌟 勾勾下移了，所以文字間距加大一點點
    paddingHorizontal: 4, 
    width: '100%', 
  },
  // 🌟 液態玻璃勾勾容器
  checkmarkContainer: {
    position: 'absolute', // 相對於 cardVisualWrapper 定位
    bottom: -12,          // 🌟 距離 Wrapper 底部的距離 (超出卡片範圍)
    width: CARD_WIDTH * 0.2, 
    height: CARD_WIDTH * 0.2,
    borderRadius: (CARD_WIDTH * 0.25) / 2, // 確保是完美的圓形
    justifyContent: 'center', 
    alignItems: 'center',
    
    // 玻璃邊緣反光效果
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)', 
    
    // 增加陰影讓它有浮起來的立體感
    shadowColor: '#EA80FC',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 5, // Android 陰影
    zIndex: 30, // 確保在圖片上方
  }
});