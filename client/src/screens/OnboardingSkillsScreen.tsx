import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllSkills, ISkill } from '../api/skill';
import { useAuthStore } from '../store/auth.store';
import { checkAuth } from '../api/auth';
import { addBulkUserSkills, IBulkSkillPayload } from '../api/userSkill';
import AlertModal from '../components/AlertModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const OnboardingSkillsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { setAuth, token } = useAuthStore();

  const [dbSkills, setDbSkills] = useState<ISkill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const [offeringIds, setOfferingIds] = useState<string[]>([]);
  const [seekingIds, setSeekingIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: 'default' | 'error' | 'success';
    freshUser?: any;
  }>({
    visible: false,
    title: '',
    message: '',
    variant: 'default',
    freshUser: null,
  });

  useEffect(() => {
    const fetchMasterSkills = async () => {
      const skills = await getAllSkills();
      setDbSkills(skills);
      setIsLoadingSkills(false);
    };
    fetchMasterSkills();
  }, []);

  const groupedSkills = dbSkills.reduce(
    (acc, skill) => {
      const cat = skill.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    },
    {} as Record<string, ISkill[]>,
  );

  const searchResults =
    searchQuery.trim() !== ''
      ? dbSkills.filter((skill) => skill.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : [];

  const toggleSkill = (skillId: string) => {
    if (currentStep === 1) {
      setOfferingIds((prev) =>
        prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId],
      );
    } else {
      setSeekingIds((prev) =>
        prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId],
      );
    }
  };

  const handleNextStep = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchQuery('');
    setExpandedCategory(null);
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchQuery('');
    setExpandedCategory(null);
    setCurrentStep(1);
  };

  const handleCompleteRegistration = async () => {
    if (offeringIds.length === 0 || seekingIds.length === 0) return;
    setIsSubmitting(true);

    const offeringPayload: IBulkSkillPayload[] = offeringIds.map((id) => ({
      skill_id: id,
      type: 'TEACH',
    }));

    const seekingPayload: IBulkSkillPayload[] = seekingIds.map((id) => ({
      skill_id: id,
      type: 'LEARN',
    }));

    const finalPayload = [...offeringPayload, ...seekingPayload];

    try {
      const success = await addBulkUserSkills(finalPayload);

      if (success) {
        const freshUser = await checkAuth();

        setAlertConfig({
          visible: true,
          title: 'Setup Complete',
          message: 'Your skills have been saved. Welcome to Swappa!',
          variant: 'success',
          freshUser: freshUser,
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'Connection Error',
          message: 'Failed to save your skills. Please try again.',
          variant: 'error',
        });
      }
    } catch (err) {
      console.error('Onboarding submission error:', err);
      setAlertConfig({
        visible: true,
        title: 'System Error',
        message: 'An unexpected error occurred.',
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSkills) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 font-body text-sm font-medium text-muted-foreground">
          Loading Skills...
        </Text>
      </View>
    );
  }

  const activeSelectionIds = currentStep === 1 ? offeringIds : seekingIds;
  const isStepValid = activeSelectionIds.length > 0;

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="border-b-2 border-solid border-border bg-card px-6 pb-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="mb-2 flex-row items-center justify-between">
          <Text className="font-technical text-2xl font-bold uppercase tracking-wider text-primary">
            Step {currentStep}
          </Text>
          <Text className="font-technical text-xs font-bold text-muted-foreground">
            {currentStep} of 2
          </Text>
        </View>
        <Text className="font-body text-sm text-foreground">
          {currentStep === 1
            ? 'What skills can you offer to the community?'
            : 'What skills are you looking to learn?'}
        </Text>

        {/* Progress Bar */}
        <View className="mt-4 h-1.5 w-full flex-row overflow-hidden rounded-full bg-muted">
          <View className="h-full flex-1 bg-primary" />
          <View
            className={`h-full flex-1 transition-colors ${currentStep === 2 ? 'bg-primary' : 'bg-transparent'}`}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={Platform.OS === 'web' ? true : false}
      >
        {/* Search Bar */}
        <View className="relative mb-6 justify-center">
          <View className="absolute left-4 z-10">
            <Ionicons name="search" size={20} color="#64748B" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search skills..."
            placeholderTextColor="#64748B"
            className="w-full rounded-sm border-2 border-solid border-border bg-muted py-3 pl-12 pr-4 font-body text-foreground focus:border-primary focus:outline-none"
          />
        </View>

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {searchQuery ? 'Search Results' : 'Browse Categories'}
          </Text>
          <Text className="font-body text-xs font-bold text-primary">
            {activeSelectionIds.length} Selected
          </Text>
        </View>

        {/* Skill Selection List */}
        <View className="flex-col gap-3">
          {searchQuery ? (
            searchResults.length > 0 ? (
              searchResults.map((skill) => {
                const isSelected = activeSelectionIds.includes(skill._id);
                const textStyle = isSelected ? 'text-white' : 'text-foreground';

                return (
                  <TouchableOpacity
                    key={skill._id}
                    onPress={() => toggleSkill(skill._id)}
                    className={`flex-row items-center justify-between rounded-sm border-2 border-solid p-4 active:opacity-80 ${isSelected ? 'border-primary bg-primary' : 'border-border bg-muted'}`}
                  >
                    <Text className={`font-body text-sm font-bold ${textStyle}`}>{skill.name}</Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text className="py-4 text-center font-body text-sm text-muted-foreground">
                No matching skills found.
              </Text>
            )
          ) : (
            Object.entries(groupedSkills).map(([category, skills]) => {
              const isExpanded = expandedCategory === category;
              const selectedCount = skills.filter((s) => activeSelectionIds.includes(s._id)).length;

              return (
                <View
                  key={category}
                  className="overflow-hidden rounded-sm border-2 border-solid border-border bg-background"
                >
                  <TouchableOpacity
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setExpandedCategory(isExpanded ? null : category);
                    }}
                    className="flex-row items-center justify-between bg-muted p-4 active:bg-border"
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="font-technical text-sm font-bold uppercase tracking-wider text-foreground">
                        {category}
                      </Text>
                      {selectedCount > 0 && (
                        <View className="h-5 w-5 items-center justify-center rounded-full bg-primary">
                          <Text className="font-technical text-[10px] font-bold text-white">
                            {selectedCount}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View className="flex-row flex-wrap gap-2 p-4">
                      {skills.map((skill) => {
                        const isSelected = activeSelectionIds.includes(skill._id);
                        const textStyle = isSelected ? 'text-white' : 'text-foreground';

                        return (
                          <TouchableOpacity
                            key={skill._id}
                            onPress={() => toggleSkill(skill._id)}
                            className={`rounded-sm border-2 border-solid px-3 py-2 active:opacity-80 ${isSelected ? 'border-primary bg-primary' : 'border-border bg-muted'}`}
                          >
                            <Text className={`font-body text-xs font-medium ${textStyle}`}>
                              {skill.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Fixed Bottom Action Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 flex-row gap-3 border-t-2 border-solid border-border bg-card p-4 shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {currentStep === 2 && (
          <TouchableOpacity
            onPress={handlePrevStep}
            disabled={isSubmitting}
            className="items-center justify-center rounded-sm border-2 border-border bg-background px-4 py-4 active:bg-muted-foreground"
          >
            <Ionicons name="arrow-back" size={20} color="#64748B" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={currentStep === 1 ? handleNextStep : handleCompleteRegistration}
          disabled={!isStepValid || isSubmitting}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-sm py-4 transition-colors duration-300 ${isStepValid && !isSubmitting ? 'bg-primary active:opacity-90' : 'bg-slate-400 opacity-70'}`}
        >
          {isSubmitting && <ActivityIndicator size="small" color="#FFFFFF" />}
          <Text className="font-technical font-bold uppercase tracking-wider text-white">
            {isSubmitting
              ? 'Saving...'
              : !isStepValid
                ? 'Select a Skill'
                : currentStep === 1
                  ? 'Next Step'
                  : 'Complete Setup'}
          </Text>
          {isStepValid && !isSubmitting && currentStep === 1 && (
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          )}
          {isStepValid && !isSubmitting && currentStep === 2 && (
            <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.variant}
        onClose={() => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));

          if (alertConfig.variant === 'success') {
            if (alertConfig.freshUser) {
              const userData = alertConfig.freshUser.user || alertConfig.freshUser;
              setAuth(userData, token || undefined);
            }
            navigation.reset({
              index: 0,
              routes: [{ name: 'MainApp' }],
            });
          }
        }}
      />
    </View>
  );
};

export default OnboardingSkillsScreen;
