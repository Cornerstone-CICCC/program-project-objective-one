import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'trade_accepted',
    title: 'TRADE_ACCEPTED',
    message: 'Alex Chen has agreed to your proposed skill exchange.',
    time: '2m ago',
    read: false,
    icon: 'swap-horizontal',
    color: '#4f46e5', // Primary
  },
  {
    id: 'notif-2',
    type: 'review',
    title: 'NEW_EVALUATION',
    message: 'Sofia Martinez submitted a 5-star post-trade report.',
    time: '1h ago',
    read: false,
    icon: 'star',
    color: '#eab308', // Warning/Yellow
  },
  {
    id: 'notif-3',
    type: 'system',
    title: 'SYSTEM_UPDATE',
    message: 'Your local discovery radius has been successfully expanded.',
    time: '1d ago',
    read: true,
    icon: 'hardware-chip',
    color: '#64748b', // Muted Foreground
  },
];

const NotificationsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

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

          <TouchableOpacity onPress={markAllAsRead} className="active:opacity-70">
            <Text className="font-technical text-xs uppercase tracking-wider text-primary">
              Clear_Logs
            </Text>
          </TouchableOpacity>
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
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                className={`flex-row items-start gap-4 rounded-sm border-2 border-solid p-4  active:bg-muted ${notification.read ? 'border-border bg-background opacity-70' : 'border-primary bg-card'}`}
              >
                {/* Icon Badge */}
                <View
                  className="mt-1 items-center justify-center rounded-sm border-2 border-solid bg-muted p-2"
                  style={{ borderColor: notification.color }}
                >
                  <Ionicons name={notification.icon as any} size={18} color={notification.color} />
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="mb-1 flex-row items-center justify-between">
                    <Text
                      className="font-technical text-[10px] uppercase tracking-wider"
                      style={{ color: notification.color }}
                    >
                      {notification.title}
                    </Text>
                    <Text className="font-technical text-[10px] text-muted-foreground">
                      {notification.time}
                    </Text>
                  </View>
                  <Text className="font-body text-sm leading-relaxed text-foreground">
                    {notification.message}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default NotificationsScreen;
