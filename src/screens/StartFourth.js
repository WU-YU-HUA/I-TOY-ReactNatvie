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
import SwipeWrapper from '../components/SwipeBack'; // 👈 引入手勢包裝

export default function StartFourth({ onSubmit, onBack }) {
  const [date, setDate] = useState(new Date(2000, 0, 1)); 
  const [birthdate, setBirthdate] = useState('2000-01-01'); 
  const [showPicker, setShowPicker] = useState(false); 
  const [gender, setGender] = useState(''); 

  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false); 
    }
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

  const isFormValid = birthdate.length === 10 && gender !== '';

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
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarFill} />
              </View>

              <View style={styles.headerContainer}>
                <Text style={styles.title}>最後一步了</Text>
                <Text style={styles.subtitle}>請設定你的生日與性別，完成個人檔案</Text>
              </View>
            </View>

            <View style={styles.centerContent}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=1000&auto=format&fit=crop' }} 
                style={styles.mainImage}
                contentFit="cover"
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
                      <Text style={styles.inputLabel}>出生年月日 (西元)</Text>
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
                      <Text style={[styles.genderButtonText, gender === 'M' && styles.genderTextActive]}>男</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.genderButton, gender === 'F' && styles.genderButtonActive]}
                      onPress={() => setGender('F')}
                    >
                      <Text style={[styles.genderButtonText, gender === 'F' && styles.genderTextActive]}>女</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.genderButton, gender === 'N' && styles.genderButtonActive]}
                      onPress={() => setGender('N')}
                    >
                      <Text style={[styles.genderButtonText, gender === 'N' && styles.genderTextActive]}>保密</Text>
                    </TouchableOpacity>
                  </View>
                </View>

              </View>
            </View>

            <View style={styles.bottomContainer}>
              <TouchableOpacity 
                onPress={handleFinish} 
                style={[styles.nextButton, !isFormValid ? styles.nextButtonDisabled : null]}
                disabled={!isFormValid}
              >
                <Text style={[styles.nextButtonText, !isFormValid ? styles.nextButtonTextDisabled : null]}>
                  完成註冊
                </Text>
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
                    <Text style={styles.pickerConfirmText}>完成</Text>
                  </TouchableOpacity>
                </View>
                
                <DateTimePicker
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
          <DateTimePicker
            value={date}
            mode="date"
            display="spinner"
            onChange={onChangeDate}
            maximumDate={new Date()}
          />
        )}

      </SafeAreaView>
    </SwipeWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151515' },
  innerContainer: { flex: 1, paddingHorizontal: 30, justifyContent: 'space-between', paddingBottom: 20 },
  progressBarContainer: { height: 4, backgroundColor: '#333333', borderRadius: 2, marginTop: 20, width: '60%', alignSelf: 'center' },
  progressBarFill: { width: '100%', height: '100%', backgroundColor: '#7AC1C9', borderRadius: 2 },
  headerContainer: { alignItems: 'center', marginTop: 30, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 10, letterSpacing: 2 },
  subtitle: { fontSize: 14, color: '#AAAAAA' },
  centerContent: { alignItems: 'center', flex: 1, justifyContent: 'flex-start' }, 
  mainImage: { width: '80%', aspectRatio: 16/9, borderRadius: 20, marginBottom: 30, marginTop: 10 }, 
  formContainer: { width: '100%', gap: 20 }, 
  inputSection: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 5 },
  iconContainer: { width: 40, alignItems: 'center', marginRight: 10 },
  inputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#EAE5EA', borderRadius: 6, paddingHorizontal: 15, paddingVertical: 12 }, 
  inputTextWrapper: { flex: 1 },
  inputLabel: { fontSize: 12, color: '#666666', marginBottom: 2 },
  dateText: { color: '#000000', fontSize: 16, fontWeight: '500' }, 
  genderSection: { flexDirection: 'row', alignItems: 'center', width: '100%', paddingHorizontal: 5 },
  genderOptions: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  genderButton: { flex: 1, backgroundColor: '#333333', paddingVertical: 12, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  genderButtonActive: { backgroundColor: '#EAE5EA', borderColor: '#7AC1C9' },
  genderButtonText: { color: '#AAAAAA', fontSize: 16, fontWeight: '600' },
  genderTextActive: { color: '#151515' }, 
  bottomContainer: { alignItems: 'center', marginTop: 'auto' },
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