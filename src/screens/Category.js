import React from 'react';
import { StyleSheet, Text, View, Image, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// 1. 計算卡片寬度
// 螢幕寬度 - (左右邊距 20*2) - (中間空隙 15) / 2
const COLUMN_GAP = 15;
const PADDING_HORIZONTAL = 20;
const CARD_WIDTH = (width - (PADDING_HORIZONTAL * 2) - COLUMN_GAP) / 2;

export default function CategoryScreen({savedItems = []}) {
  return (
    <></>
  );
}

const styles = StyleSheet.create({
  
});