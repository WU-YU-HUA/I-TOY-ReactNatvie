import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppContext } from '../context/AppContext';
import OpenSaved from './OpenSaved'; // ✅ 1. 把 OpenSaved 重新引入

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
  // 從 Context 取得資料跟全域的 Save/Remove 函式
  const { savedItems, handleSave, handleRemoveSaved } = useAppContext();

  // ✅ 2. 建立本地狀態，不干涉 GlobalUIWrapper
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [originLayout, setOriginLayout] = useState(null);
  const [previewItem, setPreviewItem] = useState(null); // 獨立保存預覽的卡片

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedIndex(null);
        setOriginLayout(null);
        setPreviewItem(null);
      };
    }, [])
  );

  // 本地的開啟邏輯
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
    if (selectedIndex !== null && selectedIndex < savedItems.length - 1) {
      const nextIndex = selectedIndex + 1;
      setSelectedIndex(nextIndex);
      setPreviewItem(savedItems[nextIndex]); // 更新預覽卡片
    }
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      const prevIndex = selectedIndex - 1;
      setSelectedIndex(prevIndex);
      setPreviewItem(savedItems[prevIndex]); // 更新預覽卡片
    }
  };

  // ✅ 3. 核心邏輯：即時計算這張預覽中的卡片，是不是還在收藏陣列裡？
  const isCurrentlySaved = previewItem 
    ? savedItems.some(i => i.img === previewItem.img) 
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
        {savedItems.map((item, index) => (
          <SavedItemCard
            key={item.img + index}
            item={item}
            index={index}
            onOpenItem={handleLocalOpen} // 呼叫本地的開啟函式
          />
        ))}
        {savedItems.length % 2 !== 0 && <View style={[styles.savedItemContainer, { backgroundColor: 'transparent' }]} />}
      </ScrollView>

      {/* ✅ 4. 本地渲染 OpenSaved，這樣它就會被限制在 Tab Bar 之內！ */}
      {previewItem && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <OpenSaved
            itemData={previewItem}
            prevItemData={selectedIndex > 0 ? savedItems[selectedIndex - 1] : null}
            nextItemData={selectedIndex < savedItems.length - 1 ? savedItems[selectedIndex + 1] : null}
            onClose={handleLocalClose}
            originLayout={originLayout}
            onRemoveSaved={handleRemoveSaved}
            onSave={handleSave}
            onNext={selectedIndex < savedItems.length - 1 ? handleNext : undefined}
            onPrev={selectedIndex > 0 ? handlePrev : undefined}
            
            isSavedStatus={isCurrentlySaved} // 將真實狀態傳給 OpenSaved
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
  scrollContent: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: PADDING_HORIZONTAL, paddingTop: 160, paddingBottom: 130 },
  savedTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginTop: 0, marginBottom: 22 },
  savedSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  savedItemContainer: { width: CARD_WIDTH, marginBottom: COLUMN_GAP + 10 },
  savedItemCard: { width: CARD_WIDTH, height: CARD_WIDTH * 1.4, borderRadius: CARD_WIDTH * RATIO_RADIUS, backgroundColor: '#1C1C1E', overflow: 'hidden' },
  savedItemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemTagWrapperOutside: { width: '100%', height: 48, marginTop: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 8, paddingHorizontal: 6 },
  itemTagTextOutside: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 11, fontWeight: '500', textAlign: 'center', letterSpacing: 0.5, lineHeight: 18 },
});