import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert,
  Linking, Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // 使用者資料
  const [profile, setProfile] = useState({
    name: '',
    gender: '',
    birthdate: ''
  });
  
  // 通知狀態
  const [isNotifEnabled, setIsNotifEnabled] = useState(false);
  
  // 編輯用的暫存 State
  const [editData, setEditData] = useState({ ...profile });
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  // 1. 載入本地儲存的資料
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

  // 2. 切換通知開關
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

  // 3. 儲存更新 (API & Local)
  const handleSave = async () => {
    setLoading(true);
    try {
      const token = await SecureStore.getItemAsync('userToken');

      // 👈 定義一個共用的更新本地資料函式
      const updateLocalData = async () => {
        const updatedProfile = { ...profile, ...editData };
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        setProfile(updatedProfile);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated.');
      };

      // 👈 判斷：如果有 token 才打 API，沒有的話直接更新本地
      if (token) {
        const API_URL = process.env.EXPO_PUBLIC_BACKEND;
        const response = await fetch(`${API_URL}/api/user/update/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: editData.name,
            gender: editData.gender,
            birthdate: editData.birthdate
          })
        });

        if (response.status === 200) {
          await updateLocalData(); // API 成功後更新本地
        } else {
          Alert.alert('Fail', 'Update failed, please try again later.');
        }
      } else {
        // 👈 使用者當初選了 Skip，沒有 token，我們只更新本地 AsyncStorage
        await updateLocalData();
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Cannot establish connection to the server.');
    } finally {
      setLoading(false);
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
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Profile</Text>
        {!isEditing && (
          <TouchableOpacity onPress={() => setIsEditing(true)}>
            <Ionicons name="pencil" size={20} color="#7AC1C9" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Profile Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Information</Text>
          
          {/* Name Field */}
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

          {/* Gender Field */}
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

          {/* Birthdate Field */}
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

        {/* Notification Section */}
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

        {/* Edit Buttons */}
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
        <DateTimePicker
          value={editData.birthdate ? new Date(editData.birthdate) : new Date(2000, 0, 1)}
          mode="date"
          display="spinner"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) {
              const formatted = date.toISOString().split('T')[0];
              setEditData({...editData, birthdate: formatted});
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#151515' },
  loadingContainer: { flex: 1, backgroundColor: '#151515', justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
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
  btnText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 }
});