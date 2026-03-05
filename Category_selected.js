import { Ionicons } from '@expo/vector-icons';
// 🌟 引入 LinearGradient 來模擬玻璃反光質感
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
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
                      style={[
                        styles.cardImage,
                        // 🌟 移除原本調低透明度的邏輯，保持 Logo 100% 清晰
                      ]} 
                    />
                    
                    {/* 🌟 核心修改：使用 LinearGradient 模擬玻璃質感 */}
                    {isSelected && (
                      <LinearGradient
                        // 使用對角線漸層模擬玻璃反光
                        colors={[
                          'rgba(255, 255, 255, 0.2)', // 右上角高光
                          'rgba(234, 128, 252, 0.15)', // 中間淡淡紫色
                          'rgba(0, 0, 0, 0.2)',        // 左下角細微壓暗
                        ]}
                        start={[0.1, 0.1]} // 渐变开始点
                        end={[0.9, 0.9]}   // 渐变结束点
                        style={styles.selectedOverlay}
                      >
                        <Ionicons 
                          name="checkmark" 
                          size={CARD_WIDTH * 0.45} // 打勾尺寸不變，垂直居中
                          color="white" 
                        />
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                  
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
  // ... 其他 styles 保持不變 ...
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
    alignItems: 'center' 
  },
  card: { 
    width: CARD_WIDTH, 
    height: CARD_WIDTH, 
    borderRadius: CARD_WIDTH * RATIO_RADIUS, 
    backgroundColor: '#1C1C1E', 
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    // 確保漸層和 Ionicons 能在 card 中間對齊
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardSelected: {
    borderColor: '#EA80FC',
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
    marginTop: 11, 
    paddingHorizontal: 4, 
    width: '100%', 
  },
  // 🌟 修改：selectedOverlay 變成滿版漸層容器
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  }
});