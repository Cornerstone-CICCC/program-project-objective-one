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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { useAuthStore } from '../store/auth.store';
import { useCallback, useEffect, useState } from 'react';
import { IUser } from '../api/auth';
import { getUserById } from '../api/user';
import { getMySkills, getUserSkills } from '../api/userSkill';
import { getMyTrades, getUserTrades } from '../api/trade';

export type Proficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface IUserSkillUI {
  _id?: string;
  skill_id: string;
  name: string;
  type: 'TEACH' | 'LEARN';
  proficiency: Proficiency;
  description: string;
}

interface ITradeHistoryUI {
  id: string;
  partnerName: string;
  partnerAvatar: string;
  offering: string;
  receiving: string;
  status: string;
  updatedAt: string;
}

const ProfileScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { user: currentUser } = useAuthStore();

  const routeUserId = route.params?.userId;
  const isOwnProfile = !routeUserId || routeUserId === currentUser?._id;

  const [profileUser, setProfileUser] = useState<IUser | null>(isOwnProfile ? currentUser : null);
  const [isLoading, setIsLoading] = useState(!isOwnProfile);

  const [offering, setOffering] = useState<IUserSkillUI[]>([]);
  const [seeking, setSeeking] = useState<IUserSkillUI[]>([]);

  const [selectedSkill, setSelectedSkill] = useState<IUserSkillUI | null>(null);

  const [tradeHistory, setTradeHistory] = useState<ITradeHistoryUI[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: 'SWAPPA' });
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const fetchAllProfileData = async () => {
        const targetUserId = isOwnProfile ? currentUser?._id : routeUserId;
        if (!targetUserId) return;

        try {
          const freshUserData = await getUserById(targetUserId);
          if (freshUserData) {
            setProfileUser(freshUserData);
          }

          const userSkillsData = isOwnProfile
            ? await getMySkills()
            : await getUserSkills(routeUserId);

          if (userSkillsData) {
            const formattedOffering: IUserSkillUI[] = [];
            const formattedSeeking: IUserSkillUI[] = [];

            userSkillsData.forEach((item: any) => {
              const skillObj: IUserSkillUI = {
                _id: item._id,
                skill_id: item.skill_id?._id || item.skill_id,
                name: item.skill_id?.name || 'Unknown Skill',
                type: item.type,
                proficiency: item.proficiency || 'Beginner',
                description: item.description || '',
              };

              if (item.type === 'TEACH') formattedOffering.push(skillObj);
              else formattedSeeking.push(skillObj);
            });

            setOffering(formattedOffering);
            setSeeking(formattedSeeking);
          }

          setIsLoadingHistory(true);
          const trades = isOwnProfile ? await getMyTrades() : await getUserTrades(targetUserId);

          const formattedTrades: ITradeHistoryUI[] = trades.map((trade: any) => {
            const profileOwnerId = targetUserId;
            const initiatorId = trade.initiator_id._id || trade.initiator_id;
            const isInitiator = initiatorId === profileOwnerId;

            const partner = isInitiator ? trade.receiver_id : trade.initiator_id;

            const myOffering = isInitiator
              ? trade.offered_skill_id?.name
              : trade.received_skill_id?.name || trade.sought_skill_id?.name;
            const myReceiving = isInitiator
              ? trade.received_skill_id?.name || trade.sought_skill_id?.name
              : trade.offered_skill_id?.name;

            return {
              id: trade._id,
              partnerName: `${partner.firstname} ${partner.lastname}`.trim(),
              partnerAvatar: partner.avatar_url,
              offering: myOffering || 'Unknown',
              receiving: myReceiving || 'Unknown',
              status: trade.status,
              updatedAt: trade.updatedAt,
            };
          });

          formattedTrades.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
          );

          setTradeHistory(formattedTrades);
        } catch (err) {
          console.error('Failed to refresh profile data:', err);
        } finally {
          setIsLoading(false);
          setIsLoadingHistory(false);
        }
      };
      fetchAllProfileData();
    }, [isOwnProfile, routeUserId, currentUser?._id]),
  );

  const getOfferingColor = (proficiency: Proficiency) => {
    if (proficiency === 'Expert') return 'bg-purple-500 border-purple-600';
    if (proficiency === 'Advanced') return 'bg-green-500 border-green-600';
    if (proficiency === 'Intermediate') return 'bg-yellow-500 border-yellow-600';
    return 'bg-blue-500 border-blue-600';
  };

  const getSeekingColor = (proficiency: Proficiency) => {
    if (proficiency === 'Expert') return ' border-purple-600 text-purple-600';
    if (proficiency === 'Advanced') return 'border-green-500 text-green-600';
    if (proficiency === 'Intermediate') return 'border-yellow-500 text-yellow-600';
    return 'border-primary text-primary';
  };

  if (isLoading || !profileUser) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text className="mt-4 font-technical text-sm uppercase tracking-wider text-muted-foreground">
          Retrieving Data...
        </Text>
      </View>
    );
  }

  const fullName = `${profileUser.firstname} ${profileUser.lastname}`;

  const averageRating = profileUser.average_rating || 0;
  const totalReviews = profileUser.total_reviews || 0;
  const visibleTrades = isHistoryExpanded ? tradeHistory : tradeHistory.slice(0, 5);
  const hiddenTradesCount = tradeHistory.length - 5;

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
              className="rounded-sm p-2 active:bg-muted"
            >
              <Ionicons name="arrow-back" size={24} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}

          <Text className="flex-1 text-center font-technical text-xl uppercase tracking-wider text-foreground">
            {isOwnProfile ? 'Swap_Profile' : 'Profile_View'}
          </Text>

          {isOwnProfile ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('Settings')}
              className="rounded-sm p-2 active:bg-muted"
            >
              <Ionicons name="settings-outline" size={24} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <View className="w-10" />
          )}
        </View>

        {/* Profile Header Details */}
        <View className="flex-row items-center justify-between">
          {/* Avatar and Info Container */}
          <View className="flex-1 flex-row items-center gap-4 pr-4">
            {/* Avatar Wrapper */}
            <View className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-sm border-2 border-solid border-muted-foreground bg-muted">
              <Image
                source={{ uri: profileUser.avatar_url || 'https://placehold.co/150' }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="contain"
              />
            </View>

            <View className="flex-1 justify-center">
              <Text className="mb-1 font-technical text-[10px] tracking-wider text-muted-foreground">
                @{profileUser.username}
              </Text>
              <Text
                className="mb-2 font-body text-lg font-medium text-foreground"
                numberOfLines={1}
              >
                {fullName}
              </Text>

              {/* Rating & Location */}
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="star" size={14} color="#EAB308" />
                  <Text className="font-body text-[10px] text-muted-foreground">
                    {averageRating > 0
                      ? `${averageRating.toFixed(1)} (${totalReviews})`
                      : 'NO_DATA'}
                  </Text>
                </View>

                <View className="flex-1 flex-row items-center gap-1 pr-2">
                  <Ionicons name="location" size={14} color="#64748B" />
                  <Text className="font-body text-xs text-muted-foreground" numberOfLines={1}>
                    {profileUser.location
                      ? [
                          profileUser.location.city,
                          profileUser.location.province,
                          profileUser.location.country,
                        ]
                          .filter(Boolean)
                          .join(', ')
                      : 'Location Unknown'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Edit Button (Own Profile Only) */}
          {isOwnProfile && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ProfileEdit')}
              className="justify-center rounded-sm bg-primary px-4 py-2 shadow-sm active:opacity-80"
            >
              <Text className="font-technical text-xs font-bold uppercase tracking-wider text-primary-foreground">
                Edit
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bio */}
        <Text className="mt-5 font-body leading-relaxed text-muted-foreground">
          {profileUser.bio || "This user hasn't initialized their bio yet."}
        </Text>
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
            {offering.length > 0 ? (
              offering.map((skill) => (
                <TouchableOpacity
                  key={skill._id || skill.name}
                  onPress={() => setSelectedSkill(skill)}
                  activeOpacity={0.7}
                  className={`rounded-sm border-2 px-4 py-2 ${getOfferingColor(skill.proficiency)}`}
                >
                  <Text className="font-body text-white">{skill.name}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text className="font-body text-sm text-muted-foreground">
                No skills established yet.
              </Text>
            )}
          </View>
        </View>

        {/* Seeking Section */}
        <View className="mb-6">
          <Text className="mb-3 font-technical text-sm uppercase tracking-wider text-muted-foreground">
            Seeking
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {seeking.length > 0 ? (
              seeking.map((skill) => {
                const colorClasses = getSeekingColor(skill.proficiency);
                return (
                  <TouchableOpacity
                    key={skill._id || skill.name}
                    onPress={() => setSelectedSkill(skill)}
                    activeOpacity={0.7}
                    className={`rounded-sm border-2 bg-transparent px-4 py-2 ${colorClasses}`}
                  >
                    <Text className={`font-body ${colorClasses}`}>{skill.name}</Text>
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text className="font-body text-sm text-muted-foreground">
                No target skills established.
              </Text>
            )}
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

        {/* Trade History */}
        <View className="mb-6">
          <Text className="mb-3 font-technical text-sm uppercase tracking-wider text-muted-foreground">
            Swap_Archive ({tradeHistory.length})
          </Text>

          {isLoadingHistory ? (
            <ActivityIndicator size="small" color="#4F46E5" className="py-4" />
          ) : tradeHistory.length === 0 ? (
            <View className="items-center rounded-sm border-2 border-dashed border-border p-6">
              <Text className="text-center font-technical text-xs uppercase text-muted-foreground">
                No structural logs found.
              </Text>
            </View>
          ) : (
            <View className="flex-col gap-3">
              {visibleTrades.map((trade) => (
                <View
                  key={trade.id}
                  className="rounded-sm border-2 border-solid border-border bg-card p-4"
                >
                  <View className="flex-row items-center gap-3">
                    {/* Small Avatar Wrapper */}
                    <View className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-sm border border-border bg-muted">
                      <Image
                        source={{ uri: trade.partnerAvatar || 'https://placehold.co/150' }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="contain"
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
                      className={`rounded-sm px-2 py-1 ${trade.status === 'COMPLETED' ? 'bg-primary' : trade.status === 'CANCELLED' || trade.status === 'REJECTED' ? 'bg-red-500' : 'bg-accent'}`}
                    >
                      <Text
                        className={`font-technical text-[10px] font-bold uppercase ${trade.status === 'COMPLETED' ? 'text-primary-foreground' : trade.status === 'CANCELLED' || trade.status === 'REJECTED' ? 'text-white' : 'text-accent-foreground'}`}
                      >
                        {trade.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {hiddenTradesCount > 0 && !isHistoryExpanded && (
                <TouchableOpacity
                  onPress={() => setIsHistoryExpanded(true)}
                  className="mt-2 items-center justify-center rounded-sm border-2 border-solid border-border py-3 active:bg-muted"
                >
                  <Text className="font-technical text-xs font-bold uppercase text-muted-foreground">
                    + View {hiddenTradesCount} Older Swaps
                  </Text>
                </TouchableOpacity>
              )}

              {isHistoryExpanded && tradeHistory.length > 5 && (
                <TouchableOpacity
                  onPress={() => setIsHistoryExpanded(false)}
                  className="mt-2 items-center justify-center rounded-sm border-2 border-solid border-border py-3 active:bg-muted"
                >
                  <Text className="font-technical text-xs font-bold uppercase text-muted-foreground">
                    Collapse Archive
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons (External Profile Only) */}
      {!isOwnProfile && (
        <View
          className="border-t border-border bg-card px-6 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('ProposeTrade', { userId: profileUser._id })}
            className="w-full items-center justify-center rounded-sm bg-primary py-4 shadow-sm active:opacity-80"
          >
            <Text className="font-technical text-sm font-bold uppercase tracking-wider text-primary-foreground">
              Initiate Swap Protocol
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Skill Details Modal */}
      <Modal
        transparent={true}
        visible={selectedSkill !== null}
        animationType="fade"
        onRequestClose={() => setSelectedSkill(null)}
      >
        <View className="flex-1 justify-center bg-black/60 px-6">
          <View className="w-full rounded-sm border-2 border-solid border-border bg-card p-6 shadow-lg">
            {/* Modal Header */}
            <View className="mb-4 flex-row items-center justify-between border-b border-border pb-4">
              <View>
                <Text className="font-technical text-lg uppercase tracking-wider text-primary">
                  {selectedSkill?.name}
                </Text>
                <Text className="font-technical text-[10px] uppercase text-muted-foreground">
                  {selectedSkill?.type === 'TEACH' ? 'Offering_Details' : 'Learning_Goals'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedSkill(null)}
                className="active:opacity-70"
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Proficiency Badge */}
            <View className="mb-6">
              <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
                Proficiency_Level
              </Text>
              <View
                className={`self-start rounded-sm border-2 px-3 py-1 ${selectedSkill?.type === 'TEACH' ? getOfferingColor(selectedSkill.proficiency || 'Beginner') : getSeekingColor(selectedSkill?.proficiency || 'Beginner')}`}
              >
                <Text
                  className={`font-body text-xs font-medium ${selectedSkill?.type === 'TEACH' ? 'text-white' : getSeekingColor(selectedSkill?.proficiency || 'Beginner').split(' ')[1]}`}
                >
                  {selectedSkill?.proficiency}
                </Text>
              </View>
            </View>

            {/* Detailed Description */}
            <View>
              <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
                {selectedSkill?.type === 'TEACH' ? 'Experience_Log' : 'Objective_Parameters'}
              </Text>
              <View className="rounded-sm border border-border bg-muted p-4">
                <Text className="font-body text-sm leading-relaxed text-foreground">
                  {selectedSkill?.description || 'No detailed parameters provided for this skill.'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;
