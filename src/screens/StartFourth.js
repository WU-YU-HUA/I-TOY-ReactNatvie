import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';

export default function StartFourth({ onSubmit, onBack }) {
  const [date, setDate] = useState(new Date(2000, 0, 1)); 
  const [birthdate, setBirthdate] = useState('2000-01-01'); 
  const [showPicker, setShowPicker] = useState(false); 
  const [gender, setGender] = useState(''); 

  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowPicker(false); 
    if (selectedDate) {
      setDate(selectedDate);
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setBirthdate(`${year}-${month}-${day}`); 
    }
  };

  const handleFinish = () => {
    if (birthdate.length !== 10 || !gender) return;
    onSubmit(birthdate, gender);
  };

  const handleSkip = () => {
    onSubmit("", "");
  };

  const isFormValid = birthdate.length === 10 && gender !== '';

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
                <Text style={styles.title}>Let's get to know you better</Text>
                <Text style={styles.subtitle}>Please set your birthday and gender</Text>
              </View>
            </View>

            <View style={styles.centerContent}>
              <Image
                source={{ uri: 'https://m.media-amazon.com/images/I/31UKTZnmCKL._SL500_.jpg' }}
                style={styles.mainImage}
                contentFit="contain"
              />
              
              <View style={styles.formContainer}>
                <View style={styles.inputSection}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="calendar" size={32} color="#FFFFFF" />
                  </View>
                  <TouchableOpacity 
                    style={styles.inputBox} 
                    activeOpacity={0.7}
                    onPress={() => setShowPicker(true)}
                  >
                    <View style={styles.inputTextWrapper}>
                      <Text style={styles.inputLabel}>Birthdate yyyy-mm-dd</Text>
                      {/* 👈 日期文字改為白色 */}
                      <Text style={styles.dateText}>{birthdate}</Text>
                    </View>
                    <Ionicons name="chevron-down" size={20} color="#666" />
                  </TouchableOpacity>
                </View>

                <View style={styles.genderSection}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="person" size={32} color="#FFFFFF" />
                  </View>
                  <View style={styles.genderOptions}>
                    <TouchableOpacity 
                      style={[styles.genderButton, gender === 'M' && styles.genderButtonActive]}
                      onPress={() => setGender('M')}
                    >
                      <Text style={[styles.genderButtonText, gender === 'M' && styles.genderTextActive]}>Male</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.genderButton, gender === 'F' && styles.genderButtonActive]}
                      onPress={() => setGender('F')}
                    >
                      <Text style={[styles.genderButtonText, gender === 'F' && styles.genderTextActive]}>Female</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.genderButton, gender === 'N' && styles.genderButtonActive]}
                      onPress={() => setGender('N')}
                    >
                      <Text style={[styles.genderButtonText, gender === 'N' && styles.genderTextActive]}>Private</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.bottomContainer}>
              <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleFinish} 
                style={[styles.nextButton, !isFormValid ? styles.nextButtonDisabled : null]}
                disabled={!isFormValid}
              >
                <Text style={[styles.nextButtonText, !isFormValid ? styles.nextButtonTextDisabled : null]}>Complete</Text>
              </TouchableOpacity>

              <View style={styles.dotsContainer}>
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={styles.dot} />
                <View style={[styles.dot, styles.activeDot]} /> 
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>

        {showPicker && Platform.OS === 'ios' && (
          <Modal transparent={true} animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.pickerContainer}>
                <View style={styles.pickerHeader}>
                  <TouchableOpacity onPress={() => setShowPicker(false)}>
                    <Text style={styles.pickerConfirmText}>Complete</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  style={{ alignSelf: 'center', width: '100%' }}
                  value={date}
                  mode="date"
                  display="spinner" 
                  onChange={onChangeDate}
                  themeVariant="dark" 
                  maximumDate={new Date()} 
                />
              </View>
            </View>
          </Modal>
        )}
        {showPicker && Platform.OS === 'android' && (
          <DateTimePicker value={date} mode="date" display="spinner" onChange={onChangeDate} maximumDate={new Date()} />
        )}
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151515' },
  innerContainer: { flex: 1, paddingHorizontal: 30, justifyContent: 'space-between', paddingBottom: 20 },
  progressBarContainer: { height: 4, backgroundColor: '#333333', borderRadius: 2, marginTop: 20, width: '60%', alignSelf: 'center' },
  progressBarFill: { width: '100%', height: '100%', backgroundColor: '#7AC1C9', borderRadius: 2 },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#AAAAAA' },
  centerContent: { alignItems: 'center', flex: 1, justifyContent: 'flex-start' }, 
  mainImage: { width: '90%', aspectRatio: 1, borderRadius: 20, marginBottom: 30, marginTop: 10 }, 
  formContainer: { width: '100%', gap: 20}, 
  inputSection: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 5 },
  iconContainer: { width: 40, alignItems: 'center', marginRight: 10 },
  
  // 👈 拿掉白底，改成透明底 + 底線 (類似前面的輸入框)
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: 'transparent', borderBottomWidth: 1, borderBottomColor: '#333333', paddingHorizontal: 5, paddingVertical: 10 }, 
  inputTextWrapper: { flex: 1 },
  inputLabel: { fontSize: 12, color: '#888888', marginBottom: 4 },
  // 👈 日期文字改為白色
  dateText: { color: '#FFFFFF', fontSize: 18, fontWeight: '500' }, 
  
  genderSection: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 5 },
  genderOptions: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  genderButton: { flex: 1, backgroundColor: '#222222', paddingVertical: 12, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#333333' },
  // 👈 拿掉選取時的白底，改為透明底 + 主題色框線
  genderButtonActive: { backgroundColor: 'transparent', borderColor: '#7AC1C9' },
  genderButtonText: { color: '#666666', fontSize: 16, fontWeight: '600' },
  // 👈 選取時的文字改為主題色 (或白色)
  genderTextActive: { color: '#7AC1C9' }, 
  
  bottomContainer: { alignItems: 'center', marginTop: 'auto' },
  skipButton: { paddingVertical: 10, marginBottom: 10, alignItems: 'center' },
  skipButtonText: { color: '#AAAAAA', fontSize: 16, textDecorationLine: 'underline' },
  nextButton: { backgroundColor: '#7AC1C9', width: '100%', paddingVertical: 15, borderRadius: 25, alignItems: 'center', marginBottom: 20 },
  nextButtonDisabled: { backgroundColor: '#333333' },
  nextButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  nextButtonTextDisabled: { color: '#888888' },
  dotsContainer: { flexDirection: 'row', gap: 8, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#555555' },
  activeDot: { backgroundColor: '#FFFFFF' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  pickerContainer: { backgroundColor: '#2A2A2A', paddingBottom: 30, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  pickerHeader: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#444' },
  pickerConfirmText: { color: '#7AC1C9', fontSize: 18, fontWeight: 'bold' },
});