import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState } from 'react';
import AuthScreen from '../screens/AuthScreen';
import { MainTabNavigator } from './MainTabNavigator';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AccountEditScreen from '../screens/AccountEditScreen';

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
          {/* User is logged in */}
          <Stack.Screen name="MainApp" component={MainTabNavigator} />
          {/* Temp Test */}
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="PublicProfile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="AccountEdit" component={AccountEditScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default RootNavigator;
