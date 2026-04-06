import { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/theme.store';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth.store';
import { logout as apiLogout } from '../api/auth';

type ThemeMode = 'light' | 'dark' | 'system';

const SettingsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { themeMode, setThemeMode } = useThemeStore();

  const { user, logout: clearStoreUser } = useAuthStore();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleLogout = async () => {
    console.log('Logging out...');

    await apiLogout();
    clearStoreUser();
  };

  const fullName = user ? `${user.firstname} ${user.lastname}` : 'User';
  const offeringCount = user?.offering?.length || 0;

  return (
    <View className="flex-1 bg-background">
      {/* Header Container */}
      <View
        className="border-b border-border bg-card p-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="mb-2 flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="rounded-sm p-2 active:opacity-70"
          >
            <Ionicons name="arrow-back" size={24} color="#64748B" />
          </TouchableOpacity>
          <Text className="font-technical text-2xl uppercase tracking-wider text-foreground">
            System_Settings
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 100 }}
      >
        {/* Profile Edit Card */}
        <View className="mb-6 rounded-sm border-2 border-solid border-border bg-card p-4">
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
              <Text className="mb-1 font-technical text-[10px] tracking-wider text-muted-foreground">
                @{user?.username || 'user'}
              </Text>
              <Text className="font-lg font-body text-foreground">{fullName}</Text>
              <Text className="font-body text-xs text-muted-foreground">
                {offeringCount} skills offered
              </Text>
            </View>
          </View>
        </View>

        {/* Interface Preference */}
        <View className="mb-6">
          <Text className="mb-3 font-technical text-sm uppercase tracking-wider text-muted-foreground">
            Interface_Preference
          </Text>
          <View className="rounded-sm border-2 border-solid border-border bg-card p-4">
            <Text className="mb-3 font-technical text-xs uppercase tracking-wider text-muted-foreground">
              Theme_Mode
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
                    className={`flex-1 rounded-sm border-2 px-2 py-3 active:opacity-80 ${isActive ? 'border-accent bg-accent' : 'border-border bg-card'}`}
                  >
                    <Ionicons
                      name={icon as any}
                      size={20}
                      color={isActive ? '#FFFFFF' : '#64748B'}
                      style={{ alignSelf: 'center', marginBottom: 4 }}
                    />
                    <Text
                      className={`text-center font-technical text-xs uppercase tracking-wider ${isActive ? 'text-accent-foreground' : 'text-muted-foreground'}`}
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
        <View className="flex-col gap-4">
          {/* Privacy */}
          <TouchableOpacity className="w-full flex-row items-center justify-between rounded-sm border-2 border-solid border-border bg-card p-4 active:opacity-80">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-sm bg-muted">
                <Ionicons name="lock-closed" size={20} color="#4F46E5" />
              </View>
              <View>
                <Text className="font-body font-medium text-foreground">Privacy & Security</Text>
                <Text className="font-body text-xs text-muted-foreground">
                  Control your data visibility
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </TouchableOpacity>

          {/* Notifications */}
          <View className="flex-row items-center justify-between rounded-sm border-2 border-solid border-border bg-card p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-sm bg-muted">
                <Ionicons name="notifications" size={20} color="#4F46E5" />
              </View>
              <View>
                <Text className="font-body font-medium text-foreground">Notifications</Text>
                <Text className="font-body text-xs text-muted-foreground">
                  Message and trade alerts
                </Text>
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`h-6 w-12 justify-center rounded-full transition-colors ${notificationsEnabled ? 'bg-accent' : 'bg-muted-foreground'}`}
            >
              <View
                className={`h-4 w-4 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}`}
              />
            </TouchableOpacity>
          </View>

          {/* Account */}
          <TouchableOpacity
            onPress={() => navigation.navigate('AccountEdit')}
            className="w-full flex-row items-center justify-between rounded-sm border-2 border-solid border-border bg-card p-4 active:opacity-80"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-sm bg-muted">
                <Ionicons name="person" size={20} color="#4F46E5" />
              </View>
              <View>
                <Text className="font-body font-medium text-foreground">Account Settings</Text>
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
            className="w-full flex-row items-center justify-between rounded-sm border-2 border-solid border-border bg-card p-4 active:opacity-80"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-sm bg-muted">
                <Ionicons name="log-out" size={20} color="#4F46E5" />
              </View>
              <View>
                <Text className="font-body font-medium text-foreground">Logout</Text>
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
