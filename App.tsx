import React, { useEffect } from 'react';
import { Keyboard, Platform, TouchableWithoutFeedback, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import {
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from '@expo-google-fonts/barlow';
import {
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
  BarlowCondensed_800ExtraBold,
  BarlowCondensed_900Black,
} from '@expo-google-fonts/barlow-condensed';
import {
  GeistMono_400Regular,
  GeistMono_500Medium,
  GeistMono_600SemiBold,
  GeistMono_700Bold,
} from '@expo-google-fonts/geist-mono';
import { gluestackConfig } from '@/theme';
import { I18nProvider } from '@/i18n';
import { AuthProvider } from '@/contexts/AuthContext';
import { ActiveRoutineProvider } from '@/contexts/ActiveRoutineContext';
import AppNavigator from '@/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [fontsLoaded] = useFonts({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    // Heading resolves to $black (900) app-wide; without this face loaded
    // every heading would silently fall back to the system font.
    BarlowCondensed_800ExtraBold,
    BarlowCondensed_900Black,
    GeistMono_400Regular,
    GeistMono_500Medium,
    GeistMono_600SemiBold,
    GeistMono_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GluestackUIProvider config={gluestackConfig} colorMode="dark">
      <I18nProvider>
        <AuthProvider>
          <ActiveRoutineProvider>
            <StatusBar style="light" />
            {Platform.OS === 'web' ? (
              // Web browsers already blur the focused input on an outside click;
              // wrapping in TouchableWithoutFeedback would blur it on every click,
              // including clicks landing on the input itself (RNWeb bubbles the
              // click up before the input can register focus), making typing
              // impossible. Only native needs an explicit tap-to-dismiss handler.
              <View style={{ flex: 1 }}>
                <AppNavigator />
              </View>
            ) : (
              <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                <View style={{ flex: 1 }}>
                  <AppNavigator />
                </View>
              </TouchableWithoutFeedback>
            )}
          </ActiveRoutineProvider>
        </AuthProvider>
      </I18nProvider>
    </GluestackUIProvider>
  );
}
