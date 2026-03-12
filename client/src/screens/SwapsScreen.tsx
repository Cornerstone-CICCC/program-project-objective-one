import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { activeTrades, completedTrades, pendingTrades, Trade } from '../data/mockData';

type TradeTab = 'active' | 'pending' | 'history';

const SwapsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TradeTab>('active');

  const getTrades = () => {
    switch (activeTab) {
      case 'active':
        return activeTrades;
      case 'pending':
        return pendingTrades;
      case 'history':
        return completedTrades;
      default:
        return [];
    }
  };

  const getStatusBadge = (status: Trade['status']) => {
    switch (status) {
      case 'active':
        return {
          iconName: 'time-outline',
          text: 'IN_PROGRESS',
          bgColor: 'bg-accent',
          textColor: 'text-white',
        };
      case 'pending':
        return {
          iconName: 'alert-circle',
          text: 'AWAITING_RESPONSE',
          bgColor: 'bg-[#64748b]',
          textColor: 'text-white',
        };
      case 'completed':
        return {
          iconName: 'checkmark-circle',
          text: 'COMPLETED',
          bgColor: 'bg-primary',
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

  const currentTrades = getTrades();

  return (
    <View className="flex-1 bg-background">
      {/* Header & Tabs */}
      <View
        className="border-b-2 border-solid border-border bg-card px-6 pb-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="font-technical text-2xl uppercase tracking-wider text-foreground">
            Trade_Dashboard
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('Notifications')}
            className="relative rounded-sm p-2 active:bg-muted"
          >
            <Ionicons name="notifications-outline" size={24} color="#64748B" />
            <View className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full border-2 border-solid border-card bg-primary" />
          </TouchableOpacity>
        </View>

        <View className="flex-row gap-2">
          {(['active', 'pending', 'history'] as TradeTab[]).map((tab) => {
            const isActive = activeTab === tab;
            return (
              <TouchableOpacity
                key={tab}
                onPress={() => setActiveTab(tab)}
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
        {currentTrades.length === 0 ? (
          <View className="items-center justify-center py-12">
            <Ionicons name="swap-horizontal" size={48} color="#64748B" />
            <Text className="mt-4 font-technical text-sm uppercase tracking-wider text-muted-foreground">
              No_{activeTab.toUpperCase()}_Trades
            </Text>
            <Text className="mt-2 px-4 text-center font-body text-sm text-muted-foreground">
              {activeTab === 'active' && 'Start trading skills with your community!'}
              {activeTab === 'pending' && 'Check the map to find potential swap partners.'}
              {activeTab === 'history' && 'Your completed trades will appear here.'}
            </Text>
          </View>
        ) : (
          <View className="flex-col gap-4">
            {currentTrades.map((trade) => {
              const badge = getStatusBadge(trade.status);

              return (
                <View
                  key={trade.id}
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
                      {new Date(trade.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>

                  {/* Trade Partner */}
                  <TouchableOpacity
                    className="mb-4 flex-row items-center gap-3 active:opacity-70"
                    onPress={() => navigation.navigate('UserProfile', { userId: trade.partnerId })}
                  >
                    <Image
                      source={{ uri: trade.partnerAvatar }}
                      className="h-12 w-12 rounded-sm border-2 border-solid border-muted-foreground bg-muted"
                      resizeMode="cover"
                    />
                    <View>
                      <Text className="mb-1 font-technical text-[10px] uppercase tracking-wider text-muted-foreground">
                        Trade_Partner
                      </Text>
                      <Text className="font-body text-base font-medium text-foreground">
                        {trade.partnerName}
                      </Text>
                    </View>
                  </TouchableOpacity>

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
                        {trade.offering}
                      </Text>
                    </View>

                    <View className="px-2">
                      <Ionicons name="arrow-forward" size={20} color="#4f46e5" />
                    </View>

                    <View className="flex-1 items-end">
                      <Text className="mb-1 font-technical text-[10px] uppercase text-muted-foreground">
                        You_Receive
                      </Text>
                      <Text
                        className="font-body text-sm font-medium text-foreground"
                        numberOfLines={1}
                      >
                        {trade.receiving}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Chat', { partnerId: trade.partnerId })}
                      className="flex-1 items-center justify-center rounded-sm bg-primary py-3 active:opacity-80"
                    >
                      <Text className="font-technical text-xs uppercase tracking-wider text-white">
                        Message
                      </Text>
                    </TouchableOpacity>

                    {trade.status === 'active' && (
                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate('Rating', { partnerId: trade.partnerId })
                        }
                        className="flex-1 items-center justify-center rounded-sm border-2 border-solid border-accent bg-transparent py-3 active:bg-muted"
                      >
                        <Text className="font-technical text-xs uppercase tracking-wider text-foreground">
                          Complete
                        </Text>
                      </TouchableOpacity>
                    )}

                    {trade.status === 'pending' && (
                      <TouchableOpacity
                        onPress={() =>
                          Alert.alert(
                            'Trade Accepted',
                            `You have accepted the trade from ${trade.partnerName}!`,
                          )
                        }
                        className="flex-1 items-center justify-center rounded-sm border-2 border-solid border-primary bg-transparent py-3 active:bg-muted"
                      >
                        <Text className="font-technical text-xs uppercase tracking-wider text-primary">
                          Accept
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default SwapsScreen;
