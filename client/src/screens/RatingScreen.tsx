import { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { nearbyUsers } from '../data/mockData';

const RatingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const targetUserId = route.params?.partnerId;
  const partner = nearbyUsers.find((u) => u.id === targetUserId) || nearbyUsers[0];

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const handleSubmit = () => {
    console.log('Submitting review:', { rating, review, partner: partner.name });
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      {/* Header */}
      <View
        className="border-b-2 border-solid border-border bg-card px-6 pb-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="mb-4 self-start rounded-sm p-1 active:bg-muted"
        >
          <Ionicons name="close" size={28} color="#64748B" />
        </TouchableOpacity>
        <Text className="font-technical text-2xl uppercase tracking-wider text-foreground">
          Trade_Evaluation
        </Text>
        <Text className="mt-2 font-body text-sm text-muted-foreground">
          Log your experience to maintain community integrity.
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Target Card */}
        <View className="mb-8 flex-row items-center gap-4 rounded-sm border-2 border-solid border-border bg-muted p-4">
          <Image
            source={{ uri: partner.avatar }}
            className="h-14 w-14 rounded-sm border-2 border-solid border-muted-foreground bg-card"
            resizeMode="cover"
          />
          <View>
            <Text className="mb-1 font-technical text-[10px] uppercase tracking-wider text-muted-foreground">
              Evaluating_Partner
            </Text>
            <Text className="font-body text-lg font-medium text-foreground">{partner.name}</Text>
          </View>
        </View>

        {/* Star Rating System */}
        <View className="mb-8 items-center">
          <Text className="mb-4 font-technical text-xs uppercase tracking-wider text-foreground">
            Overall_Rating
          </Text>
          <View className="flex-row gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                className="p-2 active:opacity-70"
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? '#4f46e5' : '#64748b'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Text Review */}
        <View className="mb-8">
          <Text className="mb-3 font-technical text-xs uppercase tracking-wider text-foreground">
            Detailed_Report (Optional)
          </Text>
          <TextInput
            value={review}
            onChangeText={setReview}
            placeholder="How was the swap?"
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            className="min-h-[120px] w-full rounded-sm border-2 border-solid border-border bg-card p-4 font-body text-foreground focus:border-primary"
          />
        </View>
      </ScrollView>

      {/* Fixed Footer */}
      <View
        className="border-t-2 border-solid border-border bg-card p-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={rating === 0}
          className={`w-full flex-row items-center justify-center rounded-sm border-2 border-solid py-4 ${rating > 0 ? 'border-primary bg-primary active:opacity-80' : 'border-muted-foreground bg-muted opacity-50'}`}
        >
          <Text
            className="font-technical text-sm uppercase tracking-wider"
            style={{ color: rating > 0 ? '#FFFFFF' : '#64748B' }}
          >
            {rating > 0 ? 'Submit_Evaluation' : 'Select_Rating_To_Proceed'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default RatingScreen;
