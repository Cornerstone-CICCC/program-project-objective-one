import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AccountEditScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('Morgan');
  const [lastName, setLastName] = useState('Rivers');
  const [email, setEmail] = useState('morgan.rivers@example.com');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSave = () => {
    console.log('Deploying changes...');
    navigation.geBack();
  };

  const handleDeleteAccount = () => {
    console.log('Deleting account...');
    setShowDeleteConfirm(false);
    navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
  };

  return (
    <View className="flex-1 bg-background">
      {/* Header Container */}
      <View
        className="border-b border-border bg-card p-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="rounded-sm p-2 active:opacity-70"
          >
            <Ionicons name="arrow-back" size={24} color="#64748B" />
          </TouchableOpacity>
          <View>
            <Text className="font-technical text-lg uppercase tracking-wider text-primary">
              Identity_Module_01
            </Text>
            <Text className="mt-1 font-technical text-xs uppercase tracking-wider text-muted-foreground">
              Account_Configuration_Interface
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 40 }}
      >
        {/* Personal Infomation */}
        <View className="mb-8 space-y-4">
          <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-accent">
            Personal_Identification
          </Text>

          {/* First Name */}
          <View className="mb-4 rounded-sm border-2 border-solid border-border bg-card p-4">
            <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
              First_Name
            </Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              className="w-full rounded-sm border-2 border-solid border-border bg-background px-3 py-2 font-body text-foreground focus:border-primary"
              placeholderTextColor="#64748B"
            />
          </View>

          {/* Last Name */}
          <View className="mb-4 rounded-sm border-2 border-solid border-border bg-card p-4">
            <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
              Last_Name
            </Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              className="w-full rounded-sm border-2 border-solid border-border bg-background px-3 py-2 font-body text-foreground focus:border-primary"
              placeholderTextColor="#64748B"
            />
          </View>

          {/* Email */}
          <View className="mb-4 rounded-sm border-2 border-solid border-border bg-card p-4">
            <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
              Email_Address
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="w-full rounded-sm border-2 border-solid border-border bg-background px-3 py-2 font-body text-foreground focus:border-primary"
              placeholderTextColor="#64748B"
            />
          </View>
        </View>

        {/* Security Override */}
        <View className="mb-8">
          <Text className="mb-4 font-technical text-xs uppercase tracking-wider text-accent">
            Security_Override
          </Text>

          <View className="rounded-sm border-2 border-solid border-accent bg-card p-4">
            <View className="mb-4">
              <Text className="mb-1 font-technical text-xs uppercase tracking-wider text-muted-foreground">
                Password_Authentication
              </Text>
              <Text className="font-body text-xs text-muted-foreground">
                Update your security credentials
              </Text>
            </View>

            {/* Current Password */}
            <View className="mb-4">
              <Text className="text-destructive mb-2 font-technical text-xs uppercase tracking-wider">
                Current_Password
              </Text>
              <View className="relative justify-center">
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                  className="border-destructive w-full rounded-sm border-2 border-solid bg-background px-3 py-2 pr-10 font-body text-foreground focus:border-primary"
                  placeholder="Enter current password"
                  placeholderTextColor="#64748B"
                />
                <TouchableOpacity
                  onPress={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 p-1"
                >
                  <Ionicons name={showCurrent ? 'eye-off' : 'eye'} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View className="mb-4">
              <Text className="text-destructive mb-2 font-technical text-xs uppercase tracking-wider">
                New_Password
              </Text>
              <View className="relative justify-center">
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  className="border-destructive w-full rounded-sm border-2 border-solid bg-background px-3 py-2 pr-10 font-body text-foreground focus:border-primary"
                  placeholder="Enter new password"
                  placeholderTextColor="#64748B"
                />
                <TouchableOpacity
                  onPress={() => setShowNew(!showNew)}
                  className="absolute right-3 p-1"
                >
                  <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View className="mb-4">
              <Text className="text-destructive mb-2 font-technical text-xs uppercase tracking-wider">
                Confirm_New_Password
              </Text>
              <View className="relative justify-center">
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  className="border-destructive w-full rounded-sm border-2 border-solid bg-background px-3 py-2 pr-10 font-body text-foreground focus:border-primary"
                  placeholder="Confirm current password"
                  placeholderTextColor="#64748B"
                />
                <TouchableOpacity
                  onPress={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 p-1"
                >
                  <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Password Requirements */}
            <View className="mt-2 rounded-sm border-2 border-solid border-border bg-background p-3">
              <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
                Security_Requirements
              </Text>
              <Text className="font-body text-xs leading-relaxed text-muted-foreground">
                • Minimum 8 characters{'\n'}• At least one uppercase letter{'\n'}• At least one
                number{'\n'}• At least one special character
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mb-8">
          <Text className="mb-4 font-technical text-xs uppercase tracking-wider text-red-600 dark:text-red-500">
            Danger_Zone
          </Text>
          <TouchableOpacity
            onPress={() => setShowDeleteConfirm(true)}
            className="w-full flex-row items-center justify-between rounded-sm border-2 border-solid border-[#ef4444] bg-card p-4 active:opacity-80"
          >
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-sm bg-red-100 dark:bg-red-950">
                <Ionicons name="trash" size={20} color="#ef4444" />
              </View>
              <View>
                <Text className="font-body font-medium text-red-600 dark:text-red-500">
                  Delete Account
                </Text>
                <Text className="mt-0.5 font-body text-xs text-red-600/70 dark:text-red-500/70">
                  Permanently delete your account
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View
        className="flex-row gap-3 border-t border-border bg-card p-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity
          onPress={handleSave}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-sm bg-primary py-3 active:opacity-80"
        >
          <Ionicons name="save" size={20} color="#FFFFFF" />
          <Text className="font-technical text-sm uppercase tracking-wider text-primary-foreground">
            Deploy_Changes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-sm border-2 border-solid border-border bg-transparent py-3 active:bg-muted"
        >
          <Ionicons name="close" size={20} color="#64748B" />
          <Text className="font-technical text-sm uppercase tracking-wider text-foreground">
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Modal */}
      <Modal
        transparent={true}
        visible={showDeleteConfirm}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-6">
          <View className="w-full max-w-md rounded-sm border-2 border-red-600 bg-card p-6 shadow-lg">
            <View className="mb-4 flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-sm bg-red-100 dark:bg-red-950">
                <Ionicons name="trash" size={24} color="#ef4444" />
              </View>
              <Text className="font-technical text-lg font-bold uppercase tracking-wider text-red-600 dark:text-red-500">
                Delete_Account
              </Text>
            </View>

            <Text className="mb-6 font-body text-sm leading-relaxed text-foreground">
              Are you absolutely sure? This action cannot be undone. This will permanently delete
              your account, remove all your skills, trades, and messages from our servers.
            </Text>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={handleDeleteAccount}
                className="flex-1 rounded-sm bg-red-600 py-3 active:bg-red-700"
              >
                <Text className="text-center font-technical text-sm font-bold uppercase tracking-wider text-white">
                  Delete_Forever
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-sm bg-muted py-3 active:opacity-70"
              >
                <Text className="text-center font-technical text-sm font-bold uppercase tracking-wider text-foreground">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default AccountEditScreen;
