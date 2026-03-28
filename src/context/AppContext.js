import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native'; // --- 新增：引入 Alert ---

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

  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [isBrandsLoaded, setIsBrandsLoaded] = useState(false);
  const [categories, setCategories] = useState([]);

  const [reFetch, setReFetch] = useState(false);

  const API_URL = process.env.EXPO_PUBLIC_BACKEND;

  // 讀取已選取的品牌
  useEffect(() => {
    const loadSelectedBrands = async () => {
      try {
        const storedBrands = await AsyncStorage.getItem('@selected_brands');
        if (storedBrands !== null) {
          setSelectedBrands(new Set(JSON.parse(storedBrands)));
        }
      } catch (error) {
        console.error('讀取品牌設定失敗:', error);
      } finally {
        setIsBrandsLoaded(true);
      }
    };
    loadSelectedBrands();
  }, []);

  // 去後端讀取所有品牌
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
      }
    };
    fetchCategories();
  }, [API_URL]);

  // 讀取最愛清單
  useEffect(() => {
    const loadSavedItems = async () => {
      try {
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

  // --- 刪除原本在這裡的 useEffect (requestNotificationPermission) ---

  const [currentOpenList, setCurrentOpenList] = useState('cards');

  const toggleBrand = (brandName) => {
    setSelectedBrands((prevSet) => {
      const newSet = new Set(prevSet);
      if (newSet.has(brandName)) {
        newSet.delete(brandName);
      } else {
        newSet.add(brandName);
      }

      AsyncStorage.setItem('@selected_brands', JSON.stringify(Array.from(newSet)))
        .catch(error => console.error('儲存品牌設定失敗:', error));

      return newSet;
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

  // --- 改寫：加入自訂訊息與判斷是否為第一次 ---
  const requestNotificationPermission = async () => {
    try {
      // 1. 檢查是否已經詢問過
      const hasPrompted = await AsyncStorage.getItem('@has_prompted_notification');
      if (hasPrompted === 'true') return; 

      // 2. 檢查目前的系統權限狀態
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      // 如果還沒授權過，就跳出我們的自訂 Alert
      if (existingStatus !== 'granted') {
        Alert.alert(
          "開啟通知接收最新資訊", // 自訂標題
          "為了讓您不錯過收藏項目的最新狀態與優惠，請允許我們發送通知給您！", // 自訂內容
          [
            {
              text: "晚點再說",
              style: "cancel",
              onPress: () => {
                // 使用者拒絕，紀錄起來，下次就不會再跳了
                AsyncStorage.setItem('@has_prompted_notification', 'true');
              }
            },
            {
              text: "好，開啟通知",
              onPress: async () => {
                // 使用者同意，這時才呼叫系統的原生權限視窗
                await Notifications.requestPermissionsAsync();
                // 紀錄已經詢問過
                await AsyncStorage.setItem('@has_prompted_notification', 'true');
              }
            }
          ]
        );
      } else {
        // 如果原本系統就已經允許了，也要紀錄一下避免重複跑邏輯
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
        selectedBrands,
        setSelectedBrands,
        isBrandsLoaded,
        categories,
        toggleBrand,
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
        requestNotificationPermission // --- 新增：拋出這個 function 給 Saved.js 用 ---
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