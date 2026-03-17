import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function FixedScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="construct" size={64} color="white" />
      <Text style={styles.text}>敬請期待</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgb(12, 12, 12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  text: {
    marginTop: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
