import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { getConversations } from '../api/message';
import { socketService } from '../sockets/socket';

const BottomNavigation = ({ state, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [unreadCount, setUnreadCount] = useState(0);

  const currentRouteName = state.routes[state.index].name;

  const fetchUnreadCount = async () => {
    try {
      const conversations = await getConversations();
      const total = conversations.reduce(
        (sum: number, conversation: any) => sum + conversation.unreadCount,
        0,
      );
      setUnreadCount(total);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [currentRouteName]);

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const handleNewMessage = () => {
      fetchUnreadCount();
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, []);

  const navItems = [
    {
      name: 'Economy',
      activeIcon: 'analytics',
      inactiveIcon: 'analytics-outline',
      label: 'Economy',
    },
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
      className="absolute bottom-0 left-0 right-0 z-50 flex-row justify-around border-t border-border bg-card pt-3 shadow-sm"
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
              className={`font-technical text-[10px] uppercase tracking-wider ${isActive ? 'font-medium text-primary' : 'text-muted-foreground'}`}
            >
              {label}
            </Text>

            {/* Notification Badge */}
            {name === 'Inbox' && unreadCount > 0 && (
              <View className="absolute right-7 top-2 h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1">
                <Text className="text-center text-[10px] font-bold text-accent-foreground">
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
