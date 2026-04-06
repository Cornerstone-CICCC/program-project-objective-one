import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { getConversations } from '../api/message';
import { socketService } from '../sockets/socket';
import { hideTradeConversation } from '../api/trade';
import ConfirmModal from '../components/ConfirmModal';
import { Ionicons } from '@expo/vector-icons';

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

  const [conversations, setConversations] = useState<IConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
          Communication_Logs
        </Text>
        <Text className="mt-2 font-body text-sm text-muted-foreground">
          {totalUnreadCount} unread message{totalUnreadCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Message List */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="mt-4 font-technical text-sm uppercase tracking-wider text-muted-foreground">
              Decrypting_Logs...
            </Text>
          </View>
        ) : conversations.length === 0 ? (
          <View className="items-center py-12">
            <Text className="mb-2 font-technical uppercase text-muted-foreground">No_Messages</Text>
            <Text className="font-body text-sm text-muted-foreground">
              Start a conversation with a swap partner!
            </Text>
          </View>
        ) : (
          <View className="divide-y divide-border">
            {conversations.map((conversation) => {
              const hasUnread = conversation.unreadCount > 0;

              return (
                <TouchableOpacity
                  key={conversation.tradeId}
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
                  className="relative flex-row overflow-hidden bg-card p-4 active:bg-muted"
                >
                  {hasUnread && <View className="absolute bottom-0 left-0 top-0 w-1 bg-accent" />}
                  <View className="flex-1 flex-row gap-4">
                    {/* Avatar */}
                    <View className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm border-2 border-solid border-muted-foreground bg-muted">
                      <Image
                        source={{ uri: conversation.partnerAvatar || 'https://placehold.co/150' }}
                        className="h-full w-full"
                        style={{ width: 56, height: 56 }}
                        resizeMode="contain"
                      />
                    </View>

                    {/* Message Content */}
                    <View className="flex-1 justify-center">
                      <Text
                        className={`mb-1 font-body font-medium ${hasUnread ? 'text-primary' : 'text-foreground'}`}
                        numberOfLines={1}
                      >
                        {conversation.partnerName}
                      </Text>

                      <View className="my-0.5 flex-row items-center gap-1 opacity-80">
                        <Text
                          className="font-technical text-[10px] uppercase text-muted-foreground"
                          numberOfLines={1}
                        >
                          {conversation.offering} ↔ {conversation.receiving}
                        </Text>
                      </View>

                      <Text
                        className={`font-body text-sm ${hasUnread ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
                        numberOfLines={1}
                      >
                        {conversation.lastMessage}
                      </Text>
                    </View>

                    <View className="items-end justify-between pl-2">
                      <View className="flex-row items-center gap-3">
                        <Text className="font-technical text-xs text-muted-foreground">
                          {formatTimestamp(conversation.timestamp)}
                        </Text>

                        <TouchableOpacity
                          activeOpacity={0.7}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          className="rounded-sm p-1 active:bg-border"
                          onPress={(e) => {
                            if (e && e.stopPropagation) e.stopPropagation();

                            setArchiveConfig({
                              visible: true,
                              tradeId: conversation.tradeId,
                              partnerName: conversation.partnerName,
                            });
                          }}
                        >
                          <Ionicons name="archive-outline" size={16} color="#64748B" />
                        </TouchableOpacity>
                      </View>
                      {/* Unread Badge */}
                      {hasUnread ? (
                        <View className="mt-1 justify-center pl-2">
                          <View className="h-6 w-6 items-center justify-center rounded-full bg-accent">
                            <Text className="font-technical text-xs font-bold text-accent-foreground">
                              {conversation.unreadCount}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View className="mt-1 h-6 w-6" />
                      )}
                    </View>
                  </View>

                  {/* Technical Grid Pattern for Unread */}
                  {hasUnread && (
                    <View
                      className="absolute bottom-0 right-0 top-0 w-1 opacity-20"
                      pointerEvents="none"
                    >
                      <Svg width="100%" height="100%">
                        <Defs>
                          <Pattern id="stripes" width="4" height="8" patternUnits="userSpaceOnUse">
                            <Rect width="4" height="2" fill="#4F46E5" />
                          </Pattern>
                        </Defs>
                        <Rect width="100%" height="100%" fill="url(#stripes)" />
                      </Svg>
                    </View>
                  )}
                </TouchableOpacity>
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
