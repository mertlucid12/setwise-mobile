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
import ErrorBoundary from '@/components/ErrorBoundary';
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
    // Provider order matters and is load-bearing:
    //
    //  - ErrorBoundary is outermost so a crash in any provider still lands on
    //    a readable screen instead of a blank one.
    //  - I18nProvider sits ABOVE GluestackUIProvider because gluestack renders
    //    Modal/Toast content through its own overlay host, which lives inside
    //    GluestackUIProvider. Anything portalled there is outside every
    //    provider nested below it, so with I18nProvider on the inside a modal
    //    child calling useI18n threw "must be used within I18nProvider" and
    //    white-screened the app (this is what broke the exercise picker).
    <ErrorBoundary>
      <I18nProvider>
        <GluestackUIProvider config={gluestackConfig} colorMode="dark">
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
        </GluestackUIProvider>
      </I18nProvider>
    </ErrorBoundary>
  );
}
