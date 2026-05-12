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
// 1. 外層觸發按鈕
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
// 2. 遞迴節點
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
// 3. 主組件 (徹底修復手勢與點擊衝突)
// ==========================================
export default function CategoryFilterPicker({ data, selectedPaths = [], onSave, customTrigger }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelectedPaths, setTempSelectedPaths] = useState([]);

  const panY = useRef(new Animated.Value(height)).current; 
  const scrollY = useRef(0); 

  const bgOpacity = panY.interpolate({
    inputRange: [0, height],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

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

  // 🌟 修改：簡化手勢處理，只負責「拖曳下滑關閉」，移除所有點擊座標判斷
  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return gestureState.dy > 10 && scrollY.current <= 0;
      },
      onPanResponderGrant: () => {
        panY.extractOffset(); 
      },
      onPanResponderMove: (evt, gestureState) => {
        if (gestureState.dy > 0) { 
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        panY.flattenOffset();
        
        // 滑動距離超過 20% 或下滑速度大於 1.5 時關閉 Modal
        if (gestureState.dy > height * 0.2 || gestureState.vy > 1.5) {
          closeModal();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 4,
          }).start();
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
          
          <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', opacity: bgOpacity }]}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={closeModal} />
          </Animated.View>
          
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: panY }] }
            ]}
          >
            {/* 🌟 修改 1：PanResponder 現在只綁定在這個「拖曳手柄」區域 */}
            <View {...headerPanResponder.panHandlers} style={styles.dragHandleWrapper}>
              <View style={styles.dragHandle} />
            </View>

            {/* 🌟 修改 2：標題列回歸乾淨的 View，並使用 TouchableOpacity 處理按鈕 */}
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.headerSideBtnContainer}
                onPress={handleClearAll}
                disabled={tempSelectedPaths.length === 0}
              >
                <Text style={[styles.clearText, tempSelectedPaths.length === 0 && styles.disabledText]}>
                  Clear
                </Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>
                Filter {tempSelectedPaths.length > 0 ? `(${tempSelectedPaths.length})` : ''}
              </Text>

              <TouchableOpacity 
                style={[styles.headerSideBtnContainer, { alignItems: 'flex-end' }]}
                onPress={handleSave}
              >
                <Text style={styles.closeText}>Save</Text>
              </TouchableOpacity>
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
// 4. 樣式 
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
  
  // 拖曳手柄的樣式 (加入 padding 增加觸控範圍)
  dragHandleWrapper: { width: '100%', alignItems: 'center', paddingTop: 16, paddingBottom: 10, backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  dragHandle: { width: 40, height: 5, borderRadius: 3, backgroundColor: '#D1D1D6' },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  headerSideBtnContainer: { flex: 1, justifyContent: 'center' }, 
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