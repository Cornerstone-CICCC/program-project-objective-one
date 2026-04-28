import { useRef, useState } from 'react';
import {
  Animated,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  UIManager,
  useColorScheme,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/theme.store';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth.store';
import { logout as apiLogout } from '../api/auth';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ThemeMode = 'light' | 'dark' | 'system';

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primaryIconColor = isDark ? '#A5B4FC' : '#4F46E5';

  const { themeMode, setThemeMode } = useThemeStore();

  const { user, logout: clearStoreUser } = useAuthStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const thumbTranslateX = useRef(new Animated.Value(notificationsEnabled ? 20 : 2)).current;

  const handleLogout = async () => {
    console.log('Logging out...');

    await apiLogout();
    clearStoreUser();
  };

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);

    if (Platform.OS !== 'web') {
      Animated.spring(thumbTranslateX, {
        toValue: newValue ? 20 : 2,
        speed: 14,
        useNativeDriver: true,
      }).start();
    }
  };

  const fullName = user ? `${user.firstname} ${user.lastname}` : 'User';
  const offeringCount = user?.offering?.length || 0;

  return (
    <View className="flex-1 bg-background">
      {/* Header Container */}
      <View
        className="border-b border-border bg-card px-4 pb-4"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="rounded-sm p-2 active:opacity-70"
          >
            <Ionicons name="arrow-back" size={24} color="#64748B" />
          </TouchableOpacity>
          <Text className="font-technical text-xl uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
            Settings
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Edit Card */}
        <View className="mb-8 rounded-sm border-2 border-solid border-border bg-card p-4 shadow-sm">
          <View className="flex-row items-center gap-4">
            {/* Image Wrapper */}
            <View className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-sm border-2 border-solid border-muted-foreground bg-muted">
              <Image
                source={{ uri: user?.avatar_url || 'https://placehold.co/150' }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>

            <View className="flex-1 justify-center">
              <Text className="mb-1 font-technical text-xs font-bold tracking-wider text-muted-foreground">
                @{user?.username || 'user'}
              </Text>
              <Text className="font-body text-lg font-bold text-foreground">{fullName}</Text>
              <Text className="font-body text-xs text-muted-foreground">
                {offeringCount} skills offered
              </Text>
            </View>
          </View>
        </View>

        {/* Interface Preference */}
        <View className="mb-8">
          <Text className="mb-3 font-body text-sm font-bold uppercase tracking-wider text-muted-foreground">
            App Appearance
          </Text>
          <View className="rounded-sm border-2 border-solid border-border bg-card p-4 shadow-sm">
            <Text className="mb-3 font-body text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Theme
            </Text>
            <View className="flex-row gap-2">
              {[
                { mode: 'light' as ThemeMode, icon: 'sunny', label: 'Light' },
                { mode: 'dark' as ThemeMode, icon: 'moon', label: 'Dark' },
                { mode: 'system' as ThemeMode, icon: 'desktop-outline', label: 'System' },
              ].map(({ mode, icon, label }) => {
                const isActive = themeMode === mode;
                return (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => setThemeMode(mode)}
                    className={`flex-1 rounded-sm border-2 px-2 py-3 transition-colors ${isActive ? 'border-primary bg-primary' : 'border-border bg-background'}`}
                  >
                    <Ionicons
                      name={icon as any}
                      size={20}
                      color={isActive ? '#FFFFFF' : '#64748B'}
                      style={{ alignSelf: 'center', marginBottom: 4 }}
                    />
                    <Text
                      className={`text-center font-body text-xs font-bold uppercase tracking-wider ${isActive ? 'text-white' : 'text-muted-foreground'}`}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Settings List */}
        <View className="flex-col gap-3">
          <Text className="mb-1 font-body text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Account Management
          </Text>

          {/* Privacy */}
          <TouchableOpacity className="w-full flex-row items-center justify-between rounded-sm border-2 border-solid border-border bg-card p-4 shadow-sm active:opacity-80">
            <View className="flex-row items-center gap-4">
              <View className="h-10 w-10 items-center justify-center rounded-sm border-2 border-primary bg-muted">
                <Ionicons name="lock-closed" size={20} color={primaryIconColor} />
              </View>
              <View>
                <Text className="font-body text-sm font-bold text-foreground">
                  Privacy & Security
                </Text>
                <Text className="font-body text-xs text-muted-foreground">
                  Control your data visibility
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={toggleNotifications}
            className="flex-row items-center justify-between rounded-sm border-2 border-solid border-border bg-card p-4 shadow-sm"
          >
            <View className="flex-row items-center gap-4">
              <View className="h-10 w-10 items-center justify-center rounded-sm border-2 border-primary bg-muted">
                <Ionicons name="notifications" size={20} color={primaryIconColor} />
              </View>
              <View>
                <Text className="font-body text-sm font-bold text-foreground">Notifications</Text>
                <Text className="font-body text-xs text-muted-foreground">
                  Message and trade alerts
                </Text>
              </View>
            </View>

            {Platform.OS === 'web' ? (
              <View
                className={`h-7 w-12 justify-center rounded-full border-2 transition-colors duration-300 ${notificationsEnabled ? 'border-primary bg-primary' : 'border-slate-300 bg-slate-300 dark:border-slate-600 dark:bg-slate-600'}`}
              >
                <View
                  className={`h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                />
              </View>
            ) : (
              <View
                className={`h-7 w-12 justify-center rounded-full border-2 ${notificationsEnabled ? 'border-primary bg-primary' : 'border-slate-300 bg-slate-300 dark:border-slate-600 dark:bg-slate-600'}`}
              >
                <Animated.View
                  className="h-5 w-5 rounded-full bg-white shadow-md"
                  style={{ transform: [{ translateX: thumbTranslateX }] }}
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Account */}
          <TouchableOpacity
            onPress={() => navigation.navigate('AccountEdit')}
            className="w-full flex-row items-center justify-between rounded-sm border-2 border-solid border-border bg-card p-4 active:opacity-80"
          >
            <View className="flex-row items-center gap-4">
              <View className="h-10 w-10 items-center justify-center rounded-sm border-2 border-primary bg-muted">
                <Ionicons name="person" size={20} color={primaryIconColor} />
              </View>
              <View>
                <Text className="font-body text-sm font-bold text-foreground">
                  Account Settings
                </Text>
                <Text className="font-body text-xs text-muted-foreground">
                  Email, password, and more
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            onPress={handleLogout}
            className="mt-4 w-full flex-row items-center justify-between rounded-sm border-2 border-solid border-border bg-card p-4 active:opacity-80"
          >
            <View className="flex-row items-center gap-4">
              <View className="h-10 w-10 items-center justify-center rounded-sm border-2 border-primary bg-muted">
                <Ionicons name="log-out" size={20} color={primaryIconColor} />
              </View>
              <View>
                <Text className="font-body text-sm font-bold text-foreground">Logout</Text>
                <Text className="font-body text-xs text-muted-foreground">
                  Sign out of your account
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;
