import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth.store';
import { useCallback, useEffect, useState } from 'react';
import { IUser } from '../api/auth';
import { getUserById } from '../api/user';
import { getMySkills, getUserSkills } from '../api/userSkill';
import { getMyTrades, getUserTrades } from '../api/trade';
import { getUserReviews } from '../api/rating';

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

interface IReviewUI {
  _id: string;
  score: number;
  comment: string;
  createdAt: string;
  reviewer_id: {
    firstname: string;
    lastname: string;
    avatar_url: string;
  };
  trade_id?: {
    offered_skill_id?: { name: string };
    received_skill_id?: { name: string };
    sought_skill_id?: { name: string };
  };
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

  const [isReviewsModalVisible, setIsReviewsModalVisible] = useState(false);
  const [reviewsList, setReviewsList] = useState<IReviewUI[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

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

  const handleOpenReviews = async () => {
    if (!profileUser?._id) return;
    setIsReviewsModalVisible(true);
    setIsLoadingReviews(true);
    try {
      const data = await getUserReviews(profileUser._id);
      setReviewsList(data);
    } catch (err) {
      console.error('Error fetching reviews:', err);
    } finally {
      setIsLoadingReviews(false);
    }
  };

  const getBadgeStyle = (proficiency: Proficiency) => {
    if (proficiency === 'Expert') return 'bg-purple-600 border-purple-700';
    if (proficiency === 'Advanced') return 'bg-emerald-600 border-emerald-700';
    if (proficiency === 'Intermediate') return 'bg-amber-600 border-amber-700';
    return 'bg-blue-600 border-blue-700';
  };

  if (isLoading || !profileUser) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text className="mt-4 font-technical text-sm uppercase tracking-wider text-muted-foreground">
          Loading Profile...
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
        className="border-b border-border bg-card px-4 pb-6"
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

          <Text className="flex-1 text-center font-technical text-xl font-bold uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
            {isOwnProfile ? 'My Profile' : 'Profile'}
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
              <Text className="mb-1 font-technical text-[10px] font-bold tracking-wider text-muted-foreground">
                @{profileUser.username}
              </Text>
              <Text className="mb-2 font-body text-xl font-bold text-foreground" numberOfLines={1}>
                {fullName}
              </Text>

              {/* Location */}
              <View className="flex-row items-center gap-1 pr-2">
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

          {/* Edit Button (Own Profile Only) */}
          {isOwnProfile && (
            <TouchableOpacity
              onPress={() => navigation.navigate('ProfileEdit')}
              className="justify-center rounded-sm bg-primary px-4 py-2 shadow-sm active:opacity-80"
            >
              <Text className="font-technical text-xs font-bold uppercase tracking-wider text-white">
                Edit
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Bio */}
        <Text className="mt-5 font-body leading-relaxed text-foreground">
          {profileUser.bio || "This user hasn't written a bio yet."}
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 100 }}
        showsVerticalScrollIndicator={Platform.OS === 'web' ? true : false}
      >
        {/* Reviews */}
        <View className="mb-6 flex-row items-center justify-between rounded-sm border-2 border-border bg-card p-4 shadow-sm">
          <View>
            <Text className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Community Rating
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <Ionicons name="star" size={20} color="#F59E0B" />
              <Text className="font-body text-lg font-bold text-foreground">
                {averageRating > 0 ? averageRating.toFixed(1) : 'New'}
              </Text>
              <Text className="font-body text-xs text-muted-foreground">
                ({totalReviews} reviews)
              </Text>
            </View>
          </View>
          <TouchableOpacity
            disabled={totalReviews === 0}
            onPress={handleOpenReviews}
            className={`rounded-sm px-4 py-2 ${totalReviews > 0 ? 'bg-primary active:opacity-80' : 'bg-muted'}`}
          >
            <Text
              className={`font-body text-xs font-bold uppercase tracking-wider ${totalReviews > 0 ? 'text-white' : 'text-muted-foreground'}`}
            >
              Read Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {/* Offering Section */}
        <View className="mb-6">
          <Text className="mb-3 font-body text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Offering to Teach
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {offering.length > 0 ? (
              offering.map((skill) => (
                <TouchableOpacity
                  key={skill._id || skill.name}
                  onPress={() => setSelectedSkill(skill)}
                  activeOpacity={0.7}
                  className={`flex-row items-center gap-1.5 rounded-sm border-2 px-4 py-2 shadow-sm ${getBadgeStyle(skill.proficiency)}`}
                >
                  <Text className="font-body text-sm font-bold text-white">{skill.name}</Text>
                  <Ionicons name="information-circle" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ))
            ) : (
              <Text className="font-body text-sm italic text-muted-foreground">
                No skills listed yet.
              </Text>
            )}
          </View>
        </View>

        {/* Seeking Section */}
        <View className="mb-8">
          <Text className="mb-3 font-body text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Looking to Learn
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {seeking.length > 0 ? (
              seeking.map((skill) => (
                <TouchableOpacity
                  key={skill._id || skill.name}
                  onPress={() => setSelectedSkill(skill)}
                  activeOpacity={0.7}
                  className={`flex-row items-center gap-1.5 rounded-sm border-2 px-4 py-2 shadow-sm ${getBadgeStyle(skill.proficiency)}`}
                >
                  <Text className="font-body text-sm font-bold text-white">{skill.name}</Text>
                  <Ionicons name="information-circle" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ))
            ) : (
              <Text className="font-body text-sm italic text-muted-foreground">
                No target skills listed yet.
              </Text>
            )}
          </View>
        </View>

        {/* Trade History */}
        <View className="mb-6">
          <Text className="mb-3 font-body text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Trade History ({tradeHistory.length})
          </Text>

          {isLoadingHistory ? (
            <ActivityIndicator size="small" color="#4F46E5" className="py-4" />
          ) : tradeHistory.length === 0 ? (
            <View className="items-center rounded-sm border-2 border-dashed border-border bg-card p-6">
              <Text className="text-center font-body text-xs italic text-muted-foreground">
                No past trades found.
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
                      <Text className="font-body text-sm font-bold text-foreground">
                        {trade.partnerName}
                      </Text>
                      <Text className="mt-0.5 font-body text-xs text-muted-foreground">
                        {trade.offering} ↔ {trade.receiving}
                      </Text>
                    </View>

                    <View
                      className={`rounded-sm px-2 py-1 ${trade.status === 'COMPLETED' ? 'bg-emerald-600' : trade.status === 'CANCELLED' || trade.status === 'REJECTED' ? 'bg-destructive' : 'bg-primary'}`}
                    >
                      <Text className="font-body text-[10px] font-bold uppercase tracking-wider text-white">
                        {trade.status}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {hiddenTradesCount > 0 && !isHistoryExpanded && (
                <TouchableOpacity
                  onPress={() => setIsHistoryExpanded(true)}
                  className="mt-2 items-center justify-center rounded-sm border-2 border-solid border-border bg-card py-3 active:bg-muted"
                >
                  <Text className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    + View {hiddenTradesCount} Older Swaps
                  </Text>
                </TouchableOpacity>
              )}

              {isHistoryExpanded && tradeHistory.length > 5 && (
                <TouchableOpacity
                  onPress={() => setIsHistoryExpanded(false)}
                  className="mt-2 items-center justify-center rounded-sm border-2 border-solid border-border bg-card py-3 active:bg-muted"
                >
                  <Text className="font-body text-xs font-bold uppercase text-muted-foreground">
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
          className="border-t border-border bg-card px-6 pt-4 shadow-lg"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate('ProposeTrade', { userId: profileUser._id })}
            className="w-full items-center justify-center rounded-sm bg-primary py-4 shadow-sm active:opacity-90"
          >
            <Text className="font-body text-sm font-bold uppercase tracking-wider text-white">
              Request a Swap
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
                <Text className="font-body text-lg font-bold text-primary dark:text-[#A5B4FC]">
                  {selectedSkill?.name}
                </Text>
                <Text className="font-body text-xs text-muted-foreground">
                  {selectedSkill?.type === 'TEACH' ? 'Offering Details' : 'Learning Goals'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSelectedSkill(null)}
                className="p-2 active:opacity-70"
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Proficiency Badge */}
            <View className="mb-6">
              <Text className="mb-2 font-body text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Proficiency Level
              </Text>
              <View
                className={`self-start rounded-sm border-2 px-3 py-1.5 ${getBadgeStyle(selectedSkill?.proficiency || 'Beginner')}`}
              >
                <Text className="font-body text-xs font-bold uppercase tracking-wider text-white">
                  {selectedSkill?.proficiency}
                </Text>
              </View>
            </View>

            {/* Detailed Description */}
            <View>
              <Text className="mb-2 font-body text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {selectedSkill?.type === 'TEACH' ? 'Experience Details' : 'Learning Goals'}
              </Text>
              <View className="rounded-sm border border-border bg-muted p-4">
                <Text className="font-body text-sm leading-relaxed text-foreground">
                  {selectedSkill?.description || 'No detailed information provided.'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reviews Modal */}
      <Modal
        visible={isReviewsModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsReviewsModalVisible(false)}
      >
        <View className="flex-1 bg-background pt-12">
          <View className="mb-4 flex-row items-center justify-between border-b border-border px-6 pb-4">
            <View>
              <View>
                <Text className="font-body text-xl font-bold text-foreground">
                  Community Reviews ({totalReviews})
                </Text>
              </View>
              <Text className="font-body text-sm text-muted-foreground">{fullName}</Text>
            </View>
            <TouchableOpacity onPress={() => setIsReviewsModalVisible(false)} className="p-2">
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {isLoadingReviews ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          ) : (
            <FlatList
              data={reviewsList}
              keyExtractor={(item) => item._id}
              contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const offeringSkill = item.trade_id?.offered_skill_id?.name || 'Unknown Skill';
                const receivingSkill =
                  item.trade_id?.received_skill_id?.name ||
                  item.trade_id?.sought_skill_id?.name ||
                  'Unknown Skill';

                return (
                  <View className="mb-4 rounded-sm border-2 border-border bg-card p-4">
                    <View className="mb-2 flex-row items-center justify-between">
                      <View className="flex-1 flex-row items-center gap-3">
                        <View className="h-8 w-8 overflow-hidden rounded-sm bg-muted">
                          <Image
                            source={{
                              uri: item.reviewer_id?.avatar_url || 'https://placehold.co/150',
                            }}
                            className="h-full w-full"
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="font-body text-sm font-bold text-foreground">
                            {item.reviewer_id?.firstname} {item.reviewer_id?.lastname}
                          </Text>
                          <Text
                            className="mt-0.5 font-technical text-[10px] uppercase tracking-wider text-muted-foreground"
                            numberOfLines={1}
                          >
                            {offeringSkill} ↔ {receivingSkill}
                          </Text>
                        </View>
                      </View>
                      <Text className="font-body text-[10px] text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>

                    <View className="mb-2 flex-row items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Ionicons
                          key={star}
                          name={star <= item.score ? 'star' : 'star-outline'}
                          size={14}
                          color="#F59E0B"
                        />
                      ))}
                    </View>

                    <Text className="font-body text-sm text-foreground">
                      {item.comment || 'No written comment provided.'}
                    </Text>
                  </View>
                );
              }}
              ListEmptyComponent={() => (
                <Text className="text-center font-technical text-muted-foreground">
                  No reviews have been written yet.
                </Text>
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

export default ProfileScreen;
