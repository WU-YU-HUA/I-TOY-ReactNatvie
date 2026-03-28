import { Image } from 'expo-image';
import React, { useState } from 'react';
// first.js
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAppContext } from './AppContext'; // 請確保路徑正確

export default function FirstScreen({ onFinish }) { 
  const { completeFirstLaunch } = useAppContext();
  const [name, setName] = useState('Yu Hua Wu');

  const handleFinish = () => {
    // 如果有傳入 onFinish，優先執行傳入的函數（代表它是作為分頁蓋板）
    if (onFinish) {
      onFinish();
    } else {
      // 否則執行原本的首次啟動邏輯
      completeFirstLaunch();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.innerContainer}
      >
        {/* 頂部進度條 */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarFill} />
        </View>

        {/* 標題區塊 */}
        <View style={styles.headerContainer}>
          <Text style={styles.title}>歡迎!</Text>
          <Text style={styles.subtitle}>發現衣櫃裡的下一件寶貝</Text>
        </View>

        {/* 圖片區塊 */}
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=1000&auto=format&fit=crop' }} // 請換成你的鋼彈/機甲圖片路徑
          style={styles.mainImage}
          contentFit="cover"
        />

        {/* 名字輸入區塊 */}
        <View style={styles.inputContainer}>
          <Text style={styles.askText}>來者何人?!</Text>
          <TextInput
            style={styles.textInput}
            value={name}
            onChangeText={setName}
            placeholder="請輸入你的名字"
            placeholderTextColor="#666"
            textAlign="center"
          />
        </View>

        {/* 底部按鈕區塊 */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity onPress={handleFinish} style={styles.skipButton}>
            <Text style={styles.skipText}>跳過</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleFinish} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>下一步</Text>
          </TouchableOpacity>

          {/* 底部小圓點 */}
          <View style={styles.dotsContainer}>
            <View style={[styles.dot, styles.activeDot]} />
            <View style={styles.dot} />
            <View style={styles.dot} />
            <View style={styles.dot} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151515', // 深色背景
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
    marginTop: 20,
    width: '60%',
    alignSelf: 'center',
  },
  progressBarFill: {
    width: '25%', // 代表第一步
    height: '100%',
    backgroundColor: '#7AC1C9',
    borderRadius: 2,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  mainImage: {
    width: '100%',
    aspectRatio: 4 / 3, // 調整為接近你截圖的比例
    borderRadius: 20,
    marginTop: 20,
  },
  inputContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  askText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    width: '80%',
    paddingVertical: 10,
  },
  bottomContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  skipButton: {
    marginBottom: 15,
  },
  skipText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: '#7AC1C9',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#555555',
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
  },
});