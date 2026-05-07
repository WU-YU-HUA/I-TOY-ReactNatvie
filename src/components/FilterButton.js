import { useState } from 'react';
import {
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';

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
// 2. 遞迴節點 (多層級展開 + 打勾支援)
// ==========================================
const CategoryItem = ({ item, parentPath = [], selectedPaths = [], onToggle }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!item.name || item.name.trim() === '') return null;

  const hasChildren = item.children && item.children.length > 0;
  const currentPath = [...parentPath, item.name];
  const fullPathString = currentPath.join('/');
  
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
// 3. 主組件
// ==========================================
export default function CategoryFilterPicker({ data, selectedPaths = [], onTogglePath }) {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View>
      <FilterButton 
        selectedCount={selectedPaths.length} 
        onPress={() => setModalVisible(true)} 
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet" // iOS 卡片式彈窗
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              選擇分類 {selectedPaths.length > 0 ? `(${selectedPaths.length})` : ''}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>完成</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {data && data.map((item) => (
              <CategoryItem 
                key={item.id.toString()} 
                item={item} 
                selectedPaths={selectedPaths}
                onToggle={onTogglePath} 
              />
            ))}
          </ScrollView>
        </SafeAreaView>
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // 暗色主題時的半透明底色
  },
  filterButtonActive: {
    backgroundColor: '#fff', 
  },
  filterText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000', 
  },
  
  modalContainer: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#333' 
  },
  closeText: { 
    fontSize: 16, 
    color: '#007AFF', 
    fontWeight: '600' 
  },
  scrollView: { 
    flex: 1, 
    padding: 10 
  },

  itemContainer: { 
    marginTop: 2 
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  rowExpanded: { 
    backgroundColor: '#f8f9fa' 
  },
  itemName: { 
    fontSize: 16, 
    color: '#333' 
  },
  itemSelectedText: { 
    color: '#007AFF', 
    fontWeight: '600' 
  },
  arrow: { 
    fontSize: 12, 
    color: '#aaa', 
    paddingTop: 2 
  },
  checkMark: { 
    fontSize: 18, 
    color: '#007AFF', 
    fontWeight: 'bold' 
  },
  childrenContainer: {
    paddingLeft: 20, 
    borderLeftWidth: 2,
    borderLeftColor: '#f0f0f0',
    marginLeft: 10,
  },
});