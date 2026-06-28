import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Dimensions,
  Linking, Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { updateUserData } from '../utilise/UpdateUser';

const { height } = Dimensions.get('window');

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  const [profile, setProfile] = useState({
    name: '',
    gender: '',
    birthdate: ''
  });
  
  const [isNotifEnabled, setIsNotifEnabled] = useState(false);
  
  const [editData, setEditData] = useState({ ...profile });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const storedProfile = await AsyncStorage.getItem('userProfile');
      const notifStatus = await AsyncStorage.getItem('@has_prompted_notification');
      
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setProfile(parsed);
        setEditData(parsed);
      }
      setIsNotifEnabled(notifStatus === 'true');
    } catch (error) {
      console.error('Load Profile Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNotification = async (value) => {
    if (value === true) {
      const { status } = await Notifications.getPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          "Notifications Disabled",
          "To receive the latest updates, please enable notifications in your device settings.",
          [
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => setIsNotifEnabled(false) 
            },
            {
              text: "Open Settings",
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:'); 
                } else {
                  Linking.openSettings();
                }
                setIsNotifEnabled(false); 
              }
            }
          ]
        );
        return;
      }
    }

    setIsNotifEnabled(value);
    await AsyncStorage.setItem('@has_prompted_notification', value ? 'true' : 'false');
  };

  const handleSave = async () => {
    setLoading(true);
    const payload = {
      name: editData.name,
      gender: editData.gender,
      birthdate: editData.birthdate
    };

    const result = await updateUserData(payload);

    setLoading(false);

    const updatedProfile = { ...profile, ...payload };
    setProfile(updatedProfile);
    setIsEditing(false); 

    if (result.success) {
      Alert.alert('Success', 'Profile updated.');
    } else {
      Alert.alert('Alert', "Update Local First.");
    }
  };

  if (loading && !isEditing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7AC1C9" />
      </View>
    );
  }

  return (
    // 👈 這裡把 SafeAreaView 改回普通的 View
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        {!isEditing && (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Ionicons name="pencil" size={20} color="#7AC1C9" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.label}>Name</Text>
            {isEditing ? (
              <TextInput 
                style={styles.input} 
                value={editData.name} 
                onChangeText={(t) => setEditData({...editData, name: t})}
                placeholderTextColor="#666"
              />
            ) : (
              <Text style={styles.value}>{profile.name}</Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Gender</Text>
            {isEditing ? (
              <View style={styles.genderContainer}>
                {['M', 'F', 'N'].map((g) => (
                  <TouchableOpacity 
                    key={g} 
                    onPress={() => setEditData({...editData, gender: g})}
                    style={[styles.genderTag, editData.gender === g && styles.genderTagActive]}
                  >
                    <Text style={[styles.genderTagText, editData.gender === g && styles.genderTagTextActive]}>
                      {g === 'M' ? 'Male' : g === 'F' ? 'Female' : 'Secret'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.value}>
                {profile.gender === 'M' ? 'Male' : profile.gender === 'F' ? 'Female' : 'Secret'}
              </Text>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Birthdate</Text>
            {isEditing ? (
              <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                <Text style={{ color: '#000' }}>{editData.birthdate || 'Not set'}</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.value}>{profile.birthdate}</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.notifRow}>
            <View>
              <Text style={styles.sectionTitle}>Notifications</Text>
              <Text style={styles.subLabel}>Receive the latest information</Text>
            </View>
            <Switch 
              value={isNotifEnabled} 
              onValueChange={toggleNotification}
              trackColor={{ false: "#333", true: "#7AC1C9" }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {/* 👈 新增的 Amazon 聲明區塊 */}
        <View style={styles.section}>
          <Text style={styles.disclaimerText}>
            As an Amazon Associate I earn from qualifying purchases.
          </Text>
        </View>

        {isEditing && (
          <View style={styles.buttonGroup}>
            <TouchableOpacity 
              style={[styles.btn, styles.btnSave]} 
              onPress={handleSave}
            >
              <Text style={styles.btnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, styles.btnCancel]} 
              onPress={() => {
                setEditData({...profile});
                setIsEditing(false);
              }}
            >
              <Text style={styles.btnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {showDatePicker && (
        <View style={styles.datePickerContainer}>
          {Platform.OS === 'ios' && (
            <View style={styles.datePickerHeader}>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Text style={styles.datePickerDoneText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <DateTimePicker
            value={editData.birthdate ? new Date(editData.birthdate) : new Date(2000, 0, 1)}
            mode="date"
            display="spinner"
            onChange={(event, date) => {
              if (Platform.OS === 'android') {
                setShowDatePicker(false);
              }
              
              if (date) {
                const formatted = date.toISOString().split('T')[0];
                setEditData({...editData, birthdate: formatted});
              }
            }}
          />
        </View>
      )}
    </View> // 👈 對應原本的 SafeAreaView 結尾
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151515' },
  loadingContainer: { flex: 1, backgroundColor: '#151515', justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    // 👈 這裡保持和 SavedScreen / Discover 相同的 Padding 設定
    paddingTop: height * 0.08, 
    paddingHorizontal: 25, 
    paddingBottom: 20, 
    borderBottomWidth: 0.5, 
    borderBottomColor: '#333' 
  },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  content: { padding: 20 },
  section: { backgroundColor: '#222', borderRadius: 15, padding: 15, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#7AC1C9', marginBottom: 10 },
  infoRow: { marginBottom: 15 },
  label: { fontSize: 12, color: '#AAA', marginBottom: 5 },
  value: { fontSize: 16, color: '#FFF', fontWeight: '500' },
  subLabel: { fontSize: 12, color: '#666' },
  input: { backgroundColor: '#EAE5EA', borderRadius: 8, padding: 10, color: '#000', fontSize: 16 },
  notifRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  genderContainer: { flexDirection: 'row', gap: 10 },
  genderTag: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20, backgroundColor: '#333' },
  genderTagActive: { backgroundColor: '#7AC1C9' },
  genderTagText: { color: '#AAA' },
  genderTagTextActive: { color: '#FFF', fontWeight: 'bold' },
  buttonGroup: { flexDirection: 'row', gap: 15, marginTop: 10 },
  btn: { flex: 1, paddingVertical: 15, borderRadius: 30, alignItems: 'center' },
  btnSave: { backgroundColor: '#7AC1C9' },
  btnCancel: { backgroundColor: '#444' },
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  // 👈 新增的 disclaimerText 樣式
  disclaimerText: { fontSize: 12, color: '#666', textAlign: 'center', fontStyle: 'italic' },
  datePickerContainer: {
    backgroundColor: '#222', 
    borderRadius: 15,
    padding: 10,
    marginTop: 10,
    marginHorizontal: 20,
    marginBottom: 20
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#444'
  },
  datePickerDoneText: {
    color: '#7AC1C9',
    fontSize: 16,
    fontWeight: 'bold'
  },
});