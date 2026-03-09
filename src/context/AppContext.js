import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [savedItems, setSavedItems] = useState([]);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [openedItem, setOpenedItem] = useState(null);
  const [originLayout, setOriginLayout] = useState(null);

  const [selectedBrands, setSelectedBrands] = useState(new Set());
  const [isBrandsLoaded, setIsBrandsLoaded] = useState(false);
  const [categories, setCategories] = useState([]);

  const API_URL = process.env.EXPO_PUBLIC_BACKEND;

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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (!API_URL) return;
        const response = await fetch(`${API_URL}/api/firebase/categories/`);
        const json = await response.json();
        setCategories(json);
      } catch (error) {
        console.error('Fetch categories error:', error);
      }
    };
    fetchCategories();
  }, [API_URL]);

  const [currentOpenList, setCurrentOpenList] = useState('cards'); // 'cards' or 'saved'

  // ... (toggleBrand, handleSave, handleRemoveSaved stay the same)
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
  };

  const handleSave = (item) => {
    setSavedItems((prevItems) => {
      const isExisted = prevItems.find((i) => i.img === item.img);
      if (isExisted) return prevItems;
      return [item, ...prevItems];
    });
  };

  const handleRemoveSaved = (itemToRemove) => {
    setSavedItems((prevItems) => prevItems.filter((i) => i.img !== itemToRemove.img));
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
  const openItemIndex = openedItem ? currentList.findIndex(i => i.img === openedItem.img) : -1;

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
