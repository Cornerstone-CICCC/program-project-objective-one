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
    isSuccess: boolean;
    variant: 'default' | 'error' | 'success';
    freshUser?: any;
  }>({
    visible: false,
    title: '',
    message: '',
    isSuccess: false,
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

    console.log('Deploying new user skills to Database...', finalPayload);

    try {
      const success = await addBulkUserSkills(finalPayload);

      if (success) {
        const freshUser = await checkAuth();

        setAlertConfig({
          visible: true,
          title: 'Initialization_Complete',
          message: 'Your skill parameters have been established. Welcome to Swappa.',
          isSuccess: true,
          variant: 'success',
          freshUser: freshUser,
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'Connection_Error',
          message: 'Failed to save your skills. Please try again.',
          isSuccess: false,
          variant: 'error',
        });
      }
    } catch (err) {
      console.error('Onboarding submission error:', err);
      setAlertConfig({
        visible: true,
        title: 'System_Error',
        message: 'An unexpected error occurred.',
        isSuccess: false,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingSkills) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#1E40AF" />
        <Text className="mt-4 font-mono text-sm uppercase tracking-wider text-muted-foreground">
          Loading Skill Database...
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
          <Text className="font-technical text-2xl uppercase tracking-wider text-primary">
            {currentStep === 1 ? 'Phase_1' : 'Phase_2'}
          </Text>
          <Text className="font-technical text-xs uppercase text-muted-foreground">
            Step {currentStep} of 2
          </Text>
        </View>
        <Text>
          {currentStep === 1
            ? 'Declare the assets and skills you bring to the network.'
            : 'Identify the knowledge you wish to acquire from others.'}
        </Text>

        {/* Progress Bar */}
        <View className="mt-4 h-1 w-full flex-row overflow-hidden rounded-full bg-muted">
          <View className="h-full flex-1 bg-primary" />
          <View
            className={`h-full flex-1 transition-colors ${currentStep === 2 ? 'bg-accent' : 'bg-transparent'}`}
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View className="relative mb-6 justify-center">
          <View className="absolute left-4 z-10">
            <Ionicons name="search" size={20} color="#64748B" />
          </View>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search the skill database..."
            placeholderTextColor="#64748B"
            className="w-full rounded-sm border-2 border-solid border-border bg-card py-3 pl-12 pr-4 font-body text-foreground focus:border-primary"
          />
        </View>

        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-technical text-xs uppercase tracking-wider text-muted-foreground">
            {searchQuery ? 'Search_Results' : 'Browse_Categories'}
          </Text>
          <Text className="font-technical text-[10px] uppercase text-primary">
            {activeSelectionIds.length} Selected
          </Text>
        </View>

        {/* Skill Selection List */}
        <View className="flex-col gap-3">
          {searchQuery ? (
            searchResults.length > 0 ? (
              searchResults.map((skill) => {
                const isSelected = activeSelectionIds.includes(skill._id);
                return (
                  <TouchableOpacity
                    key={skill._id}
                    onPress={() => toggleSkill(skill._id)}
                    className={`flex-row items-center justify-between rounded-sm border-2 border-solid p-4 active:opacity-80 ${isSelected ? (currentStep === 1 ? 'border-primary bg-primary' : 'border-accent bg-accent') : 'border-border bg-card'}`}
                  >
                    <Text
                      className={`font-body text-sm ${isSelected ? 'text-white' : 'text-foreground'}`}
                    >
                      {skill.name}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                  </TouchableOpacity>
                );
              })
            ) : (
              <Text className="py-4 text-center font-body text-sm text-muted-foreground">
                No matching skills found in the database.
              </Text>
            )
          ) : (
            Object.entries(groupedSkills).map(([category, skills]) => {
              const isExpanded = expandedCategory === category;
              const selectedCount = skills.filter((s) => activeSelectionIds.includes(s._id)).length;

              return (
                <View
                  key={category}
                  className="overflow-hidden rounded-sm border-2 border-solid border-border bg-card"
                >
                  <TouchableOpacity
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setExpandedCategory(isExpanded ? null : category);
                    }}
                    className="flex-row items-center justify-between bg-muted p-4 active:bg-border"
                  >
                    <View className="flex-row items-center gap-2">
                      <Text className="font-technical text-sm uppercase tracking-wider text-foreground">
                        {category}
                      </Text>
                      {selectedCount > 0 && (
                        <View
                          className={`h-5 w-5 items-center justify-center rounded-full ${currentStep === 1 ? 'bg-primary' : 'bg-accent'}`}
                        >
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
                        return (
                          <TouchableOpacity
                            key={skill._id}
                            onPress={() => toggleSkill(skill._id)}
                            className={`rounded-sm border-2 border-solid px-3 py-2 active:opacity-80 ${isSelected ? (currentStep === 1 ? 'border-primary bg-primary' : 'border-accent bg-accent') : 'border-border bg-background'}`}
                          >
                            <Text
                              className={`font-body text-xs ${isSelected ? 'text-white' : 'text-foreground'}`}
                            >
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
            className="items-center justify-center rounded-sm border-2 border-border bg-card px-4 py-4 active:bg-muted"
          >
            <Ionicons name="arrow-back" size={20} color="#64748B" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          onPress={currentStep === 1 ? handleNextStep : handleCompleteRegistration}
          disabled={!isStepValid || isSubmitting}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-sm border-2 border-solid py-4 ${isStepValid && !isSubmitting ? (currentStep === 1 ? 'border-primary bg-primary' : 'border-accent bg-accent') : 'border-muted-foreground bg-muted opacity-50'}`}
        >
          {isSubmitting && <ActivityIndicator size="small" color="#FFFFFF" />}
          <Text
            className="font-technical text-sm uppercase tracking-wider"
            style={{ color: isStepValid ? '#FFFFFF' : '#64748B' }}
          >
            {isSubmitting
              ? 'Processing...'
              : !isStepValid
                ? 'Awaiting_Input'
                : currentStep === 1
                  ? 'Next_Phase'
                  : 'Establish_Connection'}
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

          if (alertConfig.isSuccess) {
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
