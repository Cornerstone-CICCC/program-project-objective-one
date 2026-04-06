import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  clearReadNotifications,
  deleteNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notification';
import { socketService } from '../sockets/socket';
import ConfirmModal from '../components/ConfirmModal';

type NotificationType =
  | 'SWAP_REQUESTED'
  | 'SWAP_ACCEPTED'
  | 'SWAP_CANCELLED'
  | 'PARTNER_COMPLETED'
  | 'SWAP_COMPLETED'
  | 'NEW_EVALUATION'
  | 'SYSTEM_ALERT';

interface INotification {
  _id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  is_read: boolean;
  trade_id?: string;
  partner_id?: string;
}

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);

  const [clearLogsConfirmVisible, setClearLogsConfirmVisible] = useState(false);

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Calculate time units
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    // Less than 60 seconds
    if (minutes < 1) return 'Just now';

    // Less than 60 minutes
    if (minutes < 60) return `${minutes}m ago`;

    // Less than 24 hours
    if (hours < 24) return `${hours}h ago`;

    // Exactly 1 day ago
    if (days === 1) return 'Yesterday';

    // Older than Yesterday
    const isCurrentYear = now.getFullYear() === date.getFullYear();

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: isCurrentYear ? undefined : 'numeric',
    });
  };

  const fetchNotifications = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const data = await getMyNotifications();

      const sortedData = data.sort(
        (a: INotification, b: INotification) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setNotifications(sortedData);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchNotifications();
    }, []),
  );

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const handleNewNotification = () => {
      console.log('Real-time notification received via socket!');
      fetchNotifications(true);
    };

    socket.on('new_notification', handleNewNotification);
    return () => {
      socket.off('new_notification', handleNewNotification);
    };
  }, []);

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to update server', err);
    }
  };

  const handleClearReadLogs = async () => {
    setClearLogsConfirmVisible(false);
    setNotifications((prev) => prev.filter((n) => !n.is_read));

    try {
      await clearReadNotifications();
    } catch (err) {
      console.error('Failed to clear read logs', err);
    }
  };

  const executeSingleDelete = async () => {
    if (!selectedNotifId) return;

    setNotifications((prev) => prev.filter((n) => n._id !== selectedNotifId));
    setDeleteConfirmVisible(false);

    try {
      await deleteNotification(selectedNotifId);
    } catch (err) {
      console.error('Failed to delete on server', err);
    }
  };

  const getNotificationConfig = (type: NotificationType) => {
    switch (type) {
      case 'SWAP_REQUESTED':
        return { icon: 'swap-horizontal', color: '#4f46e5' }; // Primary Blue
      case 'SWAP_ACCEPTED':
      case 'SWAP_COMPLETED':
        return { icon: 'checkmark-done-circle', color: '#16a34a' }; // Green
      case 'PARTNER_COMPLETED':
        return { icon: 'time', color: '#eab308' }; // Yellow
      case 'SWAP_CANCELLED':
        return { icon: 'close-circle', color: '#ef4444' }; // Red
      case 'NEW_EVALUATION':
        return { icon: 'star', color: '#eab308' }; // Yellow
      case 'SYSTEM_ALERT':
      default:
        return { icon: 'hardware-chip', color: '#64748b' }; // Muted Gray
    }
  };

  const handleNotificationPress = async (notification: INotification) => {
    if (!notification.is_read) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, is_read: true } : n)),
      );

      try {
        await markNotificationRead(notification._id);
      } catch (err) {
        console.error('Failed to mark read', err);
      }
    }

    switch (notification.type) {
      case 'SWAP_REQUESTED':
        navigation.navigate('MainApp', { screen: 'Swaps', params: { targetTab: 'pending' } });
      case 'PARTNER_COMPLETED':
      case 'SWAP_ACCEPTED':
        navigation.navigate('MainApp', { screen: 'Swaps', params: { targetTab: 'active' } });
        break;
      case 'SWAP_COMPLETED':
        navigation.navigate('MainApp', { screen: 'Swaps', params: { targetTab: 'history' } });
        break;
      case 'NEW_EVALUATION':
        if (notification.partner_id) {
          navigation.navigate('UserProfile', { userId: notification.partner_id });
        }
        break;
      default:
        break;
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-center font-technical text-sm uppercase tracking-wider text-muted-foreground">
          Retrieving_Alert_Logs...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="border-b-2 border-solid border-border bg-card px-6 pb-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="ml-[-8px] rounded-sm p-2 active:bg-muted"
          >
            <Ionicons name="arrow-back" size={28} color="#64748B" />
          </TouchableOpacity>

          <View className="flex-row gap-3">
            <TouchableOpacity onPress={handleMarkAllRead} className="p-2 active:opacity-70">
              <Text className="font-technical text-xs uppercase tracking-wider text-primary">
                Read_All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setClearLogsConfirmVisible(true)}
              className="p-2 active:opacity-70"
            >
              <Text className="font-technical text-xs uppercase tracking-wider text-red-500">
                Clear_Logs
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text className="font-technical text-2xl uppercase tracking-wider text-foreground">
          System_Alerts
        </Text>
      </View>

      {/* Alerts Feed */}
      <ScrollView
        className="flex-1 px-6 pt-4"
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {notifications.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Ionicons name="notifications-off-outline" size={48} color="#64748B" />
            <Text className="mt-4 font-technical text-sm uppercase tracking-wider text-muted-foreground">
              No_Active_Alerts
            </Text>
          </View>
        ) : (
          <View className="flex-col gap-3">
            {notifications.map((notification) => {
              const config = getNotificationConfig(notification.type);
              const formattedDate = formatTimestamp(notification.createdAt);

              return (
                <TouchableOpacity
                  key={notification._id}
                  onPress={() => handleNotificationPress(notification)}
                  activeOpacity={0.7}
                  className={`flex-row items-start gap-4 rounded-sm border-2 border-solid p-4 ${notification.is_read ? 'border-border bg-card opacity-60' : 'border-border bg-card'}`}
                >
                  {/* Icon Badge */}
                  <View
                    className="mt-1 items-center justify-center rounded-sm border-2 border-solid bg-muted p-2"
                    style={{ borderColor: notification.is_read ? '#CBD5E1' : config.color }}
                  >
                    <Ionicons
                      name={config.icon as any}
                      size={18}
                      color={notification.is_read ? '#64748B' : config.color}
                    />
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <View className="mb-1 flex-row items-center justify-between">
                      <View className="flex-col">
                        <Text
                          className="font-technical text-[10px] uppercase tracking-wider"
                          style={{ color: notification.is_read ? '#64748B' : config.color }}
                        >
                          {notification.title}
                        </Text>
                        <Text className="font-technical text-[10px] text-muted-foreground">
                          {formattedDate}
                        </Text>
                      </View>

                      {/* Explicit Delete Button */}
                      <TouchableOpacity
                        onPress={(e) => {
                          if (e && e.stopPropagation) e.stopPropagation();
                          setSelectedNotifId(notification._id);
                          setDeleteConfirmVisible(true);
                        }}
                        hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                        className="p-1 active:opacity-50"
                      >
                        <Ionicons
                          name="close"
                          size={20}
                          color={notification.is_read ? '#94A3B8' : '#64748B'}
                        />
                      </TouchableOpacity>
                    </View>

                    <Text
                      className={`mt-1 font-body text-sm leading-relaxed ${notification.is_read ? 'text-muted-foreground' : 'font-medium text-foreground'}`}
                    >
                      {notification.message}
                    </Text>
                  </View>

                  {/* Unread Dot Indicator */}
                  {!notification.is_read && (
                    <View className="mt-2 h-2 w-2 rounded-full bg-primary" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Confirm Modals */}
      <ConfirmModal
        visible={deleteConfirmVisible}
        title="Purge Alert"
        message="Are you sure you want to permanently remove this notification log?"
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onCancel={() => setClearLogsConfirmVisible(false)}
        onConfirm={executeSingleDelete}
      />

      <ConfirmModal
        visible={clearLogsConfirmVisible}
        title="Clear Read Logs"
        message="This will permanently delete all notifications that you have already read. Unread alerts will remain."
        confirmText="Clear Read Logs"
        cancelText="Cancel"
        isDestructive={true}
        onCancel={() => setClearLogsConfirmVisible(false)}
        onConfirm={handleClearReadLogs}
      />
    </View>
  );
};

export default NotificationsScreen;
