import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { IUser } from '../api/auth';
import { getUserById } from '../api/user';
import { getMySkills, getUserSkills } from '../api/userSkill';
import { proposeTrade } from '../api/trade';
import AlertModal from '../components/AlertModal';

export interface IUserSkillUI {
  _id?: string;
  skill_id: string;
  name: string;
  type: 'TEACH' | 'LEARN';
  proficiency: string;
  description: string;
}

const ProposeTradeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const targetUserId = route.params?.userId;

  const [partner, setPartner] = useState<IUser | null>(null);
  const [mySkills, setMySkills] = useState<IUserSkillUI[]>([]);
  const [partnerSkills, setPartnerSkills] = useState<IUserSkillUI[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [selectedReceiveId, setSelectedReceiveId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [location, setLocation] = useState('');

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    isSuccess: boolean;
    variant: 'default' | 'error' | 'success';
  }>({
    visible: false,
    title: '',
    message: '',
    isSuccess: false,
    variant: 'default',
  });

  const isMessageOverLimit = message.length > 500;
  const isLocationOverLimit = location.length > 100;
  const isValid =
    selectedOfferId !== null &&
    selectedReceiveId !== null &&
    !isMessageOverLimit &&
    !isLocationOverLimit;

  useEffect(() => {
    const loadTradeData = async () => {
      if (!targetUserId) return;
      try {
        const [partnerData, mySkillsData, partnerSkillsData] = await Promise.all([
          getUserById(targetUserId),
          getMySkills(),
          getUserSkills(targetUserId),
        ]);

        setPartner(partnerData);

        const formatSkills = (data: any[]) =>
          data
            .filter((item) => item.type === 'TEACH')
            .map((item) => ({
              _id: item._id,
              skill_id: item.skill_id?._id || item.skill_id,
              name: item.skill_id?.name || 'Unknown',
              type: item.type,
              proficiency: item.proficiency,
              description: item.description,
            }));

        setMySkills(formatSkills(mySkillsData || []));
        setPartnerSkills(formatSkills(partnerSkillsData || []));
      } catch (err) {
        console.error('Failed to load trade data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadTradeData();
  }, [targetUserId]);

  const handleSubmitProposal = async () => {
    if (!isValid || !partner || !partner._id || !selectedOfferId || !selectedReceiveId) return;
    setIsSubmitting(true);

    try {
      await proposeTrade({
        receiver_id: partner._id,
        offered_skill_id: selectedOfferId,
        received_skill_id: selectedReceiveId,
        message: message.trim() || undefined,
        proposed_location: location.trim() || undefined,
      });

      setAlertConfig({
        visible: true,
        title: 'Swap Request Sent',
        message: `Your request has been successfully sent to ${partner.firstname} ${partner.lastname}.`,
        isSuccess: true,
        variant: 'success',
      });
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        title: 'System Error',
        message: err.message || 'Failed to send proposal. Please try again.',
        isSuccess: false,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBadgeStyle = (proficiency: string) => {
    switch (proficiency) {
      case 'Expert':
        return 'bg-purple-600 border-purple-700';
      case 'Advanced':
        return 'bg-emerald-700 border-emerald-700';
      case 'Intermediate':
        return 'bg-amber-600 border-amber-700';
      default:
        return 'bg-blue-600 border-blue-700';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="mt-4 text-center font-technical text-sm uppercase tracking-wider text-muted-foreground">
          Loading Swap Interface...
        </Text>
      </View>
    );
  }

  if (!partner) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Ionicons name="warning-outline" size={48} color="#ef4444" />
        <Text className="mt-4 text-center font-technical text-lg uppercase tracking-wider text-muted-foreground">
          User Not Found
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
          className="mt-6 rounded-sm border-2 border-solid border-primary px-6 py-3"
        >
          <Text className="font-body font-bold uppercase text-primary dark:text-[#A5B4FC]">
            Return to Previous
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="border-b-2 border-solid border-border bg-card px-4 pb-4"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="rounded-sm p-2 active:bg-muted"
            disabled={isSubmitting}
          >
            <Ionicons name="close" size={28} color="#64748B" />
          </TouchableOpacity>
          <View>
            <Text className="font-technical text-xl font-bold uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
              Request Swap
            </Text>
            <Text className="font-body text-xs text-muted-foreground">
              Configure the details of your skill exchange.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={Platform.OS === 'web' ? true : false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Target Partner Card */}
        <View className="mb-8 flex-row items-center gap-4 rounded-sm border-2 border-solid border-border bg-muted p-4">
          <Image
            source={{ uri: partner.avatar_url || 'https://placehold.co/150' }}
            className="h-14 w-14 rounded-sm border-2 border-solid border-muted-foreground bg-card"
            resizeMode="contain"
          />
          <View>
            <Text className="mb-1 font-body text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Trading Partner
            </Text>
            <Text className="font-body text-lg font-bold text-foreground">
              {partner.firstname} {partner.lastname}
            </Text>
          </View>
        </View>

        {/* Offer */}
        <View className="mb-8">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-body text-sm font-bold uppercase tracking-wider text-foreground">
              1. What You'll Teach
            </Text>
            {selectedOfferId && (
              <Ionicons
                name="checkmark-circle"
                size={18}
                className="text-primary dark:text-[#A5B4FC]"
              />
            )}
          </View>
          <Text className="mb-4 font-body text-xs text-muted-foreground">
            Select a skill from your active repertoire to offer in this exchange.
          </Text>

          <View className="flex-col gap-2">
            {mySkills.length === 0 ? (
              <Text className="font-body text-sm font-bold text-destructive">
                You must add a teaching skill to your profile before you can trade!
              </Text>
            ) : (
              mySkills.map((skill) => {
                const isSelected = selectedOfferId === skill.skill_id;
                const badgeClass = getBadgeStyle(skill.proficiency);

                return (
                  <TouchableOpacity
                    key={`offer-${skill.skill_id}`}
                    onPress={() => setSelectedOfferId(skill.skill_id)}
                    activeOpacity={0.8}
                    className={`flex-row items-center justify-between rounded-sm border-2 border-solid p-4 ${isSelected ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                  >
                    <Text
                      className={`flex-1 font-body text-sm font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}
                      numberOfLines={1}
                    >
                      {skill.name}
                    </Text>

                    <View className="flex-row items-center gap-3 px-2">
                      <View className={`rounded-sm border-2 px-2 py-1 ${badgeClass}`}>
                        <Text className="font-body text-[10px] font-bold uppercase tracking-wider text-white">
                          {skill.proficiency}
                        </Text>
                      </View>
                    </View>
                    <View className="w-5 items-center justify-center">
                      {isSelected && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        {/* Receive */}
        <View className="mb-8">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="font-body text-sm font-bold uppercase tracking-wider text-foreground">
              2. What You'll Learn
            </Text>
            {selectedReceiveId && (
              <Ionicons
                name="checkmark-circle"
                size={18}
                className="text-primary dark:text-[#A5B4FC]"
              />
            )}
          </View>
          <Text className="mb-4 font-body text-xs text-muted-foreground">
            Select the skill you wish to acquire from {partner.firstname} {partner.lastname}.
          </Text>

          <View className="flex-col gap-2">
            {partnerSkills.length === 0 ? (
              <Text className="font-body text-sm font-bold text-destructive">
                This user currently has no skills to offer.
              </Text>
            ) : (
              partnerSkills.map((skill) => {
                const isSelected = selectedReceiveId === skill.skill_id;
                const badgeClass = getBadgeStyle(skill.proficiency);

                return (
                  <TouchableOpacity
                    key={`receive-${skill.skill_id}`}
                    onPress={() => setSelectedReceiveId(skill.skill_id)}
                    activeOpacity={0.8}
                    className={`flex-row items-center justify-between rounded-sm border-2 border-solid p-4 ${isSelected ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                  >
                    <Text
                      className={`flex-1 font-body text-sm font-bold ${isSelected ? 'text-white' : 'text-foreground'}`}
                      numberOfLines={1}
                    >
                      {skill.name}
                    </Text>
                    <View className="flex-row items-center gap-3 px-2">
                      <View className={`rounded-sm border-2 px-2 py-1 ${badgeClass}`}>
                        <Text className="font-body text-[10px] font-bold uppercase tracking-wider text-white">
                          {skill.proficiency}
                        </Text>
                      </View>
                    </View>
                    <View className="w-5 items-center justify-center">
                      {isSelected && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>

        {/* Trade Details (Message & Location) */}
        <View className="mb-8">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-body text-sm font-bold uppercase tracking-wider text-foreground">
              3. Details
            </Text>
          </View>

          {/* Location Input */}
          <View className="mb-4">
            <Text
              className={`mb-2 font-body text-xs font-bold uppercase tracking-wider ${isLocationOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              Proposed Location / Platform
            </Text>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Coffee Shop, Zoom, Discord..."
              placeholderTextColor="#64748B"
              className={`w-full rounded-sm border-2 border-solid bg-card px-4 py-3 font-body text-foreground focus:outline-none ${isLocationOverLimit ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`}
            />
            <Text
              className={`mt-1 text-right font-technical text-[10px] uppercase tracking-wider ${isLocationOverLimit ? 'font-bold text-destructive' : 'text-muted-foreground'}`}
            >
              {location.length} / 100
            </Text>
          </View>

          {/* Message Input */}
          <View className="mb-4">
            <Text
              className={`mb-2 font-body text-xs font-bold uppercase tracking-wider ${isMessageOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              Message
            </Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder={`Hi ${partner.firstname}, I'd love to start a swap...`}
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className={`min-h-[80px] w-full rounded-sm border-2 border-solid bg-card px-4 py-3 font-body text-foreground focus:outline-none ${isMessageOverLimit ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`}
            />
            <Text
              className={`mt-1 text-right font-technical text-[10px] uppercase tracking-wider ${isMessageOverLimit ? 'font-bold text-destructive' : 'text-muted-foreground'}`}
            >
              {message.length} / 500
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Fixed Fotter */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t-2 border-solid border-border bg-card p-4 shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity
          onPress={handleSubmitProposal}
          disabled={!isValid || isSubmitting}
          activeOpacity={0.8}
          className={`w-full flex-row items-center justify-center gap-2 rounded-sm py-4 shadow-sm ${isValid && !isSubmitting ? 'bg-primary' : ' bg-slate-400 opacity-70 dark:bg-slate-600'}`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Text className="font-body font-bold text-white">
                {isValid ? 'Send Request' : 'Complete Form'}
              </Text>
              {isValid && (
                <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />
              )}
            </>
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
            navigation.navigate('MainApp', { screen: 'Swaps' });
          }
        }}
      />
    </View>
  );
};

export default ProposeTradeScreen;
