import { useCallback, useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllSkills, ISkill } from '../api/skill';
import { getAIMatches, IAIMatchUser } from '../api/ai';
import { checkAuth, IUser } from '../api/auth';
import { getAllUsers } from '../api/user';

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
        setAiError('AI Matrix Offline');
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

  const formatLocation = (location: any) => {
    if (!location) return 'Remote';
    if (typeof location === 'string') return location;
    if (location.city) {
      return [location.city, location.province].filter(Boolean).join(', ');
    }
    return 'Remote';
  };

  const getProficiencyColors = (proficiency?: string) => {
    switch (proficiency?.toUpperCase()) {
      case 'EXPERT':
        return { border: 'border-purple-500', text: 'text-purple-500' };
      case 'ADVANCED':
        return { border: 'border-green-500', text: 'text-green-500' };
      case 'INTERMEDIATE':
        return { border: 'border-yellow-500', text: 'text-yellow-500' };
      default:
        return { border: 'border-blue-500', text: 'text-blue-500' };
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

  const isSearching = searchQuery.trim().length > 0 || selectedSkills.length > 0;

  let activeList: any[] = [];
  let listTitle = '';
  let listIcon: any = 'people';

  if (isSearching) {
    const dedupedStandard = filteredStandard.filter(
      (stdUser) => !filteredAI.some((aiUser) => (aiUser._id || aiUser.userId) === stdUser._id),
    );

    activeList = [...filteredAI, ...dedupedStandard];
    listTitle = 'Search_Results';
    listIcon = 'search';
  } else if (!aiError && filteredAI.length > 0) {
    activeList = filteredAI;
    listTitle = 'Neural_Match_Protocol';
    listIcon = 'sparkles';
  } else {
    activeList = filteredStandard;
    listTitle = 'Standard_Directory';
    listIcon = 'people';
  }

  const displayedItems = activeList.slice(0, displayLimit);
  const hasMoreItems = displayLimit < activeList.length;

  return (
    <View className="flex-1 bg-background">
      {/* Header & Search Bar */}
      <View
        className="z-10 border-b border-border bg-card p-6 shadow-sm"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="mb-6  flex-row items-center justify-between">
          <Text className="font-technical text-2xl uppercase tracking-wider text-foreground">
            Discovery_Matrix
          </Text>

          {Platform.OS === 'web' && (
            <TouchableOpacity
              onPress={onRefresh}
              disabled={refreshing}
              className={`flex-row items-center gap-2 rounded-sm border-2 border-solid px-3 py-1.5 transition-colors ${refreshing ? 'border-muted-foreground bg-muted opacity-50' : 'border-primary bg-card active:bg-muted'}`}
            >
              <Ionicons
                name={refreshing ? 'sync' : 'refresh'}
                size={14}
                color={refreshing ? '#64748B' : '#4F46E5'}
              />
              <Text
                className={`font-technical text-xs font-bold uppercase ${refreshing ? 'text-muted-foreground' : 'text-primary'}`}
              >
                {refreshing ? 'Scanning...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="flex-row gap-3">
          <View className="relative flex-1 justify-center">
            <View className="absolute left-3 z-10">
              <Ionicons name="search" size={20} color="#64748B" />
            </View>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search skills or users..."
              placeholderTextColor="#64748B"
              className="w-full rounded-sm border-2 border-solid border-border bg-muted py-3 pl-10 pr-10 font-body text-foreground focus:border-primary"
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
            className={`relative items-center justify-center rounded-sm border-2 border-solid px-4 transition-colors ${selectedSkills.length > 0 ? 'border-primary bg-muted' : 'border-border bg-card'}`}
          >
            <Ionicons
              name="options-outline"
              size={24}
              color={selectedSkills.length > 0 ? '#4F46E5' : '#64748B'}
            />

            {selectedSkills.length > 0 && (
              <View className="absolute -right-2 -top-2 h-5 w-5 items-center justify-center rounded-full border-2 border-background bg-accent">
                <Text className="font-technical text-[10px] font-bold text-accent-foreground">
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
              colors={['#4F46E5']}
            />
          ) : undefined
        }
      >
        <View className="p-6">
          {/* Dynamic Header */}
          <View className="mb-4 flex-row items-center gap-2">
            <View className="flex-row items-center gap-2">
              <Ionicons name={listIcon} size={18} color="#4F46E5" />
              <Text className="font-technical text-sm uppercase tracking-wider text-primary">
                {listTitle}
              </Text>
            </View>
            <Text className="font-technical text-[10px] uppercase text-muted-foreground">
              {activeList.length} Found
            </Text>
          </View>

          {/* Loading States */}
          {isAnalyzing || isLoadingUsers ? (
            <View className="mb-8 items-center justify-center rounded-sm border-2 border-dashed border-primary py-8">
              <ActivityIndicator size="small" color="#4F46E5" />
              <Text className="mt-4 font-technical text-sm uppercase tracking-wider text-primary">
                Scanning_Network...
              </Text>
            </View>
          ) : aiError && !isSearching && activeList.length === 0 ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('Profile')}
              className="items-center justify-center rounded-sm border-2 border-dashed border-border bg-muted p-6"
            >
              <Text className="text-center font-technical text-xs uppercase text-muted-foreground">
                Matrix_Offline: {aiError}
              </Text>
              <Text className="mt-2 text-center font-body text-[10px] uppercase text-primary underline">
                Update Profile Skills
              </Text>
            </TouchableOpacity>
          ) : activeList.length === 0 ? (
            <View className="items-center justify-center rounded-sm border-2 border-dashed border-border bg-muted py-10">
              <Ionicons name="search-outline" size={48} color="#64748B" />
              <Text className="mt-4 font-technical text-sm uppercase tracking-wider text-muted-foreground">
                No_Matches_Found
              </Text>
            </View>
          ) : (
            <View className="flex-col gap-4">
              {displayedItems.map((user: any) => {
                const hasAIBadge = !!user.aiMatchScore && user.aiMatchScore > 0;

                return (
                  <TouchableOpacity
                    key={user._id || user.userId}
                    onPress={() =>
                      navigation.navigate('UserProfile', { userId: user._id || user.userId })
                    }
                    className={`rounded-sm border-2 border-solid p-4 shadow-sm active:border-primary ${hasAIBadge ? 'border-primary bg-card' : 'border-border bg-card'}`}
                  >
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
                        <View className="flex-row items-center gap-1">
                          <Ionicons name="location" size={12} color="#64748B" />
                          <Text className="font-body text-xs text-muted-foreground">
                            {formatLocation(user.location)}
                          </Text>
                        </View>
                      </View>
                      {/* Only show AI Match Badge if AI is active */}
                      {hasAIBadge && (
                        <View className="items-center justify-center rounded-sm bg-primary px-2 py-1">
                          <Text className="font-technical text-[10px] font-bold uppercase tracking-wider text-white">
                            {user.aiMatchScore}% Match
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* All Offering Skills */}
                    <View className={hasAIBadge ? 'mb-3' : ''}>
                      <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                        {user.offering?.map((skill: any, index: number) => {
                          const proficiency = skill.proficiency || 'BEGINNER';
                          const colors = getProficiencyColors(proficiency);

                          return (
                            <View
                              key={`offer-${index}`}
                              className={`rounded-sm border-2 border-solid px-2 py-1 ${colors.border}`}
                            >
                              <Text
                                className={`font-body text-[10px] uppercase tracking-wider ${colors.text}`}
                              >
                                {skill.skill || skill}
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
                      <View className="flex-row items-start gap-2 rounded-sm border-2 border-solid border-border bg-muted p-3">
                        <Ionicons
                          name="sparkles"
                          size={14}
                          color="#4F46E5"
                          style={{ marginTop: 2 }}
                        />
                        <Text
                          className="flex-1 font-body text-[11px] italic leading-tight text-muted-foreground"
                          numberOfLines={2}
                        >
                          {user.aiReason}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {hasMoreItems && (
            <TouchableOpacity
              onPress={() => setDisplayLimit((prev) => prev + 10)}
              className="mt-4 items-center justify-center rounded-sm border-2 border-solid border-border bg-muted py-4 active:bg-card"
            >
              <Text className="font-technical text-xs font-bold uppercase text-foreground">
                Load 10 More Results
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
          <View className="h-[85%] overflow-hidden rounded-t-3xl bg-background shadow-lg">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between border-b border-border bg-card p-6">
              <Text className="font-technical text-xl uppercase tracking-wider text-foreground">
                Filter_Discipline
              </Text>
              <View className="flex-row items-center gap-4">
                {selectedSkills.length > 0 && (
                  <TouchableOpacity onPress={() => setSelectedSkills([])}>
                    <Text className="font-technical text-xs font-bold uppercase text-primary">
                      Clear All
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Modal Body */}
            <ScrollView className="flex-1 p-6" contentContainerStyle={{ paddingBottom: 40 }}>
              {isLoadingSkills ? (
                <View className="items-center justify-center py-12">
                  <ActivityIndicator size="large" color="#4F46E5" />
                  <Text className="mt-4 font-technical text-xs uppercase text-muted-foreground">
                    Loading Categories...
                  </Text>
                </View>
              ) : (
                <View className="flex-col gap-8">
                  {Object.entries(skillsByCategory).map(([category, skills]) => {
                    const isExpanded = expandedCategories.includes(category);
                    const displaySkills = isExpanded ? skills : skills.slice(0, 5);
                    const hiddenCount = skills.length - 5;

                    return (
                      <View key={category}>
                        <Text className="mb-3 border-l-2 border-primary pl-2 font-technical text-xs uppercase tracking-widest text-muted-foreground">
                          {category}
                        </Text>

                        <View className="flex-row flex-wrap gap-2">
                          {displaySkills.map((skill) => {
                            const isSeleted = selectedSkills.includes(skill.name);

                            return (
                              <TouchableOpacity
                                key={skill._id}
                                onPress={() => toggleSkill(skill.name)}
                                className={`flex-row items-center gap-1.5 rounded-sm border-2 border-solid px-4 py-2 transition-colors active:opacity-80 ${isSeleted ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                              >
                                {skill.icon_name && (
                                  <Ionicons
                                    name={skill.icon_name as any}
                                    size={14}
                                    color={isSeleted ? '#FFFFFF' : '#64748B'}
                                  />
                                )}
                                <Text
                                  className={`font-body text-sm ${isSeleted ? 'text-white' : 'text-foreground'}`}
                                >
                                  {skill.name}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}

                          {hiddenCount > 0 && (
                            <TouchableOpacity
                              onPress={() => toggleCategoryExpand(category)}
                              className="flex-row items-center justify-center rounded-sm border-2 border-solid border-border bg-card px-4 py-2 active:bg-muted"
                            >
                              <Text className="font-technical text-sm font-bold uppercase text-muted-foreground">
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
              className="border-t border-border bg-card p-6"
              style={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              <TouchableOpacity
                onPress={() => setIsFilterModalVisible(false)}
                className="w-full items-center justify-center rounded-sm bg-primary py-4 active:opacity-90"
              >
                <Text className="font-technical text-sm font-bold uppercase text-white">
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
