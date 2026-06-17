import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback, // 👈 新增引入 ScrollView
  useWindowDimensions,
  View
} from 'react-native';

export default function FirstScreen({ onNext, initialName }) {
  const [name, setName] = useState(initialName || '');

  const { width, height } = useWindowDimensions();
  
  // 👈 加上第三個參數 250，鎖死圖片最大高度
  const imageSize = Math.min(width * 0.9, height * 0.4, 250);

  const handleNext = () => {
    Keyboard.dismiss();
    if (name.trim().length === 0) return;
    if (onNext) onNext(name);
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
              <Text style={styles.title}>Welcome!</Text>
              <Text style={styles.subtitle}>Discover the perfect piece for you</Text>
            </View>
          </View>

          {/* 👈 把 View 改成 ScrollView，並加上防呆屬性 */}
          <ScrollView 
            style={{ flex: 1, width: '100%' }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Image
              source={{ uri: "https://m.media-amazon.com/images/I/31CsSv5XJuL._SL500_.jpg" }}
              style={[styles.mainImage, { width: imageSize, height: imageSize }]}
              contentFit="contain"
            />

            <View style={styles.inputContainer}>
              <Text style={styles.askText}>What should we call you?</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Please enter your name"
                placeholderTextColor="#666"
                textAlign="center"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleNext} 
                maxLength={75}
              />
            </View>
          </ScrollView>

          <View style={styles.bottomContainer}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleNext}
              style={[styles.nextButton, name.trim().length === 0 && { opacity: 0.5 }]}
              disabled={name.trim().length === 0}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>

            <View style={styles.dotsContainer}>
              <View style={[styles.dot, styles.activeDot]} />
              <View style={styles.dot} />
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
  progressBarFill: { width: '25%', height: '100%', backgroundColor: '#7AC1C9', borderRadius: 2 },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  title: { fontSize: 34, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10 },
  subtitle: { fontSize: 18, color: '#AAAAAA' },
  mainImage: { borderRadius: 20 },
  inputContainer: { alignItems: 'center', width: '100%', marginTop: 30 },
  askText: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 15 },
  textInput: { color: '#FFFFFF', fontSize: 18, borderBottomWidth: 1, borderBottomColor: '#333333', width: '80%', paddingVertical: 10, marginBottom: 20 },
  bottomContainer: { alignItems: 'center', marginTop: 'auto' },
  skipButton: { paddingVertical: 10, marginBottom: 10, alignItems: 'center' },
  skipButtonText: { color: '#AAAAAA', fontSize: 16, textDecorationLine: 'underline' },
  nextButton: { backgroundColor: '#7AC1C9', width: '100%', paddingVertical: 15, borderRadius: 25, alignItems: 'center', marginBottom: 20, shadowColor: '#7AC1C9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  dotsContainer: { flexDirection: 'row', gap: 8, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555555' },
  activeDot: { backgroundColor: '#FFFFFF' },
});