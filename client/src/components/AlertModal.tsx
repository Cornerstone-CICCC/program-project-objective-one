import { Modal, Text, TouchableOpacity, View } from 'react-native';

interface AlertModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  variant?: 'default' | 'error' | 'success';
  onClose: () => void;
}

const AlertModal = ({
  visible,
  title,
  message,
  buttonText = 'Acknowledge',
  variant = 'default',
  onClose,
}: AlertModalProps) => {
  const getTheme = () => {
    switch (variant) {
      case 'error':
        return {
          title: 'text-red-500',
          border: 'border-red-500/50',
          button: 'bg-red-600',
        };
      case 'success':
        return {
          title: 'text-green-500',
          border: 'border-green-500/50',
          button: 'bg-green-600',
        };
      default:
        return {
          title: 'text-foreground',
          border: 'border-border',
          button: 'bg-primary',
        };
    }
  };

  const theme = getTheme();

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/60 px-6">
        <View
          className={`w-full max-w-sm rounded-sm border-2 border-solid bg-card p-6 shadow-xl ${theme.border}`}
        >
          <Text className={`mb-2 font-technical text-lg uppercase tracking-wider ${theme.title}`}>
            {title}
          </Text>

          <Text className="mb-8 font-body text-sm leading-relaxed text-muted-foreground">
            {message}
          </Text>

          <TouchableOpacity
            onPress={onClose}
            className={`w-full items-center justify-center rounded-sm py-3 active:opacity-80 ${theme.button}`}
          >
            <Text className="font-technical text-xs uppercase tracking-wider text-white">
              {buttonText}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;
