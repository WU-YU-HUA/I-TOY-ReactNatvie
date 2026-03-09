import React from 'react';
import CategoryScreen from '../../src/screens/Category';
import { useAppContext } from '../../src/context/AppContext';

export default function CategoryTab() {
  const { categories, selectedBrands, toggleBrand } = useAppContext();

  return (
    <CategoryScreen
      categories={categories}
      selectedBrands={selectedBrands}
      onToggleBrand={toggleBrand}
    />
  );
}
