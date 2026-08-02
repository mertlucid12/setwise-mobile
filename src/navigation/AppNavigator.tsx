import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon, { IconName } from '@/components/Icon';
import WorkoutLogScreen from '@/screens/WorkoutLogScreen';
import SessionHistoryScreen from '@/screens/SessionHistoryScreen';
import TrainingProfileScreen from '@/screens/TrainingProfileScreen';
import CalendarScreen from '@/screens/CalendarScreen';
import RoutinesScreen from '@/screens/RoutinesScreen';
import RoutineDetailScreen from '@/screens/RoutineDetailScreen';
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
const RoutinesStack = createNativeStackNavigator();
const WorkoutStack = createNativeStackNavigator();

// The detail screen draws its own hero under the status bar, so the stack
// header stays off and back navigation lives in the hero itself.
/** Session history hangs off the workout tab rather than becoming a seventh
 *  tab - it's something you consult after training, not a destination. */
function WorkoutStackNavigator() {
  return (
    <WorkoutStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <WorkoutStack.Screen name="WorkoutMain" component={WorkoutLogScreen} />
      <WorkoutStack.Screen name="SessionHistory" component={SessionHistoryScreen} />
    </WorkoutStack.Navigator>
  );
}

function RoutinesStackNavigator() {
  return (
    <RoutinesStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <RoutinesStack.Screen name="RoutinesList" component={RoutinesScreen} />
      <RoutinesStack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
    </RoutinesStack.Navigator>
  );
}

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
      <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
      <ProfileStack.Screen name="BodyTracking" component={BodyTrackingScreen} />
      <ProfileStack.Screen name="TrainingProfile" component={TrainingProfileScreen} />
    </ProfileStack.Navigator>
  );
}

const setwiseTheme = {
  ...DarkTheme,
  // Transparent so the app-wide shader shows through the navigator's own
  // scene container; every screen root is transparent for the same reason.
  colors: { ...DarkTheme.colors, background: 'transparent', card: colors.bg, border: colors.border },
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

const TransitionedWorkoutLog = withScreenTransition(WorkoutStackNavigator);
const TransitionedCalendar = withScreenTransition(CalendarScreen);
const TransitionedRoutines = withScreenTransition(RoutinesStackNavigator);
const TransitionedVolume = withScreenTransition(VolumeDashboardScreen);
const TransitionedCoach = withScreenTransition(AICoachScreen);
const TransitionedProfileStack = withScreenTransition(ProfileStackNavigator);

// Docked (not absolute) so every screen keeps reserving its height in the
// normal layout - no per-screen bottom-padding fixes needed.
//
// The focused tab is a solid block of the action red, capped with a molten
// orange rule - straight from the reference, where the active tab is the one
// filled element on the bar. A hard-edged block states it far louder than the
// tinted capsule this used to be.
function TabIcon({ icon, color, focused }: { icon: IconName; color: string; focused: boolean }) {
  return (
    <View
      style={{
        width: 46,
        height: 30,
        backgroundColor: focused ? colors.primary : 'transparent',
        borderTopWidth: focused ? 3 : 0,
        borderTopColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={18} color={focused ? colors.onPrimary : color} />
    </View>
  );
}

function MainTabs() {
  const { t } = useI18n();
  return (
    <Tab.Navigator
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          // The reference caps the nav with a 2px rule in the action colour
          // over the deepest surface tier - that rule is what stops the bar
          // reading as a floating panel and makes it a plate bolted on.
          borderTopWidth: 2,
          borderTopColor: colors.primary,
          backgroundColor: colors.well,
          height: 68,
          paddingBottom: 12,
          paddingTop: 6,
          ...cardShadow,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 9,
          fontFamily: 'JetBrainsMono_500Medium',
          letterSpacing: 1,
          textTransform: 'uppercase',
          marginTop: 3,
        },
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
