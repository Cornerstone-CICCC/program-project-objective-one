import {
  Image,
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { nearbyUsers } from '../data/mockData';

const isFabricEnabled = global._IS_FABRIC;

if (
  Platform.OS === 'android' &&
  !isFabricEnabled &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const DiscoveryMapScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [selectedUser, setSelectedUser] = useState(nearbyUsers[0]);

  return (
    <View className="flex-1 bg-background">
      {/* Map Container */}
      <View className="relative flex-1 overflow-hidden bg-muted">
        {/* Pseudo-Grid Pattern */}
        <View className="absolute inset-0 opacity-20" pointerEvents="none">
          {/* Vertical Lines */}
          {[10, 30, 50, 70, 90].map((left) => (
            <View
              key={`v-${left}`}
              className="absolute bottom-0 top-0 w-[1px] bg-[#64748B]"
              style={{ left: `${left}%` }}
            />
          ))}
          {/* Horizontal Lines */}
          {[10, 30, 50, 70, 90].map((top) => (
            <View
              key={`h-${top}`}
              className="absolute left-0 right-0 h-[1px] bg-[#64748B]"
              style={{ top: `${top}%` }}
            />
          ))}
        </View>

        {/* Map Pins */}
        {nearbyUsers.map((user, index) => {
          const isSelected = selectedUser.id === user.id;

          return (
            <TouchableOpacity
              key={user.id}
              activeOpacity={0.7}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSelectedUser(user);
              }}
              className="absolute -translate-x-1/2 -translate-y-full items-center justify-center"
              style={{
                left: `${45 + index * 12}%`,
                top: `${35 + index * 15}%`,
                zIndex: isSelected ? 10 : 1,
              }}
            >
              <Ionicons
                name="location"
                size={isSelected ? 48 : 36}
                color={isSelected ? '#4f46e5' : '#64748b'}
              />
              {isSelected && (
                <View className="absolute bottom-1 h-2 w-4 rounded-full bg-primary opacity-30" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Quick View Card */}
      <View
        className="absolute bottom-0 left-0 right-0 p-4"
        style={{ paddingBottom: Math.max(insets.bottom, 24) + 60 }}
      >
        <View className="rounded-sm border-2 border-solid border-border bg-card shadow-lg">
          <View className="p-4">
            <View className="mb-4 flex-row items-center gap-4">
              <Image
                source={{ uri: selectedUser.avatar }}
                className="h-16 w-16 rounded-sm border-2 border-solid border-muted-foreground bg-muted"
                resizeMode="cover"
              />
              <View className="flex-1">
                <Text className="font-body text-lg font-medium text-foreground">
                  {selectedUser.name}
                </Text>
                <Text className="font-body text-sm text-muted-foreground">
                  0.{(selectedUser.id.length % 9) + 1} mi away
                </Text>
              </View>
              <View className="rounded-sm bg-accent px-3 py-1">
                <Text className="font-technical text-sm font-bold uppercase text-accent-foreground">
                  {selectedUser.matchPercentage}% Match
                </Text>
              </View>
            </View>

            <View className="mb-3">
              <Text className="mb-2 font-technical text-[10px] uppercase tracking-wider text-muted-foreground">
                Offering
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {selectedUser.offering.slice(0, 3).map((skill) => (
                  <View key={`offer-${skill}`} className="rounded-sm bg-primary px-3 py-1">
                    <Text className="font-body text-xs text-white">{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="mb-5">
              <Text className="mb-2 font-technical text-[10px] uppercase tracking-wider text-muted-foreground">
                Seeking
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {selectedUser.seeking.slice(0, 3).map((skill) => (
                  <View
                    key={`seek-${skill}`}
                    className="rounded-sm border-2 border-solid border-accent bg-transparent px-3 py-1"
                  >
                    <Text className="font-body text-xs text-foreground">{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('UserProfile', { userId: selectedUser.id })}
              className="w-full items-center justify-center rounded-sm bg-primary py-3 active:opacity-80"
            >
              <Text className="font-technical text-sm uppercase tracking-wider text-white">
                View_Full_Profile
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default DiscoveryMapScreen;
