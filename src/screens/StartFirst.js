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

export default function FirstScreen({ onNext, initialName }) { // 👈 接收 initialName
  const [name, setName] = useState(initialName || ''); // 👈 設定初始值

  const handleNext = () => {
    Keyboard.dismiss();
    if (name.trim().length === 0) {
      // 這裡可以加個簡單提醒，如果沒輸入名字不給過
      return;
    }
    if (onNext) {
      onNext(name); // 👈 關鍵：把輸入的名字傳給 OnboardFlow
    }
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
              <Text style={styles.subtitle}>Discover the next merchandise for you</Text>
            </View>
          </View>

          <View style={styles.centerContent}>
            <Image
              source={require('../../assets/images/amazon.jpg')} 
              style={styles.mainImage}
              contentFit="cover"
            />

            <View style={styles.inputContainer}>
              <Text style={styles.askText}>Who are you?!</Text>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Please enter your name"
                placeholderTextColor="#666"
                textAlign="center"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={handleNext} // 👈 統一邏輯
              />
            </View>
          </View>

          <View style={styles.bottomContainer}>
            <TouchableOpacity 
              onPress={handleNext} // 👈 統一邏輯
              style={[styles.nextButton, name.trim().length === 0 && { opacity: 0.5 }]}
              disabled={name.trim().length === 0}
            >
              <Text style={styles.nextButtonText}>下一步</Text>
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
    width: '25%', 
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
    aspectRatio: 4 / 3, 
    borderRadius: 20,
    marginBottom: 30, 
  },
  inputContainer: {
    alignItems: 'center',
    width: '100%',
  },
  askText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15, 
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
    width: '80%',
    paddingVertical: 10,
    marginBottom: 20, 
  },
  bottomContainer: {
    alignItems: 'center',
    marginTop: 'auto', 
  },
  nextButton: {
    backgroundColor: '#7AC1C9',
    width: '100%',
    paddingVertical: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#7AC1C9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5, 
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