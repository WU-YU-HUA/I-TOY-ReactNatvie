import { Ionicons } from '@expo/vector-icons';
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

export default function CategoryScreen({ categories, selectedBrands, onToggleBrand }) {
  const [activeCategory, setActiveCategory] = useState(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  useEffect(() => {
    if (categories && Object.keys(categories).length > 0 && !activeCategory) {
      setActiveCategory('Female');
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
        colors={['rgba(12,12,12,0.8)', 'rgba(12,12,12,0.6)', 'rgba(12,12,12,0)']}
        locations={[0, 0.5, 1]}
        style={styles.headerBackground}
        pointerEvents="none"
      />

      <View style={styles.headerInteractiveContainer} pointerEvents="box-none">
        <Text style={styles.savedTitle}>品牌</Text>

        <View style={styles.headerRow}>
          <Text style={styles.categorySubtitle}>共 {currentItems.length} 個品牌</Text>

          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setIsFilterExpanded(!isFilterExpanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.filterText}>篩選</Text>
              <Ionicons
                name={isFilterExpanded ? "chevron-up" : "chevron-down"}
                size={16}
                color="rgba(255, 255, 255, 0.6)"
              />
            </TouchableOpacity>

            {isFilterExpanded && (
              <View style={styles.filterDropdown}>
              </View>
            )}
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

                    {/* 🌟 勾勾，移到 TouchableOpacity 外面，防止被 overflow:hidden 切掉 */}
                    {isSelected && (
                      <View style={styles.checkmarkContainer}>
                        <Ionicons
                          name="checkmark"
                          size={CARD_WIDTH * 0.15}
                          color="#000000"
                        />
                      </View>
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
  filterContainer: {
    position: 'relative',
    zIndex: 30, // 確保下拉選單在最上層
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingVertical: 8,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  filterOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  filterOptionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
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
    color: '#ffffff',
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
  // 🌟 勾勾容器
  checkmarkContainer: {
    position: 'absolute', // 相對於 cardVisualWrapper 定位
    bottom: -12,          // 🌟 距離 Wrapper 底部的距離 (超出卡片範圍)
    width: CARD_WIDTH * 0.2,
    height: CARD_WIDTH * 0.2,
    borderRadius: (CARD_WIDTH * 0.25) / 2, // 確保是完美的圓形
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00ffff', // 單色青色背景

    // 玻璃邊緣反光效果
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: 30, // 確保在圖片上方
  }
});