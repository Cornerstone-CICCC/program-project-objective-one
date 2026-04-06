import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface SelectOption {
  label: string;
  value: string;
}

interface SelectModalProps {
  visible: boolean;
  title: string;
  options: SelectOption[];
  onClose: () => void;
  onSelect: (option: SelectOption) => void;
  variant?: 'default' | 'themed';
}

const SelectModal = ({
  visible,
  title,
  options,
  onClose,
  onSelect,
  variant = 'default',
}: SelectModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;

    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [options, searchQuery]);

  const handleClose = () => {
    setSearchQuery('');
    onClose();
  };

  const handleSelect = (option: SelectOption) => {
    setSearchQuery('');
    onSelect(option);
  };

  const isThemed = variant === 'themed';

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/50"
      >
        <View
          className={`h-4/5 w-full rounded-t-3xl p-6 pb-10 shadow-xl ${isThemed ? 'bg-card' : 'bg-white'}`}
        >
          {/* Header */}
          <View className="mb-4 flex-row items-center justify-between">
            <Text
              className={`font-bungee text-xl ${isThemed ? 'text-foreground' : 'text-[#0F172A]'}`}
            >
              {title}
            </Text>
            <TouchableOpacity
              onPress={handleClose}
              className={`rounded-full p-2 ${isThemed ? 'bg-muted' : 'bg-[#F1F5F9]'}`}
            >
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View
            className={`mb-4 flex-row items-center rounded-lg border px-3 ${isThemed ? 'border-border bg-background' : 'border-[#CBD5E1] bg-[#F8FAFC]'}`}
          >
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search..."
              className={`h-12 flex-1 px-2 font-body focus:outline-none ${isThemed ? 'text-foreground' : 'text-[#0F172A]'}`}
              placeholderTextColor={isThemed ? '#64748B' : '#94A3B8'}
              autoCorrect={false}
            />
          </View>

          {/* List */}
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item.value}
            showsVerticalScrollIndicator={false}
            initialNumToRender={20}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                className={`border-b py-4 ${isThemed ? 'border-border' : 'border-[#E2E8F0]'}`}
              >
                <Text
                  className={`font-body text-[15px] ${isThemed ? 'text-foreground' : 'text-[#0F172A]'}`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text
                className={`mt-10 text-center font-body ${isThemed ? 'text-muted-foreground' : 'text-[#64748B]'}`}
              >
                No results found.
              </Text>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SelectModal;
