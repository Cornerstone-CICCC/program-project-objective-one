import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { nearbyUsers, popularSkills } from '../data/mockData';

const SearchScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
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
        className="border-b border-border bg-card p-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <Text className="mb-6 font-technical text-2xl uppercase tracking-wider text-foreground">
          Search_Database
        </Text>

        <View className="relative justify-center">
          <View className="absolute left-3 z-10">
            <Ionicons name="search" size={20} color="#64748B" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search skills, users, or trades..."
            placeholderTextColor="#64748B"
            className="w-full rounded-sm border-2 border-solid border-border bg-muted py-3 pl-10 pr-4 font-body text-foreground focus:border-accent"
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Popular Skills */}
        <View className="p-6">
          <Text className="mb-4 font-technical text-sm uppercase tracking-wider text-muted-foreground">
            Popular_Skills
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {popularSkills.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <TouchableOpacity
                  key={skill}
                  onPress={() => toggleSkill(skill)}
                  className={`rounded-sm border-2 border-solid px-4 py-2 active:opacity-80 ${isSelected ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                >
                  <Text
                    className={`font-body text-sm ${isSelected ? 'text-white' : 'text-foreground'}`}
                  >
                    {skill}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Nearby Swaps */}
        <View className="px-6">
          <Text className="mb-4 font-technical text-sm uppercase tracking-wider text-muted-foreground">
            Nearby_Swaps
          </Text>

          <View className="flex-col gap-4">
            {filteredUsers.length === 0 ? (
              <View className="items-center justify-center py-10">
                <Ionicons name="search-outline" size={48} color="#64748B" />
                <Text className="mt-4 font-technical text-sm uppercase tracking-wider text-muted-foreground">
                  No_Matching_Records_Found
                </Text>
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
    </View>
  );
};

export default SearchScreen;
