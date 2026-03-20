import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react'; // 加上 useEffect
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppContext } from '../context/AppContext';
import OpenSaved from './OpenSaved';

import { Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';

const { width } = Dimensions.get('window');
const COLUMN_GAP = 15;
const PADDING_HORIZONTAL = 20;
const CARD_WIDTH = (width - PADDING_HORIZONTAL * 2 - COLUMN_GAP) / 2;
const RATIO_RADIUS = 0.12;

const SavedItemCard = ({ item, index, onOpenItem }) => {
  const itemRef = useRef(null);

  const handlePress = () => {
    itemRef.current?.measure((x, y, width, height, pageX, pageY) => {
      onOpenItem(item, { x: pageX, y: pageY, width, height }, index);
    });
  };

  return (
    <View style={styles.savedItemContainer}>
      <TouchableOpacity
        ref={itemRef}
        style={styles.savedItemCard}
        activeOpacity={0.8}
        onPress={handlePress}
      >
        <Image source={{ uri: item.img[0] }} style={styles.savedItemImage} />
      </TouchableOpacity>

      {!!item.tag && (
        <View style={styles.itemTagWrapperOutside}>
          <Text style={styles.itemTagTextOutside} numberOfLines={2}>{item.tag}</Text>
        </View>
      )}
    </View>
  );
};

export default function SavedScreen() {
  const { savedItems, handleSave, handleRemoveSaved } = useAppContext();

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [originLayout, setOriginLayout] = useState(null);
  const [previewItem, setPreviewItem] = useState(null); 
  
  const [collapsedBrands, setCollapsedBrands] = useState({});

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedIndex(null);
        setOriginLayout(null);
        setPreviewItem(null);
      };
    }, [])
  );

  const brandMap = {};
  savedItems.forEach(item => {
    const b = item.brand || '未分類';
    if (!brandMap[b]) {
      brandMap[b] = { items: [], icon: item.icon };
    }
    brandMap[b].items.push(item);
  });

  const displayItems = [];
  const sections = [];

  Object.keys(brandMap).forEach(brand => {
    const sectionItems = brandMap[brand].items;
    const startIndex = displayItems.length;
    
    const categoryCount = { '上身': 0, '下身': 0, '連身': 0, '外套': 0, '其他': 0 };

    sectionItems.forEach(item => {
      displayItems.push(item);
      const cat = item.category;
      if (['上身', '下身', '連身', '外套'].includes(cat)) {
        categoryCount[cat]++;
      } else {
        categoryCount['其他']++;
      }
    });

    const summaryText = Object.entries(categoryCount)
      .filter(([_, count]) => count > 0)
      .map(([cat, count]) => `${cat}: ${count}件`)
      .join(' · ');
    
    sections.push({
      brand,
      icon: brandMap[brand].icon,
      summaryText, 
      items: sectionItems.map((item, i) => ({ ...item, flatIndex: startIndex + i }))
    });
  });

  const handleLocalOpen = (item, layout, index) => {
    setOriginLayout(layout);
    setSelectedIndex(index);
    setPreviewItem(item);
  };

  const handleLocalClose = () => {
    setSelectedIndex(null);
    setOriginLayout(null);
    setPreviewItem(null);
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < displayItems.length - 1) {
      const nextIndex = selectedIndex + 1;
      setSelectedIndex(nextIndex);
      setPreviewItem(displayItems[nextIndex]); 
    }
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      const prevIndex = selectedIndex - 1;
      setSelectedIndex(prevIndex);
      setPreviewItem(displayItems[prevIndex]); 
    }
  };

  const toggleBrand = (brand) => {
    setCollapsedBrands(prev => ({ ...prev, [brand]: !prev[brand] }));
  };

  // --- 新增：監聽收藏清單變化，處理刪除後的自動遞補 ---
  useEffect(() => {
    if (selectedIndex !== null && previewItem) {
      // 確認現在預覽的商品是不是真的已經被刪除了
      const stillExists = savedItems.find(item => item.img[0] === previewItem.img[0]);
      
      if (!stillExists) {
        if (displayItems.length === 0) {
          // 如果全部刪光了，直接關閉
          handleLocalClose();
        } else {
          // 因為 displayItems 已經是刪除後的新陣列，
          // 我們只要確保 selectedIndex 不要超出新陣列的長度就好。
          // 原本的 selectedIndex 現在會自動指向上一個（或遞補上來的下一個）商品
          const newIndex = Math.min(selectedIndex, displayItems.length - 1);
          setSelectedIndex(newIndex);
          setPreviewItem(displayItems[newIndex]);
        }
      }
    }
  }, [savedItems, displayItems, selectedIndex, previewItem]);
  // --------------------------------------------------

  const isCurrentlySaved = previewItem 
    ? savedItems.some(i => i.img[0] === previewItem.img[0]) 
    : false;

  return (
    <View style={styles.screenContainer}>
      <LinearGradient colors={['rgba(12,12,12,0.8)', 'rgba(12,12,12,0.6)', 'rgba(12,12,12,0)']} locations={[0, 0.5, 1]} style={styles.fullWidthHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.savedTitle}>收藏</Text>
          <Text style={styles.savedSubtitle}>共 {savedItems.length} 個收藏</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sections.map(section => {
          const isCollapsed = collapsedBrands[section.brand];
          
          return (
            <View key={section.brand} style={styles.sectionContainer}>
              
              <TouchableOpacity 
                style={styles.brandHeader} 
                activeOpacity={0.8}
                onPress={() => toggleBrand(section.brand)}
              >
                {/* 加上了自己的圓角和底色，保證照片不被切割 */}
                {!!section.icon && (
                  <View style={styles.brandIconWrapper}>
                    <ExpoImage 
                      source={{ uri: section.icon }} 
                      style={styles.brandHeaderIcon} 
                      cachePolicy="disk" 
                      contentFit="contain" 
                      transition={200}
                    />
                  </View>
                )}
                
                <View style={styles.brandHeaderRight}>
                  <View style={styles.brandHeaderTitleRow}>
                    <Text style={styles.brandHeaderText} numberOfLines={1}>{section.brand}</Text>
                    <Ionicons name={isCollapsed ? "chevron-down" : "chevron-up"} color="rgba(255,255,255,0.6)" size={24} />
                  </View>
                  
                  {!!section.summaryText && (
                    <Text style={styles.brandSummaryText}>{section.summaryText}</Text>
                  )}
                </View>
              </TouchableOpacity>

              {!isCollapsed && (
                <View style={styles.gridContainer}>
                  {section.items.map((item) => (
                    <SavedItemCard
                      key={item.img[0] + item.flatIndex}
                      item={item}
                      index={item.flatIndex} 
                      onOpenItem={handleLocalOpen} 
                    />
                  ))}
                  {section.items.length % 2 !== 0 && (
                    <View style={[styles.savedItemContainer, { backgroundColor: 'transparent' }]} />
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {previewItem && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <OpenSaved
            itemData={previewItem}
            prevItemData={selectedIndex > 0 ? displayItems[selectedIndex - 1] : null}
            nextItemData={selectedIndex < displayItems.length - 1 ? displayItems[selectedIndex + 1] : null}
            onClose={handleLocalClose}
            originLayout={originLayout}
            onRemoveSaved={handleRemoveSaved}
            onSave={handleSave}
            onNext={selectedIndex < displayItems.length - 1 ? handleNext : undefined}
            onPrev={selectedIndex > 0 ? handlePrev : undefined}
            isSavedStatus={isCurrentlySaved} 
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: 'rgb(12, 12, 12)' },
  fullWidthHeader: { position: 'absolute', top: 0, width: '100%', zIndex: 20 },
  headerContent: { paddingTop: Platform.OS === 'ios' ? 80 : 60, paddingBottom: 30, paddingHorizontal: 25 },
  
  scrollContent: { paddingHorizontal: PADDING_HORIZONTAL, paddingTop: 160, paddingBottom: 130 },
  
  savedTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginTop: 0, marginBottom: 22 },
  savedSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  
  sectionContainer: { marginBottom: 25, width: '100%' },
  
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#1C1C1E', 
    borderRadius: CARD_WIDTH * RATIO_RADIUS + 6, 
    padding: 5, 
  },
  brandIconWrapper: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
    borderRadius: CARD_WIDTH * RATIO_RADIUS, 
    backgroundColor: 'rgba(255, 255, 255, 0.05)', 
    overflow: 'hidden', 
    marginRight: 15,
  },
  brandHeaderIcon: {
    width: '100%',
    height: '100%',
  },

  brandHeaderRight: {
    flex: 1,
    justifyContent: 'center', 
    paddingRight: 8, 
  },
  brandHeaderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10, 
  },
  brandHeaderText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
    flex: 1,
  },
  brandSummaryText: {
    color: 'rgba(255, 255, 255, 0.5)', 
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },

  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  savedItemContainer: { width: CARD_WIDTH, marginBottom: COLUMN_GAP + 10 },
  savedItemCard: { width: CARD_WIDTH, height: CARD_WIDTH * 1.4, borderRadius: CARD_WIDTH * RATIO_RADIUS, backgroundColor: '#1C1C1E', overflow: 'hidden' },
  savedItemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemTagWrapperOutside: { width: '100%', height: 48, marginTop: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 8, paddingHorizontal: 6 },
  itemTagTextOutside: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 11, fontWeight: '500', textAlign: 'center', letterSpacing: 0.5, lineHeight: 18 },
});