import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import AuthScreen from '../screens/AuthScreen';
import { MainTabNavigator } from './MainTabNavigator';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AccountEditScreen from '../screens/AccountEditScreen';
import ProfileEditScreen from '../screens/ProfileEditScreen';
import OnboardingSkillsScreen from '../screens/OnboardingSkillsScreen';
import RatingScreen from '../screens/RatingScreen';
import ProposeTradeScreen from '../screens/ProposeTradeScreen';
import NotificationsScreen from '../screens/NotificationsScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // User not logged in
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          <Stack.Screen name="OnboardingSkills" component={OnboardingSkillsScreen} />

          {/* User is logged in */}
          <Stack.Screen name="MainApp" component={MainTabNavigator} />

          {/* Temp Test */}
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="UserProfile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="AccountEdit" component={AccountEditScreen} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
          <Stack.Screen name="Rating" component={RatingScreen} />
          <Stack.Screen name="ProposeTrade" component={ProposeTradeScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
