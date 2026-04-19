import { View, Text, useWindowDimensions, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomNavigation from '../components/BottomNavigation';
import DesktopSidebar from '../components/DesktopSidebar';
import { useNavigation } from '@react-navigation/native';
import InboxScreen from '../screens/InboxScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import SwapsScreen from '../screens/SwapsScreen';
import SkillEconomyScreen from '../screens/SkillEconomyScreen';

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View className="flex-1 flex-row bg-background">
      {isDesktop && <DesktopSidebar />}

      <View className="flex-1">
        <Tab.Navigator
          screenOptions={{ headerShown: false }}
          tabBar={(props) => (isDesktop ? null : <BottomNavigation {...props} />)}
        >
          <Tab.Screen name="Economy" component={SkillEconomyScreen} />
          <Tab.Screen name="Search" component={SearchScreen} />
          <Tab.Screen name="Swaps" component={SwapsScreen} />
          <Tab.Screen name="Inbox" component={InboxScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </View>
    </View>
  );
}
