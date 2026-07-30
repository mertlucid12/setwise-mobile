import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon, { IconName } from '@/components/Icon';
import WorkoutLogScreen from '@/screens/WorkoutLogScreen';
import CalendarScreen from '@/screens/CalendarScreen';
import RoutinesScreen from '@/screens/RoutinesScreen';
import VolumeDashboardScreen from '@/screens/VolumeDashboardScreen';
import AICoachScreen from '@/screens/AICoachScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import BodyTrackingScreen from '@/screens/BodyTrackingScreen';
import AuthScreen from '@/screens/AuthScreen';
import NewPasswordScreen from '@/screens/NewPasswordScreen';
import OnboardingScreen from '@/screens/OnboardingScreen';
import { withScreenTransition } from '@/components/ScreenTransition';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useI18n } from '@/i18n';
import { colors, cardShadow } from '@/theme';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="BodyTracking" component={BodyTrackingScreen} />
    </ProfileStack.Navigator>
  );
}

const setwiseTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, border: colors.border },
};

// Route names stay stable (used by navigation.navigate); only the visible
// label is localized via tabBarLabel.
const TAB_META: Record<string, { icon: IconName; labelKey: string }> = {
  Antrenman: { icon: 'barbell', labelKey: 'tab.workout' },
  Takvim: { icon: 'calendar', labelKey: 'tab.calendar' },
  Rutinler: { icon: 'list', labelKey: 'tab.routines' },
  Hacim: { icon: 'stats-chart', labelKey: 'tab.volume' },
  'AI Koç': { icon: 'sparkles', labelKey: 'tab.coach' },
  Profil: { icon: 'person-circle', labelKey: 'tab.profile' },
};

const TransitionedWorkoutLog = withScreenTransition(WorkoutLogScreen);
const TransitionedCalendar = withScreenTransition(CalendarScreen);
const TransitionedRoutines = withScreenTransition(RoutinesScreen);
const TransitionedVolume = withScreenTransition(VolumeDashboardScreen);
const TransitionedCoach = withScreenTransition(AICoachScreen);
const TransitionedProfileStack = withScreenTransition(ProfileStackNavigator);

// Docked (not absolute) so every screen keeps reserving its height in the
// normal layout - no per-screen bottom-padding fixes needed - while still
// reading as a rounded, elevated "pill bar" via top corner radius + shadow
// + a highlight capsule behind the focused icon.
function TabIcon({ icon, color, focused }: { icon: IconName; color: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 40,
        height: 26,
        borderRadius: 14,
        backgroundColor: focused ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={18} color={color} />
    </View>
  );
}

function MainTabs() {
  const { t } = useI18n();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          height: 68,
          paddingBottom: 12,
          paddingTop: 6,
          ...cardShadow,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
        tabBarLabel: t(TAB_META[route.name].labelKey),
        tabBarIcon: ({ color, focused }) => <TabIcon icon={TAB_META[route.name].icon} color={color} focused={focused} />,
      })}
    >
      <Tab.Screen name="Antrenman" component={TransitionedWorkoutLog} />
      <Tab.Screen name="Takvim" component={TransitionedCalendar} />
      <Tab.Screen name="Rutinler" component={TransitionedRoutines} />
      <Tab.Screen name="Hacim" component={TransitionedVolume} />
      <Tab.Screen name="AI Koç" component={TransitionedCoach} />
      <Tab.Screen name="Profil" component={TransitionedProfileStack} />
    </Tab.Navigator>
  );
}

// New sign-ups get onboardingCompleted: false and see OnboardingScreen once;
// existing accounts were backfilled to true and go straight to MainTabs.
function SignedInArea() {
  const { profile, loading, saveProfile } = useProfile();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0E0E0E', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#2F5D3A" />
      </View>
    );
  }

  if (!profile.onboardingCompleted) {
    return <OnboardingScreen profile={profile} saveProfile={saveProfile} />;
  }

  return <MainTabs />;
}

export default function AppNavigator() {
  const { session, initializing, passwordRecovery } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0E0E0E', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#2F5D3A" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={setwiseTheme}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {passwordRecovery ? (
          <RootStack.Screen name="NewPassword" component={NewPasswordScreen} />
        ) : session ? (
          <RootStack.Screen name="Main" component={SignedInArea} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
