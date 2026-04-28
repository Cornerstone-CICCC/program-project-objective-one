import { useCallback, useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllSkills, ISkill } from '../api/skill';
import { getAIMatches, IAIMatchUser } from '../api/ai';
import { checkAuth, IUser } from '../api/auth';
import { getAllUsers } from '../api/user';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const [skillsByCategory, setSkillsByCategory] = useState<Record<string, ISkill[]>>({});
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);

  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [aiMatches, setAiMatches] = useState<IAIMatchUser[]>([]);
  const [dbUsers, setDbUsers] = useState<IUser[]>([]);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const [displayLimit, setDisplayLimit] = useState(5);
  const [expandedReasons, setExpandedReasons] = useState<string[]>([]);

  useEffect(() => {
    if (route.params?.prefilledSkill) {
      setSearchQuery(route.params.prefilledSkill);
      navigation.setParams({ prefilledSkill: undefined });
    }
  }, [route.params?.prefilledSkill, navigation]);

  useEffect(() => {
    setDisplayLimit(5);
  }, [searchQuery, selectedSkills]);

  const loadScreenData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setIsAnalyzing(true);
      setIsLoadingUsers(true);
    }

    setAiError(null);

    try {
      const me = await checkAuth();
      setCurrentUser(me);

      const allSkills = await getAllSkills();
      const grouped = allSkills.reduce((acc: Record<string, ISkill[]>, skill: ISkill) => {
        const cat = skill.category || 'Other';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(skill);
        return acc;
      }, {});
      setSkillsByCategory(grouped);

      const users = await getAllUsers();
      setDbUsers(users);

      const results = await getAIMatches();
      setAiMatches(results);
    } catch (err: any) {
      console.error('Error loading data:', err);
      if (err.message?.includes('skills')) {
        setAiError(err.message);
      } else {
        setAiError('AI Services Temporarily Offline');
      }
    } finally {
      setIsLoadingSkills(false);
      setIsLoadingUsers(false);
      setIsAnalyzing(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadScreenData();
  }, []);

  const onRefresh = useCallback(() => {
    loadScreenData(true);
  }, []);

  const toggleSkill = (skillName: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skillName) ? prev.filter((s) => s !== skillName) : [...prev, skillName],
    );
  };

  const toggleCategoryExpand = (category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    );
  };

  const toggleReasonExpand = (userId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedReasons((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    );
  };

  const formatLocation = (location: any) => {
    if (!location) return 'Remote';
    if (typeof location === 'string') return location;
    if (location.city) {
      return [location.city, location.province].filter(Boolean).join(', ');
    }
    return 'Remote';
  };

  const getBadgeStyle = (proficiency?: string) => {
    switch (proficiency?.toUpperCase()) {
      case 'EXPERT':
        return 'bg-purple-600 border-purple-700';
      case 'ADVANCED':
        return 'bg-emerald-600 border-emerald-700';
      case 'INTERMEDIATE':
        return 'bg-amber-600 border-amber-700';
      default:
        return 'bg-blue-600 border-blue-700';
    }
  };

  const filterList = (list: any[]) => {
    if (!list) return [];

    return list.filter((user) => {
      if (currentUser && (user._id === currentUser._id || user.userId === currentUser._id)) {
        return false;
      }

      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        searchLower === '' ||
        user.username?.toLowerCase().includes(searchLower) ||
        `${user.firstname} ${user.lastname}`.toLowerCase().includes(searchLower) ||
        user.offering?.some((o: any) => {
          const skillName = typeof o === 'string' ? o : o.skill || o.name || '';
          return skillName.toLowerCase().includes(searchLower);
        });

      const matchesSkills =
        selectedSkills.length === 0 ||
        selectedSkills.every((selectedSkill) =>
          user.offering?.some((o: any) => {
            const skillName = typeof o === 'string' ? o : o.skill || o.name || '';
            return skillName === selectedSkill;
          }),
        );

      return matchesSearch && matchesSkills;
    });
  };

  const filteredAI = filterList(aiMatches);
  const filteredStandard = filterList(dbUsers);

  const dedupedStandard = filteredStandard.filter(
    (stdUser) =>
      !filteredAI.some(
        (aiUser) => (aiUser._id || aiUser.userId) === (stdUser._id || stdUser.userId),
      ),
  );

  const activeList = [...filteredAI, ...dedupedStandard];

  const isSearching = searchQuery.trim().length > 0 || selectedSkills.length > 0;
  const listTitle = isSearching ? 'Search Results' : 'Community Directory';
  const listIcon = isSearching ? 'search' : 'people';

  const displayedItems = activeList.slice(0, displayLimit);
  const hasMoreItems = displayLimit < activeList.length;

  return (
    <View className="flex-1 bg-background">
      {/* Header & Search Bar */}
      <View
        className="z-10 border-b border-border bg-card p-6 shadow-sm"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-technical text-2xl uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
            Discover
          </Text>

          {Platform.OS === 'web' && (
            <TouchableOpacity
              onPress={onRefresh}
              disabled={refreshing}
              className={`flex-row items-center gap-2 rounded-sm border-2 border-solid px-3 py-1.5 transition-colors ${refreshing ? 'border-muted bg-muted opacity-50' : 'border-border bg-card hover:bg-slate-50 active:bg-muted dark:hover:bg-slate-800'}`}
            >
              <Ionicons
                name={refreshing ? 'sync' : 'refresh'}
                size={14}
                className={refreshing ? 'text-[#64748B]' : 'text-primary dark:text-[#A5B4FC]'}
              />
              <Text
                className={`font-body text-xs font-bold uppercase ${refreshing ? 'text-muted-foreground' : 'text-primary dark:text-[#A5B4FC]'}`}
              >
                {refreshing ? 'Scanning...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row items-center gap-3">
          <View className="relative flex-1 justify-center">
            <View className="absolute left-3 z-10">
              <Ionicons name="search" size={20} color="#64748B" />
            </View>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search skills or users..."
              placeholderTextColor="#64748B"
              className="w-full rounded-sm border-2 border-solid border-border bg-muted py-3 pl-10 pr-10 font-body text-foreground focus:border-primary focus:outline-none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                className="absolute right-3 z-10 p-1"
              >
                <Ionicons name="close-circle" size={18} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsFilterModalVisible(true)}
            className={`relative items-center justify-center rounded-sm border-2 border-solid px-4 py-2 transition-colors ${selectedSkills.length > 0 ? 'border-primary bg-muted' : 'border-border bg-card'}`}
          >
            <Ionicons
              name="options-outline"
              size={24}
              className={
                selectedSkills.length > 0 ? 'text-primary dark:text-[#A5B4FC]' : 'text-[#64748B]'
              }
            />

            {selectedSkills.length > 0 && (
              <View className="absolute -right-2 -top-2 h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-primary">
                <Text className="font-body text-[10px] font-bold text-white">
                  {selectedSkills.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          Platform.OS !== 'web' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4F46E5"
              colors={['4F46E5']}
            />
          ) : undefined
        }
      >
        <View className="p-4">
          {/* Dynamic Header */}
          <View className="mb-4 flex-row items-center gap-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name={listIcon} size={18} className="text-primary dark:text-[#A5B4FC]" />
              <Text className="font-body text-sm font-bold uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
                {listTitle}
              </Text>
            </View>
            <Text className="font-body text-[10px] font-bold uppercase text-muted-foreground">
              {activeList.length} Found
            </Text>
          </View>

          {/* Loading States */}
          {isAnalyzing || isLoadingUsers ? (
            <View className="mb-8 items-center justify-center rounded-sm border-2 border-dashed border-primary py-8">
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text className="mt-4 font-body text-sm font-bold uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
                Scanning Network...
              </Text>
            </View>
          ) : aiError && !isSearching && activeList.length === 0 ? (
            <View>
              <Ionicons name="warning" size={32} color="#64748B" className="mb-2" />
              <Text className="text-center font-body text-sm font-bold text-muted-foreground">
                AI Services Offline: {aiError}
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Profile')}
                activeOpacity={0.8}
                className="mt-4 rounded-sm bg-primary px-6 py-3"
              >
                <Text className="font-body text-xs font-bold uppercase tracking-wider text-white">
                  Update Your Profile Skills
                </Text>
              </TouchableOpacity>
            </View>
          ) : activeList.length === 0 ? (
            <View className="items-center justify-center rounded-sm border-2 border-dashed border-border bg-card py-12 shadow-sm">
              <Ionicons name="search-outline" size={48} color="#64748B" />
              <Text className="mt-4 font-body text-sm font-bold text-muted-foreground">
                No Matches Found
              </Text>
            </View>
          ) : (
            <View className="flex-col gap-4">
              {displayedItems.map((user: any) => {
                const userId = user._id || user.userId;
                const hasAIBadge = !!user.aiMatchScore && user.aiMatchScore > 0;
                const isReasonExpanded = expandedReasons.includes(userId);

                return (
                  <TouchableOpacity
                    key={userId}
                    onPress={() => navigation.navigate('UserProfile', { userId: userId })}
                    activeOpacity={0.9}
                    className={`overflow-hidden rounded-sm border-2 border-solid shadow-sm ${hasAIBadge ? 'border-primary bg-card' : 'border-border bg-card'}`}
                  >
                    <View className="p-4">
                      {/* Identity & Match Score */}
                      <View className="mb-3 flex-row items-center gap-3">
                        <Image
                          source={{ uri: user.avatar_url || 'https://placehold.co/150' }}
                          className="h-12 w-12 rounded-sm border-2 border-solid border-muted-foreground bg-muted"
                          resizeMode="contain"
                        />
                        <View className="flex-1">
                          <Text className="font-body text-base font-bold text-foreground">
                            {user.firstname} {user.lastname}
                          </Text>
                          <View className="mt-0.5 flex-row items-center gap-1">
                            <Ionicons name="location" size={12} color="#64748B" />
                            <Text className="font-body text-xs text-muted-foreground">
                              {formatLocation(user.location)}
                            </Text>
                          </View>
                        </View>

                        {/* Only show AI Match Badge if AI is active */}
                        {hasAIBadge && (
                          <View className="items-center justify-center rounded-sm bg-primary px-2 py-1 shadow-sm">
                            <Text className="font-technical text-[10px] font-bold uppercase tracking-wider text-white">
                              {user.aiMatchScore}% Match
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* All Offering Skills */}
                      <View className="flex-row flex-wrap gap-2">
                        {user.offering?.map((skill: any, index: number) => {
                          const skillName =
                            typeof skill === 'string' ? skill : skill.skill || skill.name;
                          const proficiency =
                            typeof skill === 'string'
                              ? 'BEGINNER'
                              : skill.proficiency || 'BEGINNER';
                          const badgeClass = getBadgeStyle(proficiency);

                          return (
                            <View
                              key={`offer-${index}`}
                              className={`rounded-sm border-2 border-solid px-2 py-1 shadow-sm ${badgeClass}`}
                            >
                              <Text className="font-body text-xs font-bold text-white">
                                {skillName}
                              </Text>
                            </View>
                          );
                        })}
                        {(!user.offering || user.offering.length === 0) && (
                          <Text className="font-body text-xs italic text-muted-foreground">
                            No skills listed
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Only show Reason block if AI is active */}
                    {hasAIBadge && user.aiReason && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={(e) => {
                          if (e && e.stopPropagation) e.stopPropagation();
                          toggleReasonExpand(userId);
                        }}
                        className="flex-row items-start gap-2 border-t-2 border-solid border-border bg-slate-50 p-3 dark:bg-slate-800/50"
                      >
                        <Ionicons
                          name="sparkles"
                          size={14}
                          className="mt-2 text-primary dark:text-[#A5B4FC]"
                        />
                        <View className="flex-1">
                          <Text
                            className="font-body text-[11px] italic leading-relaxed text-foreground"
                            numberOfLines={isReasonExpanded ? undefined : 2}
                          >
                            {user.aiReason}
                          </Text>
                          <Text className="mt-1 font-body text-[10px] font-bold uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
                            {isReasonExpanded ? 'Show Less' : 'Read Full Analysis'}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {hasMoreItems && (
            <TouchableOpacity
              onPress={() => setDisplayLimit((prev) => prev + 10)}
              className="mt-6 items-center justify-center rounded-sm border-2 border-solid border-border bg-slate-200 py-4 active:bg-slate-300 dark:bg-slate-800 dark:active:bg-slate-700"
            >
              <Text className="font-body text-xs font-bold uppercase tracking-wider text-foreground">
                Load More Results
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Filter Bottom Sheet Modal */}
      <Modal
        visible={isFilterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        {/* Backdrop */}
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          {/* Modal container */}
          <View className="h-[85%] overflow-hidden rounded-t-2xl bg-background shadow-lg">
            {/* Modal Header */}
            <View className="z-10 flex-row items-center justify-between border-b border-border bg-card p-6 shadow-sm">
              <View className="flex-row items-center gap-2">
                <TouchableOpacity onPress={() => setIsFilterModalVisible(false)} className="p-2">
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
                <Text className="font-technical text-xl uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
                  Filter Skills
                </Text>
              </View>

              {selectedSkills.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSelectedSkills([])}
                  className="rounded-sm border-2 border-red-200 bg-red-50 p-2 dark:border-red-900/50  dark:bg-red-900/20"
                >
                  <Text className="font-body text-xs font-bold uppercase text-destructive">
                    Clear All
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Modal Body */}
            <ScrollView
              className="flex-1 p-6"
              contentContainerStyle={{ paddingBottom: 40 }}
              showsVerticalScrollIndicator={false}
            >
              {isLoadingSkills ? (
                <View className="items-center justify-center py-12">
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text className="mt-4 font-technical text-sm font-medium uppercase text-muted-foreground">
                    Loading Categories...
                  </Text>
                </View>
              ) : (
                <View className="flex-col gap-6">
                  {Object.entries(skillsByCategory).map(([category, skills]) => {
                    const isExpanded = expandedCategories.includes(category);
                    const displaySkills = isExpanded ? skills : skills.slice(0, 5);
                    const hiddenCount = skills.length - 5;

                    return (
                      <View
                        key={category}
                        className="rounded-lg border-2 border-border bg-card p-4 shadow-sm"
                      >
                        <Text className="mb-3 font-body text-xs font-bold uppercase tracking-widest text-primary dark:text-[#A5B4FC]">
                          {category}
                        </Text>

                        <View className="flex-row flex-wrap gap-2">
                          {displaySkills.map((skill) => {
                            const isSeleted = selectedSkills.includes(skill.name);

                            return (
                              <TouchableOpacity
                                key={skill._id}
                                onPress={() => toggleSkill(skill.name)}
                                className={`transition-colorsactive:opacity-80 flex-row items-center gap-1.5 rounded-sm border-2 border-solid px-3 py-1.5 ${isSeleted ? 'border-primary bg-primary' : 'border-border bg-background'}`}
                              >
                                {skill.icon_name && (
                                  <Ionicons
                                    name={skill.icon_name as any}
                                    size={14}
                                    color={isSeleted ? '#FFFFFF' : '#64748B'}
                                  />
                                )}
                                <Text
                                  className={`font-body text-xs font-medium ${isSeleted ? 'text-white' : 'text-foreground'}`}
                                >
                                  {skill.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}

                          {hiddenCount > 0 && (
                            <TouchableOpacity
                              onPress={() => toggleCategoryExpand(category)}
                              className="flex-row items-center justify-center rounded-sm border-2 border-dashed border-border bg-background px-4 py-1.5 active:bg-muted"
                            >
                              <Text className="font-body text-xs font-bold text-muted-foreground">
                                {isExpanded ? 'Show Less' : `+ ${hiddenCount} More`}
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

            {/* Modal Footer */}
            <View
              className="border-t border-border bg-card p-6 shadow-lg"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}
            >
              <TouchableOpacity
                onPress={() => setIsFilterModalVisible(false)}
                className="w-full items-center justify-center rounded-sm bg-primary py-4 shadow-sm active:opacity-90"
              >
                <Text className="font-body text-sm font-bold uppercase tracking-wider text-white">
                  Show Matches
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default SearchScreen;
