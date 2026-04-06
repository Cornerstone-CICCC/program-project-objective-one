import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth.store';
import { getMyTrades, updateTradeStatus } from '../api/trade';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';
import { socketService } from '../sockets/socket';
import { checkReviewStatus } from '../api/rating';
import { getMyNotifications } from '../api/notification';
import CancelTradeModal from '../components/CancelTradeModal';

type TradeTab = 'active' | 'pending' | 'history';

interface ISwapUI {
  id: string;
  status: string;
  createdAt: string;
  partnerId: string;
  partnerName: string;
  partnerAvatar: string;
  offering: string;
  receiving: string;
  canAccept: boolean;
  message?: string;
  proposedLocation?: string;
  myCompleted: boolean;
  partnerCompleted: boolean;
  hasRated?: boolean;
  offeringProficiency?: string;
  offeringDesc?: string;
  receivingProficiency?: string;
  receivingDesc?: string;
}

let cachedTab: TradeTab = 'active';

const SwapsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TradeTab>('active');
  const [swaps, setSwaps] = useState<ISwapUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [hasUnread, setHasUnread] = useState(false);

  const [selectedSwap, setSelectedSwap] = useState<ISwapUI | null>(null);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: 'default' | 'error' | 'success';
  }>({
    visible: false,
    title: '',
    message: '',
    variant: 'default',
  });

  const [confirmConfig, setConfirmConfig] = useState<{
    visible: boolean;
    swapId: string;
    actionType: 'REJECTED' | 'CANCELLED' | null;
  }>({
    visible: false,
    swapId: '',
    actionType: null,
  });

  const [cancelModalConfig, setCancelModalConfig] = useState<{
    visible: boolean;
    swapId: string;
  }>({
    visible: false,
    swapId: '',
  });

  useEffect(() => {
    if (route.params?.targetTab) {
      setActiveTab(route.params.targetTab);
      cachedTab = route.params.targetTab;
      navigation.setParams({ targetTab: undefined });
    }
  }, [route.params?.targetTab]);

  const handleTabChange = (tab: TradeTab) => {
    setActiveTab(tab);
    cachedTab = tab;
  };

  const fetchSwaps = async (isSilent = false) => {
    if (!isSilent) {
      setIsLoading(true);
    }

    try {
      const rawTrades = await getMyTrades();

      const completedTrades = rawTrades.filter((t: any) => t.status === 'COMPLETED');
      const reviewStatusPromises = completedTrades.map((t: any) => checkReviewStatus(t._id));
      const reviewStatuses = await Promise.all(reviewStatusPromises);

      const reviewedTradeIds = new Set(
        completedTrades
          .filter((_: any, index: number) => reviewStatuses[index]?.hasReviewed)
          .map((t: any) => t._id),
      );

      const formattedSwaps = rawTrades.map((trade: any): ISwapUI => {
        const currentUserId = user?._id || user?.id;
        const initiatorId = trade.initiator_id?._id || trade.initiator_id?.id || trade.initiator_id;

        const amIInitiator = String(initiatorId) === String(currentUserId);

        const partner = amIInitiator ? trade.receiver_id : trade.initiator_id;

        const offeredSkill = trade.offered_skill_id;
        const receivedSkill = trade.received_skill_id || trade.sought_skill_id;

        const myOffering = amIInitiator ? offeredSkill?.name : receivedSkill?.name;
        const myReceiving = amIInitiator ? receivedSkill?.name : offeredSkill?.name;

        const canAccept = !amIInitiator && trade.status === 'PENDING';

        const myCompleted = amIInitiator
          ? trade.completion_confirmed_initiator
          : trade.completion_confirmed_receiver;

        const partnerCompleted = amIInitiator
          ? trade.completion_confirmed_receiver
          : trade.completion_confirmed_initiator;

        return {
          id: trade._id,
          status: trade.status,
          createdAt: trade.createdAt || trade.created_at || new Date().toISOString(),
          partnerId: partner._id,
          partnerName: `${partner.firstname} ${partner.lastname}`,
          partnerAvatar: partner.avatar_url,
          offering: myOffering || 'Unknown',
          receiving: myReceiving || 'Unknown',
          canAccept,
          message: trade.message,
          proposedLocation: trade.proposed_location,
          myCompleted: myCompleted || false,
          partnerCompleted: partnerCompleted || false,
          hasRated: reviewedTradeIds.has(trade._id),
          offeringProficiency: trade.offeringProficiency,
          offeringDesc: trade.offeringDesc,
          receivingProficiency: trade.receivingProficiency,
          receivingDesc: trade.receivingDesc,
        };
      });

      setSwaps(formattedSwaps);
    } catch (err) {
      console.error('Failed to load swaps', err);
    } finally {
      if (!isSilent) {
        setIsLoading(false);
      }
    }
  };

  const checkUnreadNotifications = async () => {
    try {
      const notifs = await getMyNotifications();
      const unreadExists = notifs.some((n: any) => !n.is_read);
      setHasUnread(unreadExists);
    } catch (err) {
      console.error('Failed to check notifications', err);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchSwaps();
      checkUnreadNotifications();
    }, []),
  );

  useEffect(() => {
    const socket = socketService.socket;
    if (!socket) return;

    const handleRefresh = () => {
      console.log('Real-time sync triggered! Refreshing swaps...');
      fetchSwaps(true);
    };

    const handleNewNotification = () => {
      setHasUnread(true);
    };

    socket.on('new_swap_received', handleRefresh);
    socket.on('swap_status_updated', handleRefresh);
    socket.on('new_notification', handleNewNotification);

    return () => {
      socket.off('new_swap_received', handleRefresh);
      socket.off('swap_status_updated', handleRefresh);
      socket.off('new_notification', handleNewNotification);
    };
  }, []);

  const handleStatusUpdate = async (
    swapId: string,
    newStatus: 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED',
    reason?: string,
  ) => {
    try {
      const res = await updateTradeStatus(swapId, newStatus, reason);

      setSelectedSwap(null);
      setConfirmConfig((prev) => ({ ...prev, visible: false }));

      if (cancelModalConfig.visible) {
        setCancelModalConfig({ visible: false, swapId: '' });
      }

      fetchSwaps(true);

      if (newStatus === 'COMPLETED') {
        const msg = res?.message || 'Completion recorded. Waiting for your partner to confirm.';
        setAlertConfig({
          visible: true,
          title: 'Status_Updated',
          message: msg,
          variant: 'success',
        });
      }
    } catch (err: any) {
      setConfirmConfig({ visible: false, swapId: '', actionType: null });
      setAlertConfig({
        visible: true,
        title: 'System_Error',
        message: err.message || 'Failed to update swap status.',
        variant: 'error',
      });
      throw err;
    }
  };

  const triggerConfirm = (swapId: string, actionType: 'REJECTED' | 'CANCELLED') => {
    if (selectedSwap) {
      setSelectedSwap(null);
    }

    setConfirmConfig({
      visible: true,
      swapId,
      actionType,
    });
  };

  const getFilteredSwaps = () => {
    switch (activeTab) {
      case 'active':
        return swaps.filter((s) => s.status === 'ACCEPTED');
      case 'pending':
        return swaps.filter((s) => s.status === 'PENDING');
      case 'history':
        return swaps.filter((s) => ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(s.status));
      default:
        return [];
    }
  };

  const getStatusBadge = (status: string, canAccept: boolean) => {
    switch (status) {
      case 'ACCEPTED':
        return {
          iconName: 'time-outline',
          text: 'IN_PROGRESS',
          bgColor: 'bg-accent',
          textColor: 'text-white',
        };
      case 'PENDING':
        return {
          iconName: 'alert-circle',
          text: canAccept ? 'ACTION_REQUIRED' : 'AWAITING_RESPONSE',
          bgColor: canAccept ? 'bg-yellow-500' : 'bg-[#64748b]',
          textColor: 'text-white',
        };
      case 'COMPLETED':
        return {
          iconName: 'checkmark-circle',
          text: 'COMPLETED',
          bgColor: 'bg-green-600',
          textColor: 'text-white',
        };
      case 'REJECTED':
      case 'CANCELLED':
        return {
          iconName: 'close-circle',
          text: 'TERMINATED',
          bgColor: 'bg-red-600',
          textColor: 'text-white',
        };
      default:
        return {
          iconName: 'help-circle',
          text: 'UNKNOWN',
          bgColor: 'bg-muted',
          textColor: 'text-foreground',
        };
    }
  };

  const getBadgeColor = (proficiency: string) => {
    switch (proficiency?.toUpperCase()) {
      case 'EXPERT':
        return 'text-purple-500 border-purple-500';
      case 'ADVANCED':
        return 'text-green-500 border-green-500';
      case 'INTERMEDIATE':
        return 'text-yellow-500 border-yellow-500';
      default:
        return 'text-blue-500 border-blue-500';
    }
  };

  const currentSwaps = getFilteredSwaps();

  return (
    <View className="flex-1 bg-background">
      {/* Header & Tabs */}
      <View
        className="border-b-2 border-solid border-border bg-card px-6 pb-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="font-technical text-2xl uppercase tracking-wider text-foreground">
            Swap_Control_Center
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            className="relative rounded-sm p-2 active:opacity-70"
          >
            <Ionicons name="notifications-outline" size={24} color="#64748B" />
            {hasUnread && (
              <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-solid border-card bg-primary" />
            )}
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-2">
          {(['active', 'pending', 'history'] as TradeTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => handleTabChange(tab)}
                className={`flex-1 items-center justify-center rounded-sm border-2 border-solid py-3 active:opacity-80 ${isActive ? 'border-primary bg-primary' : 'border-border bg-card'}`}
              >
                <Text
                  className={`font-technical text-xs uppercase tracking-wider ${isActive ? 'text-white' : 'text-muted-foreground'}`}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Trade List */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View className="items-center justify-center py-12">
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text className="mt-4 font-technical text-sm uppercase tracking-wider text-muted-foreground">
              Retrieving_Swap_Data...
            </Text>
          </View>
        ) : currentSwaps.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="swap-horizontal" size={48} color="#64748B" />
            <Text className="mt-4 font-technical text-sm uppercase tracking-wider text-muted-foreground">
              No_{activeTab.toUpperCase()}_Swaps
            </Text>
            <Text className="mt-2 px-4 text-center font-body text-sm text-muted-foreground">
              {activeTab === 'active' && 'Initialize a swap to start collaborating!'}
              {activeTab === 'pending' && 'Check the map to find potential swap partners.'}
              {activeTab === 'history' && 'Your completed and archived swaps will appear here.'}
            </Text>
          </View>
        ) : (
          <View className="flex-col gap-4">
            {currentSwaps.map((swap) => {
              const badge = getStatusBadge(swap.status, swap.canAccept);

              return (
                <TouchableOpacity
                  key={swap.id}
                  activeOpacity={0.9}
                  onPress={() => setSelectedSwap(swap)}
                  className="rounded-sm border-2 border-solid border-border bg-card p-4"
                >
                  {/* Status Badge & Date */}
                  <View className="mb-4 flex-row items-center justify-between">
                    <View
                      className={`flex-row items-center gap-1.5 rounded-sm px-3 py-1 ${badge.bgColor}`}
                    >
                      <Ionicons
                        name={badge.iconName as any}
                        size={14}
                        color={badge.textColor === 'text-white' ? '#FFFFFF' : '#0f172a'}
                      />
                      <Text
                        className={`font-technical text-[10px] font-bold uppercase ${badge.textColor}`}
                      >
                        {badge.text}
                      </Text>
                    </View>

                    <Text className="font-body text-xs text-muted-foreground">
                      {new Date(swap.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>

                  {/* Trade Partner */}
                  <View className="mb-4 flex-row items-center justify-between">
                    <TouchableOpacity
                      className="flex-row items-center gap-3 active:opacity-70"
                      onPress={() => navigation.navigate('UserProfile', { userId: swap.partnerId })}
                    >
                      <Image
                        source={{ uri: swap.partnerAvatar || 'https://placehold.co/150' }}
                        className="h-12 w-12 rounded-sm border-2 border-solid border-muted-foreground bg-muted"
                        resizeMode="contain"
                      />
                      <View>
                        <Text className="mb-1 font-technical text-[10px] uppercase tracking-wider text-muted-foreground">
                          Swap_Partner
                        </Text>
                        <Text className="font-body text-base font-medium text-foreground">
                          {swap.partnerName}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <View className="flex-col items-end gap-2">
                      {(swap.message || swap.proposedLocation) && (
                        <View className="flex-row items-center gap-1 rounded-sm bg-muted px-2 py-1">
                          <Ionicons name="chatbubble-ellipses" size={12} color="#64748B" />
                          <Text className="font-technical text-[10px] text-muted-foreground">
                            Has Note
                          </Text>
                        </View>
                      )}

                      {/* Notification if partner confirmed completion first */}
                      {swap.status === 'ACCEPTED' && swap.partnerCompleted && !swap.myCompleted && (
                        <View className="flex-row items-center gap-1 rounded-sm bg-green-500/20 px-2 py-1">
                          <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
                          <Text className="font-technical text-[10px] uppercase text-green-600">
                            Partner Confirmed
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Trade Details */}
                  <View className="mb-4 flex-row items-center justify-between rounded-sm border-2 border-solid border-border bg-muted p-3">
                    <View className="flex-1">
                      <Text className="mb-1 font-technical text-[10px] uppercase text-muted-foreground">
                        You_Provide
                      </Text>
                      <Text
                        className="font-body text-sm font-medium text-foreground"
                        numberOfLines={1}
                      >
                        {swap.offering}
                      </Text>
                    </View>

                    <View className="px-2">
                      <Ionicons name="swap-horizontal" size={20} color="#4f46e5" />
                    </View>

                    <View className="flex-1 items-end">
                      <Text className="mb-1 font-technical text-[10px] uppercase text-muted-foreground">
                        You_Receive
                      </Text>
                      <Text
                        className="font-body text-sm font-medium text-foreground"
                        numberOfLines={1}
                      >
                        {swap.receiving}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2">
                    {!['REJECTED', 'CANCELLED', 'PENDING'].includes(swap.status) && (
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('Chat', {
                            tradeId: swap.id,
                            partnerId: swap.partnerId,
                            partnerName: swap.partnerName,
                            partnerAvatar: swap.partnerAvatar,
                            offering: swap.offering,
                            receiving: swap.receiving,
                            tradeStatus: swap.status,
                            proposedLocation: swap.proposedLocation,
                            tradeMessage: swap.message,
                            offeringProficiency: swap.offeringProficiency,
                            offeringDesc: swap.offeringDesc,
                            receivingProficiency: swap.receivingProficiency,
                            receivingDesc: swap.receivingDesc,
                          })
                        }
                        className="flex-1 items-center justify-center rounded-sm bg-primary py-3 active:opacity-80"
                      >
                        <Text className="font-technical text-xs uppercase tracking-wider text-white">
                          Message
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Rate Partner button appears ONLY when fully completed */}
                    {swap.status === 'COMPLETED' && (
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('Rating', {
                            tradeId: swap.id,
                            partnerId: swap.partnerId,
                            partnerName: swap.partnerName,
                            partnerAvatar: swap.partnerAvatar,
                          })
                        }
                        className={`flex-1 items-center justify-center rounded-sm border-2 border-solid py-3 active:opacity-70 ${swap.hasRated ? 'border-[#EAB308] bg-transparent' : 'border-[#EAB308] bg-[#EAB308]'}`}
                      >
                        <Text
                          className={`font-technical text-xs uppercase tracking-wider ${swap.hasRated ? 'text-[#EAB308]' : 'text-[#0F172A]'} `}
                        >
                          {swap.hasRated ? 'Edit Rating' : 'Rate Partner'}
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Dual Confirmation Buttons */}
                    {swap.status === 'ACCEPTED' && (
                      <View className="flex-1 flex-row">
                        {!swap.myCompleted ? (
                          <TouchableOpacity
                            onPress={() => handleStatusUpdate(swap.id, 'COMPLETED')}
                            className="flex-1 items-center justify-center rounded-sm border-2 border-solid border-green-600 bg-transparent py-3 active:opacity-70"
                          >
                            <Text className="font-technical text-xs uppercase tracking-wider text-green-600">
                              {swap.partnerCompleted ? 'Confirm Complete' : 'Complete'}
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View className="flex-1 items-center justify-center rounded-sm border-2 border-solid border-muted-foreground bg-muted py-3 opacity-60">
                            <Text className="font-technical text-[10px] uppercase tracking-wider text-muted-foreground">
                              Awaiting Partner
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {swap.status === 'PENDING' && (
                      <View className="flex-1 flex-row gap-2">
                        {swap.canAccept ? (
                          <>
                            <TouchableOpacity
                              onPress={() => handleStatusUpdate(swap.id, 'ACCEPTED')}
                              className="flex-1 items-center justify-center rounded-sm border-2 border-solid border-primary bg-transparent py-3 active:opacity-70"
                            >
                              <Text className="font-technical text-xs uppercase tracking-wider text-primary">
                                Authorize
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => triggerConfirm(swap.id, 'REJECTED')}
                              className="items-center justify-center rounded-sm border-2 border-solid border-red-500 bg-transparent px-4 py-3 active:opacity-70"
                            >
                              <Text className="font-technical text-xs uppercase tracking-wider text-red-500">
                                Decline
                              </Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <TouchableOpacity
                            onPress={() => triggerConfirm(swap.id, 'CANCELLED')}
                            className="flex-1 items-center justify-center rounded-sm border-2 border-solid border-muted-foreground bg-transparent py-3 active:opacity-70"
                          >
                            <Text className="font-technical text-xs uppercase tracking-wider text-muted-foreground">
                              Cancel Request
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Detail/Review Modal */}
      <Modal
        visible={selectedSwap !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedSwap(null)}
      >
        {selectedSwap && (
          <View className="flex-1 justify-end bg-black/50">
            <View className="mt-24 w-full rounded-t-xl border-t-2 border-solid border-border bg-card p-6 shadow-xl">
              <View className="mb-6 flex-row items-center justify-between border-b border-border pb-4">
                <Text className="font-technical text-lg uppercase tracking-wider text-foreground">
                  Swap_Parameters
                </Text>
                <TouchableOpacity
                  onPress={() => setSelectedSwap(null)}
                  className="p-1 active:opacity-70"
                >
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View className="mb-6 flex-row items-center gap-4">
                <Image
                  source={{ uri: selectedSwap.partnerAvatar || 'https://placehold.co/150' }}
                  className="h-16 w-16 rounded-sm border-2 border-solid border-border bg-muted"
                />
                <View>
                  <Text className="font-technical text-[10px] uppercase text-muted-foreground">
                    Initiating_Partner
                  </Text>
                  <Text className="font-body text-xl font-medium text-foreground">
                    {selectedSwap.partnerName}
                  </Text>
                </View>
              </View>

              <ScrollView className="mb-4 max-h-[50vh]" showsVerticalScrollIndicator={false}>
                {/* You Provide Section */}
                <View className="mb-4">
                  <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
                    You Are Supplying
                  </Text>
                  <View className="rounded-sm border border-border bg-muted p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-body text-base font-bold text-primary">
                        {selectedSwap.offering}
                      </Text>
                      {selectedSwap.offeringProficiency && (
                        <Text
                          className={`rounded-sm border px-2 py-0.5 font-technical text-[10px] uppercase ${getBadgeColor(selectedSwap.offeringProficiency)}`}
                        >
                          {selectedSwap.offeringProficiency}
                        </Text>
                      )}
                    </View>
                    <Text className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">
                      {selectedSwap.offeringDesc || 'No specific parameters were provided.'}
                    </Text>
                  </View>
                </View>

                {/* You Receive Section */}
                <View className="mb-4">
                  <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
                    {selectedSwap.partnerName
                      ? `${selectedSwap.partnerName.split(' ')[0]} Is Supplying`
                      : 'You Are Receiving'}
                  </Text>
                  <View className="rounded-sm border border-border bg-muted p-4">
                    <View className="flex-row items-center justify-between">
                      <Text className="font-body text-base font-bold text-accent">
                        {selectedSwap.receiving}
                      </Text>
                      {selectedSwap.receivingProficiency && (
                        <Text
                          className={`rounded-sm border px-2 py-0.5 font-technical text-[10px] uppercase ${getBadgeColor(selectedSwap.receivingProficiency)}`}
                        >
                          {selectedSwap.receivingProficiency}
                        </Text>
                      )}
                    </View>
                    <Text className="mt-1 font-body text-sm leading-relaxed text-muted-foreground">
                      {selectedSwap.receivingDesc || 'No specific parameters were provided.'}
                    </Text>
                  </View>
                </View>
              </ScrollView>

              {/* Proposed Location */}
              {selectedSwap.proposedLocation && (
                <View className="mb-4">
                  <Text className="mb-1 font-technical text-[10px] uppercase text-muted-foreground">
                    Proposed_Coordinates
                  </Text>
                  <View className="flex-row items-center gap-2 rounded-sm border-2 border-solid border-border bg-background p-3">
                    <Ionicons name="location" size={16} color="#4f46e5" />
                    <Text className="font-body text-sm text-foreground">
                      {selectedSwap.proposedLocation}
                    </Text>
                  </View>
                </View>
              )}

              {/* Message */}
              {selectedSwap.message && (
                <View className="mb-8">
                  <Text className="mb-1 font-technical text-[10px] uppercase text-muted-foreground">
                    Incoming_Transmission
                  </Text>
                  <View className="rounded-sm border-2 border-solid border-border bg-background p-4">
                    <Text className="font-body text-sm italic text-foreground">
                      {selectedSwap.message}
                    </Text>
                  </View>
                </View>
              )}

              {/* Modal Action Buttons */}
              <View className="mb-4 flex-col gap-3">
                {selectedSwap.status === 'PENDING' && selectedSwap.canAccept && (
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      onPress={() => handleStatusUpdate(selectedSwap.id, 'ACCEPTED')}
                      className="flex-1 items-center justify-center rounded-sm bg-primary py-4 active:opacity-80"
                    >
                      <Text className="font-technical text-sm uppercase tracking-wider text-white">
                        Authorize
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => triggerConfirm(selectedSwap.id, 'REJECTED')}
                      className="items-center justify-center rounded-sm border-2 border-solid border-red-500 bg-transparent px-5 py-4 active:opacity-70"
                    >
                      <Text className="font-technical text-sm uppercase tracking-wider text-red-500">
                        Decline
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {selectedSwap.status === 'PENDING' && !selectedSwap.canAccept && (
                  <TouchableOpacity
                    onPress={() => triggerConfirm(selectedSwap.id, 'CANCELLED')}
                    className="w-full items-center justify-center rounded-sm border-2 border-solid border-muted-foreground bg-transparent py-4 active:opacity-70"
                  >
                    <Text className="font-technical text-sm uppercase tracking-wider text-muted-foreground">
                      Cancel Request
                    </Text>
                  </TouchableOpacity>
                )}

                {!['REJECTED', 'CANCELLED', 'PENDING'].includes(selectedSwap.status) && (
                  <TouchableOpacity
                    onPress={() => {
                      const snapSelected = { ...selectedSwap };
                      setSelectedSwap(null);
                      navigation.navigate('Chat', {
                        tradeId: selectedSwap.id,
                        partnerId: selectedSwap.partnerId,
                        partnerName: selectedSwap.partnerName,
                        partnerAvatar: selectedSwap.partnerAvatar,
                        offering: selectedSwap.offering,
                        receiving: selectedSwap.receiving,
                        tradeStatus: selectedSwap.status,
                        proposedLocation: selectedSwap.proposedLocation,
                        tradeMessage: selectedSwap.message,
                        offeringProficiency: snapSelected.offeringProficiency,
                        offeringDesc: snapSelected.offeringDesc,
                        receivingProficiency: snapSelected.receivingProficiency,
                        receivingDesc: snapSelected.receivingDesc,
                      });
                    }}
                    className="w-full items-center justify-center rounded-sm bg-primary py-4 active:opacity-80"
                  >
                    <Text className="font-technical text-sm uppercase tracking-wider text-white">
                      Message
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Modal Dual Confirmation Buttons */}
                {selectedSwap.status === 'ACCEPTED' && (
                  <View className="flex-col gap-3">
                    {/* The Complete Action */}
                    <View className="flex-row">
                      {!selectedSwap.myCompleted ? (
                        <TouchableOpacity
                          onPress={() => handleStatusUpdate(selectedSwap.id, 'COMPLETED')}
                          className="flex-1 items-center justify-center rounded-sm border-2 border-solid border-green-600 bg-transparent py-4 active:opacity-70"
                        >
                          <Text className="font-technical text-sm uppercase tracking-wider text-green-600">
                            {selectedSwap.partnerCompleted
                              ? 'Confirm Completion'
                              : 'Mark as Complete'}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <View className="flex-1 items-center justify-center rounded-sm border-2 border-solid border-muted-foreground bg-muted py-4 opacity-60">
                          <Text className="text-center font-technical text-sm uppercase tracking-wider text-muted-foreground">
                            Awaiting Partner Confirmation
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* The Abort Swap Action */}
                    {!selectedSwap.myCompleted && (
                      <TouchableOpacity
                        onPress={() => {
                          setCancelModalConfig({ visible: true, swapId: selectedSwap.id });
                          setSelectedSwap(null);
                        }}
                        className="w-full flex-row items-center justify-center gap-2 rounded-sm border-2 border-solid border-red-500/50 bg-transparent py-3 active:opacity-70"
                      >
                        <Ionicons name="warning-outline" size={16} color="#ef4444" />
                        <Text className="font-technical text-xs uppercase tracking-wider  text-red-500">
                          Abort Swap
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Modal Rate Partner button */}
                {selectedSwap.status === 'COMPLETED' && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedSwap(null);
                      navigation.navigate('Rating', {
                        tradeId: selectedSwap.id,
                        partnerId: selectedSwap.partnerId,
                        partnerName: selectedSwap.partnerName,
                        partnerAvatar: selectedSwap.partnerAvatar,
                      });
                    }}
                    className={`w-full items-center justify-center rounded-sm border-2 border-solid py-3 active:opacity-70 ${selectedSwap.hasRated ? 'border-[#EAB308] bg-transparent' : 'border-[#EAB308] bg-[#EAB308]'}`}
                  >
                    <Text
                      className={`font-technical text-xs uppercase tracking-wider ${selectedSwap.hasRated ? 'text-[#EAB308]' : 'text-[#0F172A]'} `}
                    >
                      {selectedSwap.hasRated ? 'Edit Rating' : 'Rate Partner'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}
      </Modal>

      <ConfirmModal
        visible={confirmConfig.visible}
        title={confirmConfig.actionType === 'CANCELLED' ? 'Cancel Proposal' : 'Decline Swap'}
        message={
          confirmConfig.actionType === 'CANCELLED'
            ? 'Are you sure you want to retract your swap proposal? This action cannot be undone.'
            : 'Are you sure you want to decline this swap proposal? This action cannot be undone.'
        }
        confirmText={confirmConfig.actionType === 'CANCELLED' ? 'Cancel Swap' : 'Decline Swap'}
        cancelText="Nevermind"
        isDestructive={true}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, visible: false }))}
        onConfirm={() => handleStatusUpdate(confirmConfig.swapId, confirmConfig.actionType!)}
      />

      <CancelTradeModal
        visible={cancelModalConfig.visible}
        onClose={() => setCancelModalConfig({ visible: false, swapId: '' })}
        onConfirm={async (reason) => {
          await handleStatusUpdate(cancelModalConfig.swapId, 'CANCELLED', reason);
        }}
      />

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.variant}
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </View>
  );
};

export default SwapsScreen;
