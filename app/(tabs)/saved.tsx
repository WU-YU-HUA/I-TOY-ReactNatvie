import React from 'react';
import SavedScreen from '../../src/screens/Saved';
import { useAppContext } from '../../src/context/AppContext';

export default function SavedTab() {
  const { savedItems, handleOpenItem } = useAppContext();

  return (
    <SavedScreen
      savedItems={savedItems}
      onOpenItem={(item: any, layout: any) => handleOpenItem(item, layout, 'saved')}
    />
  );
}
