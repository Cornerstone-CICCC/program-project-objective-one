import { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';
import { Bungee_400Regular } from '@expo-google-fonts/bungee';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';

import RootNavigator from './src/navigation/RootNavigator';
import './global.css';
import { ThemeController } from './src/components/ThemeController';
import { useAuthStore } from './src/store/auth.store';
import { socketService } from './src/sockets/socket';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const { user, token } = useAuthStore();

  const [fontsLoaded, fontError] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-Medium': PlusJakartaSans_500Medium,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'DMMono-Regular': DMMono_400Regular,
    'DMMono-Medium': DMMono_500Medium,
    'Bungee-Regular': Bungee_400Regular,
    'JetBrainsMono-Regular': JetBrainsMono_400Regular,
    'JetBrainsMono-Medium': JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (user && token) {
      console.log('App.tsx: User detected. Booting up Global Socket...');
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [user, token]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        documentTitle={{
          formatter: () => 'SWAPPA',
        }}
      >
        <ThemeController />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
