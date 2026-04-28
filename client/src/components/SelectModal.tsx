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

const SelectModal = ({ visible, title, options, onClose, onSelect }: SelectModalProps) => {
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

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/60"
      >
        <View className="h-4/5 w-full rounded-t-2xl bg-card p-6 pb-10 shadow-xl">
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between border-b-2 border-border pb-4">
            <Text className="font-body text-xl font-bold uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
              {title}
            </Text>
            <TouchableOpacity onPress={handleClose} className="p-1 active:opacity-70">
              <Ionicons name="close" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="mb-4 flex-row items-center rounded-sm border-2 border-solid border-border bg-muted px-3">
            <Ionicons name="search" size={18} color="#64748B" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search..."
              className="h-12 flex-1 px-2 font-body text-sm text-foreground focus:border-primary focus:outline-none"
              placeholderTextColor="#64748B"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
                <Ionicons name="close-circle" size={16} color="#64748B" />
              </TouchableOpacity>
            )}
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
                activeOpacity={0.7}
                className="flex-row items-center border-b-2 border-border px-2 py-4"
              >
                <Text className="font-body text-sm font-medium text-foreground">{item.label}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Ionicons name="search-outline" size={32} color="#64748B" />
                <Text className="mt-4 font-body text-sm font-bold text-muted-foreground">
                  No results found.
                </Text>
              </View>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default SelectModal;
