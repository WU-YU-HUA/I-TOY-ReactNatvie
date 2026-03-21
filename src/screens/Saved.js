import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

  // 這裡的 selectedIndex 代表的是「在當前品牌中的區域 index」
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

  // 整理分類資料
  const brandMap = {};
  savedItems.forEach(item => {
    const b = item.brand || '未分類';
    if (!brandMap[b]) {
      brandMap[b] = { items: [], icon: item.icon };
    }
    brandMap[b].items.push(item);
  });

  const sections = [];
  Object.keys(brandMap).forEach(brand => {
    const sectionItems = brandMap[brand].items;
    
    const categoryCount = { '上身': 0, '下身': 0, '連身': 0, '外套': 0, '其他': 0 };

    sectionItems.forEach(item => {
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
      items: sectionItems // 直接保留區域陣列
    });
  });

  const handleLocalOpen = (item, layout, index) => {
    setOriginLayout(layout);
    setSelectedIndex(index); // 存入該品牌的區域 index
    setPreviewItem(item);
  };

  const handleLocalClose = () => {
    setSelectedIndex(null);
    setOriginLayout(null);
    setPreviewItem(null);
  };

  // 只從當前品牌陣列中取得上/下一張
  const currentBrand = previewItem?.brand || '未分類';
  const currentBrandItems = previewItem ? (brandMap[currentBrand]?.items || []) : [];

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < currentBrandItems.length - 1) {
      const nextIndex = selectedIndex + 1;
      setSelectedIndex(nextIndex);
      setPreviewItem(currentBrandItems[nextIndex]); 
    }
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      const prevIndex = selectedIndex - 1;
      setSelectedIndex(prevIndex);
      setPreviewItem(currentBrandItems[prevIndex]); 
    }
  };

  const toggleBrand = (brand) => {
    setCollapsedBrands(prev => ({ ...prev, [brand]: !prev[brand] }));
  };

  // 監聽刪除動作，限制在同一個品牌內遞補
  useEffect(() => {
    if (selectedIndex !== null && previewItem) {
      const stillExists = savedItems.find(item => item.img[0] === previewItem.img[0]);
      
      if (!stillExists) {
        // 從新陣列抓取屬於「當前品牌」的剩餘商品
        const newBrandItems = savedItems.filter(i => (i.brand || '未分類') === (previewItem.brand || '未分類'));

        if (newBrandItems.length === 0) {
          // 如果這個品牌空了，直接關閉預覽
          handleLocalClose();
        } else {
          // 確保 index 不會超出新的該品牌陣列長度
          const newIndex = Math.min(selectedIndex, newBrandItems.length - 1);
          setSelectedIndex(newIndex);
          setPreviewItem(newBrandItems[newIndex]);
        }
      }
    }
  }, [savedItems, selectedIndex, previewItem]); 

  const isCurrentlySaved = previewItem 
    ? savedItems.some(i => i.img[0] === previewItem.img[0]) 
    : false;

  // 動態算出傳給 OpenSaved 的資料
  const prevItemData = selectedIndex > 0 ? currentBrandItems[selectedIndex - 1] : null;
  const nextItemData = selectedIndex !== null && selectedIndex < currentBrandItems.length - 1 ? currentBrandItems[selectedIndex + 1] : null;

  return (
    <View style={styles.screenContainer}>
      <LinearGradient colors={['rgba(12,12,12,0.8)', 'rgba(12,12,12,0.6)', 'rgba(12,12,12,0)']} locations={[0, 0.5, 1]} style={styles.fullWidthHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.savedTitle}>收藏</Text>
          <Text style={styles.savedSubtitle}>共 {savedItems.length} 個收藏</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {sections.map((section, index) => {
          const isCollapsed = collapsedBrands[section.brand];
          
          return (
            <View key={section.brand} style={styles.sectionContainer}>
              
              {/* --- 第一個品牌以外，加上分隔線 --- */}
              {index > 0 && <View style={styles.divider} />}

              <TouchableOpacity 
                style={styles.brandHeader} 
                activeOpacity={0.8}
                onPress={() => toggleBrand(section.brand)}
              >
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
                  {section.items.map((item, localIndex) => (
                    <SavedItemCard
                      key={item.img[0] + localIndex}
                      item={item}
                      index={localIndex} 
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
            prevItemData={prevItemData}   
            nextItemData={nextItemData}   
            onClose={handleLocalClose}
            originLayout={originLayout}
            onRemoveSaved={handleRemoveSaved}
            onSave={handleSave}
            onNext={nextItemData ? handleNext : undefined}
            onPrev={prevItemData ? handlePrev : undefined}
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
  
  sectionContainer: { width: '100%' },
  
  // --- 分隔線樣式 ---
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginVertical: 20,
    marginHorizontal: 10,
  },
  
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E', 
    borderRadius: CARD_WIDTH * RATIO_RADIUS + 6, 
    padding: 5, 
  },
  brandIconWrapper: {
    width: CARD_WIDTH *2/3,
    height: CARD_WIDTH*2/3,
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
  
  savedItemContainer: { width: CARD_WIDTH, marginTop: COLUMN_GAP + 10 },
  savedItemCard: { width: CARD_WIDTH, height: CARD_WIDTH * 1.4, borderRadius: CARD_WIDTH * RATIO_RADIUS, backgroundColor: '#1C1C1E', overflow: 'hidden' },
  savedItemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemTagWrapperOutside: { width: '100%', height: 48, marginTop: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 8, paddingHorizontal: 6 },
  itemTagTextOutside: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 11, fontWeight: '500', textAlign: 'center', letterSpacing: 0.5, lineHeight: 18 },
});