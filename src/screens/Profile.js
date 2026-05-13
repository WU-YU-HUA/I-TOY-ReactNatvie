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
    // 1. 檢查目前的系統權限狀態
    const { status } = await Notifications.getPermissionsAsync();

    if (status !== 'granted') {
      // 2. 如果沒權限，彈窗詢問是否前往設定
      Alert.alert(
        "通知權限未開啟",
        "為了接收最新資訊，請至手機設定中允許通知。",
        [
          {
            text: "取消",
            style: "cancel",
            onPress: () => setIsNotifEnabled(false) // 把開關彈回去
          },
          {
            text: "前往設定",
            onPress: () => {
              // 3. 關鍵動作：跳轉到系統設定頁面
              if (Platform.OS === 'ios') {
                Linking.openURL('app-settings:'); 
              } else {
                Linking.openSettings();
              }
              setIsNotifEnabled(false); // 先彈回去，等使用者回來後再根據權限更新
            }
          }
        ]
      );
      return;
    }
  }

  // 如果原本就有權限，或者使用者是想關閉開關
  setIsNotifEnabled(value);
  await AsyncStorage.setItem('@has_prompted_notification', value ? 'true' : 'false');
};
  // 3. 儲存更新 (API & Local)
  const handleSave = async () => {
    setLoading(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_BACKEND;
      const token = await SecureStore.getItemAsync('userToken');

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
        // 更新成功後，同步更新本地 AsyncStorage
        const updatedProfile = { ...profile, ...editData };
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        setProfile(updatedProfile);
        setIsEditing(false);
        Alert.alert('成功', '個人資料已更新');
      } else {
        Alert.alert('失敗', '更新失敗，請稍後再試');
      }
    } catch (error) {
      Alert.alert('錯誤', '無法連接到伺服器');
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
                <Text style={{ color: '#000' }}>{editData.birthdate}</Text>
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
          value={new Date(editData.birthdate)}
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
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