import { useCallback, useState } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAllSkills, ISkill } from '../api/skill';
import { nearbyUsers } from '../data/mockData';

const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const [skillsByCategory, setSkillsByCategory] = useState<Record<string, ISkill[]>>({});
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  const fetchAndGroupSkills = async () => {
    setIsLoadingSkills(true);
    try {
      const allSkills = await getAllSkills();

      const grouped = allSkills.reduce((acc: Record<string, ISkill[]>, skill: ISkill) => {
        const cat = skill.category || 'Other';

        if (!acc[cat]) {
          acc[cat] = [];
        }

        acc[cat].push(skill);
        return acc;
      }, {});

      setSkillsByCategory(grouped);
    } catch (err) {
      console.error('Error loading skills for search:', err);
    } finally {
      setIsLoadingSkills(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAndGroupSkills();
    }, []),
  );

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

  const filteredUsers = nearbyUsers.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === '' ||
      user.name.toLowerCase().includes(searchLower) ||
      user.offering.some((skill) => skill.toLowerCase().includes(searchLower)) ||
      user.seeking.some((skill) => skill.toLowerCase().includes(searchLower));

    const matchesSkills =
      selectedSkills.length === 0 || selectedSkills.some((skill) => user.offering.includes(skill));

    return matchesSearch && matchesSkills;
  });

  return (
    <View className="flex-1 bg-background">
      {/* Header & Search Bar */}
      <View
        className="z-10 border-b border-border bg-card p-6 shadow-sm"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <Text className="mb-6 font-technical text-2xl uppercase tracking-wider text-foreground">
          Search_Database
        </Text>

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
      >
        {/* Nearby Swaps */}
        <View className="p-6">
          <View className="mb-4 flex-row items-end justify-between">
            <Text className="font-technical text-sm uppercase tracking-wider text-muted-foreground">
              {searchQuery.length > 0 ? 'Search_Results' : 'Nearby_Swaps'}
            </Text>
            <Text className="font-technical text-[10px] uppercase text-primary">
              {filteredUsers.length} Matches
            </Text>
          </View>

          <View className="flex-col gap-4">
            {filteredUsers.length === 0 ? (
              <View className="items-center justify-center rounded-sm border-2 border-dashed border-border bg-muted py-10">
                <Ionicons name="search-outline" size={48} color="#64748B" />
                <Text className="mt-4 font-technical text-sm uppercase tracking-wider text-muted-foreground">
                  No_Matching_Records_Found
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedSkills([]);
                  }}
                  className="mt-4 border-b border-primary"
                >
                  <Text className="font-technical text-xs uppercase text-primary">
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredUsers.map((user) => {
                const fakeDistance = `0.${(user.id.length % 9) + 1}`;

                return (
                  <TouchableOpacity
                    key={user.id}
                    onPress={() => navigation.navigate('UserProfile', { userId: user.id })}
                    className="rounded-sm border-2 border-solid border-border bg-card p-4 active:border-primary active:opacity-90"
                  >
                    <View className="flex-row items-start gap-4">
                      {/* Avatar */}
                      <Image
                        source={{ uri: user.avatar }}
                        className="h-14 w-14 rounded-sm border-2 border-solid border-muted-foreground bg-muted"
                        resizeMode="cover"
                      />

                      {/* User Info Container */}
                      <View className="flex-1">
                        {/* Name & Match Badge */}
                        <View className="mb-1 flex-row items-center justify-between">
                          <Text className="font-body text-base font-medium text-foreground">
                            {user.name}
                          </Text>
                          <View className="rounded-sm bg-accent px-2 py-1">
                            <Text className="font-technical text-xs font-bold text-accent-foreground">
                              {user.matchPercentage}%
                            </Text>
                          </View>
                        </View>

                        {/* Location Data */}
                        <View className="mb-3 flex-row items-center gap-1">
                          <Ionicons name="location" size={14} color="#64748B" />
                          <Text className="font-body text-sm text-muted-foreground">
                            {fakeDistance} mi away
                          </Text>
                        </View>

                        {/* Skill Tags */}
                        <View className="flex-row flex-wrap gap-2">
                          {user.offering.slice(0, 2).map((skill) => (
                            <View key={skill} className="rounded-sm bg-primary px-2 py-1">
                              <Text className="font-body text-xs text-white">{skill}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
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
                <TouchableOpacity
                  onPress={() => setIsFilterModalVisible(false)}
                  className="rounded-sm bg-muted p-2 active:bg-border"
                >
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
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
                  Show {filteredUsers.length} Matches
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
