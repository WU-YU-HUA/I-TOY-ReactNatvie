import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { height, width } = Dimensions.get('window');

// ==========================================
// 1. 外層觸發按鈕 (維持不變)
// ==========================================
const FilterButton = ({ onPress, selectedCount }) => {
  const label = selectedCount > 0 ? `分類 (${selectedCount})` : "篩選";
  
  return (
    <TouchableOpacity 
      style={[styles.filterButton, selectedCount > 0 && styles.filterButtonActive]} 
      onPress={onPress}
    >
      <Text style={[styles.filterText, selectedCount > 0 && styles.filterTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

// ==========================================
// 2. 遞迴節點 (維持不變)
// ==========================================
const CategoryItem = ({ item, parentPath = [], selectedPaths = [], onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!item.name || item.name.trim() === '') return null;

  const hasChildren = item.children && item.children.length > 0;
  const currentPath = [...parentPath, item.name];
  const fullPathString = currentPath.join('>');
  
  const isSelected = selectedPaths.includes(fullPathString);

  const handlePress = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else {
      onToggle(fullPathString);
    }
  };

  return (
    <View style={styles.itemContainer}>
      <TouchableOpacity 
        style={[styles.row, isExpanded && styles.rowExpanded]} 
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text style={[styles.itemName, isSelected && styles.itemSelectedText]}>
          {item.name}
        </Text>
        
        {hasChildren ? (
          <Text style={styles.arrow}>{isExpanded ? '▼' : '▶'}</Text>
        ) : (
          isSelected && <Text style={styles.checkMark}>✓</Text>
        )}
      </TouchableOpacity>

      {hasChildren && isExpanded && (
        <View style={styles.childrenContainer}>
          {item.children.map((child) => (
            <CategoryItem
              key={child.id.toString()}
              item={child}
              parentPath={currentPath}
              selectedPaths={selectedPaths}
              onToggle={onToggle}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// ==========================================
// 3. 主組件 (修正後的自訂滑動下縮)
// ==========================================
export default function CategoryFilterPicker({ data, selectedPaths = [], onSave, customTrigger }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelectedPaths, setTempSelectedPaths] = useState([]);

  // 只需一個 panY 控制上下位置
  const panY = useRef(new Animated.Value(height)).current; 
  const scrollY = useRef(0); 

  // 動態計算背景透明度 (隨卡片下滑自動變透明)
  const bgOpacity = panY.interpolate({
    inputRange: [0, height],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  // 開啟動畫
  const openModal = () => {
    setTempSelectedPaths(selectedPaths); 
    setModalVisible(true);
    panY.setValue(height);
    
    Animated.spring(panY, { 
      toValue: 0, 
      useNativeDriver: true,
      bounciness: 4, 
      speed: 12
    }).start();
  };

  // 關閉動畫
  const closeModal = () => {
    Animated.timing(panY, { 
      toValue: height, 
      duration: 250, 
      useNativeDriver: true 
    }).start(() => setModalVisible(false));
  };

  const handleToggleTempPath = (path) => {
    setTempSelectedPaths(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path) 
        : [...prev, path]
    );
  };

  const handleSave = () => {
    if (onSave) {
      onSave(tempSelectedPaths);
    }
    closeModal(); 
  };

  const handleClearAll = () => {
    setTempSelectedPaths([]); 
  };

  // 🌟 新增：用來記錄起始點和時間以區分點擊和移動
  const startY = useRef(0);
  const startTime = useRef(0);

  // 🌟 修改：專門處理紅色圈出區域的手勢處理器
  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // dy > 10 防止輕微觸控造成的誤判，且需在 ScrollView 最頂部才允許拖曳卡片
        return gestureState.dy > 10 && scrollY.current <= 0;
      },
      onPanResponderGrant: (evt) => {
        panY.extractOffset(); 
        startY.current = evt.nativeEvent.pageY;
        startTime.current = Date.now();
      },
      onPanResponderMove: (evt, gestureState) => {
        // 只允許卡片往下拖，不允許往上提
        if (gestureState.dy > 0) { 
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        panY.flattenOffset();
        
        const deltaX = Math.abs(gestureState.dx);
        const deltaY = Math.abs(gestureState.dy);
        const timeDelta = Date.now() - startTime.current;

        // 🌟 核心邏輯：區分點擊和移動
        // 如果移動距離和時間都小，則認為是「點擊」
        if (deltaX < 10 && deltaY < 10 && timeDelta < 200) {
          const touchX = evt.nativeEvent.locationX;
          // 根據觸摸的位置來觸發相應的操作
          if (touchX < 80) { // 左側「Clear」區域
            if (tempSelectedPaths.length > 0) handleClearAll();
          } else if (touchX > width - 80) { // 右側「Save」區域
            handleSave();
          }
          // 點擊中間標題不執行操作
          // 然後我們重置 Modal 位置，確保它保持在原位
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
        } else {
          // 認為是用戶在「移動」 Modal
          // 當滑動距離超過畫面高度 20% 或滑動速度很快時，觸發關閉
          if (gestureState.dy > height * 0.2 || gestureState.vy > 1.5) {
            closeModal();
          } else {
            // 否則回彈至原位
            Animated.spring(panY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 4,
            }).start();
          }
        }
      }
    })
  ).current;

  return (
    <View>
      {customTrigger ? (
        <TouchableOpacity activeOpacity={0.8} onPress={openModal}>
          {customTrigger}
        </TouchableOpacity>
      ) : (
        <FilterButton 
          selectedCount={selectedPaths.length} 
          onPress={openModal} 
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="none" 
        transparent={true}
        onRequestClose={closeModal} 
      >
        <View style={styles.modalOverlay}>
          
          {/* 背景層 */}
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: bgOpacity }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal} />
          </Animated.View>
          
          {/* 卡片層 */}
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: panY }] }
            ]}
          >
            {/* 🌟 重新設計的標題欄區域，將所有內容包裹在一個可拖動的 View 中 */}
            <View {...headerPanResponder.panHandlers}>
              {/* 拖曳手柄 */}
              <View style={styles.dragHandleWrapper}>
                <View style={styles.dragHandle} />
              </View>

              {/* 修改後的標題欄結構，移除了 TouchableOpacity，轉而在 PanResponder 中處理點擊 */}
              <View style={styles.modalHeader}>
                <View style={styles.headerSideBtnContainer}>
                  <Text style={[styles.clearText, tempSelectedPaths.length === 0 && styles.disabledText]}>
                    Clear
                  </Text>
                </View>

                <Text style={styles.modalTitle}>
                  Filter {tempSelectedPaths.length > 0 ? `(${tempSelectedPaths.length})` : ''}
                </Text>

                <View style={[styles.headerSideBtnContainer, { alignItems: 'flex-end' }]}>
                  <Text style={styles.closeText}>Save</Text>
                </View>
              </View>
            </View>

            <ScrollView 
              style={styles.scrollView}
              onScroll={(e) => { scrollY.current = e.nativeEvent.contentOffset.y; }}
              scrollEventThrottle={16} 
              bounces={false} 
            >
              {data && data.map((item) => (
                <CategoryItem 
                  key={item.id.toString()} 
                  item={item} 
                  selectedPaths={tempSelectedPaths} 
                  onToggle={handleToggleTempPath} 
                />
              ))}
            </ScrollView>
            
            <SafeAreaView style={{ backgroundColor: '#fff' }} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

// ==========================================
// 4. 樣式 (維持不變)
// ==========================================
const styles = StyleSheet.create({
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)', 
  },
  filterButtonActive: { backgroundColor: '#fff' },
  filterText: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 14, fontWeight: '600' },
  filterTextActive: { color: '#000' },
  
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { height: height * 0.5, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  dragHandleWrapper: { width: '100%', alignItems: 'center', paddingTop: 12, paddingBottom: 4, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  dragHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#D1D1D6' },

  // 修改後的標題欄樣式，將內容容器分開
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerSideBtnContainer: { flex: 1, justifyContent: 'center' }, // 替換了 headerSideBtn
  modalTitle: { flex: 2, textAlign: 'center', fontSize: 18, fontWeight: '600', color: '#333' },
  closeText: { fontSize: 16, color: '#007AFF', fontWeight: '600' },
  clearText: { fontSize: 16, color: '#FF3B30', fontWeight: '500' },
  disabledText: { color: '#D1D1D6' },

  scrollView: { flex: 1, padding: 10 },
  itemContainer: { marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 12, backgroundColor: '#fff', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#f0f0f0' },
  rowExpanded: { backgroundColor: '#f8f9fa' },
  itemName: { fontSize: 16, color: '#333' },
  itemSelectedText: { color: '#007AFF', fontWeight: '600' },
  arrow: { fontSize: 12, color: '#aaa', paddingTop: 2 },
  checkMark: { fontSize: 18, color: '#007AFF', fontWeight: 'bold' },
  childrenContainer: { paddingLeft: 20, borderLeftWidth: 2, borderLeftColor: '#f0f0f0', marginLeft: 10 },
});