// services/userService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

export const updateUserData = async (userData) => {
  try {
    const token = await SecureStore.getItemAsync('userToken');

    // 取得目前本地的資料，準備合併
    const existingStr = await AsyncStorage.getItem('userProfile');
    const existingProfile = existingStr ? JSON.parse(existingStr) : {};
    const updatedProfile = { ...existingProfile, ...userData };

    // 🔥 關鍵修改 1：不論有沒有 token、不論 API 會不會成功，先強制存入本地！
    await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));

    if (!token) {
      return { success: true, message: 'Update Local.' };
    }

    // 💡 接著才嘗試呼叫 API 進行後端更新
    const API_URL = process.env.EXPO_PUBLIC_BACKEND;
    const response = await fetch(`${API_URL}/api/user/update/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData), 
    });

    if (response.status === 200) {
      return { success: true, message: 'Update Success' };
    } else {
      const resData = await response.json().catch(() => ({})); 
      // 🔥 修改回傳訊息，讓前端知道發生了什麼事
      return { success: false, message: resData.message || 'API 更新失敗，但已暫存於本機。' };
    }

  } catch (error) {
    console.error('Update User Data Error:', error);
    // 🔥 捕捉網路錯誤，回傳自訂訊息
    return { success: false, message: '網路連線失敗，資料已暫存於本機。' };
  }
};