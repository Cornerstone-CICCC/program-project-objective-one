import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { messages } from '../data/mockData';

const BottomNavigation = ({ state, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const unreadCount = messages.filter((msg) => msg.unread).length;

  const currentRouteName = state.routes[state.index].name;

  const navItems = [
    { name: 'Map', activeIcon: 'map', inactiveIcon: 'map-outline', label: 'Map' },
    { name: 'Search', activeIcon: 'search', inactiveIcon: 'search-outline', label: 'Search' },
    {
      name: 'Swaps',
      activeIcon: 'swap-horizontal',
      inactiveIcon: 'swap-horizontal-outline',
      label: 'Swaps',
    },
    {
      name: 'Inbox',
      activeIcon: 'chatbubbles',
      inactiveIcon: 'chatbubbles-outline',
      label: 'Inbox',
    },
    { name: 'Profile', activeIcon: 'person', inactiveIcon: 'person-outline', label: 'Profile' },
  ] as const;

  return (
    <View
      className="bg-card border-border absolute bottom-0 left-0 right-0 z-50 flex-row justify-around border-t pt-3 shadow-sm"
      style={{ paddingBottom: insets.bottom }}
    >
      {navItems.map(({ name, activeIcon, inactiveIcon, label }) => {
        const isActive = currentRouteName === name;

        return (
          <TouchableOpacity
            key={name}
            onPress={() => navigation.navigate(name)}
            activeOpacity={0.7}
            className="relative flex flex-1 flex-col items-center justify-center py-2"
          >
            {/* Icon */}
            <Ionicons
              name={isActive ? activeIcon : inactiveIcon}
              size={24}
              color={isActive ? '#4F46E5' : '#64748B'}
              style={{ marginBottom: 4 }}
            />

            {/* Label */}
            <Text
              className={`font-technical text-[10px] uppercase tracking-wider ${isActive ? 'text-primary font-medium' : 'text-muted-foreground'}`}
            >
              {label}
            </Text>

            {/* Notification Badge */}
            {name === 'Inbox' && unreadCount > 0 && (
              <View className="bg-accent absolute right-7 top-2 h-[18px] min-w-[18px] items-center justify-center rounded-full px-1">
                <Text className="text-accent-foreground text-center text-[10px] font-bold">
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNavigation;
