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
          <Text className="mb-2 font-technical text-lg uppercase tracking-wider text-foreground">
            {title}
          </Text>
          <Text className="mb-8 font-body text-sm leading-relaxed text-muted-foreground">
            {message}
          </Text>

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onCancel}
              className="flex-1 items-center justify-center rounded-sm border-2 border-solid border-muted-foreground bg-transparent py-3 active:opacity-70"
            >
              <Text className="font-technical text-xs uppercase tracking-wider text-muted-foreground">
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onConfirm}
              className={`flex-1 items-center justify-center rounded-sm border-2 border-solid py-3 active:opacity-80 ${isDestructive ? 'border-red-500 bg-red-500/10' : 'border-primary bg-primary'}`}
            >
              <Text
                className={`font-technical text-xs uppercase tracking-wider ${isDestructive ? 'text-red-500' : 'text-white'}`}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmModal;
