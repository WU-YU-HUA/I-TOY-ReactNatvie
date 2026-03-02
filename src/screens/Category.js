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

export default function CategoryScreen({ categories }) {
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
      
      {/* 漸層背景 */}
      <LinearGradient 
        colors={['rgba(12,12,12,0.95)', 'rgba(12,12,12,0.85)', 'rgba(12,12,12,0)']} 
        locations={[0, 0.7, 1]} 
        style={styles.headerBackground}
        pointerEvents="none" 
      />

      {/* 獨立的可互動 Header 區塊 */}
      <View style={styles.headerInteractiveContainer} pointerEvents="box-none">
        <Text style={styles.savedTitle}>商品分類</Text>
        
        {/* 🌟 修改重點：將副標題與 Tab 放在同一個橫向容器 */}
        <View style={styles.headerRow}>
          
          {/* 左側：品牌數量 */}
          <Text style={styles.categorySubtitle}>共 {currentItems.length} 個品牌</Text>

          {/* 右側：分類 Tab 切換區 */}
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

      {/* ScrollView 列表區塊 */}
      <ScrollView 
        style={{ flex: 1 }} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.categorySection}>
          
          {/* 🌟 已經將原來的 titleWrapper (副標題) 移除，直接顯示圖卡網格 */}
          
          <View style={styles.gridContainer}>
            {currentItems.map((item, index) => (
              <View key={item.brand + index} style={styles.cardContainer}>
                
                <TouchableOpacity activeOpacity={0.8} style={styles.card}>
                  <Image 
                    source={{ uri: item.icon }} 
                    style={styles.cardImage} 
                  />
                </TouchableOpacity>
                
                <Text style={styles.tagText} numberOfLines={2}>
                  {item.brand}
                </Text>
                
              </View>
            ))}

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
    paddingTop: Platform.OS === 'ios' ? 70 : 50, 
    paddingHorizontal: 25,
  },
  savedTitle: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#FFF', 
    marginBottom: 15
  },
  
  // 🌟 新增：讓數量與 Tabs 橫向排列、置中的容器
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // 讓內容分別靠左、靠右
    alignItems: 'center',            // 讓文字與按鈕垂直置中對齊
  },
  
  // 原本的副標題樣式稍微調整
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
    fontSize: 14, // 稍微調小一點，配搭橫向佈局比較精緻
    fontWeight: '600',
  },
  activeTabText: {
    color: '#FFFFFF', 
  },

  scrollContent: {
    // 🌟 因為把副標題移上去了，稍微縮減一點 paddingTop
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
    alignItems: 'center' 
  },
  card: { 
    width: CARD_WIDTH, 
    height: CARD_WIDTH, 
    borderRadius: CARD_WIDTH * RATIO_RADIUS, 
    backgroundColor: '#1C1C1E', 
    overflow: 'hidden' 
  },
  cardImage: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'contain' 
  },
  tagText: { 
    color: 'rgba(255, 255, 255, 0.9)', 
    fontSize: 12, 
    fontWeight: '600', 
    textAlign: 'center', 
    letterSpacing: 0.5,
    marginTop: 11, 
    paddingHorizontal: 4, 
    width: '100%', 
  },
});