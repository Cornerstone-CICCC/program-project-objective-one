import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

interface CancelTradeModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

const CANCELLATION_REASONS = [
  'Schedule conflict / Timing mismatch',
  'Partner is unresponsive',
  'Scope of work changed',
  'No longer need this swap',
  'Other',
];

const CancelTradeModal = ({ visible, onClose, onConfirm }: CancelTradeModalProps) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isReasonOverLimit = customReason.length > 500;

  useEffect(() => {
    if (visible) {
      setSelectedReason(null);
      setCustomReason('');
      setIsSubmitting(false);
    }
  }, [visible]);

  const handleConfirm = async () => {
    if (!selectedReason) return;

    const finalReason = selectedReason === 'Other' ? customReason.trim() : selectedReason;

    if (selectedReason === 'Other' && !finalReason) return;

    setIsSubmitting(true);
    try {
      await onConfirm(finalReason);
    } catch (err) {
      console.error('Cancellation failed:', err);
      setIsSubmitting(false);
    }
  };

  const isConfirmDisabled =
    !selectedReason ||
    (selectedReason === 'Other' && customReason.trim() === '') ||
    isSubmitting ||
    isReasonOverLimit;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      {/* Semi-transparent background overlay */}
      <TouchableWithoutFeedback
        onPress={() => {
          Keyboard.dismiss();
          onClose();
        }}
      >
        <View className="flex-1 justify-center bg-black/70 px-4">
          {/* Prevent touches on the modal card from closing the modal */}
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
              <View className="rounded-sm border-2 border-border bg-card shadow-xl">
                {/* Header */}
                <View className="flex-row items-center justify-between border-b border-border p-4">
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="warning" size={20} color="#EF4444" />
                    <Text className="font-technical text-base font-bold uppercase tracking-wider text-foreground">
                      Abort_Swap_Protocol
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    className="p-1 active:opacity-70"
                    disabled={isSubmitting}
                  >
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View className="p-5">
                  <Text className="mb-4 font-body text-sm text-muted-foreground">
                    Please specify the reason for terminating this trade. This provides closure and
                    helps maintain ecosystem quality.
                  </Text>

                  {/* Radio Button List */}
                  <View className="mb-4 flex-col gap-3">
                    {CANCELLATION_REASONS.map((reason) => {
                      const isSeleted = selectedReason === reason;

                      return (
                        <TouchableOpacity
                          key={reason}
                          activeOpacity={0.7}
                          onPress={() => setSelectedReason(reason)}
                          className="flex-row items-center gap-3"
                        >
                          {/* Custom Radio Circle */}
                          <View
                            className={`h-5 w-5 items-center justify-center rounded-full border-2 border-solid ${isSeleted ? 'border-primary' : 'border-muted-foreground'}`}
                          >
                            {isSeleted && <View className="h-2.5 w-2.5 rounded-full bg-primary" />}
                          </View>
                          <Text
                            className={`font-body text-sm ${isSeleted ? 'text-foreground' : 'text-muted-foreground'}`}
                          >
                            {reason}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Conditional "Other" Text Input */}
                  {selectedReason === 'Other' && (
                    <View className="mb-4">
                      <TextInput
                        value={customReason}
                        onChangeText={setCustomReason}
                        placeholder="Provide details..."
                        placeholderTextColor="#64748B"
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                        className={`rounded-sm border-2 bg-muted px-4 py-3 font-body text-sm text-foreground focus:outline-none ${isReasonOverLimit ? 'border-red-500 focus:border-red-500' : 'border-border focus:border-primary'}`}
                      />
                      <Text
                        className={`mt-1 text-right font-technical text-[10px] uppercase tracking-wider ${isReasonOverLimit ? 'font-bold text-red-500' : 'text-muted-foreground'}`}
                      >
                        {customReason.length} / 500
                      </Text>
                    </View>
                  )}
                </View>

                {/* Footer Actions */}
                <View className="flex-row border-t border-border bg-card p-4">
                  <TouchableOpacity
                    onPress={onClose}
                    disabled={isSubmitting}
                    className="flex-1 items-center justify-center rounded-sm border-2 border-border bg-card py-3 active:opacity-70"
                  >
                    <Text className="font-technical text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Return
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleConfirm}
                    disabled={isConfirmDisabled}
                    className={`flex-1 items-center justify-center rounded-sm border-2 py-3 transition-opacity ${isConfirmDisabled ? 'border-red-500/70 bg-red-500/70' : 'border-red-600 bg-red-600 active:opacity-80'}`}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="font-technical text-xs font-bold uppercase tracking-wider text-white">
                        Confirm Abort
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default CancelTradeModal;
