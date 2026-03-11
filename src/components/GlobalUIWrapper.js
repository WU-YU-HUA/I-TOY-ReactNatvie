import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

import { useAppContext } from '../context/AppContext';
import OpenSaved from '../screens/OpenSaved';

const { height } = Dimensions.get('window');

export default function GlobalUIWrapper({ children }) {
  const {
    openedItem,
    originLayout,
    handleCloseItem,
    handleRemoveSaved,
    handleSave,
    handleNextItem,
    handlePrevItem,
    currentList,
    openItemIndex,
  } = useAppContext();

  return (
    <View style={styles.container}>
      <View style={styles.contentArea}>{children}</View>

      {openedItem && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          <OpenSaved
            prevItemData={openItemIndex > 0 ? currentList[openItemIndex - 1] : null}
            nextItemData={openItemIndex >= 0 && openItemIndex < currentList.length - 1 ? currentList[openItemIndex + 1] : null}
            itemData={openedItem}
            onClose={handleCloseItem}
            originLayout={originLayout}
            onRemoveSaved={handleRemoveSaved}
            onSave={handleSave}
            onNext={openItemIndex >= 0 && openItemIndex < currentList.length - 1 ? handleNextItem : undefined}
            onPrev={openItemIndex > 0 ? handlePrevItem : undefined}
          />
        </View>
      )}

      <LinearGradient
        colors={['rgba(12,12,12,0.9)', 'rgba(12,12,12,0.6)', 'transparent']}
        locations={[0, 0.5, 1]}
        style={styles.topGlobalGradient}
        pointerEvents="none"
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'rgb(12, 12, 12)' },
  contentArea: { flex: 1 },
  topGlobalGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: height * 0.1, zIndex: 50 },
  bottomGlobalGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: height * 0.15, zIndex: 50 },
});
