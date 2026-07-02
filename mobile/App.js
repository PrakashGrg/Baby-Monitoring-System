import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { colors, typography } from './src/theme';
import usePushNotifications from './src/hooks/usePushNotifications';

import LoginScreen         from './src/screens/auth/LoginScreen';
import RegisterScreen      from './src/screens/auth/RegisterScreen';
import HomeScreen          from './src/screens/home/HomeScreen';
import LiveStreamScreen    from './src/screens/stream/LiveStreamScreen';
import SummaryScreen       from './src/screens/summary/SummaryScreen';
import ActivitiesScreen    from './src/screens/activities/ActivitiesScreen';
import AddBabyScreen       from './src/screens/baby/AddBabyScreen';
import NotificationsScreen from './src/screens/notifications/NotificationsScreen';
import SettingsScreen      from './src/screens/settings/SettingsScreen';

const Stack = createStackNavigator();
const Tab   = createBottomTabNavigator();

const TAB_ICONS = {
  Home:       ['home',      'home-outline'      ],
  Summary:    ['bar-chart', 'bar-chart-outline' ],
  Activities: ['list',      'list-outline'      ],
  Settings:   ['settings',  'settings-outline'  ],
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 84,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { ...typography.tiny, marginTop: 2 },
        tabBarIcon: ({ focused, color }) => {
          const [active, inactive] = TAB_ICONS[route.name] || ['ellipse', 'ellipse-outline'];
          return <Ionicons name={focused ? active : inactive} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"       component={HomeScreen}       />
      <Tab.Screen name="Summary"    component={SummaryScreen}    initialParams={{ baby: null }} />
      <Tab.Screen name="Activities" component={ActivitiesScreen} initialParams={{ baby: null }} />
      <Tab.Screen name="Settings"   component={SettingsScreen}   />
    </Tab.Navigator>
  );
}

function AppStack() {
  // Register push notifications when user is logged in
  usePushNotifications();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main"          component={MainTabs}           />
      <Stack.Screen name="LiveStream"    component={LiveStreamScreen}   />
      <Stack.Screen name="AddBaby"       component={AddBabyScreen}      />
      <Stack.Screen name="BabyProfile"   component={AddBabyScreen}      />
      <Stack.Screen name="Notifications" component={NotificationsScreen}/>
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login"    component={LoginScreen}    />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  return user ? <AppStack /> : <AuthStack />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}