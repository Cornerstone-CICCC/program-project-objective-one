import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

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
];

const ProfileEditScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [avatar, setAvatar] = useState(
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&auto=format&fit=crop',
  );
  const [username, setUsername] = useState('Morgan Rivers');
  const [bio, setBio] = useState(
    'Full-stack developer passionate about building tools for creators. Always learning, always building.',
  );

  const [offering, setOffering] = useState<string[]>(['React Native', 'Node.js', 'UI/UX Design']);
  const [seeking, setSeeking] = useState<string[]>(['Marketing', 'Copywriting']);

  const [activeModal, setActiveModal] = useState<'offer' | 'seek' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    console.log('Deploying profile changes...');
    navigation.goBack();
  };

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

  const renderSkillChips = (skills: string[], type: 'offer' | 'seek') => (
    <View className="mt-3 flex-row flex-wrap gap-2">
      {skills.map((skill) => (
        <View
          key={skill}
          className="flex-row items-center rounded-sm border border-solid border-border bg-muted px-3 py-1.5"
        >
          <Text className="mr-2 font-technical text-xs text-foreground">{skill}</Text>
          <TouchableOpacity onPress={() => toggleSkill(skill, type)} hitSlop={10}>
            <Ionicons name="close" size={14} color="#ef4444" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        onPress={() => setActiveModal(type)}
        className="flex-row items-center rounded-sm border-2 border-dashed border-border bg-transparent px-3 py-1.5 active:bg-muted"
      >
        <Ionicons name="add" size={14} color="#64748B" />
        <Text className="ml-1 font-technical text-xs uppercase text-muted-foreground">Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="border-b border-border bg-card p-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="rounded-sm p-2 active:opacity-70"
          >
            <Ionicons name="arrow-back" size={24} color="#64748B" />
          </TouchableOpacity>
          <View>
            <Text className="font-technical text-lg uppercase tracking-wider text-primary">
              Public_Identity_Sys
            </Text>
            <Text className="mt-1 font-technical text-xs uppercase tracking-wider text-muted-foreground">
              Profile_Configuration_Interface
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 40 }}
      >
        {/* Avatar */}
        <View className="mb-8 items-center">
          <View className="relative">
            <View className="h-32 w-32 overflow-hidden rounded-sm border-2 border-solid border-primary bg-muted">
              <Image source={{ uri: avatar }} className="h-full w-full" resizeMode="cover" />
            </View>
            <TouchableOpacity
              onPress={pickImage}
              className="absolute -bottom-2 -right-2 h-10 w-10 items-center justify-center rounded-sm border-2 border-background bg-accent active:opacity-80"
            >
              <Ionicons name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text className="mt-4 font-technical text-xs uppercase tracking-wider text-muted-foreground">
            Avatar_Update
          </Text>
        </View>

        {/* Username & Bio */}
        <View className="mb-8 space-y-4">
          <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-accent">
            User_Profile_Data
          </Text>

          {/* Username */}
          <View className="mb-4 rounded-sm border-2 border-solid border-border bg-card p-4">
            <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
              Display_Name
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              className="w-full rounded-sm border-2 border-solid border-border bg-background px-3 py-2 font-body text-foreground focus:border-primary"
              placeholderTextColor="#64748B"
            />
          </View>

          {/* Bio */}
          <View className="rounded-sm border-2 border-solid border-border bg-card p-4">
            <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
              Bio_Description
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className="min-h-[100px] w-full rounded-sm border-2 border-solid border-border bg-background px-3 py-2 font-body text-foreground focus:border-primary"
              placeholderTextColor="#64748B"
            />
            <Text className="mt-2 text-right font-technical text-[10px] uppercase tracking-wider text-muted-foreground">
              {bio.length}/200 Characters
            </Text>
          </View>
        </View>

        {/* Skill Matrix */}
        <View className="mb-8 space-y-4">
          <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-accent">
            Skill_Matrix_Config
          </Text>

          {/* Offering */}
          <View className="mb-4 rounded-sm border-2 border-solid border-border bg-card p-4">
            <Text className="font-technical text-xs uppercase  tracking-wider text-muted-foreground">
              Skills_Offering
            </Text>
            {renderSkillChips(offering, 'offer')}
          </View>

          {/* Seeking */}
          <View className="rounded-sm border-2 border-solid border-border bg-card p-4">
            <Text className="font-technical text-xs uppercase tracking-wider text-muted-foreground">
              Skills_Seeking
            </Text>
            {renderSkillChips(seeking, 'seek')}
          </View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View
        className="flex-row gap-3 border-t border-border bg-card p-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity
          onPress={handleSave}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-sm bg-primary py-3 active:opacity-80"
        >
          <Ionicons name="save" size={20} color="#FFFFFF" />
          <Text className="font-technical text-sm uppercase tracking-wider text-primary-foreground">
            Deploy_Changes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-sm border-2 border-solid border-border bg-transparent py-3 active:bg-muted"
        >
          <Ionicons name="close" size={20} color="#64748B" />
          <Text className="font-technical text-sm uppercase tracking-wider text-foreground">
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      {/* Skill Search Modal */}
      <Modal
        visible={activeModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setActiveModal(null);
          setSearchQuery('');
        }}
      >
        <View className="flex-1 bg-background px-6 pt-12">
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="font-technical text-lg uppercase tracking-wider text-foreground">
              {activeModal === 'offer' ? 'Select_Offering_Skills' : 'Select_Seeking_Skills'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setActiveModal(null);
                setSearchQuery('');
              }}
              className="p-2"
            >
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Search Input */}
          <View className="relative mb-4">
            <Ionicons
              name="search"
              size={20}
              color="#64748B"
              className="absolute left-3 top-3 z-10"
            />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search database..."
              placeholderTextColor="#64748B"
              className="bottom-2 w-full rounded-sm border-solid border-border bg-card py-3 pl-10 pr-4 font-body text-foreground focus:border-primary"
            />
          </View>

          {/* Result List */}
          <FlatList
            data={filteredSkills}
            keyExtractor={(item) => item}
            renderItem={({ item }) => {
              const isSelected =
                activeModal === 'offer' ? offering.includes(item) : seeking.includes(item);
              return (
                <TouchableOpacity
                  onPress={() => activeModal && toggleSkill(item, activeModal)}
                  className={`mb-2 flex-row items-center justify-between rounded-sm border-2 border-solid p-4 ${isSelected ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                >
                  <Text
                    className={`font-technical text-sm ${isSelected ? 'text-white' : 'text-foreground'}`}
                  >
                    {item}
                  </Text>
                  {isSelected && <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        </View>
      </Modal>
    </View>
  );
};

export default ProfileEditScreen;
