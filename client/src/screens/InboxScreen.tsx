import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { createRef, useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { getConversations } from '../api/message';
import { socketService } from '../sockets/socket';
import { hideTradeConversation } from '../api/trade';
import ConfirmModal from '../components/ConfirmModal';
import { Ionicons } from '@expo/vector-icons';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

interface IConversation {
  tradeId: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  offering: string;
  receiving: string;
  tradeStatus: string;
  proposedLocation: string;
  tradeMessage: string;
  offeringProficiency?: string;
  offeringDesc?: string;
  receivingProficiency?: string;
  receivingDesc?: string;
}

const InboxScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primaryIconColor = isDark ? '#A5B4FC' : '#4F46E5';

  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const swipeableRefs = useRef(new Map<string, React.RefObject<any>>());

  const [archiveConfig, setArchiveConfig] = useState<{
    visible: boolean;
    tradeId: string;
    partnerName: string;
  }>({
    visible: false,
    tradeId: '',
    partnerName: '',
  });

  const fetchInbox = async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);

    try {
      const data = await getConversations();

      const sorted = data.sort(
        (a: IConversation, b: IConversation) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

      setConversations(sorted);
    } catch (err) {
      console.error('Failed to load inbox:', err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchInbox();
    }, []),
  );

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const handleNewMessage = () => {
      console.log('New message received! Refreshing inbox...');
      fetchInbox(true);
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, []);

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

  const getSwipeableRef = (tradeId: string) => {
    if (!swipeableRefs.current.has(tradeId)) {
      swipeableRefs.current.set(tradeId, createRef<any>());
    }
    return swipeableRefs.current.get(tradeId);
  };

  const executeArchive = async () => {
    setConversations((prev) => prev.filter((c) => c.tradeId !== archiveConfig.tradeId));

    try {
      await hideTradeConversation(archiveConfig.tradeId);
    } catch (err) {
      console.error('Failed to hide conversation', err);
      fetchInbox(true);
    }

    setArchiveConfig({ visible: false, tradeId: '', partnerName: '' });
  };

  const closeSwipeable = (tradeId: string) => {
    const ref = swipeableRefs.current.get(tradeId);
    if (ref?.current) {
      ref.current.close();
    }
  };

  const handleSwipeableOpen = (tradeId: string) => {
    [...swipeableRefs.current.entries()].forEach(([key, ref]) => {
      if (key !== tradeId && ref?.current) {
        ref.current.close();
      }
    });
  };

  const totalUnreadCount = conversations.reduce(
    (sum, conversation) => sum + conversation.unreadCount,
    0,
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header Container */}
      <View
        className="border-b border-border bg-card p-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <Text className="font-technical text-2xl uppercase tracking-wider text-foreground">
          Messages
        </Text>
        <Text className="mt-2 font-body text-sm text-muted-foreground">
          {totalUnreadCount} unread message{totalUnreadCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Message List */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color={primaryIconColor} />
            <Text className="mt-4 font-technical text-sm uppercase tracking-wider text-muted-foreground">
              Loading Inbox...
            </Text>
          </View>
        ) : conversations.length === 0 ? (
          <View className="items-center py-12">
            <Ionicons name="chatbubble-outline" size={48} color="#64748B" className="mb-4" />
            <Text className="mb-2 font-technical uppercase text-muted-foreground">Inbox Empty</Text>
            <Text className="font-body text-sm text-muted-foreground">
              Start a conversation with a swap partner!
            </Text>
          </View>
        ) : (
          <View className="divide-y divide-border">
            {conversations.map((conversation) => {
              const hasUnread = conversation.unreadCount > 0;

              const renderRightActions = () => (
                <TouchableOpacity
                  onPress={() => {
                    closeSwipeable(conversation.tradeId);
                    setArchiveConfig({
                      visible: true,
                      tradeId: conversation.tradeId,
                      partnerName: conversation.partnerName,
                    });
                  }}
                  className="bg-destructive w-20 items-center justify-center"
                >
                  <Ionicons name="archive" size={24} color="#FFFFFF" />
                  <Text className="mt-1 font-body text-[10px] font-bold uppercase tracking-wider text-white">
                    Hide
                  </Text>
                </TouchableOpacity>
              );

              const ChatRow = (
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() =>
                    navigation.navigate('Chat', {
                      tradeId: conversation.tradeId,
                      partnerId: conversation.partnerId,
                      partnerName: conversation.partnerName,
                      partnerAvatar: conversation.partnerAvatar,
                      offering: conversation.offering,
                      receiving: conversation.receiving,
                      tradeStatus: conversation.tradeStatus,
                      proposedLocation: conversation.proposedLocation,
                      tradeMessage: conversation.tradeMessage,
                      offeringProficiency: conversation.offeringProficiency,
                      offeringDesc: conversation.offeringDesc,
                      receivingProficiency: conversation.receivingProficiency,
                      receivingDesc: conversation.receivingDesc,
                    })
                  }
                  className={`relative flex-row overflow-hidden bg-card p-4 active:bg-muted ${hasUnread ? 'border-l-4 border-primary' : 'border-l-4 border-transparent'}`}
                >
                  <View className="flex-1 flex-row items-center gap-4">
                    {/* Avatar */}
                    <View className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm border-2 border-muted-foreground bg-muted">
                      <Image
                        source={{ uri: conversation.partnerAvatar || 'https://placehold.co/150' }}
                        className="h-full w-full"
                        style={{ width: 56, height: 56 }}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Message Content */}
                    <View className="flex-1 justify-center">
                      <View className="mb-1 flex-row items-center justify-between">
                        <View className="flex-1 flex-row items-center pr-2">
                          <Text
                            className={`font-body font-bold ${hasUnread ? 'text-primary dark:text-[#A5B4FC]' : 'text-muted-foreground'}`}
                            numberOfLines={1}
                          >
                            {conversation.partnerName}
                          </Text>
                          <Text className="mx-2 text-muted-foreground">•</Text>
                          <Text
                            className="flex-1 font-technical text-[10px] uppercase text-muted-foreground"
                            numberOfLines={1}
                          >
                            {conversation.offering} ↔ {conversation.receiving}
                          </Text>
                        </View>
                        <Text className="whitespace-nowrap font-body text-[10px] text-muted-foreground">
                          {formatTimestamp(conversation.timestamp)}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <Text
                          className={`flex-1 pr-4 font-body text-sm ${hasUnread ? 'font-bold text-foreground' : 'text-muted-foreground'}`}
                          numberOfLines={1}
                        >
                          {conversation.lastMessage}
                        </Text>

                        <View className="flex-row items-center gap-3">
                          {hasUnread && (
                            <View className="h-5 w-5 items-center justify-center rounded-full bg-primary">
                              <Text className="font-body text-[10px] font-bold text-primary-foreground">
                                {conversation.unreadCount}
                              </Text>
                            </View>
                          )}

                          {Platform.OS === 'web' && (
                            <TouchableOpacity
                              activeOpacity={0.7}
                              onPress={(e) => {
                                if (e && e.stopPropagation) e.stopPropagation();

                                setArchiveConfig({
                                  visible: true,
                                  tradeId: conversation.tradeId,
                                  partnerName: conversation.partnerName,
                                });
                              }}
                              className="flex-row items-center gap-1.5 rounded-sm border border-border bg-muted px-3 py-1.5 transition-colors hover:border-red-200 hover:bg-red-50 dark:hover:border-red-900/50 dark:hover:bg-red-900/20"
                            >
                              <Ionicons name="archive-outline" size={18} color="#EF4444" />
                              <Text className="text-destructive font-technical text-[10px] font-bold uppercase tracking-wider">
                                Hide
                              </Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );

              if (Platform.OS === 'web') {
                return <View key={conversation.tradeId}>{ChatRow}</View>;
              }

              return (
                <Swipeable
                  key={conversation.tradeId}
                  ref={getSwipeableRef(conversation.tradeId)}
                  onSwipeableWillOpen={() => handleSwipeableOpen(conversation.tradeId)}
                  renderRightActions={renderRightActions}
                  friction={2}
                  rightThreshold={40}
                >
                  {ChatRow}
                </Swipeable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={archiveConfig.visible}
        title="Hide Conversation"
        message={`Are you sure you want to remove the conversation with ${archiveConfig.partnerName} from your inbox? It will reappear if they message you again.`}
        confirmText="Hide"
        cancelText="Cancel"
        isDestructive={true}
        onCancel={() => setArchiveConfig({ visible: false, tradeId: '', partnerName: '' })}
        onConfirm={executeArchive}
      />
    </View>
  );
};

export default InboxScreen;
