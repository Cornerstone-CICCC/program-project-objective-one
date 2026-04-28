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
  buttonText = 'Got it',
  variant = 'default',
  onClose,
}: AlertModalProps) => {
  const getTheme = () => {
    switch (variant) {
      case 'error':
        return {
          title: 'text-red-600 dark:text-red-400',
          border: 'border-red-200 dark:border-red-900/50',
          button: 'bg-red-500',
        };
      case 'success':
        return {
          title: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-200 dark:border-emerald-900/50',
          button: 'bg-emerald-500',
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
          <Text
            className={`mb-2 font-technical text-lg font-bold uppercase tracking-wider ${theme.title}`}
          >
            {title}
          </Text>

          <Text className="mb-8 font-body text-sm leading-relaxed text-muted-foreground">
            {message}
          </Text>

          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            className={`w-full items-center justify-center rounded-sm py-3 shadow-sm ${theme.button}`}
          >
            <Text className="font-body text-sm font-bold text-white">{buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;
