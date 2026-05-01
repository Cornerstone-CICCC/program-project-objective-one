import { Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { getConversations } from '../api/message';
import { socketService } from '../sockets/socket';
import { getMyNotifications } from '../api/notification';

const DesktopSidebar = () => {
  const navigation = useNavigation<any>();

  const [unreadCount, setUnreadCount] = useState(0);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);

  const currentRouteName = useNavigationState((state) => {
    if (!state) return 'Economy';

    let route: any = state.routes[state.index ?? 0];

    while (route.state && route.state.routes) {
      route = route.state.routes[route.state.index ?? 0];
    }

    if (route.name === 'MainApp') {
      return 'Economy';
    }

    return route.name as string;
  });

  const fetchUnreadData = async () => {
    try {
      const conversations = await getConversations();
      const total = conversations.reduce(
        (sum: number, conversation: any) => sum + conversation.unreadCount,
        0,
      );
      setUnreadCount(total);

      const notifs = await getMyNotifications();
      const unreadExists = notifs.some((n: any) => !n.is_read);
      setHasUnreadNotifs(unreadExists);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadData();
  }, [currentRouteName]);

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const handleUpdate = () => {
      setHasUnreadNotifs(true);
      fetchUnreadData();
    };

    socket.on('new_message', handleUpdate);
    socket.on('new_notification', handleUpdate);
    socket.on('swap_status_updated', handleUpdate);

    return () => {
      socket.off('new_message', handleUpdate);
      socket.off('new_notification', handleUpdate);
      socket.off('swap_status_updated', handleUpdate);
    };
  }, []);

  const navItems = [
    {
      name: 'Economy',
      activeIcon: 'analytics',
      inactiveIcon: 'analytics-outline',
      label: 'Insights',
    },
    { name: 'Search', activeIcon: 'search', inactiveIcon: 'search-outline', label: 'Discover' },
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
    <View className="h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo Header */}
      <View className="flex-row items-center gap-3 border-b border-sidebar-border p-6">
        {/* React Native SVG */}
        <Svg
          width="40"
          height="40"
          viewBox="0 0 40 40"
          fill="none"
          className="text-primary dark:text-[#A5B4FC]"
        >
          <Rect
            x="1"
            y="1"
            width="38"
            height="38"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <Path d="M12 15 L20 15 L20 12 L28 17 L20 22 L20 19 L12 19 Z" fill="#06B6D4" />
          <Path d="M28 25 L20 25 L20 28 L12 23 L20 18 L20 21 L28 21 Z" fill="currentColor" />
          <Rect x="3" y="3" width="4" height="4" fill="#06B6D4" />
          <Rect x="33" y="33" width="4" height="4" fill="#06B6D4" />
          <Circle cx="10" cy="30" r="1" fill="#4F46E5" opacity="0.5" />
          <Circle cx="30" cy="10" r="1" fill="#4F46E5" opacity="0.5" />
        </Svg>

        <Text className="font-bungee text-2xl font-bold uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
          Swappa
        </Text>
      </View>

      {/* Navigation Items */}
      <View className="mt-2 flex-1 gap-2 p-4">
        {navItems.map(({ name, activeIcon, inactiveIcon, label }) => {
          const isActive = currentRouteName === name;

          return (
            <TouchableOpacity
              key={name}
              onPress={() => navigation.navigate('MainApp', { screen: name })}
              activeOpacity={0.7}
              className={`flex-row items-center rounded-md px-4 py-3 transition-colors duration-200 ${isActive ? 'bg-primary' : 'hover:bg-sidebar-accent'}`}
            >
              <Ionicons
                name={isActive ? activeIcon : inactiveIcon}
                size={20}
                color={isActive ? '#FFFFFF' : '#64748B'}
              />
              <Text
                className={`ml-4 font-body font-bold uppercase tracking-wider ${isActive ? 'text-sidebar-primary-foreground' : 'text-muted-foreground'}`}
              >
                {label}
              </Text>

              {/* Notification Badge For Inbox */}
              {name === 'Inbox' && unreadCount > 0 && (
                <View className="ml-auto items-center justify-center rounded-full bg-red-500 px-2 py-1 shadow-sm">
                  <Text className="font-body text-[10px] font-bold text-white">{unreadCount}</Text>
                </View>
              )}

              {/* Notification Badge For Swaps */}
              {name === 'Swaps' && hasUnreadNotifs && (
                <View className="ml-auto h-2.5 w-2.5 rounded-full bg-red-500 shadow-sm" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Footer */}
      <View className="border-t border-sidebar-border p-4">
        <Text className="text-xs text-muted-foreground">
          &copy; 2026 SWAPPA. All rights reserved.
        </Text>
      </View>
    </View>
  );
};

export default DesktopSidebar;
