import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { gluestackConfig } from '@/theme';
import { AuthProvider } from '@/contexts/AuthContext';
import AppNavigator from '@/navigation/AppNavigator';

export default function App() {
  return (
    <GluestackUIProvider config={gluestackConfig} colorMode="dark">
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </GluestackUIProvider>
  );
}
