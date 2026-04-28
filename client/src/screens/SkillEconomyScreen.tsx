import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/auth.store';
import { useCallback, useEffect, useState } from 'react';
import { getNetworkPulse } from '../api/network';

const SkillEconomyScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primaryIconColor = isDark ? '#A5B4FC' : '#4F46E5';

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

  const userOfferings: any[] = user?.offering || [];

  const getUserValuableSkill = () => {
    if (!userOfferings || userOfferings.length === 0) return 'Top';

    const firstSkill = userOfferings[0];
    const fallback =
      typeof firstSkill === 'string'
        ? firstSkill
        : (firstSkill as any).name || (firstSkill as any).skill || 'Top';

    if (!pulseData) return fallback;
    const match = userOfferings.find((o: any) => {
      const skillName = typeof o === 'string' ? o : o.name || o.skill;
      return (
        pulseData.trendingSkills.some((ts: any) => ts.skill === skillName) ||
        pulseData.arbitrageOpportunities.some((ao: any) => ao.skill === skillName)
      );
    });

    if (!match) return fallback;

    return typeof match === 'string' ? match : (match as any).name || (match as any).skill;
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={primaryIconColor} />
        <Text className="mt-4 font-technical text-sm uppercase tracking-widest text-muted-foreground">
          Loading Market Data...
        </Text>
      </View>
    );
  }

  if (error || !pulseData) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Ionicons name="warning-outline" size={48} color="#EF4444" />
        <Text className="mt-4 text-center font-body text-base font-medium text-foreground">
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setIsLoading(true);
            fetchPulseData();
          }}
          activeOpacity={0.8}
          className="mt-6 rounded-sm bg-primary px-6 py-3 shadow-sm"
        >
          <Text className="font-body text-sm font-bold uppercase tracking-wider text-white">
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
          tintColor={primaryIconColor}
          colors={[primaryIconColor as string]}
        />
      }
    >
      {/* Header */}
      <View className="mb-8 flex-row items-start justify-between">
        <View className="flex-1">
          <Text className="mb-1 font-technical text-3xl uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
            Market Insights
          </Text>
          <Text className="font-body text-sm text-muted-foreground">
            Real-time supply and demand across the network
          </Text>
        </View>

        {Platform.OS === 'web' && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onRefresh}
            disabled={isRefreshing}
            className={`ml-4 rounded-full border-2 border-border bg-card p-3 shadow-sm ${isRefreshing ? 'opacity-50' : 'active:bg-muted'}`}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color={primaryIconColor} />
            ) : (
              <Ionicons name="sync" size={20} color={primaryIconColor} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Network Pulse */}
      <View className="mb-8">
        <View className="mb-4 flex-row items-center gap-2">
          <Ionicons name="analytics" size={20} color={primaryIconColor} />
          <Text className="font-body text-sm font-bold uppercase tracking-wider text-foreground">
            Network Stats
          </Text>
        </View>
        <View className="flex-row justify-between gap-3">
          <View className="flex-1 items-center rounded-sm border-2 border-border bg-card p-4 shadow-sm">
            <Text className="mb-1 font-technical text-2xl font-bold text-foreground">
              {pulseData.networkStats.activeSwapsThisWeek}
            </Text>
            <Text className="text-center font-body text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Active Swaps
            </Text>
          </View>
          <View className="flex-1 items-center justify-center rounded-sm border-2 border-border bg-card p-4 shadow-sm">
            <Text className="mb-1 font-technical text-2xl font-bold text-primary dark:text-[#A5B4FC]">
              +{pulseData.networkStats.newNodesThisWeek}
            </Text>
            <Text className="text-center font-body text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              New Users
            </Text>
          </View>
          <View className="flex-1 items-center justify-center rounded-sm border-2 border-border bg-card p-4 shadow-sm">
            <Text className="mb-1 font-technical text-2xl font-bold text-foreground">
              {pulseData.networkStats.totalSkillsInCirculation}
            </Text>
            <Text className="text-center font-body text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              Total Skills
            </Text>
          </View>
        </View>
      </View>

      {/* Arbitrage Opportunity */}
      <View className="mb-8">
        <View className="mb-4 flex-row items-center gap-2">
          <Ionicons name="flame" size={20} color="#10B981" />
          <Text className="font-body text-sm font-bold uppercase tracking-wider text-foreground">
            High Demand Skills
          </Text>
        </View>
        <View className="rounded-sm border-2 border-border bg-card p-5 shadow-sm">
          <Text className="mb-5 font-body text-xs font-medium text-muted-foreground">
            These skills have high search volume but low availability. Perfect time to teach these!
          </Text>

          <View className="flex-col gap-6">
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
                  <View className="mb-4 flex-row items-center justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="font-body text-base font-bold text-foreground">
                        {opportunity.skill}
                      </Text>
                      <Text className="mt-0.5 font-body text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        {ratioDisplay}:1 Demand Ratio
                      </Text>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => handleSkillClick(opportunity.skill)}
                      className="flex-row items-center gap-1.5 rounded-sm bg-primary px-4 py-2 shadow-sm"
                    >
                      <Ionicons name="search" size={14} color="#FFFFFF" />
                      <Text className="font-body text-xs font-bold uppercase text-white">
                        Search
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Seeking Bar */}
                  <View className="mb-2">
                    <View className="mb-1 flex-row items-center justify-between">
                      <Text className="font-body text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Users Seeking
                      </Text>
                      <Text className="font-technical text-xs font-bold text-primary dark:text-[#A5B4FC]">
                        {opportunity.seeking}
                      </Text>
                    </View>
                    <View className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <View className="h-full bg-primary" style={{ width: `${seekingPercent}%` }} />
                    </View>
                  </View>

                  {/* Offering Bar */}
                  <View>
                    <View className="mb-1 flex-row items-center justify-between">
                      <Text className="font-body text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Users Offering
                      </Text>
                      <Text className="font-technical text-xs font-bold text-slate-500 dark:text-slate-300">
                        {opportunity.offering}
                      </Text>
                    </View>
                    <View className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                      <View
                        className="h-full bg-slate-400 dark:bg-slate-300"
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
          <Ionicons name="trending-up" size={20} color={primaryIconColor} />
          <Text className="font-body text-sm font-bold uppercase tracking-wider text-foreground">
            Trending Skills
          </Text>
        </View>
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {pulseData.trendingSkills.map((skill: any) => (
            <TouchableOpacity
              key={skill.skill}
              activeOpacity={0.7}
              onPress={() => handleSkillClick(skill.skill)}
              className="w-[48%] flex-col justify-between overflow-hidden rounded-sm border-2 border-border bg-card p-4 shadow-sm"
            >
              <View className="p-4">
                <Text
                  className="mb-3 font-body text-sm font-bold text-foreground"
                  numberOfLines={1}
                >
                  {skill.skill}
                </Text>

                <View className="mb-4 flex-row items-center gap-1 self-start rounded-sm bg-emerald-50 px-2 py-1 dark:bg-emerald-900/40">
                  <Ionicons name="trending-up" size={10} color={isDark ? '#34D399' : '#059669'} />
                  <Text className="font-technical text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                    +{skill.trend}%
                  </Text>
                </View>

                <View className="gap-1.5">
                  <View className="flex-row items-center gap-2">
                    <View className="h-2 w-2 rounded-full bg-primary" />
                    <Text className="font-body text-xs text-muted-foreground">
                      {skill.seeking} seeking
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                    <Text className="font-body text-xs text-muted-foreground">
                      {skill.offering} offering
                    </Text>
                  </View>
                </View>
              </View>

              <View className="w-full flex-row items-center justify-center gap-1 bg-primary py-2.5">
                <Ionicons name="search" size={12} color="#FFFFFF" />
                <Text className="font-body text-[10px] font-bold uppercase tracking-wider text-white">
                  Find Partners
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Personal Portfolio Valuation */}
      <View className="mb-8">
        <View className="mb-4 flex-row items-center gap-2">
          <Ionicons name="person" size={20} color={primaryIconColor} />
          <Text className="font-body text-sm font-bold uppercase tracking-wider text-foreground">
            Your Profile
          </Text>
        </View>
        <View className="rounded-sm border-2 border-border bg-card p-5 shadow-sm">
          <View className="mb-5 flex-row items-start gap-4">
            <View className="h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-indigo-50 dark:bg-indigo-900/40">
              <Ionicons name="star" size={20} color={primaryIconColor} />
            </View>
            <View className="flex-1">
              <Text className="mb-2 font-body text-base leading-relaxed text-foreground">
                Your{' '}
                <Text className="font-bold tracking-wide text-primary dark:text-[#A5B4FC]">
                  [ {getUserValuableSkill()} ]
                </Text>{' '}
                skill is highly valuable in the network right now.
              </Text>
              <Text className="font-body text-sm leading-relaxed text-muted-foreground">
                Ensure your profile and proficiency levels are up to date to maximize your swap
                opportunities.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Profile')}
            className="w-full flex-row items-center justify-center gap-2 rounded-sm bg-primary py-3 shadow-sm"
          >
            <Text className="font-body text-sm font-bold uppercase tracking-wider text-white">
              Update My Profile
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Data Terminal Footer */}
      <View className="items-center pb-6 pt-2">
        <Text className="font-body text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Live Data • Updated Hourly
        </Text>
      </View>
    </ScrollView>
  );
};

export default SkillEconomyScreen;
