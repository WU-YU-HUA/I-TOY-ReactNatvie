import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Linking, PanResponder, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

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
  const { savedItems, handleSave, handleRemoveSaved, requestNotificationPermission } = useAppContext();

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

  const savedItemsRef = useRef(savedItems);
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
    
    // 👇 在這裡加入 overshootClamping: true
    expandAnim.value = withSpring(isSelectMode ? 1 : 0, { 
      damping: 14, 
      stiffness: 150, 
      overshootClamping: true 
    });
    
    if (!isSelectMode) setShowMenu(false);
  }, [isSelectMode]);

  useEffect(() => {
    savedItemsRef.current = savedItems;
  }, [savedItems]);

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
        
        // 🌟 關鍵修正：判斷手勢意圖
        // 如果垂直移動的距離大於水平移動，代表使用者是想「上下滾動頁面」，這時不要接管手勢
        if (Math.abs(gestureState.dy) > Math.abs(gestureState.dx)) {
          return false;
        }
        
        // 如果是水平滑動為主，且滑動距離超過 10，才判定為「開始滑動選取」，正式接管
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
              const itemIndex = savedItemsRef.current.findIndex(i => i.img[0] === key);
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
    // 防呆：如果沒有選取任何商品則不執行
    if (selectedItems.length === 0) return;

    // 將 selectedItems 轉換成購物車需要的格式，把 id 當作 asin，數量預設為 1
    const cartItems = selectedItems.map(item => ({
      asin: item.id,
      quantity: 1
    }));
    
    // 你的 Amazon 分潤標籤 (可替換成實際的 tag)
    const affiliateTag = 'oscar-20';
    let url = `https://www.amazon.com/gp/aws/cart/add.html?AssociateTag=${affiliateTag}`;

    // 迴圈加上每個商品的 ASIN 與數量參數
    cartItems.forEach((item, i) => {
      const index = i + 1;
      url += `&ASIN.${index}=${item.asin}&Quantity.${index}=${item.quantity}`;
    });

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        // 開啟 Amazon 網址
        await Linking.openURL(url);
        
        // (選用) 如果你希望點擊購買並跳轉後，畫面自動結束選取模式，可以把下面這行取消註解
        // setIsSelectMode(false); 
      } else {
        Alert.alert('錯誤', `無法開啟此網址: ${url}`);
      }
    } catch (error) {
      console.error('開啟 Amazon 發生錯誤:', error);
    }
  };

  useEffect(() => {
    if (selectedIndex !== null && previewItem) {
      const stillExists = savedItems.find(item => item.img[0] === previewItem.img[0]);
      if (!stillExists) {
        if (savedItems.length === 0) {
          handleLocalClose();
        } else {
          const newIndex = Math.min(selectedIndex, savedItems.length - 1);
          setSelectedIndex(newIndex);
          setPreviewItem(savedItems[newIndex]);
        }
      }
    }
  }, [savedItems, selectedIndex, previewItem]); 

  // --- 動畫樣式 ---
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

  const isCurrentlySaved = previewItem ? savedItems.some(i => i.img[0] === previewItem.img[0]) : false;
  const prevItemData = selectedIndex > 0 ? savedItems[selectedIndex - 1] : null;
  const nextItemData = selectedIndex !== null && selectedIndex < savedItems.length - 1 ? savedItems[selectedIndex + 1] : null;

  const remainder = savedItems.length % 3;
  const dummyCount = remainder === 0 ? 0 : 3 - remainder;

  return (
    <View style={styles.screenContainer} {...panResponder.panHandlers}>
      <LinearGradient colors={['rgba(12,12,12,0.9)', 'rgba(12,12,12,0.7)', 'rgba(12,12,12,0)']} locations={[0, 0.6, 1]} style={styles.fullWidthHeader}>
        <View style={styles.headerContent}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={styles.savedTitle}>收藏</Text>
              {/* 動態顯示：如果進入選取模式，改顯示已選取幾項 */}
              <Text style={styles.savedSubtitle}>
                {isSelectMode ? `已選取 ${selectedItems.length} 項` : `共 ${savedItems.length} 個收藏`}
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
          {Array.from({ length: dummyCount }).map((_, i) => (
            <View key={`dummy-${i}`} style={[styles.savedItemContainer, { backgroundColor: 'transparent' }]} />
          ))}
        </View>
      </ScrollView>

      {/* --- 替換後的懸浮分裂按鈕 --- */}
      <View style={styles.fabContainer} pointerEvents="box-none">
        
        {/* 點擊「...」後跳出的選項選單 */}
        {showMenu && isSelectMode && (
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuItem} 
              onPress={handleBatchBuy}
              disabled={selectedItems.length === 0} // 加上這行來禁用點擊
            >
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

        {/* 分裂出去的「...」按鈕 */}
        <Animated.View style={moreStyle}>
          <TouchableOpacity 
            style={[styles.circleButton, { backgroundColor: '#333' }]} 
            onPress={() => setShowMenu(!showMenu)}
          >
            <Ionicons name="ellipsis-horizontal" size={28} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* 分裂出去的 取消按鈕 */}
        <Animated.View style={cancelStyle}>
          <TouchableOpacity 
            style={[styles.circleButton, { backgroundColor: '#FF3B30' }]} 
            onPress={toggleSelectMode}
          >
            <Ionicons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
        </Animated.View>

        {/* 原本的 選取按鈕 */}
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
  
  // --- 新增的 FAB 與選單樣式 ---
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
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