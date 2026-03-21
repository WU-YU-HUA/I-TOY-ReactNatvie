import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';

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

  // --- 新增：reFetch 狀態 ---
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

  // 請求通知權限
  useEffect(() => {
    requestNotificationPermission();
  }, []);

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
    
    // --- 新增：變更品牌時，將 reFetch 設為 true ---
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
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
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
        reFetch,     // --- 新增：將 reFetch 拋出 ---
        setReFetch,  // --- 新增：將 setReFetch 拋出 ---
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