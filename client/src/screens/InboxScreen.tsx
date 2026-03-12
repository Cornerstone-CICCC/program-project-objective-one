import { useNavigation } from '@react-navigation/native';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { messages } from '../data/mockData';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

const InboxScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    // Calculate time units
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    // Less than 60 seconds
    if (minutes < 1) return 'Just now';

    // Less than 60 minutes
    if (minutes < 60) return `$${minutes}m ago`;

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

  const unreadCount = messages.filter((msg) => msg.unread).length;

  return (
    <View className="bg-background flex-1">
      {/* Header Container */}
      <View
        className="bg-card border-border border-b p-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <Text className="font-technical text-foreground text-2xl uppercase tracking-wider">
          Communication_Logs
        </Text>
        <Text className="font-body text-muted-foreground mt-2 text-sm">
          {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Message List */}
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="divide-border divide-y">
          {messages.map((message) => (
            <TouchableOpacity
              key={message.id}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('Chat', { userId: message.partnerId })}
              className="bg-card hover:bg-muted relative flex-row overflow-hidden p-4 transition-colors"
            >
              {message.unread && <View className="bg-accent absolute bottom-0 left-0 top-0 w-1" />}
              <View className="flex-1 flex-row gap-4">
                {/* Avatar */}
                <View className="border-muted-foreground bg-muted h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm border-2 border-solid">
                  <Image
                    source={{ uri: message.partnerAvatar }}
                    className="h-full w-full"
                    style={{ width: 56, height: 56 }}
                    resizeMode="cover"
                  />
                </View>

                {/* Message Content */}
                <View className="flex-1 justify-center">
                  <Text
                    className={`font-body mb-1 font-medium ${message.unread ? 'text-primary' : 'text-foreground'}`}
                    numberOfLines={1}
                  >
                    {message.partnerName}
                  </Text>
                  <Text
                    className={`font-body text-sm ${message.unread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}
                    numberOfLines={1}
                  >
                    {message.lastMessage}
                  </Text>
                </View>

                <View className="items-end justify-start">
                  <Text className="font-technical text-muted-foreground mb-1 text-xs">
                    {formatTimestamp(message.timestamp)}
                  </Text>
                  {/* Unread Badge */}
                  {message.unread && message.unreadCount ? (
                    <View className="mt-1 justify-center pl-2">
                      <View className="bg-accent h-6 w-6 items-center justify-center rounded-full">
                        <Text className="font-technical text-accent-foreground text-xs font-bold">
                          {message.unreadCount}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="mt-1 h-6 w-6" />
                  )}
                </View>
              </View>

              {/* Technical Grid Pattern for Unread */}
              {message.unread && (
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
          ))}
        </View>

        {/* Empty State */}
        {messages.length === 0 && (
          <View className="items-center py-12">
            <Text className="font-technical text-muted-foreground mb-2 uppercase">No_Messages</Text>
            <Text className="font-body text-muted-foreground text-sm">
              Start a conversation with a swap partner!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default InboxScreen;
