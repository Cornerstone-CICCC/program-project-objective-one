import { useNavigation, useRoute } from '@react-navigation/native';
import { useRef, useState } from 'react';
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { chatHistory, currentUser, nearbyUsers } from '../data/mockData';

const ChatScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const userId = route.params?.userId;
  const partner = nearbyUsers.find((u) => u.id === userId);

  const [messageInput, setMessageInput] = useState('');
  const [messages, setMessages] = useState(chatHistory[userId || ''] || []);

  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;

    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;

    if (distanceFromBottom > 100) {
      setShowJumpToBottom(true);
    } else {
      setShowJumpToBottom(false);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(messages.filter((msg) => msg.id !== id));
    setSelectedMessageId(null);
  };

  const handleStartEdit = (id: string, currentText: string) => {
    setEditingMessageId(id);
    setMessageInput(currentText);
    setSelectedMessageId(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setMessageInput('');
    Keyboard.dismiss();
  };

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;

    if (editingMessageId) {
      setMessages(
        messages.map((msg) => (msg.id === editingMessageId ? { ...msg, text: messageInput } : msg)),
      );
      setEditingMessageId(null);
    } else {
      const newMessage = {
        id: `chat-${Date.now()}`,
        senderId: currentUser.id,
        text: messageInput,
        timestamp: new Date(),
      };
      setMessages([...messages, newMessage]);
      setTimeout(() => scrollToBottom(), 100);
    }

    setMessageInput('');
  };

  if (!partner) {
    return (
      <View className="bg-background flex-1 items-center justify-center">
        <View className="items-center">
          <Text className="font-technical text-muted-foreground mb-2 uppercase">
            User_Not_Found
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Inbox')}>
            <Text className="font-body text-primary underline">Return to Inbox</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="bg-background flex-1"
    >
      {/* Header Container */}
      <View
        className="bg-card border-border z-10 border-b p-4"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="hover:bg-muted rounded-sm p-2 transition-colors"
            >
              <Ionicons name="arrow-back" size={24} color="#64748B" />
            </TouchableOpacity>

            <Image
              source={{ uri: partner.avatar }}
              className="border-muted-foreground bg-muted h-10 w-10 rounded-sm border-2 border-solid"
            />

            <View>
              <Text className="font-body text-foreground font-medium">{partner.name}</Text>
              <View className="flex-row items-center gap-1.5">
                <View
                  className={`h-2 w-2 rounded-full ${partner.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
                />
                <Text className="font-technical text-muted-foreground text-xs uppercase">
                  {partner.isOnline ? 'Active_Now' : 'Offline'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity className="bg-accent flex-row items-center rounded-sm px-3 py-1 transition-opacity hover:opacity-90">
            <Ionicons
              name="checkmark-circle"
              size={16}
              color="#FFFFFF"
              style={{ marginRight: 4 }}
            />
            <Text className="font-technical text-accent-foreground text-sm uppercase tracking-wider">
              Complete
            </Text>
          </TouchableOpacity>
        </View>

        {/* Context Bar */}
        <View className="border-l-primary bg-primary/10 rounded-sm border-l-4 px-3 py-2">
          <Text className="font-technical text-primary mb-1 text-xs uppercase tracking-wider">
            Context_Bar
          </Text>
          <Text className="font-body text-foreground text-sm">
            Trading: React Development ↔ Guitar Lessons
          </Text>
        </View>
      </View>

      {/* Main Chat Area */}
      <View className="bg-muted relative flex-1">
        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          onScrollBeginDrag={() => setSelectedMessageId(null)}
          scrollEventThrottle={16}
          className="flex-1 px-4 pt-4"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
          onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
        >
          <Pressable className="flex-1" onPress={() => setSelectedMessageId(null)}>
            {messages.map((message) => {
              const isSent = message.senderId === currentUser.id;
              const isSeleted = selectedMessageId === message.id;

              return (
                <View key={message.id} className="group mb-4">
                  <View className={`flex-row ${isSent ? 'justify-end' : 'justify-start'}`}>
                    <View className="max-w-[75%">
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onLongPress={() =>
                          isSent ? setSelectedMessageId(isSeleted ? null : message.id) : null
                        }
                        onPress={() => setSelectedMessageId(null)}
                        className={`rounded-sm px-4 py-3 transition-colors ${isSent ? (isSeleted ? 'bg-[#3730A3] dark:bg-[#312E81]' : 'bg-primary') : 'bg-muted-foreground'}`}
                      >
                        <Text
                          className={`font-body ${isSent ? 'text-primary-foreground' : 'text-white'}`}
                        >
                          {message.text}
                        </Text>
                      </TouchableOpacity>

                      <Text
                        className={`font-technical text-muted-foreground mt-1 px-1 text-xs ${isSent ? 'text-right' : 'text-left'}`}
                      >
                        {message.timestamp.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                  </View>

                  {isSent && (
                    <View
                      className={`mt-2 flex-row justify-end gap-3 overflow-hidden pr-1 transition-all duration-300 ease-out ${isSeleted ? 'mt-2 max-h-12 opacity-100' : 'mt-0 max-h-0 opacity-0 md:group-hover:mt-2 md:group-hover:max-h-12 md:group-hover:opacity-100'}`}
                    >
                      <TouchableOpacity
                        onPress={() => handleStartEdit(message.id, message.text)}
                        className="flex-row items-center rounded-full bg-[#E2E8F0] px-3 py-1.5 transition-opacity hover:opacity-80"
                      >
                        <Ionicons name="pencil" size={14} color="#4F46E5" />
                        <Text className="font-technical ml-1 text-xs uppercase text-[#4F46E5]">
                          Edit
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteMessage(message.id)}
                        className="flex-row items-center rounded-full bg-[#FEE2E2] px-3 py-1.5 transition-opacity hover:opacity-80"
                      >
                        <Ionicons name="trash" size={14} color="#EF4444" />
                        <Text className="font-technical ml-1 text-xs uppercase text-[#EF4444]">
                          Delete
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </Pressable>
        </ScrollView>

        {/* Jump to Buttom Button */}
        {showJumpToBottom && (
          <TouchableOpacity
            onPress={scrollToBottom}
            className="bg-card border-border absolute bottom-4 h-12 w-12 items-center justify-center rounded-full border shadow-lg ring-4"
            style={{ elevation: 5 }}
          >
            <Ionicons name="chevron-down" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Input Area */}
      <View
        className="bg-card border-border z-10 border-t p-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {editingMessageId && (
          <View className="bg-primary/10 border-primary/20 flex-row items-center justify-between border-b px-4 py-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name="pencil" size={14} color="#4F46E5" />
              <Text className="font-technical text-primary text-xs uppercase tracking-wider">
                Editing Message
              </Text>
            </View>
            <TouchableOpacity onPress={handleCancelEdit} className="p-1">
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>
        )}

        <View className="flex-row gap-2">
          <TextInput
            value={messageInput}
            onChangeText={setMessageInput}
            onSubmitEditing={handleSendMessage}
            returnKeyType={editingMessageId ? 'done' : 'send'}
            placeholder="Type your message..."
            placeholderTextColor="#64748B"
            className="font-body border-border bg-muted text-foreground focus:border-primary flex-1 rounded-sm border-2 px-4 py-3 transition-colors focus:outline-none"
          />
          <TouchableOpacity
            onPress={handleSendMessage}
            className="bg-primary items-center justify-center rounded-sm px-6 transition-opacity hover:opacity-90"
          >
            <Ionicons name={editingMessageId ? 'checkmark' : 'send'} size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
