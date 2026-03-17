import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router'; // 1. 引入 useFocusEffect
import React, { useCallback, useRef, useState } from 'react';
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import OpenSaved from './OpenSaved';

const { width, height } = Dimensions.get('window');
const COLUMN_GAP = 15;
const PADDING_HORIZONTAL = 20;
const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - COLUMN_GAP) / 2;
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
        <Image source={{ uri: item.img }} style={styles.savedItemImage} />
      </TouchableOpacity>

      {!!item.tag && (
        <View style={styles.itemTagWrapperOutside}>
          <Text style={styles.itemTagTextOutside} numberOfLines={2}>{item.tag}</Text>
        </View>
      )}
    </View>
  );
};

export default function SavedScreen({ savedItems = [], onRemoveSaved, onSave }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [originLayout, setOriginLayout] = useState(null);

  // 2. 加入 useFocusEffect 監聽畫面進出
  useFocusEffect(
    useCallback(() => {
      // 進入此畫面時不需要特別做事
      return () => {
        // 當離開此畫面 (切換 Tab) 時，強制重置狀態，收起正在瀏覽的卡片
        setSelectedIndex(null);
        setOriginLayout(null);
      };
    }, [])
  );

  const handleOpenItem = (item, layout, index) => {
    setOriginLayout(layout);
    setSelectedIndex(index);
  };

  const handleCloseItem = () => {
    setSelectedIndex(null);
    setOriginLayout(null);
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < savedItems.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

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
            onOpenItem={handleOpenItem}
          />
        ))}
        {savedItems.length % 2 !== 0 && <View style={[styles.savedItemContainer, { backgroundColor: 'transparent' }]} />}
      </ScrollView>

      {selectedIndex !== null && savedItems[selectedIndex] && (
        <OpenSaved
          itemData={savedItems[selectedIndex]}
          prevItemData={savedItems[selectedIndex - 1]}
          nextItemData={savedItems[selectedIndex + 1]}
          onClose={handleCloseItem}
          originLayout={originLayout}
          onRemoveSaved={onRemoveSaved}
          onSave={onSave}
          onNext={selectedIndex < savedItems.length - 1 ? handleNext : undefined}
          onPrev={selectedIndex > 0 ? handlePrev : undefined}
        />
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