import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth.store';
import { getTradeMessages, markMessagesAsRead } from '../api/message';
import { socketService } from '../sockets/socket';
import ConfirmModal from '../components/ConfirmModal';
import { updateTradeStatus } from '../api/trade';
import CancelTradeModal from '../components/CancelTradeModal';

interface IChatMessage {
  _id: string;
  trade_id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  sender_id: {
    _id: string;
    firstname: string;
    lastname: string;
    avatar_url?: string;
  };
}

const ChatScreen = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const {
    tradeId,
    partnerId,
    partnerName,
    partnerAvatar,
    offering,
    receiving,
    tradeStatus,
    proposedLocation,
    tradeMessage,
    offeringProficiency,
    offeringDesc,
    receivingProficiency,
    receivingDesc,
  } = route.params || {};

  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');

  const [currentTradeStatus, setCurrentTradeStatus] = useState(tradeStatus || 'ACTIVE');

  const [showJumpToBottom, setShowJumpToBottom] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);

  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);

  const [isContextExpanded, setIsContextExpanded] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);

  const [isTradeInfoVisible, setIsTradeInfoVisible] = useState(false);

  const fetchChatHistory = async () => {
    try {
      await markMessagesAsRead(tradeId);

      const data = await getTradeMessages(tradeId);
      setMessages(data);

      setTimeout(() => scrollToBottom(), 200);
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (tradeId) fetchChatHistory();
    }, [tradeId]),
  );

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket || !tradeId) return;

    socket.emit('join_trade', tradeId);

    const handleReceive = (msg: IChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => scrollToBottom(), 100);

      if (msg.sender_id._id !== user?._id && msg.sender_id._id !== user?.id) {
        markMessagesAsRead(tradeId).catch(console.error);
      }
    };

    const handleUpdate = (updatedMsg: IChatMessage) => {
      setMessages((prev) => prev.map((msg) => (msg._id === updatedMsg._id ? updatedMsg : msg)));
    };

    const handleDelete = ({ message_id }: { message_id: string }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== message_id));
      setSelectedMessageId(null);
    };

    const handleStatusUpdate = () => {};

    socket.on('receive_message', handleReceive);
    socket.on('message_updated', handleUpdate);
    socket.on('message_deleted', handleDelete);
    socket.on('swap_status_updated', handleStatusUpdate);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('message_updated', handleUpdate);
      socket.off('message_deleted', handleDelete);
      socket.off('swap_status_updated', handleStatusUpdate);
    };
  }, [tradeId, user]);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;

    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;

    setShowJumpToBottom(distanceFromBottom > 100);
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || messageInput.length > 1000 || !socketService.socket) return;

    if (editingMessageId) {
      socketService.socket.emit('edit_message', {
        trade_id: tradeId,
        message_id: editingMessageId,
        content: messageInput,
      });
      setEditingMessageId(null);
    } else {
      socketService.socket.emit('send_message', {
        trade_id: tradeId,
        content: messageInput,
      });
    }

    setMessageInput('');
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

  const triggerDelete = (id: string) => {
    setMessageToDelete(id);
    setDeleteConfirmVisible(true);
  };

  const executeDelete = () => {
    if (!socketService.socket) return;

    socketService.socket.emit('delete_message', {
      trade_id: tradeId,
      message_id: messageToDelete,
    });

    setDeleteConfirmVisible(false);
    setMessageToDelete(null);
    setSelectedMessageId(null);
  };

  const executeCancelTrade = async (reason: string) => {
    try {
      await updateTradeStatus(tradeId, 'CANCELLED', reason);

      if (socketService.socket && messages.length > 0) {
        socketService.socket.emit('send_message', {
          trade_id: tradeId,
          content: `[SYSTEM]: Swap Aborted. Reason: ${reason}`,
        });
      }

      setCurrentTradeStatus('CANCELLED');
      setIsCancelModalVisible(false);
      setIsMenuVisible(false);
    } catch (err) {
      console.error('Failed to cancel trade:', err);
      throw err;
    }
  };

  const getBadgeColor = (proficiency: string) => {
    switch (proficiency?.toUpperCase()) {
      case 'EXPERT':
        return 'bg-purple-500 text-white border-transparent';
      case 'ADVANCED':
        return 'bg-green-500 text-white border-transparent';
      case 'INTERMEDIATE':
        return 'bg-yellow-500 text-[#0F172A] border-transparent';
      default:
        return 'bg-blue-500 text-white border-transparent';
    }
  };

  if (!tradeId) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="mb-2 font-technical uppercase text-muted-foreground">Chat Not Found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text className="font-body text-primary underline dark:text-[#A5B4FC]">
            Close Channel
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getTradeStatusConfig = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED':
        return { bg: 'bg-emerald-700', icon: 'checkmark-circle', text: 'COMPLETED' };
      case 'CANCELLED':
      case 'REJECTED':
        return { bg: 'bg-red-600', icon: 'close-circle', text: 'TERMINATED' };
      default:
        return { bg: 'bg-primary', icon: 'time-outline', text: 'IN_PROGRESS' };
    }
  };

  const statusConfig = getTradeStatusConfig(tradeStatus);
  const isTradeActive =
    currentTradeStatus !== 'CANCELLED' &&
    currentTradeStatus !== 'REJECTED' &&
    currentTradeStatus !== 'COMPLETED';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      {/* Header Container */}
      <View
        className="z-10 border-b border-border bg-card p-4"
        style={{ paddingTop: Math.max(insets.top, 16) }}
      >
        <View className="mb-3 flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="rounded-sm p-2 active:bg-muted"
            >
              <Ionicons name="arrow-back" size={24} color="#64748B" />
            </TouchableOpacity>

            <Image
              source={{ uri: partnerAvatar || 'https://placehold.co/150' }}
              className="h-10 w-10 rounded-sm border-2 border-muted-foreground bg-muted"
            />

            <View>
              <Text className="font-body font-bold text-foreground">
                {partnerName || 'Swap Partner'}
              </Text>
              <View className="mt-1 flex-row items-center gap-1.5">
                <Ionicons name="link" size={12} color="#64748B" />
                <Text className="font-body text-xs text-muted-foreground">Matched</Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <View
              className={`flex-row items-center gap-1.5 rounded-sm bg-accent px-3 py-1 ${statusConfig.bg}`}
            >
              <Ionicons name={statusConfig.icon as any} size={14} color="#FFFFFF" />
              <Text className="font-technical text-xs font-bold text-white">
                {statusConfig.text}
              </Text>
            </View>

            {/* Trade Info Button */}
            <TouchableOpacity
              onPress={() => setIsTradeInfoVisible(true)}
              className="rounded-sm p-1 active:bg-muted"
            >
              <Ionicons
                name="information-circle-outline"
                size={24}
                className="text-primary dark:text-[#A5B4FC]"
              />
            </TouchableOpacity>

            {isTradeActive && (
              <TouchableOpacity
                onPress={() => setIsMenuVisible(true)}
                className="rounded-sm p-1 active:bg-muted"
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Context Bar */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setIsContextExpanded(!isContextExpanded)}
          className="mt-2 rounded-sm border-l-4 border-primary bg-muted px-3 py-2"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-1 flex-row items-center gap-2">
              <Ionicons
                name="swap-horizontal"
                size={16}
                className="text-primary dark:text-[#A5B4FC]"
              />
              <Text
                className="font-technical text-xs font-medium text-primary dark:text-[#A5B4FC]"
                numberOfLines={1}
              >
                {offering || 'Unknown'}{' '}
                <Text className="font-normal text-muted-foreground">For</Text>{' '}
                {receiving || 'Unknown'}
              </Text>
            </View>
            <Ionicons
              name={isContextExpanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#64748B"
            />
          </View>

          {isContextExpanded && (
            <View className="mt-3 border-t border-border pt-3">
              <View className="mb-2 flex-row justify-between">
                <Text className="font-technical text-xs font-medium text-muted-foreground">
                  Swap ID:
                </Text>
                <Text className="font-body text-xs text-foreground">
                  {tradeId.slice(-6).toUpperCase()}
                </Text>
              </View>

              <View className="mb-2 flex-row justify-between">
                <Text className="font-technical text-xs font-medium text-muted-foreground">
                  Location / Platform:
                </Text>
                <Text className="font-body text-xs text-foreground">
                  {route.params?.proposedLocation || 'Remote / TBD'}
                </Text>
              </View>

              {route.params?.tradeMessage && (
                <View className="mt-1">
                  <Text className="mb-1 font-technical text-xs font-medium text-muted-foreground">
                    Initial Message:
                  </Text>
                  <Text className="font-body text-xs italic text-muted-foreground">
                    {route.params.tradeMessage}
                  </Text>
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Main Chat Area */}
      <View className="relative flex-1 bg-muted">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4F46E5" />
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            onScroll={handleScroll}
            onScrollBeginDrag={() => setSelectedMessageId(null)}
            scrollEventThrottle={16}
            className="flex-1 px-4 pt-4"
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            onLayout={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={Platform.OS === 'web' ? true : false}
          >
            <Pressable className="flex-1" onPress={() => setSelectedMessageId(null)}>
              {messages.length === 0 && isTradeActive && (
                <View className="my-6 items-center justify-center">
                  <View className="max-w-[85%] rounded-sm border border-border bg-card px-4 py-3 shadow-sm">
                    <Text className="text-center font-technical text-sm font-bold uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
                      [SYSTEM]: Swap Started
                    </Text>
                    <Text className="mt-1 text-center font-body text-xs text-muted-foreground">
                      You can now chat with your swap partner. Say hello!
                    </Text>
                  </View>
                </View>
              )}

              {messages.map((message) => {
                const currentUserId = user?._id || user?.id;
                const senderId =
                  message.sender_id._id || (message.sender_id as any).id || message.sender_id;

                const isSent = String(senderId) === String(currentUserId);
                const isSeleted = selectedMessageId === message._id;
                const isSystemMessage = message.content.startsWith('[SYSTEM]');

                const createdTime = new Date(message.createdAt).getTime();
                const updatedTime = new Date(message.updatedAt).getTime();
                const isEdited = updatedTime > createdTime + 1000;

                const displayTime = new Date(
                  isEdited ? message.updatedAt : message.createdAt,
                ).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                });

                if (isSystemMessage) {
                  const parts = message.content.split('. ');
                  const title = parts[0];
                  const body = parts.length > 1 ? parts.slice(1).join('. ') : '';

                  return (
                    <View key={message._id} className="my-6 items-center justify-center">
                      <View className="max-w-[85%] rounded-sm border border-border bg-card px-4 py-3 shadow-sm">
                        <Text className="text-center font-technical text-[10px] font-bold uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
                          {title}
                        </Text>
                        {body ? (
                          <Text className="mt-1 text-center font-body text-xs text-muted-foreground">
                            {body}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  );
                }

                return (
                  <View
                    key={message._id}
                    className={`group mb-4 flex-row ${isSent ? 'justify-end' : 'justify-start'}`}
                  >
                    <View
                      className={`relative max-w-[75%] ${isSent ? 'items-end' : 'items-start'}`}
                    >
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onLongPress={() =>
                          isSent ? setSelectedMessageId(isSeleted ? null : message._id) : null
                        }
                        onPress={() => setSelectedMessageId(null)}
                        className={`rounded-sm px-4 py-3 ${isSent ? (isSeleted ? 'bg-[#3730A3] dark:bg-[#312E81]' : 'bg-primary') : 'bg-muted-foreground'}`}
                      >
                        <Text
                          className={`font-body ${isSent ? 'text-primary-foreground' : 'text-white'}`}
                        >
                          {message.content}
                        </Text>
                      </TouchableOpacity>

                      <Text
                        className={`mt-1 px-1 font-technical text-[10px] text-muted-foreground ${isSent ? 'text-right' : 'text-left'}`}
                      >
                        {isEdited ? `${displayTime} (Edited)` : displayTime}
                      </Text>
                    </View>

                    {isSent && (
                      <View
                        className={`absolute -right-2 -top-5 flex-row items-center gap-1 rounded-full border border-border bg-card px-2 py-1 shadow-sm transition-opacity duration-200 ${isSeleted ? 'z-10 opacity-100' : '-z-10 opacity-0 hover:z-10 hover:opacity-100 group-hover:z-10 group-hover:opacity-100'}`}
                      >
                        <TouchableOpacity
                          onPress={() => handleStartEdit(message._id, message.content)}
                          className="flex-row items-center rounded-full px-2 py-1 active:bg-muted"
                        >
                          <Ionicons
                            name="pencil"
                            size={14}
                            className="text-primary dark:text-[#A5B4FC]"
                          />
                        </TouchableOpacity>

                        <View className="h-3 w-[1px] bg-border" />

                        <TouchableOpacity
                          onPress={() => triggerDelete(message._id)}
                          className="flex-row items-center rounded-full  px-2 py-1 active:bg-muted"
                        >
                          <Ionicons name="trash" size={14} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </Pressable>
          </ScrollView>
        )}

        {/* Jump to Buttom Button */}
        {showJumpToBottom && (
          <TouchableOpacity
            onPress={scrollToBottom}
            className="absolute bottom-4 right-4 h-12 w-12 items-center justify-center rounded-full border border-border bg-card shadow-lg"
            style={{ elevation: 5 }}
          >
            <Ionicons name="chevron-down" size={24} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Input Area */}
      <View
        className="z-10 border-t border-border bg-card p-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {!isTradeActive ? (
          <View className="items-center justify-center rounded-sm border border-border bg-muted py-4">
            <Ionicons name="lock-closed" size={16} color="#64748B" className="mb-1" />
            <Text className="font-technical text-xs font-bold uppercase text-muted-foreground">
              Chat Locked: Trade is {currentTradeStatus}
            </Text>
          </View>
        ) : (
          <>
            {editingMessageId && (
              <View className="flex-row items-center justify-between border-b border-border bg-muted px-4 py-2">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="pencil" size={14} className="text-primary dark:text-[#A5B4FC]" />
                  <Text className="font-technical text-xs uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
                    Editing Message
                  </Text>
                </View>
                <TouchableOpacity onPress={handleCancelEdit} className="p-1">
                  <Ionicons name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>
            )}

            <View className="mt-2 flex-row gap-2">
              <TextInput
                value={messageInput}
                onChangeText={setMessageInput}
                onSubmitEditing={handleSendMessage}
                returnKeyType={editingMessageId ? 'done' : 'send'}
                blurOnSubmit={editingMessageId ? true : false}
                placeholder="Type your message..."
                placeholderTextColor="#64748B"
                className={`flex-1 rounded-sm border-2 bg-muted px-4 py-3 font-body text-foreground focus:outline-none ${messageInput.length > 1000 ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`}
              />
              <TouchableOpacity
                onPress={handleSendMessage}
                disabled={!messageInput.trim() || messageInput.length > 1000}
                className={`items-center justify-center rounded-sm px-6 ${!messageInput.trim() || messageInput.length > 1000 ? 'bg-slate-400 opacity-70 dark:bg-slate-600' : 'bg-primary active:opacity-70'}`}
              >
                <Ionicons
                  name={editingMessageId ? 'checkmark' : 'send'}
                  size={20}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <View className="mt-1 flex-row justify-end pr-1">
              <Text
                className={`font-technical text-[10px] tracking-wider ${messageInput.length > 1000 ? 'font-bold text-red-500' : 'text-muted-foreground'}`}
              >
                {messageInput.length} / 1000
              </Text>
            </View>
          </>
        )}
      </View>

      <Modal
        transparent={true}
        visible={isTradeInfoVisible}
        animationType="fade"
        onRequestClose={() => setIsTradeInfoVisible(false)}
      >
        <View className="flex-1 justify-center bg-black/60 px-6">
          <View className="w-full rounded-sm border-2 border-solid border-border bg-card p-6 shadow-lg">
            {/* Modal Header */}
            <View className="mb-4 flex-row items-center justify-between border-b border-border pb-4">
              <View>
                <Text className="font-technical text-lg uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
                  Swap Details
                </Text>
                <Text className="font-technical text-[10px] uppercase text-muted-foreground">
                  Agreed Terms
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsTradeInfoVisible(false)}
                className="p-2 active:opacity-70"
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              className="max-h-[60vh]"
              showsVerticalScrollIndicator={Platform.OS === 'web' ? true : false}
            >
              {/* You Are Offering */}
              <View className="mb-6">
                <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
                  You Are Offering
                </Text>
                <View className="rounded-sm border border-border bg-muted p-4">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-body text-base font-bold text-foreground">
                      {offering || 'Unknown'}
                    </Text>
                    {offeringProficiency && (
                      <Text
                        className={`rounded-sm border px-2 py-0.5 font-technical text-[10px] uppercase ${getBadgeColor(offeringProficiency)}`}
                      >
                        {offeringProficiency}
                      </Text>
                    )}
                  </View>
                  <Text className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">
                    {offeringDesc || 'No specific details provided.'}
                  </Text>
                </View>
              </View>

              {/* You Are Receiving */}
              <View className="mb-2">
                <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
                  {partnerName ? `${partnerName.split(' ')[0]} Is Offering` : 'You Are Receiving'}
                </Text>
                <View className="rounded-sm border border-border bg-muted p-4">
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="font-body text-base font-bold text-foreground">
                      {receiving || 'Unknown'}
                    </Text>
                    {receivingProficiency && (
                      <Text
                        className={`rounded-sm border px-2 py-0.5 font-technical text-[10px] uppercase ${getBadgeColor(receivingProficiency)}`}
                      >
                        {receivingProficiency}
                      </Text>
                    )}
                  </View>
                  <Text className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">
                    {receivingDesc || 'No specific details provided.'}
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsMenuVisible(false)}>
          <View className="flex-1 bg-black/20">
            <View className="absolute right-4 top-16 w-48 rounded-sm border border-border bg-card shadow-lg">
              <TouchableOpacity
                onPress={() => {
                  setIsMenuVisible(false);
                  setIsCancelModalVisible(true);
                }}
                className="flex-row items-center gap-3 border-b border-border p-4 active:bg-muted"
              >
                <Ionicons name="warning" size={18} color="#EF4444" />
                <Text className="font-technical text-xs font-bold uppercase text-destructive">
                  Cancel Swap
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setIsMenuVisible(false)}
                className="flex-row items-center gap-3 p-4 active:bg-muted"
              >
                <Ionicons name="flag" size={18} color="#64748B" />
                <Text className="font-technical text-xs uppercase text-foreground">
                  Report User
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <ConfirmModal
        visible={deleteConfirmVisible}
        title="Delete Message"
        message="Are you sure you want to permanently delete this message? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onCancel={() => {
          setDeleteConfirmVisible(false);
          setMessageToDelete(null);
        }}
        onConfirm={executeDelete}
      />

      <CancelTradeModal
        visible={isCancelModalVisible}
        onClose={() => setIsCancelModalVisible(false)}
        onConfirm={executeCancelTrade}
      />
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;
