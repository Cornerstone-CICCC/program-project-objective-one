import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';

import { activeTrades, completedTrades, currentUser, nearbyUsers } from '../data/mockData';

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const routeUserId = route.params?.userId;
  const isOwnProfile = !routeUserId || routeUserId === currentUser.id;

  const user = isOwnProfile
    ? currentUser
    : nearbyUsers.find((u) => u.id === routeUserId) || currentUser;

  const userTrades = isOwnProfile ? [...activeTrades, ...completedTrades] : [];

  return (
    <View className="flex-1 bg-background">
      {/* Header Container */}
      <View
        className="border-b border-border bg-card px-6 pb-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="mb-6 flex-row items-center justify-between">
          {!isOwnProfile ? (
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="rounded-sm p-2 transition-colors hover:bg-muted"
            >
              <Ionicons name="arrow-back" size={24} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}

          <Text className="flex-1 text-center font-technical text-xl uppercase tracking-wider text-foreground">
            {isOwnProfile ? 'User_Profile' : 'Profile_View'}
          </Text>

          {isOwnProfile ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              className="rounded-sm p-2 transition-colors hover:bg-muted"
            >
              <Ionicons name="settings-outline" size={24} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}
        </View>

        {/* Profile Header Details */}
        <View className="flex-row items-start gap-4">
          {/* Avatar Wrapper */}
          <View className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-sm border-2 border-solid border-muted-foreground bg-muted">
            <Image
              source={{ uri: user.avatar }}
              style={{ width: 96, height: 96 }}
              resizeMode="cover"
            />
          </View>

          <View className="flex-1 justify-center py-2">
            <Text className="mb-1 font-technical text-xs uppercase tracking-wider text-muted-foreground">
              User_ID
            </Text>
            <Text className="mb-2 font-body text-xl font-medium text-foreground">{user.name}</Text>
            <View className="flex-row items-center gap-1">
              <Ionicons name="location" size={16} color="#64748B" />
              <Text className="font-body text-sm text-muted-foreground">New York, NY</Text>
            </View>
          </View>
        </View>

        {/* Bio */}
        <Text className="mt-4 font-body leading-relaxed text-muted-foreground">{user.bio}</Text>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 100 }}
      >
        {/* Offering Section */}
        <View className="mb-6">
          <Text className="mb-3 font-technical text-sm uppercase tracking-wider text-muted-foreground">
            Offering
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {user.offering.map((skill) => (
              <View key={`offer-${skill}`} className="rounded-sm bg-primary px-4 py-2">
                <Text className="font-body text-primary-foreground">{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Seeking Section */}
        <View className="mb-6">
          <Text className="mb-3 font-technical text-sm uppercase tracking-wider text-muted-foreground">
            Seeking
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {user.seeking.map((skill) => (
              <View
                key={`seek-${skill}`}
                className="rounded-sm border-2 border-accent bg-transparent px-4 py-2"
              >
                <Text className="font-body text-foreground">{skill}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Location Blueprint */}
        <View className="mb-6">
          <Text className="mb-3 font-technical text-sm uppercase tracking-wider text-muted-foreground">
            Location_Blueprint
          </Text>
          <View className="relative h-32 items-center justify-center overflow-hidden rounded-sm border-2 border-solid border-muted-foreground bg-muted">
            {/* SVG Grid Pattern */}
            <View className="absolute inset-0 opacity-30" pointerEvents="none">
              <Svg width="100%" height="100%">
                <Defs>
                  <Pattern id="locationGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <Rect width="20" height="20" fill="none" />
                    <Rect width="20" height="1" fill="#94A3B8" />
                    <Rect width="1" height="20" fill="#94A3B8" />
                  </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill="url(#locationGrid)" />
              </Svg>
            </View>

            <Ionicons name="location" size={40} color="#4F46E5" style={{ opacity: 0.8 }} />
          </View>
        </View>

        {/* Trade History (Own Profile Only) */}
        {isOwnProfile && userTrades.length > 0 && (
          <View className="mb-6">
            <Text className="mb-3 font-technical text-sm uppercase tracking-wider text-muted-foreground">
              Trade_History ({userTrades.length})
            </Text>
            <View className="flex-col gap-3">
              {userTrades.map((trade) => (
                <View
                  key={trade.id}
                  className="rounded-sm border-2 border-solid border-border bg-card p-4"
                >
                  <View className="flex-row items-center gap-3">
                    {/* Small Avatat Wrapper */}
                    <View className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
                      <Image
                        source={{ uri: trade.partnerAvatar }}
                        style={{ width: 40, height: 40 }}
                        resizeMode="cover"
                      />
                    </View>

                    <View className="flex-1 justify-center">
                      <Text className="font-body text-sm font-medium text-foreground">
                        {trade.partnerName}
                      </Text>
                      <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                        {trade.offering} ↔ {trade.receiving}
                      </Text>
                    </View>

                    <View
                      className={`rounded-sm px-2 py-1 ${trade.status === 'completed' ? 'bg-primary' : 'bg-accent'}`}
                    >
                      <Text
                        className={`font-technical text-xs ${trade.status === 'completed' ? 'text-primary-foreground' : 'text-accent-foreground'}`}
                      >
                        {trade.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Action Buttons (External Profile Only) */}
        {!isOwnProfile && (
          <View className="mt-2 flex-row gap-3">
            <TouchableOpacity
              onPress={() => navigation.navigate('Chat', { userId: user.id })}
              className="flex-1 items-center justify-center rounded-sm bg-primary py-3 transition-opacity hover:opacity-90"
            >
              <Text className="font-technical text-sm uppercase tracking-wider text-primary-foreground">
                Message
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('ProposeTrade', { userId: user.id })}
              className="flex-1 items-center justify-center rounded-sm border-2 border-accent bg-transparent py-3 transition-colors active:opacity-70"
            >
              <Text className="font-technical text-sm uppercase tracking-wider text-foreground">
                Propose Trade
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;
