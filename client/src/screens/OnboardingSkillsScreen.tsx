import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SKILL_DATABASE = [
  'React',
  'React Native',
  'Node.js',
  'TypeScript',
  'Python',
  'UI/UX Design',
  'Figma',
  'Graphic Design',
  'Digital Marketing',
  'Copywriting',
  'SEO',
  'Data Analysis',
  'SQL',
  'MongoDB',
  'Photography',
  'Guitar Lessons',
  'Spanish Tutoring',
  'Yoga Instruction',
  'Cooking Classes',
];

const OnboardingSkillsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [offering, setOffering] = useState<string[]>([]);
  const [seeking, setSeeking] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSkills = SKILL_DATABASE.filter((skill) =>
    skill.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const toggleSkill = (skill: string, type: 'offer' | 'seek') => {
    if (type === 'offer') {
      setOffering((prev) =>
        prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
      );
    } else {
      setSeeking((prev) =>
        prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill],
      );
    }
  };

  const isValid = offering.length > 0 && seeking.length > 0;

  const handleCompleteRegistration = () => {
    if (!isValid) return;

    console.log('Deploying new user skills to Database...', { offering, seeking });

    navigation.reset({
      index: 0,
      routes: [{ name: 'MainApp' }],
    });
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="border-b-2 border-solid border-border bg-card px-6 pb-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <Text className="mb-2 font-technical text-2xl uppercase tracking-wider text-primary">
          Initialize_Profile
        </Text>
        <Text className="font-body text-sm text-muted-foreground">
          Select the skills you bring to the table, and the knowledge you wish to acquire.
        </Text>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View className="relative mb-8 justify-center">
          <View className="absolute left-4 z-10">
            <Ionicons name="search" size={20} color="#64748B" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search the skill database..."
            placeholderTextColor="#64748B"
            className="w-full rounded-sm border-2 border-solid border-border bg-muted py-3 pl-12 pr-4 font-body text-foreground focus:border-primary"
          />
        </View>

        {/* Offering Matrix */}
        <View className="mb-8">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-technical text-sm uppercase tracking-wider text-foreground">
              1. What_You_Offer
            </Text>
            <Text className="font-technical text-[10px] uppercase text-muted-foreground">
              {offering.length} Selected
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {filteredSkills.map((skill) => {
              const isSelected = offering.includes(skill);
              return (
                <TouchableOpacity
                  key={`offer-${skill}`}
                  onPress={() => toggleSkill(skill, 'offer')}
                  className={`rounded-sm border-2 border-solid px-4 py-2 active:opacity-80 ${isSelected ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                >
                  <Text
                    style={{ color: isSelected ? '#FFFFFF' : '#64748B' }}
                    className="font-body text-sm"
                  >
                    {skill}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Seeking Matrix */}
        <View className="mb-8">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-technical text-sm uppercase tracking-wider text-foreground">
              2. What_You_Seek
            </Text>
            <Text className="font-technical text-[10px] uppercase text-muted-foreground">
              {seeking.length} Selected
            </Text>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {filteredSkills.map((skill) => {
              const isSelected = seeking.includes(skill);
              return (
                <TouchableOpacity
                  key={`seek-${skill}`}
                  onPress={() => toggleSkill(skill, 'seek')}
                  className={`rounded-sm border-2 border-solid px-4 py-2 active:opacity-80 ${isSelected ? 'border-accent bg-accent' : 'border-border bg-card'}`}
                >
                  <Text
                    style={{ color: isSelected ? '#FFFFFF' : '#64748B' }}
                    className="font-body text-sm"
                  >
                    {skill}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t-2 border-solid border-border bg-card p-4 shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity
          onPress={handleCompleteRegistration}
          disabled={!isValid}
          className={`w-full flex-row items-center justify-center gap-2 rounded-sm border-2 border-solid py-4 ${isValid ? 'border-primary bg-primary active:opacity-80' : 'border-muted-foreground bg-muted opacity-50'}`}
        >
          <Text
            className="font-technical text-sm uppercase tracking-wider"
            style={{ color: isValid ? '#FFFFFF' : '#64748B' }}
          >
            {isValid ? 'Establish_Connection' : 'Awaiting_Input'}
          </Text>
          {isValid && <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default OnboardingSkillsScreen;
