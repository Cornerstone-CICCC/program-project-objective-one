// import {
//   Image,
//   LayoutAnimation,
//   Platform,
//   Text,
//   TouchableOpacity,
//   UIManager,
//   View,
// } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { useState } from 'react';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { Ionicons } from '@expo/vector-icons';
// import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// import { nearbyUsers } from '../data/mockData';

// declare var global: any;

// const isFabricEnabled = global._IS_FABRIC;

// if (
//   Platform.OS === 'android' &&
//   !isFabricEnabled &&
//   UIManager.setLayoutAnimationEnabledExperimental
// ) {
//   UIManager.setLayoutAnimationEnabledExperimental(true);
// }

// const DiscoveryMapScreen = () => {
//   const navigation = useNavigation<any>();
//   const insets = useSafeAreaInsets();

//   const [selectedUser, setSelectedUser] = useState(nearbyUsers[0]);

//   if (Platform.OS === 'web') {
//     return (
//       <View className="flex-1 items-center justify-center bg-background p-6">
//         <View className="w-full max-w-md items-center justify-center rounded-sm border-2 border-dashed border-border bg-muted p-10">
//           <Ionicons name="map-outline" size={64} color="#64748B" />
//           <Text className="mt-6 text-center font-technical text-lg uppercase tracking-wider text-foreground">
//             Map View Unavailable
//           </Text>
//           <Text className="mt-2 text-center font-body text-sm text-muted-foreground">
//             The Interactive Discovery Map requires native mobile GPS and native map SDKs. Please
//             open the Swappa app on iOS or Android to view nearby swaps!
//           </Text>
//           <TouchableOpacity
//             onPress={() => navigation.goBack()}
//             className="mt-8 rounded-sm bg-primary px-6 py-3 active:opacity-80"
//           >
//             <Text className="font-technical text-sm font-bold uppercase text-white">
//               Return to Matrix
//             </Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   return (
//     <View className="flex-1 bg-background">
//       {/* Map Container */}
//       <MapView
//         className="h-full w-full flex-1"
//         initialRegion={{
//           latitude: 49.2827,
//           longitude: -123.1207,
//           latitudeDelta: 0.08,
//           longitudeDelta: 0.08,
//         }}
//         showsUserLocation={true}
//         showsCompass={false}
//         showsMyLocationButton={false}
//         toolbarEnabled={false}
//       >
//         {/* Map Pins */}
//         {nearbyUsers.map((user, index) => {
//           const isSeleted = selectedUser.id === user.id;
//           // Mock Location
//           const mockLat = 49.2827 + index * 0.008 * (index % 2 === 0 ? 1 : -1);
//           const mockLng = -123.1207 + index * 0.008 * (index % 3 === 0 ? 1 : -1);

//           return (
//             <Marker
//               key={user.id}
//               coordinate={{ latitude: mockLat, longitude: mockLng }}
//               onPress={() => {
//                 LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//                 setSelectedUser(user);
//               }}
//               pinColor={isSeleted ? '#4f46e5' : '#64748b'}
//               zIndex={isSeleted ? 10 : 1}
//             />
//           );
//         })}
//       </MapView>

//       {/* Quick View Card */}
//       <View
//         className="absolute bottom-0 left-0 right-0 p-4"
//         style={{ paddingBottom: Math.max(insets.bottom, 24) + 60 }}
//         pointerEvents="box-none"
//       >
//         <View className="rounded-sm border-2 border-solid border-border bg-card shadow-lg">
//           <View className="p-4">
//             <View className="mb-4 flex-row items-center gap-4">
//               <Image
//                 source={{ uri: selectedUser.avatar }}
//                 className="h-16 w-16 rounded-sm border-2 border-solid border-muted-foreground bg-muted"
//                 resizeMode="cover"
//               />
//               <View className="flex-1">
//                 <Text className="font-body text-lg font-medium text-foreground">
//                   {selectedUser.name}
//                 </Text>
//                 <Text className="font-body text-sm text-muted-foreground">
//                   0.{(selectedUser.id.length % 9) + 1} mi away
//                 </Text>
//               </View>
//               <View className="rounded-sm bg-accent px-3 py-1">
//                 <Text className="font-technical text-sm font-bold uppercase text-accent-foreground">
//                   {selectedUser.matchPercentage}% Match
//                 </Text>
//               </View>
//             </View>

//             <View className="mb-3">
//               <Text className="mb-2 font-technical text-[10px] uppercase tracking-wider text-muted-foreground">
//                 Offering
//               </Text>
//               <View className="flex-row flex-wrap gap-2">
//                 {selectedUser.offering.slice(0, 3).map((skill) => (
//                   <View key={`offer-${skill}`} className="rounded-sm bg-primary px-3 py-1">
//                     <Text className="font-body text-xs text-white">{skill}</Text>
//                   </View>
//                 ))}
//               </View>
//             </View>

//             <View className="mb-5">
//               <Text className="mb-2 font-technical text-[10px] uppercase tracking-wider text-muted-foreground">
//                 Seeking
//               </Text>
//               <View className="flex-row flex-wrap gap-2">
//                 {selectedUser.seeking.slice(0, 3).map((skill) => (
//                   <View
//                     key={`seek-${skill}`}
//                     className="rounded-sm border-2 border-solid border-accent bg-transparent px-3 py-1"
//                   >
//                     <Text className="font-body text-xs text-foreground">{skill}</Text>
//                   </View>
//                 ))}
//               </View>
//             </View>

//             <TouchableOpacity
//               onPress={() => navigation.navigate('UserProfile', { userId: selectedUser.id })}
//               className="w-full items-center justify-center rounded-sm bg-primary py-3 active:opacity-80"
//             >
//               <Text className="font-technical text-sm uppercase tracking-wider text-white">
//                 View_Full_Profile
//               </Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </View>
//   );
// };

// export default DiscoveryMapScreen;

import { StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.015,
          longitudeDelta: 0.0121,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});
