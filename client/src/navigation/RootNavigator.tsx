import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
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
import { useAuthStore } from '../store/auth.store';
import { checkAuth, getToken } from '../api/auth';
import { ActivityIndicator, View } from 'react-native';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isAuthenticated, user, setAuth, logout } = useAuthStore();

  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const currentUser = await checkAuth();

        if (currentUser) {
          const storedToken = await getToken();
          setAuth(currentUser, storedToken || undefined);
        } else {
          logout();
        }
      } catch (err) {
        console.error('Failed to restore session', err);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();
  }, []);

  if (isRestoring) {
    return (
      <View className="flex-1 items-center justify-center bg-[#F8FAFC]">
        <ActivityIndicator size="large" color="#1E40AF" />
      </View>
    );
  }

  const hasCompletedOnboarding = user?.offering && user.offering.length > 0;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // User not logged in
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : (
        <>
          {/* User is logged in */}
          {hasCompletedOnboarding ? (
            <>
              <Stack.Screen name="MainApp" component={MainTabNavigator} />
              <Stack.Screen name="OnboardingSkills" component={OnboardingSkillsScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="OnboardingSkills" component={OnboardingSkillsScreen} />
              <Stack.Screen name="MainApp" component={MainTabNavigator} />
            </>
          )}

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
