// services/userService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * 統一處理使用者資料更新 (支援本地與遠端)
 * @param {Object} userData - 要更新的使用者資料 { name, email, birthdate, gender }
 * @returns {Object} { success: boolean, message?: string }
 */
export const updateUserData = async (userData) => {
  try {
    const token = await SecureStore.getItemAsync('userToken');

    // 取得目前本地的資料，準備合併
    const existingStr = await AsyncStorage.getItem('userProfile');
    const existingProfile = existingStr ? JSON.parse(existingStr) : {};
    const updatedProfile = { ...existingProfile, ...userData };

    // 💡 核心邏輯：如果沒有 token，只更新本地資料就提早 return
    if (!token) {
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      return { success: true, message: 'Update Local.' };
    }

    // 💡 如果有 token，則呼叫 API 進行後端更新
    const API_URL = process.env.EXPO_PUBLIC_BACKEND;
    const response = await fetch(`${API_URL}/api/user/update/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(userData), // 傳入合併後的新資料或傳入的 userData
    });

    if (response.status === 200) {
      // API 更新成功後，同步更新本地 AsyncStorage
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      return { success: true, message: 'Update Success' };
    } else {
      // 嘗試解析後端回傳的錯誤訊息
      const resData = await response.json().catch(() => ({})); 
      return { success: false, message: resData.message || 'Update Fail, please try again later.' };
    }

  } catch (error) {
    console.error('Update User Data Error:', error);
    return { success: false, message: 'Connect fail.' };
  }
};