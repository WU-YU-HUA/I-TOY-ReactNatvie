import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
// 引入流程控制器，確認相對路徑是否正確
import OnboardingFlow from '../../src/screens/OnboardFlow';

export default function FixedTab() {
  // 紀錄這次進來這個分頁，是否已經看過歡迎畫面了
  const [hasSeenIntro, setHasSeenIntro] = useState(false);

  // 如果還沒看過，就把流程控制器渲染出來
  if (1) {
    return (
      <OnboardingFlow 
        onFinish={() => {
          // 當使用者跑完 First -> Second 流程後，會觸發這裡，把狀態改成 true
          setHasSeenIntro(true);
        }} 
      />
    );
  }

  // 看過之後，就會顯示這個分頁真正的內容
  return (
    <View style={styles.container}>
      <Text style={styles.text}>這裡放置你未來的開發中功能</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#151515',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});