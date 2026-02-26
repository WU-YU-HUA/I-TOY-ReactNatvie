import React from 'react';
import { StyleSheet, Text, View, Image, ScrollView, Dimensions, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
// 引入漸層
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');
const COLUMN_GAP = 15;
const PADDING_HORIZONTAL = 20;
const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - COLUMN_GAP) / 2;
const RATIO_MARGIN = 0.06;
const RATIO_RADIUS = 0.12;

export default function SavedScreen({ savedItems = [] }) {
  return (
    <View style={styles.screenContainer}>
      
      {/* 修改處：改用 LinearGradient 
        這會創造一個從「純黑」到「透明」的漸層，
        看起來會像內容慢慢消失在黑暗中，非常柔和，完全沒有邊界線。
      */}
      <LinearGradient 
        colors={['#rgba(0,0,0,0.8)', '#rgba(0,0,0,0.6)', 'rgba(0,0,0,0)']} 
        locations={[0, 0.5, 1]} // 0%~60% 是純黑，60%~100% 慢慢變透明
        style={styles.fullWidthHeader}
      >
        <View style={styles.headerContent}>
          <Text style={styles.savedTitle}>我的收藏</Text>
          <Text style={styles.savedSubtitle}>{savedItems.length} items saved</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {savedItems.map((item, index) => (
          <View key={index} style={styles.savedItemCard}>
             <Image source={{ uri: item.img }} style={styles.savedItemImage} />
             {item.tag && (
               <View style={styles.itemTagWrapper}>
                 <BlurView intensity={40} tint="dark" style={styles.itemTagInner}>
                   <Text style={styles.itemTagText} numberOfLines={1}>{item.tag}</Text>
                 </BlurView>
               </View>
             )}
             <TouchableOpacity style={styles.floatingHeart}>
               <Ionicons name="heart" size={CARD_WIDTH * 0.15} color="#EA80FC" />
             </TouchableOpacity>
          </View>
        ))}
        {savedItems.length % 2 !== 0 && <View style={[styles.savedItemCard, { backgroundColor: 'transparent' }]} />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: { 
    flex: 1, 
    backgroundColor: '#000',
  },
  fullWidthHeader: {
    position: 'absolute',
    top: 0,
    width: '100%',
    zIndex: 20,
    // 不需要 backgroundColor，因為 LinearGradient 本身就是背景
  },
  headerContent: {
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 30, // 稍微增加底部空間讓漸層過渡更自然
    paddingHorizontal: 25,
  },
  // ... 其他樣式保持不變 ...
  scrollContent: {
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between',
    paddingHorizontal: PADDING_HORIZONTAL,
    paddingTop: 160, 
    paddingBottom: 130, 
  },
  savedTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', marginTop: -5 },
  savedSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  savedItemCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.4, 
    borderRadius: CARD_WIDTH * RATIO_RADIUS, 
    marginBottom: COLUMN_GAP,
    backgroundColor: '#1C1C1E',
    overflow: 'hidden',
    position: 'relative',
  },
  savedItemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  itemTagWrapper: {
    position: 'absolute',
    top: CARD_WIDTH * RATIO_MARGIN,
    left: 0, right: 0, alignItems: 'center', zIndex: 10,
  },
  itemTagInner: {
    paddingHorizontal: CARD_WIDTH * 0.04, 
    paddingVertical: CARD_WIDTH * 0.015,
    borderRadius: 100, 
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderColor: 'rgba(255, 255, 255, 0.15)', 
    borderWidth: 0,
    overflow: 'hidden',
    maxWidth: CARD_WIDTH * 0.85, 
  },
  itemTagText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 7, fontWeight: '500', textAlign: 'center', lineHeight: 12, letterSpacing: 0.5,
  },
  floatingHeart: {
    position: 'absolute',
    bottom: CARD_WIDTH * RATIO_MARGIN,
    right: CARD_WIDTH * RATIO_MARGIN,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 50,
    padding: CARD_WIDTH * 0.06, //改大小
    zIndex: 10,
  },
});