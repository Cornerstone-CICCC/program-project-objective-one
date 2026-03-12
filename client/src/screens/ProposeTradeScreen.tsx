import { useState } from 'react';
import { Alert, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { currentUser, nearbyUsers } from '../data/mockData';

const ProposeTradeScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const targetUserId = route.params?.userId;
  const partner = nearbyUsers.find((u) => u.id === targetUserId);

  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [selectedReceive, setSelectedReceive] = useState<string | null>(null);

  if (!partner) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Ionicons name="warning-outline" size={48} color="#ef4444" />
        <Text className="mt-4 text-center font-technical text-lg uppercase tracking-wider text-muted-foreground">
          User_Not_Found
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mt-6 rounded-sm border-2 border-solid border-primary px-6 py-3 active:bg-muted"
        >
          <Text className="font-technical uppercase text-primary">Return to Previous</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isValid = selectedOffer !== null && selectedReceive !== null;

  const handleSubmitProposal = () => {
    if (!isValid) return;

    console.log(
      `Proposing Trade to ${partner.name}: Give [${selectedOffer}] for [${selectedReceive}]`,
    );

    Alert.alert(
      'Proposal Sent',
      `Your trade request has been successfully transmitted to ${partner.name}.`,
      [{ text: 'Acknowledge', onPress: () => navigation.goBack() }],
    );
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="border-b-2 border-solid border-border bg-card px-6 pb-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="mb-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="ml-[-8px] rounded-sm p-2 active:bg-muted"
          >
            <Ionicons name="close" size={28} color="#64748B" />
          </TouchableOpacity>
        </View>
        <Text className="font-technical text-2xl uppercase tracking-wider text-primary">
          Draft_Proposal
        </Text>
        <Text className="mt-2 font-body text-sm text-muted-foreground">
          Configure the parameters of your skill exchange.
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* Target Partner Card */}
        <View className="mb-8 flex-row items-center gap-4 rounded-sm border-2 border-solid border-border bg-muted p-4">
          <Image
            source={{ uri: partner.avatar }}
            className="h-14 w-14 rounded-sm border-2 border-solid border-muted-foreground bg-card"
            resizeMode="cover"
          />
          <View>
            <Text className="mb-1 font-technical text-[10px] uppercase tracking-wider text-muted-foreground">
              Target_Recipient
            </Text>
            <Text className="font-body text-lg font-medium text-foreground">{partner.name}</Text>
          </View>
        </View>

        {/* Offer */}
        <View className="mb-8">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-technical text-sm uppercase tracking-wider text-foreground">
              1. You_Provide
            </Text>
            {selectedOffer && <Ionicons name="checkmark-circle" size={16} color="#4f46e5" />}
          </View>
          <Text className="mb-4 font-body text-xs text-muted-foreground">
            Select a skill from your active repertoire to offer in this exchange.
          </Text>

          <View className="flex-col gap-2">
            {currentUser.offering.map((skill) => {
              const isSelected = selectedOffer === skill;
              return (
                <TouchableOpacity
                  key={`offer-${skill}`}
                  onPress={() => setSelectedOffer(skill)}
                  className={`flex-row items-center justify-between rounded-sm border-2 border-solid p-4 active:opacity-70 ${isSelected ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                >
                  <Text
                    className={`font-body text-sm ${isSelected ? 'text-white' : 'text-foreground'}`}
                  >
                    {skill}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Receive */}
        <View className="mb-8">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-technical text-sm uppercase tracking-wider text-foreground">
              2. You_Receive
            </Text>
            {selectedReceive && <Ionicons name="checkmark-circle" size={16} color="#4f46e5" />}
          </View>
          <Text className="mb-4 font-body text-xs text-muted-foreground">
            Select the desired skill you wish to acquire from {partner.name}.
          </Text>

          <View className="flex-col gap-2">
            {partner.offering.map((skill) => {
              const isSelected = selectedReceive === skill;
              return (
                <TouchableOpacity
                  key={`receive-${skill}`}
                  onPress={() => setSelectedReceive(skill)}
                  className={`flex-row items-center justify-between rounded-sm border-2 border-solid p-4 active:opacity-70 ${isSelected ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                >
                  <Text
                    className={`font-body text-sm ${isSelected ? 'text-white' : 'text-foreground'}`}
                  >
                    {skill}
                  </Text>
                  {isSelected && <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
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
          disabled={!isValid}
          className={`w-full flex-row items-center justify-center gap-2 rounded-sm border-2 border-solid py-4 ${isValid ? 'border-primary bg-primary active:opacity-80' : 'border-muted-foreground bg-muted opacity-50'}`}
        >
          <Text
            className="font-technical text-sm uppercase tracking-wider"
            style={{ color: isValid ? '#FFFFFF' : '#64748B' }}
          >
            {isValid ? 'Transmit_Proposal' : 'Awaiting_Selection'}
          </Text>
          {isValid && <Ionicons name="send" size={16} color="#FFFFFF" style={{ marginLeft: 4 }} />}
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProposeTradeScreen;
