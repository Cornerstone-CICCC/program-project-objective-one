import { useEffect, useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { checkReviewStatus, deleteRating, submitRating, updateRating } from '../api/rating';
import AlertModal from '../components/AlertModal';
import ConfirmModal from '../components/ConfirmModal';

const RatingScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primaryIconColor = isDark ? '#A5B4FC' : '#4F46E5';

  const tradeId = route.params?.tradeId;
  const partnerName = route.params?.partnerName || 'Trade Partner';
  const partnerAvatar = route.params?.partnerAvatar;

  const offeredSkill = route.params?.offering || 'Skill';
  const receivedSkill = route.params?.receiving || 'Skill';

  const [ratingId, setRatingId] = useState<string | null>(null);
  const [initialRating, setInitialRating] = useState(0);
  const [initialReview, setInitialReview] = useState('');

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');

  const [isChecking, setIsChecking] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);

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

  const isReviewOverLimit = review.length > 500;
  const hasChanges = rating !== initialRating || review.trim() !== initialReview.trim();

  const isFormValid = rating > 0 && !isReviewOverLimit;
  const canSubmit = alreadyReviewed ? hasChanges && isFormValid : isFormValid;

  useEffect(() => {
    const checkStatus = async () => {
      if (!tradeId) return;
      try {
        const status = await checkReviewStatus(tradeId);
        if (status.hasReviewed) {
          setAlreadyReviewed(true);
          setRatingId(status.review._id || status.review.id);
          setInitialRating(status.review.score);
          setInitialReview(status.review.comment || '');

          setRating(status.review.score);
          setReview(status.review.comment || '');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsChecking(false);
      }
    };

    checkStatus();
  }, [tradeId]);

  const handleSubmit = async () => {
    if (!tradeId || rating === 0) return;

    setIsSubmitting(true);
    try {
      if (alreadyReviewed && ratingId) {
        await updateRating(ratingId, {
          score: rating,
          comment: review.trim() || undefined,
        });
        setAlertConfig({
          visible: true,
          title: 'Review Updated',
          message: 'Your revised evaluation has been saved.',
          isSuccess: true,
          variant: 'success',
        });
      } else {
        await submitRating({
          trade_id: tradeId,
          score: rating,
          comment: review.trim() || undefined,
        });

        setAlertConfig({
          visible: true,
          title: 'Review Recorded',
          message: 'Thank you for helping maintain community integrity.',
          isSuccess: true,
          variant: 'success',
        });
      }
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        title: 'System Error',
        message: err.message || 'Failed to process evaluation.',
        isSuccess: false,
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!ratingId) return;

    setConfirmDeleteVisible(false);
    setIsDeleting(true);
    try {
      await deleteRating(ratingId);
      setAlertConfig({
        visible: true,
        title: 'Review Deleted',
        message: 'Your evaluation has been permanently removed.',
        isSuccess: true,
        variant: 'success',
      });
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        title: 'System Error',
        message: err.message || 'Failed to delete evaluation.',
        isSuccess: false,
        variant: 'error',
      });
      setIsDeleting(false);
    }
  };

  if (isChecking) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <ActivityIndicator size="large" color={primaryIconColor} />
        <Text className="mt-4 text-center font-technical text-sm uppercase tracking-wider text-muted-foreground">
          Checking Records...
        </Text>
      </View>
    );
  }

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
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="rounded-sm p-1 active:bg-muted"
            disabled={isSubmitting || isDeleting}
          >
            <Ionicons name="close" size={28} color="#64748B" />
          </TouchableOpacity>

          <View>
            <Text className="font-technical text-xl uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
              Rate Your Swap
            </Text>
            <Text className="font-body text-xs text-muted-foreground">
              Log your experience to maintain community integrity.
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Target Card */}
        <View className="mb-6 overflow-hidden rounded-sm border-2 border-solid border-border bg-card shadow-sm">
          <View className="flex-row items-center gap-4 p-4">
            <View className="h-14 w-14 overflow-hidden rounded-sm border-2 border-border bg-muted">
              <Image
                source={{ uri: partnerAvatar || 'https://placehold.co/150' }}
                className="h-full w-full"
                resizeMode="contain"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-1 font-body text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Swap Partner
              </Text>
              <Text className="font-body text-lg font-bold text-foreground">{partnerName}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-2 border-t-2 border-border bg-slate-50 px-4 py-3 dark:bg-slate-800/50">
            <Ionicons name="sync" size={14} color="#64748B" />
            <Text
              className="font-technical text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
              numberOfLines={1}
            >
              <Text className="text-foreground">{offeredSkill}</Text>
              {'  '}↔{'  '}
              <Text className="text-foreground">{receivedSkill}</Text>
            </Text>
          </View>
        </View>

        {alreadyReviewed && (
          <View className="mb-6 flex-row items-center gap-2 rounded-sm border-2 border-solid border-primary bg-muted p-4">
            <Ionicons name="information-circle" size={24} color={primaryIconColor} />
            <Text className="flex-1 font-body text-sm font-bold text-foreground">
              You are currently editing your existing evaluation.
            </Text>
          </View>
        )}

        {/* Star Rating System */}
        <View className="mb-8 items-center">
          <Text className="mb-4 font-body text-sm font-bold uppercase tracking-wider text-foreground">
            Overall Rating
          </Text>
          <View className="flex-row gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                disabled={isSubmitting || isDeleting}
                className="p-2 active:opacity-70"
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? '#EAB308' : '#64748b'}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Text Review */}
        <View className="mb-8">
          <Text className="mb-3 font-body text-sm font-bold uppercase tracking-wider text-foreground">
            Review Details <Text className="text-muted-foreground">(Optional)</Text>
          </Text>
          <TextInput
            value={review}
            onChangeText={setReview}
            placeholder="How was the swap?"
            placeholderTextColor="#64748B"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            editable={!isSubmitting && !isDeleting}
            className={`min-h-[120px] w-full rounded-sm border-2 border-solid bg-card p-4 font-body text-foreground focus:outline-none ${isReviewOverLimit ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`}
          />
          <Text
            className={`mt-1 text-right font-technical text-[10px] uppercase tracking-wider ${isReviewOverLimit ? 'text-destructive font-bold' : 'text-muted-foreground'}`}
          >
            {review.length} / 500
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Footer */}

      <View
        className="flex-row gap-3 border-t-2 border-solid border-border bg-card p-4 shadow-lg"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {alreadyReviewed && (
          <TouchableOpacity
            onPress={() => setConfirmDeleteVisible(true)}
            disabled={isSubmitting || isDeleting}
            className="border-destructive items-center justify-center rounded-sm border-2 border-solid bg-red-50 px-4 active:bg-red-100 dark:bg-red-900/20 dark:active:bg-red-900/40"
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#EF4444" />
            ) : (
              <Ionicons name="trash" size={24} color="#EF4444" />
            )}
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={!canSubmit || isSubmitting || isDeleting}
          activeOpacity={0.8}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-sm py-4 shadow-sm ${canSubmit && !isSubmitting && !isDeleting ? 'bg-primary' : 'bg-slate-400 opacity-70 dark:bg-slate-600'}`}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text className="font-body font-bold text-white">
              {alreadyReviewed ? 'Update Review' : 'Submit Review'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ConfirmModal
        visible={confirmDeleteVisible}
        title="Delete Review"
        message="Are you sure you want to permanently delete this rating? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDestructive={true}
        onCancel={() => setConfirmDeleteVisible(false)}
        onConfirm={handleDelete}
      />

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.variant}
        onClose={() => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          if (alertConfig.isSuccess) {
            navigation.goBack();
          }
        }}
      />
    </KeyboardAvoidingView>
  );
};

export default RatingScreen;
