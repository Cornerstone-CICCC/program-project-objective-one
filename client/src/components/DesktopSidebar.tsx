import { Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { getConversations } from '../api/message';
import { socketService } from '../sockets/socket';

const DesktopSidebar = () => {
  const navigation = useNavigation<any>();
  const [currentRoute, setCurrentRoute] = useState('Map');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('state', (e: any) => {
      if (e.data.state) {
        const activeRoute = e.data.state.routes[e.data.state.index].name;
        setCurrentRoute(activeRoute);
      }
    });
    return unsubscribe;
  }, [navigation]);

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
  }, [currentRoute]);

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
    <View className="h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      {/* Logo Header */}
      <View className="flex-row items-center gap-3 border-b border-sidebar-border p-6">
        {/* React Native SVG */}
        <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <Rect x="1" y="1" width="38" height="38" stroke="#4F46E5" strokeWidth="2" fill="none" />
          <Path d="M12 15 L20 15 L20 12 L28 17 L20 22 L20 19 L12 19 Z" fill="#06B6D4" />
          <Path d="M28 25 L20 25 L20 28 L12 23 L20 18 L20 21 L28 21 Z" fill="#4F46E5" />
          <Rect x="3" y="3" width="4" height="4" fill="#06B6D4" />
          <Rect x="33" y="33" width="4" height="4" fill="#06B6D4" />
          <Circle cx="10" cy="30" r="1" fill="#4F46E5" opacity="0.5" />
          <Circle cx="30" cy="10" r="1" fill="#4F46E5" opacity="0.5" />
        </Svg>

        <Text className="text-2xl font-bold uppercase tracking-wider text-sidebar-primary">
          Swappa
        </Text>
      </View>

      {/* Navigation Items */}
      <View className="flex-1 gap-2 p-4">
        {navItems.map(({ name, activeIcon, inactiveIcon, label }) => {
          const isActive = currentRoute === name;

          return (
            <TouchableOpacity
              key={name}
              onPress={() => navigation.navigate('MainApp', { screen: name })}
              activeOpacity={0.7}
              className={`flex-row items-center rounded-md px-4 py-3 transition-all ${isActive ? 'bg-sidebar-primary' : 'hover:bg-sidebar-accent'}`}
            >
              <Ionicons
                name={isActive ? activeIcon : inactiveIcon}
                size={20}
                color={isActive ? '#FFFFFF' : '#64748B'}
              />
              <Text
                className={`ml-3 uppercase tracking-wider ${isActive ? 'font-medium text-sidebar-primary-foreground' : 'text-muted-foreground'}`}
              >
                {label}
              </Text>

              {/* Notification Badge */}
              {name === 'Inbox' && unreadCount > 0 && (
                <View className="ml-auto rounded-full bg-accent px-2 py-0.5">
                  <Text className="text-xs font-bold text-accent-foreground">{unreadCount}</Text>
                </View>
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
