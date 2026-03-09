import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import DiscoverScreen from '../../src/screens/Discover';
import { useAppContext } from '../../src/context/AppContext';

export default function Index() {
  const {
    isBrandsLoaded,
    cards,
    setCards,
    currentIndex,
    setCurrentIndex,
    selectedBrands,
    handleSave,
  } = useAppContext();

  if (!isBrandsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: 'rgb(12, 12, 12)', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#EA80FC" />
      </View>
    );
  }

  return (
    <DiscoverScreen
      onSave={handleSave}
      cards={cards}
      setCards={setCards}
      currentIndex={currentIndex}
      setCurrentIndex={setCurrentIndex}
      selectedBrands={selectedBrands}
    />
  );
}