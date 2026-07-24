import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import WorkoutLogScreen from '@/screens/WorkoutLogScreen';
import CalendarScreen from '@/screens/CalendarScreen';
import RoutinesScreen from '@/screens/RoutinesScreen';
import VolumeDashboardScreen from '@/screens/VolumeDashboardScreen';
import AICoachScreen from '@/screens/AICoachScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import AuthScreen from '@/screens/AuthScreen';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/theme';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();

const setwiseTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, border: colors.border },
};

const TAB_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  Antrenman: 'barbell',
  Takvim: 'calendar',
  Rutinler: 'list',
  Hacim: 'stats-chart',
  'AI Koç': 'sparkles',
  Profil: 'person-circle',
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size }) => (
          <Ionicons name={TAB_ICONS[route.name]} size={size ? size - 2 : 20} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Antrenman" component={WorkoutLogScreen} />
      <Tab.Screen name="Takvim" component={CalendarScreen} />
      <Tab.Screen name="Rutinler" component={RoutinesScreen} />
      <Tab.Screen name="Hacim" component={VolumeDashboardScreen} />
      <Tab.Screen name="AI Koç" component={AICoachScreen} />
      <Tab.Screen name="Profil" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { session, initializing } = useAuth();

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
        {session ? (
          <RootStack.Screen name="Main" component={MainTabs} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
