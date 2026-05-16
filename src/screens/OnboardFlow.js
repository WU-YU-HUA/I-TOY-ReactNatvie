import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useAppContext } from '../context/AppContext';

// 引入各個步驟畫面
import FirstScreen from './StartFirst';
import FourthScreen from './StartFourth';
import SecondScreen from './StartSecond';
import ThirdScreen from './StartThird';

const { width } = Dimensions.get('window'); 

export default function OnboardingFlow({ onFinish }) {
  const { completeFirstLaunch } = useAppContext(); 
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', birthdate: '', gender: ''
  });

  // --- 全局動畫狀態 ---
  const translateX = useSharedValue(0);
  const activeIndex = useSharedValue(0); // 紀錄當前的索引 (0, 1, 2, 3)，供底層動畫使用

  // 按鈕點擊：前往下一頁的邏輯
  const changeStepWithAnimation = (nextStep) => {
    setStep(nextStep);
    activeIndex.value = nextStep - 1;
    translateX.value = withTiming(-(nextStep - 1) * width, { duration: 400 });
  };

  // --- 全局手勢返回邏輯 (取代原本的 SwipeWrapper) ---
  const handleSwipeBack = () => {
    // 這裡會讀取最新的 React State (formData 和 step)
    let prevStep = step - 1;
    // 判斷如果是在第四頁，且當初沒填 Email，返回時要直接略過 OTP(第三頁) 回到第二頁
    if (step === 4 && formData.email === "") {
      prevStep = 2; 
    }
    
    setStep(prevStep);
    activeIndex.value = prevStep - 1;
    translateX.value = withTiming(-(prevStep - 1) * width, { duration: 250 });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (activeIndex.value === 0) return; // 第一頁不允許往回拉
      if (event.translationX > 0) { // 只允許向右拉動 (返回方向)
        translateX.value = -(activeIndex.value * width) + event.translationX;
      }
    })
    .onEnd((event) => {
      if (activeIndex.value === 0) return;
      // 成功觸發：拉動超過螢幕 30% 或是快速滑動
      if (event.translationX > width * 0.3 || event.velocityX > 500) {
        runOnJS(handleSwipeBack)(); // 呼叫 JS 執行真正換頁邏輯
      } else {
        // 取消觸發：彈回當前頁面原位
        translateX.value = withTiming(-(activeIndex.value * width), { duration: 250 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  const updateFormData = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      const resData = await response.json(); 

      if (response.status === 200) {
        const userProfile = {
          name: formData.name, email: formData.email, birthdate: finalData.birthdate, gender: finalData.gender
        };
        await AsyncStorage.setItem('userProfile', JSON.stringify(userProfile));
        if (onFinish) onFinish(); 
        else completeFirstLaunch(); 
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

  // 使用 GestureHandlerRootView 和 GestureDetector 包裹全局
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#151515' }}>
      <GestureDetector gesture={panGesture}>
        <Animated.View 
          style={[{ 
            flex: 1, 
            flexDirection: 'row', 
            width: width * 4 
          }, animatedStyle]}
        >
          {/* 第 1 步 */}
          <View style={{ width, flex: 1 }}>
            <FirstScreen 
              initialName={formData.name}
              onNext={(name) => {
                updateFormData('name', name);
                changeStepWithAnimation(2);
              }} 
            />
          </View>

          {/* 第 2 步 */}
          <View style={{ width, flex: 1 }}>
            <SecondScreen 
              initialEmail={formData.email}
              onNext={(email) => {
                updateFormData('email', email);
                if (email === "") changeStepWithAnimation(4); 
                else changeStepWithAnimation(3);
              }} 
            />
          </View>

          {/* 第 3 步 */}
          <View style={{ width, flex: 1 }}>
            <ThirdScreen 
              email={formData.email} 
              onNext={() => changeStepWithAnimation(4)} 
            />
          </View>

          {/* 第 4 步 */}
          <View style={{ width, flex: 1 }}>
            <FourthScreen 
              onSubmit={(birthdate, gender) => {
                updateFormData('birthdate', birthdate);
                updateFormData('gender', gender);
                handleFinalSubmit({ birthdate, gender }); 
              }}
            />
          </View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}