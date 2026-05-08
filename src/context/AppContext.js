import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
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

  // ==========================================
  // Category & 篩選相關狀態
  // ==========================================
  const [categories, setCategories] = useState([]);
  const [isCategoriesLoaded, setIsCategoriesLoaded] = useState(false); // 🌟 新增：用來記錄分類是否讀取完畢
  
  const [selectedCategoryPaths, setSelectedCategoryPaths] = useState([]); 
  const [reFetch, setReFetch] = useState(false);

  const [isFirstLaunch, setIsFirstLaunch] = useState(null);
  const [currentOpenList, setCurrentOpenList] = useState('cards');

  const API_URL = process.env.EXPO_PUBLIC_BACKEND;

  // --- 讀取是否為第一次打開 APP ---
  useEffect(() => {
    const checkFirstLaunch = async () => {
      try {
        const hasLaunched = await AsyncStorage.getItem('@has_launched');
        if (hasLaunched === null) {
          setIsFirstLaunch(true); 
        } else {
          setIsFirstLaunch(false); 
        }
      } catch (error) {
        console.error('讀取首次啟動狀態失敗:', error);
        setIsFirstLaunch(false); 
      }
    };
    checkFirstLaunch();
  }, []);

  const completeFirstLaunch = async () => {
    try {
      await AsyncStorage.setItem('@has_launched', 'true');
      setIsFirstLaunch(false);
    } catch (error) {
      console.error('儲存首次啟動狀態失敗:', error);
    }
  };

  // --- 去後端讀取所有 Category 樹狀結構 ---
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (!API_URL) return;
        const response = await fetch(`${API_URL}/api/firebase/categories/`);
        const json = await response.json();
        setCategories(json);

        if (json && json.length > 0) {
          const urlsToPrefetch = json
            .map(brand => getFirstImg(brand.img) || brand.icon)
            .filter(url => typeof url === 'string');

          if (urlsToPrefetch.length > 0) {
            Image.prefetch(urlsToPrefetch);
          }
        }
      } catch (error) {
        console.error('Fetch categories error:', error);
      } finally {
        setIsCategoriesLoaded(true); // 🌟 新增：不論成功或失敗，都把載入狀態設為 true，避免畫面永遠卡住
      }
    };
    fetchCategories();
  }, [API_URL]);

  const CURRENT_DATA_VERSION = '2.0'; 

  useEffect(() => {
    const loadSavedItems = async () => {
      try {
        const savedVersion = await AsyncStorage.getItem('@data_version');

        if (savedVersion !== CURRENT_DATA_VERSION) {
          await AsyncStorage.removeItem('@saved_items');
          await AsyncStorage.setItem('@data_version', CURRENT_DATA_VERSION);
          setSavedItems([]); 
          return; 
        }

        const storedItems = await AsyncStorage.getItem('@saved_items');
        if (storedItems !== null) {
          setSavedItems(JSON.parse(storedItems));
        }
      } catch (error) {
        console.error('讀取收藏清單失敗:', error);
      }
    };
    loadSavedItems();
  }, []);

  const toggleCategoryPath = (path) => {
    setSelectedCategoryPaths((prev) => {
      if (prev.includes(path)) {
        return prev.filter((p) => p !== path); 
      } else {
        return [...prev, path]; 
      }
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
          "開啟通知接收最新資訊", 
          "為了讓您不錯過收藏項目的最新狀態與優惠，請允許我們發送通知給您！", 
          [
            {
              text: "晚點再說",
              style: "cancel",
              onPress: () => {
                AsyncStorage.setItem('@has_prompted_notification', 'true');
              }
            },
            {
              text: "好，開啟通知",
              onPress: async () => {
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
        savedItems,
        setSavedItems,
        cards,
        setCards,
        currentIndex,
        setCurrentIndex,
        openedItem,
        setOpenedItem,
        originLayout,
        setOriginLayout,
        
        categories,
        isCategoriesLoaded,    // 🌟 新增：拋出這個變數讓 index.tsx 可以讀取
        selectedCategoryPaths, 
        toggleCategoryPath,    
        
        handleSave,
        handleRemoveSaved,
        handleOpenItem,
        handleCloseItem,
        handleNextItem,
        handlePrevItem,
        currentList,
        openItemIndex,
        reFetch,
        setReFetch,
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