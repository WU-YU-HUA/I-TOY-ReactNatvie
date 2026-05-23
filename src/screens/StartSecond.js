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

export default function SecondScreen({ onNext, onBack, initialEmail }) {
  const [inputValue, setInputValue] = useState(initialEmail || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNext = async () => {
    setErrorMessage('');
    if (!inputValue || !inputValue.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_BACKEND;
      const url = `${API_URL}/api/user/send_otp/`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inputValue }),
      });

      let data;
      try { data = await response.json(); } catch (e) { data = await response.text(); }

      if (response.status === 200) {
        onNext(inputValue); 
      } else if (response.status === 400) {
        const errorText = typeof data === 'string' ? data : (data.message || data.error || 'Something went wrong, please try again later.');
        setErrorMessage(errorText);
      } else {
        setErrorMessage('Server error, please try again later.');
      }
    } catch (error) {
      setErrorMessage('Unable to connect to the server.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Keyboard.dismiss();
    if (onNext) onNext("");
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
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarFill} />
              </View>

              <View style={styles.headerContainer}>
                <Text style={styles.title}>Register with your email</Text>
                <Text style={styles.subtitle}>for optimal user experience</Text>
              </View>
            </View>

            <View style={styles.centerContent}>
              <Image
                source={{ uri: 'https://m.media-amazon.com/images/I/3190wEBjpYL._SL500_.jpg' }}
                style={styles.mainImage}
                contentFit="contain"
              />

              {/* 👈 改成跟 StartFirst 一樣的輸入欄結構 */}
              <View style={styles.inputContainer}>
                <Text style={styles.askText}>Please enter your email</Text>
                <TextInput
                  style={[styles.textInput, errorMessage ? styles.textInputError : null]}
                  value={inputValue}
                  onChangeText={(text) => {
                    setInputValue(text);
                    if (errorMessage) setErrorMessage(''); 
                  }}
                  placeholder="example@email.com"
                  placeholderTextColor="#666"
                  textAlign="center"
                  autoCorrect={false}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
              </View>

            </View>

            <View style={styles.bottomContainer}>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleNext} 
                style={[styles.nextButton, isLoading && { opacity: 0.7 }]}
                disabled={isLoading}
              >
                {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.nextButtonText}>Next</Text>}
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
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151515' },
  innerContainer: { flex: 1, paddingHorizontal: 30, justifyContent: 'space-between', paddingBottom: 20 },
  progressBarContainer: { height: 4, backgroundColor: '#333333', borderRadius: 2, marginTop: 20, width: '60%', alignSelf: 'center' },
  progressBarFill: { width: '50%', height: '100%', backgroundColor: '#7AC1C9', borderRadius: 2 },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#AAAAAA'},
  centerContent: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  mainImage: { width: '100%', aspectRatio: 1, borderRadius: 20, marginBottom: 15},
  hintText: { color: '#DDDDDD', fontSize: 14, marginBottom: 10 },
  
  // 👈 套用 StartFirst 的輸入欄樣式
  inputContainer: { alignItems: 'center', width: '100%', marginTop: 15 },
  askText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 15 },
  textInput: { color: '#FFFFFF', fontSize: 18, borderBottomWidth: 1, borderBottomColor: '#333333', width: '80%', paddingVertical: 10, marginBottom: 10 },
  textInputError: { borderBottomColor: '#FF6B6B' },
  errorText: { color: '#FF6B6B', fontSize: 13, marginBottom: 10, textAlign: 'center' },

  bottomContainer: { alignItems: 'center', marginTop: 'auto' },
  skipButton: { paddingVertical: 10, marginBottom: 10, alignItems: 'center' },
  skipButtonText: { color: '#AAAAAA', fontSize: 16, textDecorationLine: 'underline' },
  nextButton: { backgroundColor: '#7AC1C9', width: '100%', paddingVertical: 15, borderRadius: 25, alignItems: 'center', marginBottom: 20 },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  dotsContainer: { flexDirection: 'row', gap: 8, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555555' },
  activeDot: { backgroundColor: '#FFFFFF' },
});