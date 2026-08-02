import React, { useEffect } from 'react';
import { Keyboard, Platform, TouchableWithoutFeedback, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Anton_400Regular } from '@expo-google-fonts/anton';
import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
  HankenGrotesk_900Black,
} from '@expo-google-fonts/hanken-grotesk';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
  JetBrainsMono_800ExtraBold,
} from '@expo-google-fonts/jetbrains-mono';
import ErrorBoundary from '@/components/ErrorBoundary';
import ShaderBackground from '@/components/ShaderBackground';
import { gluestackConfig } from '@/theme';
import { I18nProvider } from '@/i18n';
import { AuthProvider } from '@/contexts/AuthContext';
import { ActiveRoutineProvider } from '@/contexts/ActiveRoutineContext';
import AppNavigator from '@/navigation/AppNavigator';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  /**
   * Every weight used anywhere in the app has to be listed here: gluestack's
   * FontResolver turns family + weight into a suffixed face name
   * ("HankenGrotesk_900Black"), and a face that wasn't loaded resolves to
   * nothing and silently falls back to the system font.
   *
   * Anton has exactly one weight, which is why the Heading theme asks for 400
   * rather than 900. JetBrains Mono stops at 800, so mono runs use
   * $extrabold as their heaviest.
   */
  const [fontsLoaded] = useFonts({
    Anton_400Regular,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
    HankenGrotesk_900Black,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
    JetBrainsMono_800ExtraBold,
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
              {/* One shader for the whole app: screen roots are transparent,
                  so this drifts behind every tab. Cards keep their own opaque
                  surfaces, which is what keeps text readable over it. */}
              <ShaderBackground preset="ember" />
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
