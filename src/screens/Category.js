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

const { width, height } = Dimensions.get('window');
const COLUMN_GAP = 15;
const PADDING_HORIZONTAL = 20;
const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - COLUMN_GAP) / 2;
const RATIO_RADIUS = 0.12;

export default function CategoryScreen({ categories, selectedBrands, onToggleBrand }) {
  // 原本用來渲染清單的邏輯 (保留預設載入)
  const [activeCategory, setActiveCategory] = useState(null);
  
  // --- 與 Discover.js 一模一樣的篩選狀態 ---
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedStyles, setSelectedStyles] = useState([]);

  useEffect(() => {
    if (categories && Object.keys(categories).length > 0 && !activeCategory) {
      setActiveCategory('Female');
    }
  }, [categories]);

  // --- 與 Discover.js 一模一樣的切換邏輯 ---
  const toggleCategory = (category) => {
    setSelectedCategories((prev) => 
      prev.includes(category) 
        ? prev.filter((item) => item !== category) 
        : [...prev, category]
    );
  };

  const toggleStyle = (style) => {
    setSelectedStyles((prev) => 
      prev.includes(style) 
        ? prev.filter((item) => item !== style) 
        : [...prev, style]
    );
  };

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
      {/* 全螢幕透明遮罩：點擊空白處收回選單 */}
      {isFilterExpanded && (
        <TouchableOpacity 
          style={styles.fullScreenDismiss} 
          activeOpacity={1} 
          onPress={() => setIsFilterExpanded(false)} 
        />
      )}

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
                name="filter"
                size={16}
                color="rgba(255, 255, 255, 0.6)"
              />
            </TouchableOpacity>

            {isFilterExpanded && (
              <View style={styles.filterDropdown}>
                {/* --- 分類區塊 --- */}
                <Text style={styles.dropdownSectionTitle}>分類</Text>
                {['上身', '下身', '外套', '連身'].map((item) => {
                  const isChecked = selectedCategories.includes(item);
                  return (
                    <TouchableOpacity 
                      key={`cat-${item}`} 
                      style={styles.checkboxRow}
                      onPress={() => toggleCategory(item)}
                    >
                      <Text style={styles.filterOptionText}>{item}</Text>
                      <Ionicons 
                        name={isChecked ? "checkbox" : "square-outline"} 
                        size={18} 
                        color={isChecked ? "#00ffff" : "rgba(255,255,255,0.4)"} 
                      />
                    </TouchableOpacity>
                  );
                })}

                <View style={styles.dropdownDivider} />

                {/* --- 風格區塊 --- */}
                <Text style={styles.dropdownSectionTitle}>風格</Text>
                {['日系', '韓系', '美式', '簡約'].map((item) => {
                  const isChecked = selectedStyles.includes(item);
                  return (
                    <TouchableOpacity 
                      key={`style-${item}`} 
                      style={styles.checkboxRow}
                      onPress={() => toggleStyle(item)}
                    >
                      <Text style={styles.filterOptionText}>{item}</Text>
                      <Ionicons 
                        name={isChecked ? "checkbox" : "square-outline"} 
                        size={18} 
                        color={isChecked ? "#00ffff" : "rgba(255,255,255,0.4)"} 
                      />
                    </TouchableOpacity>
                  );
                })}
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
                  <View style={styles.cardVisualWrapper}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => onToggleBrand(item.brand)}
                      style={[
                        styles.card,
                        isSelected && styles.cardSelected
                      ]}
                    >
                      <Image
                        source={{ uri: item.icon }}
                        style={styles.cardImage}
                      />
                    </TouchableOpacity>

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
  
  fullScreenDismiss: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 25, 
    backgroundColor: 'transparent',
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
    zIndex: 30, 
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
    zIndex: 40,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
    backgroundColor: 'rgba(28, 28, 30, 0.98)',
    borderRadius: 15,
    paddingVertical: 10,
    width: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  dropdownSectionTitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 10,
    marginHorizontal: 12,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filterOptionText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 15,
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
    alignItems: 'center',
  },
  cardVisualWrapper: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: CARD_WIDTH * RATIO_RADIUS,
    backgroundColor: '#1C1C1E',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSelected: {
    borderWidth: 0,
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
    marginTop: 16,
    paddingHorizontal: 4,
    width: '100%',
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: -12,
    width: CARD_WIDTH * 0.22,
    height: CARD_WIDTH * 0.22,
    borderRadius: (CARD_WIDTH * 0.25) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00ffff',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    zIndex: 30,
  }
});