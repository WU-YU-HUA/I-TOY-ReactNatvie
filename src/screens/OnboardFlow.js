import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useAppContext } from '../context/AppContext';

// 引入各個步驟畫面
import FirstScreen from './StartFirst';
import FourthScreen from './StartFourth';
import SecondScreen from './StartSecond';
import ThirdScreen from './StartThird';

export default function OnboardingFlow({ onFinish }) {
  const { completeFirstLaunch } = useAppContext();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 統一的 State 來儲存所有使用者的輸入
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    birthdate: '', 
    gender: ''
  });

  const updateFormData = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 最後一步：將資料更新回後端並儲存至本地
  const handleFinalSubmit = async (finalData) => {
    setIsSubmitting(true);
    try {
      const API_URL = process.env.EXPO_PUBLIC_BACKEND;
      const url = `${API_URL}/api/user/update/`; 
      
      const token = await SecureStore.getItemAsync('userToken');

      const payload = {
        name: formData.name,
        birthdate: finalData.birthdate,      
        gender: finalData.gender    
      };

      const response = await fetch(url, {
        method: 'POST', 
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload),
      });

      const resData = await response.json(); 

      if (response.status === 200) {
        const userProfile = {
          name: formData.name,
          email: formData.email,
          birthdate: finalData.birthdate,
          gender: finalData.gender
        };
        
        await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));

        if (onFinish) {
          onFinish(); 
        } else {
          completeFirstLaunch(); 
        }
      } else {
        Alert.alert('更新失敗', resData.message || '請稍後再試');
      }
    } catch (error) {
      console.error('Submit Error:', error);
      Alert.alert('錯誤', '資料儲存或連線失敗');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitting) {
    return (
      <View style={{ flex: 1, backgroundColor: '#151515', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#7AC1C9" />
      </View>
    );
  }

  // --- 畫面渲染路由 ---

  if (step === 1) {
    return (
      <FirstScreen 
        initialName={formData.name}
        onNext={(name) => {
          updateFormData('name', name);
          setStep(2);
        }} 
      />
    );
  }

  if (step === 2) {
    return (
      <SecondScreen 
        initialEmail={formData.email} // 👈 傳入初始值
        onNext={(email) => {
          updateFormData('email', email);
          setStep(3);
        }} 
        onBack={() => setStep(1)} // 👈 傳入返回邏輯
      />
    );
  }

  if (step === 3) {
    return (
      <ThirdScreen 
        email={formData.email} 
        onNext={() => setStep(4)} 
        onBack={() => setStep(2)}
      />
    );
  }

  if (step === 4) {
    return (
      <FourthScreen 
        onSubmit={(birthdate, gender) => {
          updateFormData('birthdate', birthdate);
          updateFormData('gender', gender);
          handleFinalSubmit({ birthdate, gender }); 
        }}
        onBack={() => setStep(3)} 
      />
    );
  }
}