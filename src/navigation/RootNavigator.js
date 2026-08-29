import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/calendar/CalendarScreen';
import DailyScreen from '../screens/daily/DailyScreen';
import LearnScreen from '../screens/learn/LearnScreen';
import LearnDetailScreen from '../screens/learn/LearnDetailScreen';
import UniverseScreen from '../screens/universe/UniverseScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

import { colors } from '../theme';
import { useUser } from '../contexts/UserContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const LearnStack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
    text: colors.text,
    primary: colors.purpleSoft,
    border: colors.border,
    notification: colors.purple,
  },
};

const tabIcon = (glyph) => ({ color, size }) => (
  <Text style={{ color, fontSize: size ?? 20 }}>{glyph}</Text>
);

function LearnStackNav() {
  return (
    <LearnStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <LearnStack.Screen name="LearnHome" component={LearnScreen} options={{ headerShown: false }} />
      <LearnStack.Screen name="LearnDetail" component={LearnDetailScreen} options={{ title: '' }} />
    </LearnStack.Navigator>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.bgSoft,
          borderTopColor: colors.border,
          height: 62,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.purpleSoft,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ tabBarLabel: 'Inicio', tabBarIcon: tabIcon('🌙') }} />
      <Tab.Screen name="CalendarTab" component={CalendarScreen} options={{ tabBarLabel: 'Calendario', tabBarIcon: tabIcon('📅') }} />
      <Tab.Screen name="DailyTab" component={DailyScreen} options={{ tabBarLabel: 'Hoy', tabBarIcon: tabIcon('💜') }} />
      <Tab.Screen name="LearnTab" component={LearnStackNav} options={{ tabBarLabel: 'Aprende', tabBarIcon: tabIcon('📚') }} />
      <Tab.Screen name="UniverseTab" component={UniverseScreen} options={{ tabBarLabel: 'Universo', tabBarIcon: tabIcon('✨') }} />
      <Tab.Screen name="SettingsTab" component={SettingsScreen} options={{ tabBarLabel: 'Ajustes', tabBarIcon: tabIcon('⚙️') }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { ready, onboarded } = useUser();
  if (!ready) return null;
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!onboarded ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          <Stack.Screen name="Tabs" component={Tabs} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
