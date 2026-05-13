import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as SecureStore from 'expo-secure-store';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import SwipeWrapper from '../components/SwipeBack'; // 👈 引入手勢包裝

export default function ThirdScreen({ email, onNext, onBack }) {
  const [otpValue, setOtpValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNext = async () => {
    if (otpValue.length !== 6) return;

    setIsLoading(true);
    setErrorMessage('');

    try {
      const API_URL = process.env.EXPO_PUBLIC_BACKEND;
      const url = `${API_URL}/api/user/check_otp/`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email, 
          otp: otpValue
        }),
      });

      const rawContent = await response.text(); 

      if (response.status === 200) {
        // 在「存入」前就把它洗乾淨
        const cleanToken = rawContent.replace(/"/g, '').trim();

        if (cleanToken) {
          await SecureStore.setItemAsync('userToken', cleanToken);
        }
        onNext(); 
      } else if (response.status === 401) {
        setErrorMessage('驗證碼錯誤，請重新輸入或嘗試重發');
      } else {
        // 發生錯誤時顯示後端回傳的訊息
        setErrorMessage(rawContent || '伺服器異常，請稍後再試');
      }
    } catch (error) {
      setErrorMessage('網路連線失敗');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_BACKEND;
      const url = `${API_URL}/api/user/send_otp/`; 
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email }),
      });

      if (response.status === 200) {
        Alert.alert('已重送', '新的驗證碼已寄送到您的信箱');
        setOtpValue(''); 
      }
    } catch (error) {
      Alert.alert('錯誤', '無法重送驗證碼');
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
            <View>
              <View style={styles.progressBarContainer}><View style={styles.progressBarFill} /></View>
              <View style={styles.headerContainer}>
                <Text style={styles.title}>請輸入驗證碼</Text>
                <Text style={styles.subtitle}>已寄送至 {email}</Text>
              </View>
            </View>

            <View style={styles.centerContent}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=1000&auto=format&fit=crop' }} 
                style={styles.mainImage}
                contentFit="cover"
              />
              
              <View style={{ width: '100%' }}>
                <View style={styles.inputSection}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="shield-checkmark" size={40} color="#FFFFFF" />
                  </View>

                  <View style={[styles.inputBox, errorMessage ? styles.inputBoxError : null]}>
                    <View style={styles.inputTextWrapper}>
                      <Text style={styles.inputLabel}>6位驗證碼</Text>
                      <TextInput
                        style={styles.textInput}
                        value={otpValue}
                        onChangeText={(text) => {
                          setOtpValue(text.replace(/[^0-9]/g, ''));
                          if (errorMessage) setErrorMessage('');
                        }}
                        placeholder="123456"
                        placeholderTextColor="#666"
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                    </View>
                  </View>
                </View>
                
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                <TouchableOpacity onPress={handleResendOtp} style={styles.resendButton}>
                  <Text style={styles.resendText}>沒收到驗證碼？點此重送</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.bottomContainer}>
              <TouchableOpacity 
                onPress={handleNext} 
                style={[styles.nextButton, otpValue.length < 6 ? styles.nextButtonDisabled : null]}
                disabled={otpValue.length < 6 || isLoading}
              >
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.nextButtonText}>下一步</Text>}
              </TouchableOpacity>

              <View style={styles.dotsContainer}>
                <View style={styles.dot} /><View style={styles.dot} />
                <View style={[styles.dot, styles.activeDot]} /><View style={styles.dot} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
    </SwipeWrapper>
  );
}

const styles = StyleSheet.create({
  resendButton: { marginTop: 20, alignItems: 'center' },
  resendText: { color: '#7AC1C9', fontSize: 14, textDecorationLine: 'underline' },
  container: { flex: 1, backgroundColor: '#151515' },
  innerContainer: { flex: 1, paddingHorizontal: 30, justifyContent: 'space-between', paddingBottom: 20 },
  progressBarContainer: { height: 4, backgroundColor: '#333333', borderRadius: 2, marginTop: 20, width: '60%', alignSelf: 'center' },
  progressBarFill: { width: '75%', height: '100%', backgroundColor: '#7AC1C9', borderRadius: 2 },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10, letterSpacing: 2 },
  subtitle: { fontSize: 14, color: '#AAAAAA' },
  centerContent: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  mainImage: { width: '100%', aspectRatio: 1, borderRadius: 20, marginBottom: 15 },
  inputSection: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 10 },
  iconContainer: { marginRight: 15, position: 'relative' },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAE5EA', borderRadius: 6, paddingHorizontal: 15, paddingVertical: 8, borderWidth: 1, borderColor: 'transparent' },
  inputBoxError: { borderColor: '#FF6B6B' },
  inputTextWrapper: { flex: 1 },
  inputLabel: { fontSize: 12, color: '#666666', marginBottom: 2 },
  textInput: { color: '#000000', fontSize: 16, paddingVertical: 0 },
  errorText: { color: '#FF6B6B', fontSize: 13, marginTop: 8, marginLeft: 65 },
  bottomContainer: { alignItems: 'center', marginTop: 'auto' },
  nextButton: { backgroundColor: '#7AC1C9', width: '100%', paddingVertical: 15, borderRadius: 25, alignItems: 'center', marginBottom: 20 },
  nextButtonDisabled: { backgroundColor: '#333333' },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  dotsContainer: { flexDirection: 'row', gap: 8, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555555' },
  activeDot: { backgroundColor: '#FFFFFF' },
});