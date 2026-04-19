import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth.store';
import { useCallback, useEffect, useState } from 'react';
import { getNetworkPulse } from '../api/network';

const SkillEconomyScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const [pulseData, setPulseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPulseData = async () => {
    try {
      setError(null);
      const data = await getNetworkPulse();
      if (data) {
        setPulseData(data);
      } else {
        setError('Could not connect to the network.');
      }
    } catch (err) {
      setError('Failed to load market intelligence.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPulseData();
  }, []);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPulseData();
  }, []);

  const handleSkillClick = (skill: string) => {
    navigation.navigate('Search', { prefilledSkill: skill });
  };

  const userOfferings = user?.offering || [];

  const getUserValuableSkill = () => {
    const fallback = userOfferings.length > 0 ? userOfferings[0] : 'Top';

    if (!pulseData || userOfferings.length === 0) return fallback;

    return (
      userOfferings.find(
        (skill: string) =>
          pulseData.trendingSkills.some((ts: any) => ts.skill === skill) ||
          pulseData.arbitrageOpportunities.some((ao: any) => ao.skill === skill),
      ) || fallback
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#06b6d4" />
        <Text className="mt-4 font-technical text-sm uppercase tracking-widest text-muted-foreground">
          Establishing Uplink...
        </Text>
      </View>
    );
  }

  if (error || !pulseData) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Ionicons name="warning-outline" size={48} color="#ef4444" />
        <Text className="mt-4 text-center font-body text-base text-foreground">{error}</Text>
        <TouchableOpacity
          onPress={() => {
            setIsLoading(true);
            fetchPulseData();
          }}
          className="mt-6 rounded-sm bg-primary px-6 py-3"
        >
          <Text className="font-technical text-sm font-medium uppercase tracking-wider text-white">
            Retry Connection
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 24),
        paddingBottom: Math.max(insets.bottom, 100),
        paddingHorizontal: 16,
      }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#06b6d4"
          colors={['#06b6d4']}
        />
      }
    >
      {/* Header */}
      <View className="mb-8 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="mb-2 font-technical text-3xl uppercase tracking-wider text-foreground">
            Skill_Economy
          </Text>
          <Text className="font-body text-sm text-muted-foreground">
            Real-time market intelligence for the Swappa network
          </Text>
        </View>

        {Platform.OS === 'web' && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRefresh}
            disabled={isRefreshing}
            className={`ml-4 rounded-full bg-muted p-3 ${isRefreshing ? 'opacity-50' : ''}`}
          >
            <Ionicons name="sync" size={20} color="#06b6d4" />
          </TouchableOpacity>
        )}
      </View>

      {/* Network Pulse */}
      <View className="mb-8">
        <View className="mb-4 flex-row items-center gap-2">
          <Ionicons name="analytics" size={20} color="#06b6d4" />
          <Text className="font-technical text-sm uppercase tracking-wider text-muted-foreground">
            Network_Pulse
          </Text>
        </View>
        <View className="flex-row justify-between gap-3">
          <View className="flex-1 rounded-sm border border-border bg-card p-4">
            <Text className="mb-1 font-technical text-3xl font-bold text-accent">
              {pulseData.networkStats.activeSwapsThisWeek}
            </Text>
            <Text className="font-technical text-[10px] uppercase tracking-wide text-muted-foreground">
              Active Swaps
            </Text>
          </View>
          <View className="flex-1 rounded-sm border border-border bg-card p-4">
            <Text className="mb-1 font-technical text-3xl font-bold text-primary">
              +{pulseData.networkStats.newNodesThisWeek}
            </Text>
            <Text className="font-technical text-[10px] uppercase tracking-wide text-muted-foreground">
              New Nodes
            </Text>
          </View>
          <View className="flex-1 rounded-sm border border-border bg-card p-4">
            <Text className="mb-1 font-technical text-3xl font-bold text-foreground">
              {pulseData.networkStats.totalSkillsInCirculation}
            </Text>
            <Text className="font-technical text-[10px] uppercase tracking-wide text-muted-foreground">
              Total Skills
            </Text>
          </View>
        </View>
      </View>

      {/* Arbitrage Opportunity */}
      <View className="mb-8">
        <View className="mb-4 flex-row items-center gap-2">
          <Ionicons name="star" size={20} color="#f59e0b" />
          <Text className="font-technical text-sm uppercase tracking-wider text-muted-foreground">
            Arbitrage_Opportunity
          </Text>
        </View>
        <View className="rounded-sm border border-amber-500 bg-card p-5">
          <Text className="mb-5 font-technical text-[10px] uppercase tracking-wide text-muted-foreground">
            High demand / Low supply • Be the solution
          </Text>

          <View className="gap-6">
            {pulseData.arbitrageOpportunities.map((opportunity: any) => {
              const maxScale = Math.max(opportunity.seeking, 10);
              const seekingPercent = Math.min(100, (opportunity.seeking / maxScale) * 100);
              const offeringPercent = Math.min(100, (opportunity.offering / maxScale) * 100);
              const rawRatio =
                opportunity.offering > 0
                  ? opportunity.seeking / opportunity.offering
                  : opportunity.seeking;
              const ratioDisplay = rawRatio.toFixed(1);

              return (
                <View key={opportunity.skill}>
                  <View className="mb-3 flex-row items-center justify-between">
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSkillClick(opportunity.skill)}
                      className="flex-row items-center gap-2 rounded-sm bg-muted px-3 py-1.5"
                    >
                      <Ionicons name="search" size={14} color="#06b6d4" />
                      <Text className="font-body text-sm font-medium text-foreground">
                        {opportunity.skill}
                      </Text>
                    </TouchableOpacity>
                    <Text className="font-technical text-xs font-bold uppercase text-amber-500">
                      {ratioDisplay}:1 Ratio
                    </Text>
                  </View>

                  {/* Seeking Bar */}
                  <View className="mb-2">
                    <View className="mb-1 flex-row items-center justify-between">
                      <Text className="font-body text-xs text-muted-foreground">Seeking</Text>
                      <Text className="font-technical text-xs font-bold text-accent">
                        {opportunity.seeking}
                      </Text>
                    </View>
                    <View className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <View className="h-full bg-accent" style={{ width: `${seekingPercent}%` }} />
                    </View>
                  </View>

                  {/* Offering Bar */}
                  <View>
                    <View className="mb-1 flex-row items-center justify-between">
                      <Text className="font-body text-xs text-muted-foreground">Offering</Text>
                      <Text className="font-technical text-xs font-bold text-primary">
                        {opportunity.offering}
                      </Text>
                    </View>
                    <View className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <View
                        className="h-full bg-primary"
                        style={{ width: `${offeringPercent}%` }}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </View>

      {/* Trending Nodes */}
      <View className="mb-8">
        <View className="mb-4 flex-row items-center gap-2">
          <Ionicons name="trending-up" size={20} color="#4f46e5" />
          <Text className="font-technical text-sm uppercase tracking-wider text-muted-foreground">
            Treding_Nodes
          </Text>
        </View>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {pulseData.trendingSkills.map((skill: any) => (
            <TouchableOpacity
              key={skill.skill}
              activeOpacity={0.7}
              onPress={() => handleSkillClick(skill.skill)}
              className="w-[48%] rounded-sm border border-border bg-card p-4"
            >
              <View className="mb-3 flex-row items-start justify-between">
                <Text className="flex-1 font-body text-sm font-medium text-foreground">
                  {skill.skill}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#64748B" />
              </View>

              <View className="mb-3 flex-row items-center gap-1 self-start rounded-sm bg-muted px-2 py-1">
                <Ionicons name="trending-up" size={10} color="#4f46e5" />
                <Text className="font-technical text-[10px] font-bold text-primary">
                  +{skill.trend}%
                </Text>
              </View>

              <View className="gap-1">
                <View className="flex-row items-center gap-1">
                  <View className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <Text className="font-body text-xs text-muted-foreground">
                    {skill.seeking} seeking
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <View className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <Text className="font-body text-xs text-muted-foreground">
                    {skill.offering} offering
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Personal Portfolio Valuation */}
      <View className="mb-8">
        <View className="mb-4 flex-row items-center gap-2">
          <Ionicons name="flash-outline" size={20} color="#06b6d4" />
          <Text className="font-technical text-sm uppercase tracking-wider text-muted-foreground">
            Your_Portfolio
          </Text>
        </View>
        <View className="rounded-sm border border-primary bg-card p-5">
          <View className="mb-5 flex-row items-start gap-4">
            <View className="h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-muted">
              <Ionicons name="flash-outline" size={20} color="#4f46e5" />
            </View>
            <View className="flex-1">
              <Text className="mb-2 font-body text-base text-foreground">
                Your{' '}
                <Text className="font-bold tracking-wide text-primary">
                  [ {getUserValuableSkill()} ]
                </Text>{' '}
                skill is in high demand right now.
              </Text>
              <Text className="font-body text-sm text-muted-foreground">
                Make sure your profile is up to date to maximize your swap opportunities.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
            className="w-full flex-row items-center justify-center gap-2 rounded-sm bg-primary py-3 shadow-sm"
          >
            <Text className="font-technical text-sm font-medium uppercase tracking-wider text-white">
              Update My Offerings
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Data Terminal Footer */}
      <View className="items-center pb-6 pt-2">
        <Text className="font-technical text-[10px] uppercase tracking-widest text-muted-foreground">
          Live_Data • Updated_Hourly
        </Text>
      </View>
    </ScrollView>
  );
};

export default SkillEconomyScreen;
