import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import FirstScreen from './First';
import SecondScreen from './Second'; // 剛剛建立的檔案

export default function OnboardingFlow({ onFinish }) {
  const { completeFirstLaunch } = useAppContext();
  
  // 紀錄目前在第幾步 (1 = First, 2 = Second)
  const [step, setStep] = useState(1);

  // 當整個流程結束時 (點擊 Second 的下一步，或是任何畫面的跳過)
  const handleComplete = () => {
    if (onFinish) {
      onFinish(); // 作為開發中分頁蓋板時觸發
    } else {
      completeFirstLaunch(); // 全域首次啟動時觸發
    }
  };

  if (step === 1) {
    return (
      <FirstScreen 
        onNext={() => setStep(2)} // 點下一步跳到第二頁
        onSkip={handleComplete}   // 點跳過直接結束
      />
    );
  }

  return (
    <SecondScreen 
      onNext={handleComplete} // 因為目前只有兩步，第二步的下一步就結束流程
      onSkip={handleComplete} 
    />
  );
}