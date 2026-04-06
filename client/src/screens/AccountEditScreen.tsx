import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/auth.store';
import { updateProfile, deleteAccount as apiDeleteAccount } from '../api/user';
import zxcvbn from 'zxcvbn';
import ConfirmModal from '../components/ConfirmModal';
import AlertModal from '../components/AlertModal';

const AccountEditScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const { user, setAuth, logout } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.firstname || '');
  const [lastName, setLastName] = useState(user?.lastname || '');
  const [email, setEmail] = useState(user?.email || '');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [passwordScore, setPasswordScore] = useState(0);

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

  useEffect(() => {
    let score = 0;
    if (newPassword) {
      const evaluation = zxcvbn(newPassword);
      score = evaluation.score;
      setPasswordScore(score);
    } else {
      setPasswordScore(0);
    }
  }, [newPassword]);

  const getBarWidth = () => {
    if (!newPassword) return '0%';
    if (passwordScore <= 1) return '25%';
    if (passwordScore === 2) return '50%';
    if (passwordScore === 3) return '75%';
    return '100%';
  };

  const getBarColor = () => {
    if (!newPassword) return 'transparent';
    if (passwordScore <= 1) return '#ef4444'; // Red
    if (passwordScore === 2) return '#f97316'; // Orange
    if (passwordScore === 3) return '#eab308'; // Yellow
    return '#22c55e'; // Green
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setAlertConfig({
        visible: true,
        title: 'Validation_Error',
        message: 'Name and email fields cannot be empty.',
        isSuccess: false,
        variant: 'error',
      });
      return;
    }

    const isAttemptingPasswordChange = currentPassword || newPassword || confirmPassword;

    if (isAttemptingPasswordChange) {
      if (!currentPassword) {
        setAlertConfig({
          visible: true,
          title: 'Security_Error',
          message: 'You must enter your current password to set a new one.',
          isSuccess: false,
          variant: 'error',
        });
        return;
      }
      if (!newPassword) {
        setAlertConfig({
          visible: true,
          title: 'Validation_Error',
          message: 'You must enter a new password.',
          isSuccess: false,
          variant: 'error',
        });
        return;
      }
      if (!confirmPassword) {
        setAlertConfig({
          visible: true,
          title: 'Validation_Error',
          message: 'You must confirm your new password.',
          isSuccess: false,
          variant: 'error',
        });
        return;
      }
      if (newPassword !== confirmPassword) {
        setAlertConfig({
          visible: true,
          title: 'Security_Error',
          message: 'New passwords do not match.',
          isSuccess: false,
          variant: 'error',
        });
        return;
      }
      if (passwordScore < 3) {
        setAlertConfig({
          visible: true,
          title: 'Weak_Signature',
          message: 'Please enter a stronger new password to continue.',
          isSuccess: false,
          variant: 'error',
        });
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await updateProfile({
        firstname: firstName,
        lastname: lastName,
        email: email,
        currPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      if (result && result.user) {
        setAuth(result.user);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        setAlertConfig({
          visible: true,
          title: 'Update_Successful',
          message: 'Account updated successfully.',
          isSuccess: true,
          variant: 'success',
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'Update_Failed',
          message: 'Please check your inputs and try again.',
          isSuccess: false,
          variant: 'error',
        });
      }
    } catch (err: any) {
      console.error('Account update error:', err);
      setAlertConfig({
        visible: true,
        title: 'System_Error',
        message: err.message || 'An unexpected error occurred.',
        isSuccess: false,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      const success = await apiDeleteAccount();

      if (success) {
        setShowDeleteConfirm(false);
        logout();
      } else {
        setAlertConfig({
          visible: true,
          title: 'Error',
          message: 'Failed to delete account. Please try again.',
          isSuccess: false,
          variant: 'error',
        });
      }
    } catch (err) {
      console.error('Delete account error:', err);
      setAlertConfig({
        visible: true,
        title: 'System_Error',
        message: 'An unexpected error occurred.',
        isSuccess: false,
        variant: 'error',
      });
    } finally {
      setIsLoading(false);
    }
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
              editable={!isLoading}
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
              editable={!isLoading}
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
              editable={!isLoading}
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
              <Text className="text-destructive mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
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
                  editable={!isLoading}
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
              <Text className="text-destructive mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
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
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowNew(!showNew)}
                  className="absolute right-3 p-1"
                >
                  <Ionicons name={showNew ? 'eye-off' : 'eye'} size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              {newPassword.length > 0 && (
                <View className="mt-2">
                  <View className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <View
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: getBarWidth(), backgroundColor: getBarColor() }}
                    />
                  </View>
                  <Text className="mt-1 text-right font-technical text-[10px] uppercase tracking-wider text-muted-foreground">
                    {passwordScore < 3 ? 'Weak_Signature' : 'Strong_Signature'}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View className="mb-4">
              <Text className="text-destructive mb-2 font-technical text-xs uppercase tracking-wider text-muted-foreground">
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
                  editable={!isLoading}
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
                Our system uses dynamic entropy checking. Use long phrases, unpredictable words, or
                a mix of characters to achieve a strong security signature.
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
          disabled={isLoading}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-sm bg-primary py-3 ${isLoading ? 'opacity-50' : 'active:opacity-80'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="save" size={20} color="#FFFFFF" />
          )}
          <Text className="font-technical text-sm uppercase tracking-wider text-primary-foreground">
            {isLoading ? 'Deploying...' : 'Deploy_Changes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={isLoading}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-sm border-2 border-solid border-border bg-transparent py-3 active:bg-muted"
        >
          <Ionicons name="close" size={20} color="#64748B" />
          <Text className="font-technical text-sm uppercase tracking-wider text-foreground">
            Cancel
          </Text>
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete_Account"
        message="Are you absolutely sure? This action cannot be undone. This will permanently delete your account, remove all your skills, trades, and messages from our servers."
        confirmText="Delete_Forever"
        cancelText="Cancel"
        isDestructive={true}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteConfirm(false)}
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
    </View>
  );
};

export default AccountEditScreen;
