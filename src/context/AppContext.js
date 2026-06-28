import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
// 如果你其他地方沒有用到 SecureStore，可以把這行註解或刪掉
// import * as SecureStore from 'expo-secure-store'; 
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';

const AppContext = createContext();

const getFirstImg = (img) => {
  if (!img) return null;
  return Array.isArray(img) ? img[0] : img;
};

export function AppProvider({ children }) {
  const [savedItems, setSavedItems] = useState([]);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [openedItem, setOpenedItem] = useState(null);
  const [originLayout, setOriginLayout] = useState(null);

  const [categories, setCategories] = useState([]);
  const [isCategoriesLoaded, setIsCategoriesLoaded] = useState(false); 
  const [isLocalDataLoaded, setIsLocalDataLoaded] = useState(false);
  
  const [selectedCategoryPaths, setSelectedCategoryPaths] = useState([]); 
  const [reFetch, setReFetch] = useState(false);

  // isFirstLaunch 為 null 時代表還在讀取中，true 顯示 Onboarding，false 顯示主程式
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const [currentOpenList, setCurrentOpenList] = useState('cards');

  const API_URL = process.env.EXPO_PUBLIC_BACKEND;

  // 🌟 修改：核心邏輯 - 改為檢查 userProfile
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // 同時檢查「是否啟動過」以及「是否有 userProfile 資料」
        const hasLaunched = await AsyncStorage.getItem('@has_launched');
        const userProfile = await AsyncStorage.getItem('userProfile'); // 👈 改為檢查 userProfile

        // 如果沒有啟動過，或者沒有 userProfile，都視為需要進行 Onboarding
        if (hasLaunched === null || !userProfile) {
          setIsFirstLaunch(true); 
        } else {
          setIsFirstLaunch(false); 
        }
      } catch (error) {
        console.error('檢查驗證狀態失敗:', error);
        setIsFirstLaunch(true); // 發生錯誤時保險起見導向註冊
      }
    };
    checkAuthStatus();
  }, []);

  // 🌟 修改：完成註冊流程時呼叫
  const completeFirstLaunch = async () => {
    try {
      await AsyncStorage.setItem('@has_launched', 'true');
      setIsFirstLaunch(false);
      console.log('✅ Onboarding 流程正式完成，進入主畫面');
    } catch (error) {
      console.error('儲存啟動狀態失敗:', error);
    }
  };

  // --- 原有的 Categories 抓取 ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (!API_URL) return;
        const response = await fetch(`${API_URL}/api/firebase/categories/`);
        const json = await response.json();
        
        setCategories(json);

      } catch (error) {
        console.error('Fetch categories error:', error);
      } finally {
        setIsCategoriesLoaded(true); 
      }
    };
    fetchCategories();
  }, [API_URL]);

  const CURRENT_DATA_VERSION = '2.2'; 

  // --- 原有的 Local Data 加載 ---
  useEffect(() => {
    const loadLocalData = async () => {
      try {
        const savedVersion = await AsyncStorage.getItem('@data_version');

        if (savedVersion !== CURRENT_DATA_VERSION) {
          await AsyncStorage.removeItem('@saved_items');
          await AsyncStorage.removeItem('@selected_category_paths'); 
          await AsyncStorage.setItem('@data_version', CURRENT_DATA_VERSION);
          setSavedItems([]); 
          return; 
        }

        const storedItems = await AsyncStorage.getItem('@saved_items');
        if (storedItems !== null) {
          setSavedItems(JSON.parse(storedItems));
        }

        const storedPaths = await AsyncStorage.getItem('@selected_category_paths');
        if (storedPaths !== null) {
          setSelectedCategoryPaths(JSON.parse(storedPaths));
        }
      } catch (error) {
        console.error('讀取本地資料失敗:', error);
      } finally {
        setIsLocalDataLoaded(true); 
      }
    };
    loadLocalData();
  }, []);

  // --- 下方輔助函式保持不變 ---
  const toggleCategoryPath = (path) => {
    setSelectedCategoryPaths((prev) => {
      let newPaths;
      if (prev.includes(path)) {
        newPaths = prev.filter((p) => p !== path); 
      } else {
        newPaths = [...prev, path]; 
      }
      AsyncStorage.setItem('@selected_category_paths', JSON.stringify(newPaths))
        .catch(error => console.error('儲存篩選條件失敗:', error));
      return newPaths;
    });
    setReFetch(true);
  };

  const handleSave = (item) => {
    setSavedItems((prevItems) => {
      const isExisted = prevItems.find((i) => getFirstImg(i.img) === getFirstImg(item.img));
      if (isExisted) return prevItems;
      const newItems = [item, ...prevItems];
      AsyncStorage.setItem('@saved_items', JSON.stringify(newItems))
        .catch(error => console.error('儲存收藏清單失敗:', error));
      return newItems;
    });
  };

  const handleRemoveSaved = (itemToRemove) => {
    setSavedItems((prevItems) => {
      const newItems = prevItems.filter((i) => getFirstImg(i.img) !== getFirstImg(itemToRemove.img));
      AsyncStorage.setItem('@saved_items', JSON.stringify(newItems))
        .catch(error => console.error('儲存收藏清單失敗:', error));
      return newItems;
    });
  };

  const handleOpenItem = (item, layout, listType = 'cards') => {
    setOpenedItem(item);
    setOriginLayout(layout);
    setCurrentOpenList(listType);
  };

  const handleCloseItem = () => {
    setOpenedItem(null);
    setOriginLayout(null);
  };

  const currentList = currentOpenList === 'saved' ? savedItems : cards;
  const openItemIndex = openedItem 
    ? currentList.findIndex(i => getFirstImg(i.img) === getFirstImg(openedItem.img)) 
    : -1;

  const handleNextItem = () => {
    if (openItemIndex >= 0 && openItemIndex < currentList.length - 1) {
      setOpenedItem(currentList[openItemIndex + 1]);
      setOriginLayout(null);
    }
  };

  const handlePrevItem = () => {
    if (openItemIndex > 0) {
      setOpenedItem(currentList[openItemIndex - 1]);
      setOriginLayout(null);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      const hasPrompted = await AsyncStorage.getItem('@has_prompted_notification');
      if (hasPrompted === 'true') return; 
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      if (existingStatus !== 'granted') {
        Alert.alert(
          "Enable Notifications for the Latest Updates", 
          "Please allow notifications so you never miss out on the latest status and offers for your saved items!", 
          [
            { text: "Later", style: "cancel", onPress: () => AsyncStorage.setItem('@has_prompted_notification', 'true') },
            { text: "Enable", onPress: async () => {
                await Notifications.requestPermissionsAsync();
                await AsyncStorage.setItem('@has_prompted_notification', 'true');
              }
            }
          ]
        );
      } else {
        await AsyncStorage.setItem('@has_prompted_notification', 'true');
      }
    } catch (error) {
      console.error("通知權限請求失敗:", error);
    }
  };

  return (
    <AppContext.Provider
      value={{
        savedItems, setSavedItems,
        cards, setCards,
        currentIndex, setCurrentIndex,
        openedItem, setOpenedItem,
        originLayout, setOriginLayout,
        categories, isCategoriesLoaded,
        isLocalDataLoaded,
        selectedCategoryPaths, toggleCategoryPath,
        handleSave, handleRemoveSaved,
        handleOpenItem, handleCloseItem,
        handleNextItem, handlePrevItem,
        currentList, openItemIndex,
        reFetch, setReFetch,
        requestNotificationPermission,
        isFirstLaunch,
        completeFirstLaunch
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}