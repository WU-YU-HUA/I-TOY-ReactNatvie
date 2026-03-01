import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef } from 'react';
import { Dimensions, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const COLUMN_GAP = 15;
const PADDING_HORIZONTAL = 20;
const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - COLUMN_GAP) / 2;
const RATIO_RADIUS = 0.12;

const SavedItemCard = ({ item, onOpenItem }) => {
  const itemRef = useRef(null);

  const handlePress = () => {
    // 取得該元件在螢幕上的絕對位置
    itemRef.current?.measure((x, y, width, height, pageX, pageY) => {
      onOpenItem(item, { x: pageX, y: pageY, width, height });
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

export default function SavedScreen({ savedItems = [], onOpenItem }) {
  // 🌟 反轉陣列，讓最新的收藏排在最前面
  const reversedItems = [...savedItems].reverse();

  return (
    <View style={styles.screenContainer}>
      <LinearGradient colors={['rgba(12,12,12,0.8)', 'rgba(12,12,12,0.6)', 'rgba(12,12,12,0)']} locations={[0, 0.5, 1]} style={styles.fullWidthHeader}>
        <View style={styles.headerContent}>
          <Text style={styles.savedTitle}>我的收藏</Text>
          <Text style={styles.savedSubtitle}>{savedItems.length} items saved</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {reversedItems.map((item, index) => (
          <SavedItemCard 
            key={item.img + index} 
            item={item} 
            onOpenItem={onOpenItem} 
          />
        ))}
        {reversedItems.length % 2 !== 0 && <View style={[styles.savedItemContainer, { backgroundColor: 'transparent' }]} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { flex: 1, backgroundColor: 'rgb(12, 12, 12)' },
  fullWidthHeader: { position: 'absolute', top: 0, width: '100%', zIndex: 20 },
  headerContent: { paddingTop: Platform.OS === 'ios' ? 80 : 60, paddingBottom: 30, paddingHorizontal: 25 },
  scrollContent: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: PADDING_HORIZONTAL, paddingTop: 160, paddingBottom: 130 },
  savedTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginTop: -5 },
  savedSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  savedItemContainer: { width: CARD_WIDTH, marginBottom: COLUMN_GAP + 10 },
  savedItemCard: { width: CARD_WIDTH, height: CARD_WIDTH * 1.4, borderRadius: CARD_WIDTH * RATIO_RADIUS, backgroundColor: '#1C1C1E', overflow: 'hidden' },
  savedItemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemTagWrapperOutside: { width: '100%', height: 48, marginTop: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 8, paddingHorizontal: 6 },
  itemTagTextOutside: { color: 'rgba(255, 255, 255, 0.9)', fontSize: 11, fontWeight: '500', textAlign: 'center', letterSpacing: 0.5, lineHeight: 18 },
});