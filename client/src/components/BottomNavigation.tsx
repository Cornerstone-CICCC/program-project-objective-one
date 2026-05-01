import { TouchableOpacity, View, Text, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { getConversations } from '../api/message';
import { socketService } from '../sockets/socket';
import { getMyNotifications } from '../api/notification';

const BottomNavigation = ({ state, navigation }: any) => {
  const insets = useSafeAreaInsets();

  const [unreadCount, setUnreadCount] = useState(0);
  const [hasUnreadNotifs, setHasUnreadNotifs] = useState(false);

  const currentRouteName = state.routes[state.index].name;

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

    const handleNewMessage = () => {
      fetchUnreadData();
    };
    const handleNewNotification = () => {
      setHasUnreadNotifs(true);
      fetchUnreadData();
    };

    socket.on('new_message', handleNewMessage);
    socket.on('new_notification', handleNewNotification);
    socket.on('swap_status_updated', handleNewNotification);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('new_notification', handleNewNotification);
      socket.off('swap_status_updated', handleNewNotification);
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
    <View
      className="absolute bottom-0 left-0 right-0 z-50 flex-row justify-around border-t border-border bg-card pt-3 shadow-lg"
      style={{ paddingBottom: Math.max(insets.bottom, 12) }}
    >
      {navItems.map(({ name, activeIcon, inactiveIcon, label }) => {
        const isActive = currentRouteName === name;

        return (
          <TouchableOpacity
            key={name}
            onPress={() => navigation.navigate(name)}
            activeOpacity={0.8}
            className="relative flex flex-1 flex-col items-center justify-center py-2"
          >
            {/* Icon */}
            <Ionicons
              name={isActive ? activeIcon : inactiveIcon}
              size={24}
              className={isActive ? 'text-primary dark:text-[#A5B4FC]' : 'text-[#64748B]'}
              style={{ marginBottom: 4 }}
            />

            {/* Label */}
            <Text
              className={`font-body text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary dark:text-[#A5B4FC]' : 'text-muted-foreground'}`}
            >
              {label}
            </Text>

            {/* Notification Badge For Inbox */}
            {name === 'Inbox' && unreadCount > 0 && (
              <View className="absolute right-6 top-1 h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-card bg-red-500 px-1 shadow-sm">
                <Text className="text-center font-body text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}

            {/* Notification Badge For Swaps */}
            {name === 'Swaps' && hasUnreadNotifs && (
              <View className="absolute right-7 top-1.5 h-3 w-3 rounded-full border-2 border-card bg-red-500 shadow-sm" />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default BottomNavigation;
