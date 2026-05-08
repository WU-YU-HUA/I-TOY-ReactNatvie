import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Image, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppContext } from '../context/AppContext';
import OpenSaved from './OpenSaved';

const { width, height } = Dimensions.get('window');
const COLUMN_GAP = 15;
const PADDING_HORIZONTAL = 20;
const CARD_WIDTH = (width - PADDING_HORIZONTAL * 2 - COLUMN_GAP) / 3;
const RATIO_RADIUS = 0.12;

const SavedItemCard = ({ item, index, onOpenItem, isSelectMode, isSelected, onToggleSelect, onSetRef }) => {
  const itemRef = useRef(null);

  const handlePress = () => {
    if (isSelectMode) {
      onToggleSelect(item);
    } else {
      itemRef.current?.measure((x, y, width, height, pageX, pageY) => {
        onOpenItem(item, { x: pageX, y: pageY, width, height }, index);
      });
    }
  };

  return (
    <View style={styles.savedItemContainer} ref={onSetRef} collapsable={false}>
      <TouchableOpacity
        ref={itemRef}
        style={[styles.savedItemCard, isSelected && styles.selectedItemCard]}
        activeOpacity={0.8}
        onPress={handlePress}
      >
        <Image 
          source={{ uri: item.img[0] }} 
          style={[styles.savedItemImage, isSelected && styles.selectedItemImage]} 
        />
        
        {isSelectMode && (
          <View style={styles.checkboxContainer}>
            <Ionicons 
              name={isSelected ? "checkmark-circle" : "ellipse-outline"} 
              size={24} 
              color={isSelected ? "#FFF" : "rgba(255,255,255,0.6)"} 
            />
          </View>
        )}
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
  const { savedItems, handleSave, handleRemoveSaved, requestNotificationPermission } = useAppContext();

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [originLayout, setOriginLayout] = useState(null);
  const [previewItem, setPreviewItem] = useState(null); 
  
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);
  const isSelectModeRef = useRef(isSelectMode);
  const cardRefs = useRef({});       
  const cardLayouts = useRef({});    
  const itemMap = useRef({});        

  useFocusEffect(
    useCallback(() => {
      requestNotificationPermission();
    }, [])
  );

  useEffect(() => {
    isSelectModeRef.current = isSelectMode;
  }, [isSelectMode]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        setSelectedIndex(null);
        setOriginLayout(null);
        setPreviewItem(null);
        setIsSelectMode(false);
        setSelectedItems([]);
      };
    }, [])
  );

  // --- 建立平坦的 itemMap，供手勢滑動選取使用 ---
  itemMap.current = {};
  savedItems.forEach(item => {
    itemMap.current[item.img[0]] = item; 
  });

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (!isSelectModeRef.current) return false;
        return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: (evt, gestureState) => {
        setIsScrollEnabled(false);
        const startX = gestureState.x0;
        const startY = gestureState.y0;

        Object.keys(cardRefs.current).forEach(key => {
          const node = cardRefs.current[key];
          if (node) {
            node.measure((x, y, w, h, pageX, pageY) => {
              cardLayouts.current[key] = { pageX, pageY, w, h };
              if (
                startX >= pageX && startX <= pageX + w &&
                startY >= pageY && startY <= pageY + h
              ) {
                const item = itemMap.current[key];
                if (item) {
                  setSelectedItems(prev => {
                    if (!prev.find(i => i.img[0] === item.img[0])) {
                      return [...prev, item];
                    }
                    return prev;
                  });
                }
              }
            });
          }
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        const { moveX, moveY } = gestureState;
        let newSelections = [];

        Object.entries(cardLayouts.current).forEach(([key, layout]) => {
          if (
            moveX >= layout.pageX && moveX <= layout.pageX + layout.w &&
            moveY >= layout.pageY && moveY <= layout.pageY + layout.h
          ) {
            const item = itemMap.current[key];
            if (item) newSelections.push(item);
          }
        });

        if (newSelections.length > 0) {
          setSelectedItems(prev => {
            const prevIds = new Set(prev.map(i => i.img[0]));
            const toAdd = newSelections.filter(i => !prevIds.has(i.img[0]));
            if (toAdd.length > 0) {
              return [...prev, ...toAdd];
            }
            return prev;
          });
        }
      },
      onPanResponderRelease: () => setIsScrollEnabled(true),
      onPanResponderTerminate: () => setIsScrollEnabled(true),
    })
  ).current;

  const handleLocalOpen = (item, layout, index) => { setOriginLayout(layout); setSelectedIndex(index); setPreviewItem(item); };
  const handleLocalClose = () => { setSelectedIndex(null); setOriginLayout(null); setPreviewItem(null); };
  
  // --- 更新：上一張 / 下一張 邏輯改成在全部陣列中平移 ---
  const handleNext = () => { 
    if (selectedIndex !== null && selectedIndex < savedItems.length - 1) { 
      setSelectedIndex(selectedIndex + 1); 
      setPreviewItem(savedItems[selectedIndex + 1]); 
    } 
  };
  const handlePrev = () => { 
    if (selectedIndex !== null && selectedIndex > 0) { 
      setSelectedIndex(selectedIndex - 1); 
      setPreviewItem(savedItems[selectedIndex - 1]); 
    } 
  };

  const toggleSelectItem = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.img[0] === item.img[0]);
      if (exists) {
        return prev.filter(i => i.img[0] !== item.img[0]);
      } else {
        return [...prev, item];
      }
    });
  };

  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    setSelectedItems([]); 
  };

  const handleBatchDelete = () => {
    selectedItems.forEach(item => handleRemoveSaved(item));
    setSelectedItems([]);
    setIsSelectMode(false);
  };

  // --- 更新：刪除當下預覽物品後的處理邏輯 ---
  useEffect(() => {
    if (selectedIndex !== null && previewItem) {
      const stillExists = savedItems.find(item => item.img[0] === previewItem.img[0]);
      if (!stillExists) {
        if (savedItems.length === 0) {
          handleLocalClose();
        } else {
          // 如果原本的 index 超過現在陣列的長度，就退回最後一張
          const newIndex = Math.min(selectedIndex, savedItems.length - 1);
          setSelectedIndex(newIndex);
          setPreviewItem(savedItems[newIndex]);
        }
      }
    }
  }, [savedItems, selectedIndex, previewItem]); 

  const isCurrentlySaved = previewItem ? savedItems.some(i => i.img[0] === previewItem.img[0]) : false;
  
  // --- 更新：上下張變數改成在全部收藏中找 ---
  const prevItemData = selectedIndex > 0 ? savedItems[selectedIndex - 1] : null;
  const nextItemData = selectedIndex !== null && selectedIndex < savedItems.length - 1 ? savedItems[selectedIndex + 1] : null;

  // 計算空缺卡片數量，讓最後一排如果不足 3 個，也能靠左對齊
  const remainder = savedItems.length % 3;
  const dummyCount = remainder === 0 ? 0 : 3 - remainder;

  return (
    <View style={styles.screenContainer} {...panResponder.panHandlers}>
      <LinearGradient colors={['rgba(12,12,12,0.9)', 'rgba(12,12,12,0.7)', 'rgba(12,12,12,0)']} locations={[0, 0.6, 1]} style={styles.fullWidthHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={styles.savedTitle}>收藏</Text>
              <Text style={styles.savedSubtitle}>共 {savedItems.length} 個收藏</Text>
            </View>
            
            {!isSelectMode && (
              <TouchableOpacity onPress={toggleSelectMode} style={styles.headerSelectBtn}>
                <Text style={styles.headerSelectText}>選取</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        scrollEnabled={isScrollEnabled}
        contentContainerStyle={[styles.scrollContent, isSelectMode && { paddingBottom: 200 }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {savedItems.map((item, index) => (
            <SavedItemCard
              key={item.img[0] + index}
              item={item}
              index={index} 
              onOpenItem={handleLocalOpen} 
              isSelectMode={isSelectMode}
              isSelected={selectedItems.some(i => i.img[0] === item.img[0])}
              onToggleSelect={toggleSelectItem}
              onSetRef={(el) => cardRefs.current[item.img[0]] = el} 
            />
          ))}
          {/* 補足最後一排的空格，實現靠左對齊 */}
          {Array.from({ length: dummyCount }).map((_, i) => (
            <View key={`dummy-${i}`} style={[styles.savedItemContainer, { backgroundColor: 'transparent' }]} />
          ))}
        </View>
      </ScrollView>

      {isSelectMode && (
        <View style={styles.bottomActionBar}>
          <TouchableOpacity onPress={toggleSelectMode} style={styles.actionSideBtn}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>

          <Text style={styles.selectedCountText}>已選取 {selectedItems.length} 項</Text>
          
          <TouchableOpacity 
            style={[styles.actionSideBtn, { alignItems: 'flex-end' }]} 
            disabled={selectedItems.length === 0}
            onPress={handleBatchDelete}
          >
            <Ionicons name="trash-outline" size={24} color={selectedItems.length === 0 ? "rgba(255,255,255,0.3)" : "#FF3B30"} />
          </TouchableOpacity>
        </View>
      )}

      {previewItem && !isSelectMode && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <OpenSaved
            itemData={previewItem} prevItemData={prevItemData} nextItemData={nextItemData} 
            onClose={handleLocalClose} originLayout={originLayout} onRemoveSaved={handleRemoveSaved}
            onSave={handleSave} onNext={nextItemData ? handleNext : undefined} onPrev={prevItemData ? handlePrev : undefined}
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
  headerContent: { paddingTop: height * 0.08, paddingBottom: 20, paddingHorizontal: 25 },
  headerTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerSelectBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16 },
  headerSelectText: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  scrollContent: { paddingHorizontal: PADDING_HORIZONTAL, paddingTop: 160, paddingBottom: 130 },
  savedTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginTop: 0, marginBottom: 5 },
  savedSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  savedItemContainer: { width: CARD_WIDTH, marginTop: COLUMN_GAP + 10 },
  savedItemCard: { width: CARD_WIDTH, height: CARD_WIDTH * 1.4, borderRadius: CARD_WIDTH * RATIO_RADIUS, backgroundColor: '#1C1C1E', overflow: 'hidden' },
  savedItemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  selectedItemCard: { borderWidth: 2, borderColor: '#FFF' },
  selectedItemImage: { opacity: 0.6 }, 
  checkboxContainer: { position: 'absolute', top: 10, right: 10, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 15 },
  itemTagWrapperOutside: { width: '100%', height: 48, marginTop: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 8, paddingHorizontal: 6 },
  itemTagTextOutside: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 11, fontWeight: '500', textAlign: 'center', letterSpacing: 0.5, lineHeight: 18 },
  
  bottomActionBar: { 
    position: 'absolute', 
    bottom: height * 0.15, 
    alignSelf: 'center',    
    width: width * 0.6,    
    backgroundColor: '#2C2C2E', 
    borderRadius: 100, 
    paddingVertical: 12, 
    paddingHorizontal: 25,  
    zIndex: 30, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.5, 
    shadowRadius: 10, 
    elevation: 5 
  },
  actionSideBtn: { 
    flex: 1, 
    justifyContent: 'center',
  },
  cancelText: { 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '500' 
  },
  selectedCountText: { 
    flex: 2, 
    textAlign: 'center', 
    color: '#FFF', 
    fontSize: 16, 
    fontWeight: '600' 
  },
});