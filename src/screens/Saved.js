import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Linking, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import CategoryFilterPicker from '../components/FilterButton';
import { useAppContext } from '../context/AppContext';
import OpenSaved from './OpenSaved';

const { width, height } = Dimensions.get('window');
const COLUMN_GAP = 15;
const PADDING_HORIZONTAL = 20;
const CARD_WIDTH = (width - PADDING_HORIZONTAL * 2 - COLUMN_GAP) / 3;
const RATIO_RADIUS = 0.12;
const BUTTON_SIZE = Math.round(width * 0.15); // 圓形按鈕大小

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
  const { 
    savedItems, 
    handleSave, 
    handleRemoveSaved, 
    requestNotificationPermission,
    categories,              
    selectedCategoryPaths,   
    toggleCategoryPath,
    setSelectedCategoryPaths 
  } = useAppContext();

  // 🌟 核心過濾邏輯：依照 selectedCategoryPaths 過濾 savedItems
  const filteredSavedItems = useMemo(() => {
    if (!selectedCategoryPaths || selectedCategoryPaths.length === 0) {
      return savedItems; // 如果沒有選擇任何分類，顯示全部
    }
    // 假設你的 item 裡面有 category 屬性對應到 Path 字串
    return savedItems.filter(item => selectedCategoryPaths.includes(item.category));
  }, [savedItems, selectedCategoryPaths]);

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [originLayout, setOriginLayout] = useState(null);
  const [previewItem, setPreviewItem] = useState(null); 
  
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isScrollEnabled, setIsScrollEnabled] = useState(true);

  // --- 分裂按鈕狀態 ---
  const [showMenu, setShowMenu] = useState(false);
  const expandAnim = useSharedValue(0);
  
  // --- Refs ---
  const isSelectModeRef = useRef(isSelectMode);
  const cardRefs = useRef({});       
  const cardLayouts = useRef({});    

  // 🌟 注意：這裡的 Ref 要改為綁定 filteredSavedItems，這樣拖曳多選的座標與索引才會對齊目前畫面上的卡片
  const savedItemsRef = useRef(filteredSavedItems);
  const selectedItemsRef = useRef(selectedItems);

  const dragStartIndex = useRef(null);
  const dragIsSelecting = useRef(true);
  const initialSelectedIds = useRef(new Set());

  useFocusEffect(
    useCallback(() => {
      requestNotificationPermission();
    }, [])
  );

  useEffect(() => {
    isSelectModeRef.current = isSelectMode;
    
    expandAnim.value = withSpring(isSelectMode ? 1 : 0, { 
      damping: 14, 
      stiffness: 150, 
      overshootClamping: true 
    });
    
    if (!isSelectMode) setShowMenu(false);
  }, [isSelectMode]);

  // 🌟 同步過濾後的陣列至 Ref
  useEffect(() => {
    savedItemsRef.current = filteredSavedItems;
  }, [filteredSavedItems]);

  useEffect(() => {
    selectedItemsRef.current = selectedItems;
  }, [selectedItems]);

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

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        if (!isSelectModeRef.current) return false;
        
        if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
          return false;
        }
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: (evt, gestureState) => {
        setIsScrollEnabled(false);
        const startX = gestureState.x0;
        const startY = gestureState.y0;

        initialSelectedIds.current = new Set(selectedItemsRef.current.map(i => i.img[0]));
        dragStartIndex.current = null;

        Object.keys(cardRefs.current).forEach(key => {
          const node = cardRefs.current[key];
          if (node) {
            node.measure((x, y, w, h, pageX, pageY) => {
              // 🌟 拖拉選取要以 filteredSavedItems 中的索引為準
              const itemIndex = savedItemsRef.current.findIndex(i => i.img[0] === key);
              if (itemIndex === -1) return; // 避免已經被過濾掉的卡片觸發

              cardLayouts.current[key] = { pageX, pageY, w, h, index: itemIndex, img: key };

              if (
                dragStartIndex.current === null &&
                startX >= pageX && startX <= pageX + w &&
                startY >= pageY && startY <= pageY + h
              ) {
                dragStartIndex.current = itemIndex;
                dragIsSelecting.current = !initialSelectedIds.current.has(key);
              }
            });
          }
        });
      },
      onPanResponderMove: (evt, gestureState) => {
        const { moveX, moveY } = gestureState;
        let currentIndex = null;

        Object.values(cardLayouts.current).forEach(layout => {
          if (
            moveX >= layout.pageX && moveX <= layout.pageX + layout.w &&
            moveY >= layout.pageY && moveY <= layout.pageY + layout.h
          ) {
            currentIndex = layout.index;
          }
        });

        if (currentIndex !== null) {
          if (dragStartIndex.current === null) {
            dragStartIndex.current = currentIndex;
            const imgKey = savedItemsRef.current[currentIndex].img[0];
            dragIsSelecting.current = !initialSelectedIds.current.has(imgKey);
          }

          const minIdx = Math.min(dragStartIndex.current, currentIndex);
          const maxIdx = Math.max(dragStartIndex.current, currentIndex);

          const newSelection = [];
          savedItemsRef.current.forEach((item, idx) => {
            const imgKey = item.img[0];
            const isInRange = idx >= minIdx && idx <= maxIdx;

            if (isInRange) {
              if (dragIsSelecting.current) newSelection.push(item);
            } else {
              if (initialSelectedIds.current.has(imgKey)) newSelection.push(item);
            }
          });

          setSelectedItems(newSelection);
        }
      },
      onPanResponderRelease: () => setIsScrollEnabled(true),
      onPanResponderTerminate: () => setIsScrollEnabled(true),
    })
  ).current;

  const handleLocalOpen = (item, layout, index) => { setOriginLayout(layout); setSelectedIndex(index); setPreviewItem(item); };
  const handleLocalClose = () => { setSelectedIndex(null); setOriginLayout(null); setPreviewItem(null); };
  
  // 🌟 上一張/下一張 要以 filteredSavedItems 為準
  const handleNext = () => { 
    if (selectedIndex !== null && selectedIndex < filteredSavedItems.length - 1) { 
      setSelectedIndex(selectedIndex + 1); 
      setPreviewItem(filteredSavedItems[selectedIndex + 1]); 
    } 
  };
  const handlePrev = () => { 
    if (selectedIndex !== null && selectedIndex > 0) { 
      setSelectedIndex(selectedIndex - 1); 
      setPreviewItem(filteredSavedItems[selectedIndex - 1]); 
    } 
  };

  const toggleSelectItem = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.img[0] === item.img[0]);
      if (exists) return prev.filter(i => i.img[0] !== item.img[0]);
      return [...prev, item];
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

  const handleBatchBuy = async () => {
    if (selectedItems.length === 0) return;

    const cartItems = selectedItems.map(item => ({
      asin: item.id, 
      quantity: 1
    }));
    
    const affiliateTag = 'oscar-20'; 
    let url = `https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=${affiliateTag}`;

    cartItems.forEach((item, i) => {
      const index = i + 1;
      url += `&ASIN.${index}=${item.asin}&Quantity.${index}=${item.quantity}`;
    });

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('錯誤', `無法開啟此網址: ${url}`);
      }
    } catch (error) {
      console.error('開啟 Amazon 發生錯誤:', error);
    }
  };

  // 🌟 預覽時如果列表變更（例如取消收藏或改了Filter），重新對齊資料
  useEffect(() => {
    if (selectedIndex !== null && previewItem) {
      const stillExists = filteredSavedItems.find(item => item.img[0] === previewItem.img[0]);
      if (!stillExists) {
        if (filteredSavedItems.length === 0) {
          handleLocalClose();
        } else {
          const newIndex = Math.min(selectedIndex, filteredSavedItems.length - 1);
          setSelectedIndex(newIndex);
          setPreviewItem(filteredSavedItems[newIndex]);
        }
      }
    }
  }, [filteredSavedItems, selectedIndex, previewItem]); 

  const handleSaveFilters = (newPaths) => {
    if (setSelectedCategoryPaths) {
      setSelectedCategoryPaths(newPaths);
    } else if (toggleCategoryPath) {
      const toAdd = newPaths.filter(p => !selectedCategoryPaths.includes(p));
      const toRemove = selectedCategoryPaths.filter(p => !newPaths.includes(p));
      const pathsToToggle = [...toAdd, ...toRemove];
      pathsToToggle.forEach(path => toggleCategoryPath(path));
    }
  };

  const mainStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(expandAnim.value, [0, 1], [1, 0.1], 'clamp') }],
    opacity: interpolate(expandAnim.value, [0, 0.5], [1, 0], 'clamp'),
    position: 'absolute',
    zIndex: 10,
  }));

  const cancelStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(expandAnim.value, [0, 1], [0.1, 1], 'clamp') }],
    opacity: interpolate(expandAnim.value, [0.5, 1], [0, 1], 'clamp'),
    position: 'absolute',
    zIndex: 9,
  }));

  const moreStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(expandAnim.value, [0, 1], [0, -BUTTON_SIZE - 15], 'clamp') },
      { scale: interpolate(expandAnim.value, [0, 1], [0.1, 1], 'clamp') }
    ],
    opacity: interpolate(expandAnim.value, [0.5, 1], [0, 1], 'clamp'),
    position: 'absolute',
    zIndex: 8,
  }));

  // 🌟 isCurrentlySaved 維持與完整的 savedItems 比對，確保顯示真實的收藏狀態
  const isCurrentlySaved = previewItem ? savedItems.some(i => i.img[0] === previewItem.img[0]) : false;
  // 🌟 預覽視窗的上一筆/下一筆，應以 filteredSavedItems 陣列來判斷
  const prevItemData = selectedIndex > 0 ? filteredSavedItems[selectedIndex - 1] : null;
  const nextItemData = selectedIndex !== null && selectedIndex < filteredSavedItems.length - 1 ? filteredSavedItems[selectedIndex + 1] : null;

  const remainder = filteredSavedItems.length % 3;
  const dummyCount = remainder === 0 ? 0 : 3 - remainder;

  return (
    <View style={styles.screenContainer} {...panResponder.panHandlers}>
      <LinearGradient colors={['rgba(12,12,12,0.9)', 'rgba(12,12,12,0.7)', 'rgba(12,12,12,0)']} locations={[0, 0.6, 1]} style={styles.fullWidthHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={styles.savedTitle}>Saved</Text>
              {/* 🌟 數量統計改為過濾後的長度 */}
              <Text style={styles.savedSubtitle}>
                {isSelectMode ? `Selected ${selectedItems.length} items` : `${filteredSavedItems.length} items saved`}
              </Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        scrollEnabled={isScrollEnabled}
        contentContainerStyle={[styles.scrollContent, isSelectMode && { paddingBottom: 200 }]} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {/* 🌟 使用 filteredSavedItems 進行渲染 */}
          {filteredSavedItems.map((item, index) => (
            <SavedItemCard
              key={item.img[0] + index}
              item={item}
              index={index} 
              onOpenItem={handleLocalOpen} 
              isSelectMode={isSelectMode}
              isSelected={selectedItems.some(i => i.img[0] === item.img[0])}
              onToggleSelect={toggleSelectItem}
              onSetRef={(el) => {
                if(el) cardRefs.current[item.img[0]] = el;
              }} 
            />
          ))}
          {Array.from({ length: dummyCount }).map((_, i) => (
            <View key={`dummy-${i}`} style={[styles.savedItemContainer, { backgroundColor: 'transparent' }]} />
          ))}
        </View>
      </ScrollView>

      {!previewItem && !isSelectMode && (
        <View style={styles.staticFilterWrapper} pointerEvents="box-none">
          <CategoryFilterPicker 
            data={categories} 
            selectedPaths={selectedCategoryPaths} 
            onSave={handleSaveFilters} 
            customTrigger={
              <View style={[styles.circleButton, { backgroundColor: 'rgba(51, 51, 51, 0.8)' }]}>
                <Ionicons name="filter" size={28} color="#FFF" />
                <Text style={styles.selectText}>Filter</Text>
              </View>
            }
          />
        </View>
      )}

      {/* --- 懸浮分裂按鈕 --- */}
      {!previewItem && (
        <View style={styles.fabContainer} pointerEvents="box-none">
          
          {showMenu && isSelectMode && (
            <View style={styles.menuContainer}>
              <TouchableOpacity style={styles.menuItem} onPress={handleBatchBuy} disabled={selectedItems.length === 0}>
                <Ionicons name="cart-outline" size={20} color={selectedItems.length === 0 ? "rgba(255,255,255,0.4)" : "#FFF"} />
                <Text style={[styles.menuText, {color: selectedItems.length === 0 ? "rgba(255,255,255,0.4)" : "#FFF"}]}>Buy</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={handleBatchDelete}
                disabled={selectedItems.length === 0}
              >
                <Ionicons name="trash-outline" size={20} color={selectedItems.length === 0 ? "rgba(255,59,48,0.4)" : "#FF3B30"} />
                <Text style={[styles.menuText, { color: selectedItems.length === 0 ? "rgba(255,59,48,0.4)" : '#FF3B30' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}

          <Animated.View style={moreStyle}>
            <TouchableOpacity 
              style={[styles.circleButton, { backgroundColor: '#333' }]} 
              onPress={() => setShowMenu(!showMenu)}
            >
              <Ionicons name="ellipsis-horizontal" size={28} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={cancelStyle}>
            <TouchableOpacity 
              style={[styles.circleButton, { backgroundColor: '#FF3B30' }]} 
              onPress={toggleSelectMode}
            >
              <Ionicons name="close" size={32} color="#FFF" />
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={mainStyle}>
            <TouchableOpacity 
              style={[styles.circleButton, { backgroundColor: 'rgb(0,255,255)' }]} 
              onPress={toggleSelectMode}
            >
              <Ionicons name="checkmark-done" size={28} color="#FFF" />
              <Text style={styles.selectText}>Select</Text>
            </TouchableOpacity>
          </Animated.View>

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
  
  staticFilterWrapper: {
    position: 'absolute',
    bottom: (height * 0.12) + BUTTON_SIZE + 15, 
    right: 20,
    zIndex: 90,
  },

  fabContainer: {
    position: 'absolute',
    bottom: height * 0.12,
    right: 20,
    width: BUTTON_SIZE * 2.5,
    height: BUTTON_SIZE * 2.5,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    zIndex: 100,
  },
  circleButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
  },
  selectText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: -2,
  },
  menuContainer: {
    position: 'absolute',
    bottom: BUTTON_SIZE + 15,
    right: BUTTON_SIZE + 5,
    backgroundColor: 'rgba(30, 30, 30, 0.95)',
    borderRadius: 12,
    paddingVertical: 5,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  menuText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 8,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginHorizontal: 10,
  }
});