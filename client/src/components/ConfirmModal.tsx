import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal = ({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onCancel}>
      {/* Dark Overlay */}
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        {/* Modal Box */}
        <View className="w-full max-w-sm rounded-sm border-2 border-solid border-border bg-card p-6 shadow-xl">
          <Text className="mb-2 font-body text-lg font-bold text-foreground">{title}</Text>
          <Text className="mb-8 font-body text-sm leading-relaxed text-muted-foreground">
            {message}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.8}
              className="flex-1 items-center justify-center rounded-sm border-2 border-solid border-muted-foreground bg-card py-3 shadow-sm"
            >
              <Text className="font-body text-sm font-bold text-foreground">{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              activeOpacity={0.8}
              className={`flex-1 items-center justify-center rounded-sm border-2 border-solid py-3 shadow-sm ${isDestructive ? 'border-red-800 bg-red-600' : 'border-primary bg-primary'}`}
            >
              <Text className="font-body text-sm font-bold text-white">{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;
