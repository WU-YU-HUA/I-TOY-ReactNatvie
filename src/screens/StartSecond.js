import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
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
import SwipeWrapper from '../components/SwipeBack';

export default function SecondScreen({ onNext, onBack, initialEmail }) {
  // 使用 initialEmail 作為初始狀態，確保返回時資料還在
  const [inputValue, setInputValue] = useState(initialEmail || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNext = async () => {
    setErrorMessage('');

    if (!inputValue || !inputValue.includes('@')) {
      setErrorMessage('請輸入有效的 Email 地址');
      return;
    }

    setIsLoading(true);

    try {
      const API_URL = process.env.EXPO_PUBLIC_BACKEND;
      const url = `${API_URL}/api/user/send_otp/`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inputValue,
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }

      if (response.status === 200) {
        onNext(inputValue); 
      } else if (response.status === 400) {
        const errorText = typeof data === 'string' ? data : (data.message || data.error || '發生錯誤，請稍後再試');
        setErrorMessage(errorText);
      } else {
        setErrorMessage('伺服器發生異常，請稍後再試');
      }

    } catch (error) {
      setErrorMessage('無法連接到伺服器，請檢查網路連線');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SwipeWrapper onBack={onBack}>
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
                <Text style={styles.title}>讓我們更了解妳</Text>
                <Text style={styles.subtitle}>提供更好的服務品質</Text>
              </View>
            </View>

            {/* 中間區域 */}
            <View style={styles.centerContent}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?q=80&w=1000&auto=format&fit=crop' }} 
                style={styles.mainImage}
                contentFit="cover"
              />
              <Text style={styles.hintText}>不會影響app體驗</Text>

              {/* 輸入框區域 */}
              <View style={{ width: '100%' }}>
                <View style={styles.inputSection}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="mail" size={40} color="#FFFFFF" />
                    <View style={styles.iconBadge} />
                  </View>

                  <View style={[styles.inputBox, errorMessage ? styles.inputBoxError : null]}>
                    <View style={styles.inputTextWrapper}>
                      <Text style={styles.inputLabel}>Email</Text>
                      <TextInput
                        style={styles.textInput}
                        value={inputValue}
                        onChangeText={(text) => {
                          setInputValue(text);
                          if (errorMessage) setErrorMessage(''); 
                        }}
                        placeholder="example@email.com"
                        placeholderTextColor="#666"
                        autoCorrect={false}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                    {inputValue.length > 0 && (
                      <TouchableOpacity onPress={() => {
                        setInputValue('');
                        setErrorMessage('');
                      }}>
                        <Ionicons name="close-circle-outline" size={24} color="#666" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                
                {errorMessage ? (
                  <Text style={styles.errorText}>{errorMessage}</Text>
                ) : null}
              </View>

            </View>

            {/* 底部按鈕區域 */}
            <View style={styles.bottomContainer}>
              <TouchableOpacity 
                onPress={handleNext} 
                style={[styles.nextButton, isLoading && { opacity: 0.7 }]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.nextButtonText}>下一步</Text>
                )}
              </TouchableOpacity>

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
    </SwipeWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151515' },
  innerContainer: { flex: 1, paddingHorizontal: 30, justifyContent: 'space-between', paddingBottom: 20 },
  progressBarContainer: { height: 4, backgroundColor: '#333333', borderRadius: 2, marginTop: 20, width: '60%', alignSelf: 'center' },
  progressBarFill: { width: '50%', height: '100%', backgroundColor: '#7AC1C9', borderRadius: 2 },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10, letterSpacing: 2 },
  subtitle: { fontSize: 14, color: '#AAAAAA' },
  centerContent: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  mainImage: { width: '100%', aspectRatio: 1, borderRadius: 20, marginBottom: 15 },
  hintText: { color: '#DDDDDD', fontSize: 14, marginBottom: 30 },
  inputSection: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 10 },
  iconContainer: { marginRight: 15, position: 'relative' },
  iconBadge: { position: 'absolute', top: -2, right: -2, width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFFFFF' },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAE5EA', borderRadius: 6, paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: 'transparent' },
  inputBoxError: { borderColor: '#FF6B6B' },
  inputTextWrapper: { flex: 1 },
  inputLabel: { fontSize: 12, color: '#666666', marginBottom: 2 },
  textInput: { color: '#000000', fontSize: 16, paddingVertical: 0 },
  errorText: { color: '#FF6B6B', fontSize: 13, marginTop: 8, marginLeft: 65 },
  bottomContainer: { alignItems: 'center', marginTop: 'auto' },
  nextButton: { backgroundColor: '#7AC1C9', width: '100%', paddingVertical: 15, borderRadius: 25, alignItems: 'center', marginBottom: 20 },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  dotsContainer: { flexDirection: 'row', gap: 8, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555555' },
  activeDot: { backgroundColor: '#FFFFFF' },
});