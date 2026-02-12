import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { DatabaseProvider } from './src/db/provider';
import MainScreen from './src/screens/MainScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <DatabaseProvider>
        <StatusBar style="dark" />
        <MainScreen />
      </DatabaseProvider>
    </SafeAreaProvider>
  );
}
