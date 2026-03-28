import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';

export default function SecondScreen({ onNext, onSkip }) {
  const [inputValue, setInputValue] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'position' : 'height'}
          style={{ flex: 1 }}
          contentContainerStyle={styles.innerContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* 頂部區域 */}
          <View>
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarFill} />
            </View>

            <View style={styles.headerContainer}>
              {/* 截圖中的紫框應該只是選取框，這邊實作粗體文字 */}
              <Text style={styles.title}>讓我們更了解妳</Text>
              <Text style={styles.subtitle}>提供更好的服務品質</Text>
            </View>
          </View>

          {/* 中間區域 */}
          <View style={styles.centerContent}>
            <Image
              // 請替換成你實際的圖片路徑
              source={{ uri: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=1000&auto=format&fit=crop' }} 
              style={styles.mainImage}
              contentFit="cover"
            />
            <Text style={styles.hintText}>不會影響app體驗</Text>

            {/* 輸入框區域 */}
            <View style={styles.inputSection}>
              {/* 左側信封圖標 (含右上角小圓點) */}
              <View style={styles.iconContainer}>
                <Ionicons name="mail" size={40} color="#FFFFFF" />
                <View style={styles.iconBadge} />
              </View>

              {/* 右側輸入框 */}
              <View style={styles.inputBox}>
                <View style={styles.inputTextWrapper}>
                  <Text style={styles.inputLabel}>Label</Text>
                  <TextInput
                    style={styles.textInput}
                    value={inputValue}
                    onChangeText={setInputValue}
                    placeholder="Input"
                    placeholderTextColor="#666"
                    autoCorrect={false}
                  />
                </View>
                {/* 右側清除按鈕 */}
                {inputValue.length > 0 ? (
                  <TouchableOpacity onPress={() => setInputValue('')}>
                    <Ionicons name="close-circle-outline" size={24} color="#666" />
                  </TouchableOpacity>
                ) : (
                  <Ionicons name="close-circle-outline" size={24} color="#666" style={{ opacity: 0.5 }} />
                )}
              </View>
            </View>
          </View>

          {/* 底部按鈕區塊 */}
          <View style={styles.bottomContainer}>
            <TouchableOpacity onPress={onSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>跳過</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onNext} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>下一步</Text>
            </TouchableOpacity>

            {/* 底部小圓點 - 第二顆亮起 */}
            <View style={styles.dotsContainer}>
              <View style={styles.dot} />
              <View style={[styles.dot, styles.activeDot]} /> 
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151515', 
  },
  innerContainer: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between', 
    paddingBottom: 20, 
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
    width: '50%', // 第二步，進度條變長
    height: '100%',
    backgroundColor: '#7AC1C9',
    borderRadius: 2,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20, 
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    letterSpacing: 2, // 稍微拉開字距增加質感
  },
  subtitle: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  centerContent: {
    alignItems: 'center',
    flex: 1, 
    justifyContent: 'center', 
  },
  mainImage: {
    width: '100%',
    aspectRatio: 1, // 截圖看起來偏向正方形
    borderRadius: 20,
    marginBottom: 15, 
  },
  hintText: {
    color: '#DDDDDD',
    fontSize: 14,
    marginBottom: 30,
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
  },
  iconContainer: {
    marginRight: 15,
    position: 'relative',
  },
  iconBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  inputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAE5EA', // 淺灰粉色背景
    borderRadius: 6,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  inputTextWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 2,
  },
  textInput: {
    color: '#000000',
    fontSize: 16,
    paddingVertical: 0, 
  },
  bottomContainer: {
    alignItems: 'center',
    marginTop: 'auto', 
  },
  skipButton: {
    marginBottom: 15,
    padding: 10, 
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
    marginTop: 10,
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