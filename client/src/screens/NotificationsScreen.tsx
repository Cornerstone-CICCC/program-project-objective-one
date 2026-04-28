import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
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

  const swipeableRefs = useRef(new Map<string, React.RefObject<any>>());

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);

  const [clearLogsConfirmVisible, setClearLogsConfirmVisible] = useState(false);

  const getSwipeableRef = (notifId: string) => {
    if (!swipeableRefs.current.has(notifId)) {
      swipeableRefs.current.set(notifId, createRef<any>());
    }
    return swipeableRefs.current.get(notifId);
  };

  const closeSwipeable = (notifId: string) => {
    const ref = swipeableRefs.current.get(notifId);
    if (ref?.current) {
      ref.current.close();
    }
  };

  const handleSwipeableOpen = (notifId: string) => {
    [...swipeableRefs.current.entries()].forEach(([key, ref]) => {
      if (key !== notifId && ref?.current) {
        ref.current.close();
      }
    });
  };

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

  const parseNotificationContent = (notif: INotification) => {
    let title = notif.title;
    let message = notif.message;

    switch (notif.type) {
      case 'SWAP_REQUESTED':
        title = 'New Swap Request';
        message = 'A new skill swap proposal has arrived.';
        break;
      case 'SWAP_ACCEPTED':
        title = 'Swap Accepted';
        message = 'Your swap proposal was accepted! You can now chat with your partner.';
        break;
      case 'SWAP_CANCELLED':
        title = 'Swap Cancelled';
        if (message.includes('Reason:')) {
          const reason = message.split('Reason:')[1].trim();
          message = `A swap request was declined or cancelled. Reason: ${reason}`;
        } else {
          message = 'A swap request was declined or cancelled.';
        }
        break;
      case 'PARTNER_COMPLETED':
        title = 'Action Required';
        message = 'Your partner marked the swap as complete. Please confirm on your end.';
        break;
      case 'SWAP_COMPLETED':
        title = 'Swap Completed';
        message = 'Trade fully completed! You can now leave a review.';
        break;
      case 'NEW_EVALUATION':
        title = 'New Review';
        message = message.replace('post-trade report', 'review');
        break;
    }

    return { title, message };
  };

  const getNotificationConfig = (type: NotificationType) => {
    switch (type) {
      case 'SWAP_REQUESTED':
        return {
          icon: 'swap-horizontal',
          textClass: 'text-indigo-600 dark:text-indigo-400',
          borderClass: 'border-indigo-600 dark:border-indigo-400',
        };
      case 'SWAP_ACCEPTED':
      case 'SWAP_COMPLETED':
        return {
          icon: 'checkmark-done-circle',
          textClass: 'text-emerald-500 dark:text-emerald-400',
          borderClass: 'border-emerald-500 dark:border-emerald-400',
        };
      case 'PARTNER_COMPLETED':
        return {
          icon: 'time',
          textClass: 'text-amber-600 dark:text-amber-400',
          borderClass: 'border-amber-600 dark:border-amber-400',
        };
      case 'SWAP_CANCELLED':
        return {
          icon: 'close-circle',
          textClass: 'text-red-600 dark:text-red-400',
          borderClass: 'border-red-600 dark:border-red-400',
        };
      case 'NEW_EVALUATION':
        return {
          icon: 'star',
          textClass: 'text-amber-600 dark:text-amber-400',
          borderClass: 'border-amber-600 dark:border-amber-400',
        };
      case 'SYSTEM_ALERT':
      default:
        return {
          icon: 'hardware-chip',
          textClass: 'text-slate-500 dark:text-slate-400',
          borderClass: 'border-slate-500 dark:border-slate-400',
        };
    }
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
          Loading Notifications...
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
        <View className="flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="rounded-sm p-1 active:bg-muted"
            >
              <Ionicons name="arrow-back" size={28} color="#64748B" />
            </TouchableOpacity>
            <Text className="font-technical text-2xl uppercase tracking-wider text-foreground">
              Notifications
            </Text>
          </View>

          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={handleMarkAllRead}
              className="flex-row items-center gap-1.5 rounded-full border-2 border-border bg-muted px-3 py-1.5 active:opacity-70"
            >
              <Ionicons
                name="checkmark-done"
                size={14}
                className="text-primary dark:text-[#A5B4FC]"
              />
              <Text className="font-technical text-[10px] font-bold uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
                Mark All Read
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setClearLogsConfirmVisible(true)}
              className="flex-row items-center gap-1.5 rounded-full border-2 border-red-200 bg-red-50 px-3 py-1.5 active:opacity-70 dark:border-red-900/50 dark:bg-red-900/20"
            >
              <Ionicons name="trash-outline" size={14} color="#EF4444" />
              <Text className="font-technical text-[10px] font-bold uppercase tracking-wider text-destructive">
                Clear Read
              </Text>
            </TouchableOpacity>
          </View>
        </View>
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
              No Notifications
            </Text>
          </View>
        ) : (
          <View className="flex-col gap-3">
            {notifications.map((notification) => {
              const config = getNotificationConfig(notification.type);
              const formattedDate = formatTimestamp(notification.createdAt);
              const isUnread = !notification.is_read;

              const { title, message } = parseNotificationContent(notification);

              const renderRightActions = () => (
                <TouchableOpacity
                  onPress={() => {
                    closeSwipeable(notification._id);
                    setSelectedNotifId(notification._id);
                    setDeleteConfirmVisible(true);
                  }}
                  className="w-20 items-center justify-center rounded-r-sm bg-destructive"
                >
                  <Ionicons name="trash" size={24} color="#FFFFFF" />
                  <Text className="mt-1 font-body text-[10px] font-bold uppercase tracking-wider text-white">
                    Delete
                  </Text>
                </TouchableOpacity>
              );

              const NotificationRow = (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => handleNotificationPress(notification)}
                  className={`relative flex-row items-center gap-4 overflow-hidden rounded-sm border-y border-r border-solid p-4 ${isUnread ? 'border-l-4 border-y-border border-l-primary border-r-border bg-card' : 'border-l border-border border-l-border bg-card opacity-70'}`}
                >
                  {/* Icon Badge */}
                  <View
                    className={`items-center justify-center rounded-sm border-2 border-solid bg-muted p-2 ${isUnread ? config.borderClass : 'border-border'}`}
                  >
                    <Ionicons
                      name={config.icon as any}
                      size={20}
                      className={isUnread ? config.textClass : 'text-muted-foreground'}
                    />
                  </View>

                  {/* Content */}
                  <View className="flex-1">
                    <View className="mb-1 flex-row items-center justify-between">
                      <Text
                        className={`flex-1 font-technical text-sm font-bold tracking-wider ${isUnread ? 'text-foreground' : 'text-muted-foreground'}`}
                        style={{ color: isUnread ? config.textClass : '#64748B' }}
                      >
                        {title}
                      </Text>
                      <Text className="ml-2 font-body text-[10px] text-muted-foreground">
                        {formattedDate}
                      </Text>
                    </View>

                    <View className="flex-row items-end justify-between">
                      <Text
                        className={`flex-1 pr-2 font-body text-sm leading-relaxed ${isUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                      >
                        {message}
                      </Text>
                    </View>
                  </View>

                  {/* Explicit Delete Button (Web Only) */}
                  {Platform.OS === 'web' && (
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={(e) => {
                        if (e && e.stopPropagation) e.stopPropagation();
                        setSelectedNotifId(notification._id);
                        setDeleteConfirmVisible(true);
                      }}
                      className="ml-2 flex-row items-center gap-1.5 rounded-sm border-2 border-border bg-muted px-3 py-1.5 transition-colors hover:border-red-200 hover:bg-red-50 dark:hover:border-red-900/50 dark:hover:bg-red-900/20"
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      <Text className="font-body text-[10px] font-bold uppercase tracking-wider text-destructive">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              );

              if (Platform.OS === 'web') {
                return (
                  <View key={notification._id} className="mb-3">
                    {NotificationRow}
                  </View>
                );
              }

              return (
                <Swipeable
                  key={notification._id}
                  ref={getSwipeableRef(notification._id)}
                  onSwipeableWillOpen={() => handleSwipeableOpen(notification._id)}
                  renderRightActions={renderRightActions}
                  friction={2}
                  rightThreshold={40}
                  containerStyle={{ marginBottom: 12 }}
                >
                  {NotificationRow}
                </Swipeable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Confirm Modals */}
      <ConfirmModal
        visible={deleteConfirmVisible}
        title="Delete Notification"
        message="Are you sure you want to permanently remove this notification?"
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setSelectedNotifId(null);
        }}
        onConfirm={executeSingleDelete}
      />

      <ConfirmModal
        visible={clearLogsConfirmVisible}
        title="Clear Read Notifications"
        message="This will permanently delete all notifications that you have already read. Unread alerts will remain safe."
        confirmText="Clear Read"
        cancelText="Cancel"
        isDestructive={true}
        onCancel={() => setClearLogsConfirmVisible(false)}
        onConfirm={handleClearReadLogs}
      />
    </View>
  );
};

export default NotificationsScreen;
