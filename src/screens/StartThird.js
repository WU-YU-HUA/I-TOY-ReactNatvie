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
        body: JSON.stringify({ email: email, otp: otpValue }),
      });

      const rawContent = await response.text(); 
      if (response.status === 200) {
        const cleanToken = rawContent.replace(/"/g, '').trim();
        if (cleanToken) await SecureStore.setItemAsync('userToken', cleanToken);
        onNext(); 
      } else if (response.status === 401) {
        setErrorMessage('Invalid verification code, please try again or request resend.');
      } else {
        setErrorMessage(rawContent || 'Server error, please try again later.');
      }
    } catch (error) {
      setErrorMessage('Unable to connect to the server.');
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
        Alert.alert('Resent', 'New code has been sent.');
        setOtpValue(''); 
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to resend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Keyboard.dismiss();
    if (onNext) onNext();
  };

  return (
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
                <Text style={styles.title}>Please enter verification code</Text>
                <Text style={styles.subtitle}>sent to: {email}</Text>
              </View>
            </View>

            <View style={styles.centerContent}>
              <Image
                source={{ uri: 'https://m.media-amazon.com/images/I/419SI1zXJ6L._SL500_.jpg' }}
                style={styles.mainImage}
                contentFit="contain"
              />
              
              {/* 👈 改成極簡底線置中風格 */}
              <View style={styles.inputContainer}>
                <Text style={styles.askText}>Please enter 6-digit code</Text>
                <TextInput
                  style={[styles.textInput, errorMessage ? styles.textInputError : null]}
                  value={otpValue}
                  onChangeText={(text) => {
                    setOtpValue(text.replace(/[^0-9]/g, ''));
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="123456"
                  placeholderTextColor="#666"
                  textAlign="center"
                  keyboardType="number-pad"
                  maxLength={6}
                />
                
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

                <TouchableOpacity onPress={handleResendOtp} style={styles.resendButton}>
                  <Text style={styles.resendText}>Didn't receive code? Resend</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.bottomContainer}>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleNext} 
                style={[styles.nextButton, otpValue.length < 6 ? styles.nextButtonDisabled : null]}
                disabled={otpValue.length < 6 || isLoading}
              >
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.nextButtonText}>Next</Text>}
              </TouchableOpacity>

              <View style={styles.dotsContainer}>
                <View style={styles.dot} /><View style={styles.dot} />
                <View style={[styles.dot, styles.activeDot]} /><View style={styles.dot} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151515' },
  innerContainer: { flex: 1, paddingHorizontal: 30, justifyContent: 'space-between', paddingBottom: 20 },
  progressBarContainer: { height: 4, backgroundColor: '#333333', borderRadius: 2, marginTop: 20, width: '60%', alignSelf: 'center' },
  progressBarFill: { width: '75%', height: '100%', backgroundColor: '#7AC1C9', borderRadius: 2 },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#AAAAAA', textAlign: 'center' },
  centerContent: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  mainImage: { width: '100%', aspectRatio: 1, borderRadius: 20, marginBottom: 15 },
  
  // 👈 套用極簡輸入框樣式
  inputContainer: { alignItems: 'center', width: '100%', marginTop: 15 },
  askText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 15 },
  textInput: { color: '#FFFFFF', fontSize: 18, borderBottomWidth: 1, borderBottomColor: '#333333', width: '80%', paddingVertical: 10, marginBottom: 10, letterSpacing: 3 }, // 加一點 letterSpacing 讓數字分開比較好看
  textInputError: { borderBottomColor: '#FF6B6B' },
  errorText: { color: '#FF6B6B', fontSize: 13, marginBottom: 10, textAlign: 'center' },

  resendButton: { marginTop: 10, alignItems: 'center' },
  resendText: { color: '#7AC1C9', fontSize: 14, textDecorationLine: 'underline' },
  
  bottomContainer: { alignItems: 'center', marginTop: 'auto' },
  skipButton: { paddingVertical: 10, marginBottom: 10, alignItems: 'center' },
  skipButtonText: { color: '#AAAAAA', fontSize: 16, textDecorationLine: 'underline' },
  nextButton: { backgroundColor: '#7AC1C9', width: '100%', paddingVertical: 15, borderRadius: 25, alignItems: 'center', marginBottom: 20 },
  nextButtonDisabled: { backgroundColor: '#333333' },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  dotsContainer: { flexDirection: 'row', gap: 8, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555555' },
  activeDot: { backgroundColor: '#FFFFFF' },
});