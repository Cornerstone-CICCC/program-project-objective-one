import { View, Text, useWindowDimensions, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomNavigation from '../components/BottomNavigation';
import DesktopSidebar from '../components/DesktopSidebar';
import { useNavigation } from '@react-navigation/native';
import InboxScreen from '../screens/InboxScreen';
import ProfileScreen from '../screens/ProfileScreen';

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View className="bg-background flex-1 items-center justify-center">
    <Text className="text-foreground text-2xl font-medium">{title}</Text>
  </View>
);

const MapScreen = () => <PlaceholderScreen title="Map View" />;
const SearchScreen = () => <PlaceholderScreen title="Search Skills" />;
const SwapsScreen = () => <PlaceholderScreen title="My Swaps" />;

const Tab = createBottomTabNavigator();

export function MainTabNavigator() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View className="bg-background flex-1 flex-row">
      {isDesktop && <DesktopSidebar />}

      <View className="flex-1">
        <Tab.Navigator
          screenOptions={{ headerShown: false }}
          tabBar={(props) => (isDesktop ? null : <BottomNavigation {...props} />)}
        >
          <Tab.Screen name="Map" component={MapScreen} />
          <Tab.Screen name="Search" component={SearchScreen} />
          <Tab.Screen name="Swaps" component={SwapsScreen} />
          <Tab.Screen name="Inbox" component={InboxScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
      </View>
    </View>
  );
}
