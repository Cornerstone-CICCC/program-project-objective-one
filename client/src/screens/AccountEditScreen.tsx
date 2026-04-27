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

  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    current: false,
    new: false,
    confirm: false,
  });

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

  const isBasicInfoValid = firstName.trim() !== '' && lastName.trim() !== '' && email.trim() !== '';

  const isAttemptingPasswordChange =
    currentPassword !== '' || newPassword !== '' || confirmPassword !== '';

  const isPasswordValid = isAttemptingPasswordChange
    ? currentPassword !== '' &&
      newPassword !== '' &&
      confirmPassword !== '' &&
      newPassword === confirmPassword &&
      passwordScore >= 3
    : true;

  const isFormValid = isBasicInfoValid && isPasswordValid;

  const handleBackendError = (errorMessage: string) => {
    const msg = errorMessage.toLowerCase();
    let title = 'Update Failed';
    let displayMessage = errorMessage;

    if (msg.includes('email') || msg.includes('duplicate') || msg.includes('exists')) {
      setFieldErrors((prev) => ({ ...prev, email: true }));
      title = 'Email Unavailable';
      displayMessage = 'This email is already in use by another account.';
    } else if (
      msg.includes('current password') ||
      msg.includes('incorrect password') ||
      msg.includes('match')
    ) {
      setFieldErrors((prev) => ({ ...prev, current: true }));
      title = 'Security Error';
      displayMessage = 'Your current password is incorrect.';
    } else if (msg.includes('password')) {
      setFieldErrors((prev) => ({ ...prev, new: true }));
    }

    setAlertConfig({
      visible: true,
      title,
      message: displayMessage,
      isSuccess: false,
      variant: 'error',
    });
  };

  const handleSave = async () => {
    setFieldErrors({ email: false, current: false, new: false, confirm: false });

    if (!isFormValid) return;

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
          title: 'Update Successful',
          message: 'Your account has been updated successfully.',
          isSuccess: true,
          variant: 'success',
        });
      } else {
        const errorMsg = result?.message || 'Please check your inputs and try again.';
        handleBackendError(errorMsg);
      }
    } catch (err: any) {
      console.error('Account update error:', err);
      handleBackendError(err.message || 'An unexpected error occurred.');
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
        title: 'System Error',
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
            <Text className="font-technical text-lg uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
              Edit Profile
            </Text>
            <Text className="mt-1 font-body text-xs text-muted-foreground">
              Manage your personal information and security
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
          <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
            Personal Information
          </Text>

          {/* First Name */}
          <View className="mb-4 rounded-sm border-2 border-border bg-card p-4">
            <Text className="mb-2 font-body text-sm font-medium text-foreground">First Name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              className="w-full rounded-sm border-2 border-border bg-background px-3 py-2 font-body text-foreground focus:border-primary focus:outline-none"
              placeholderTextColor="#64748B"
              editable={!isLoading}
            />
          </View>

          {/* Last Name */}
          <View className="mb-4 rounded-sm border-2 border-border bg-card p-4">
            <Text className="mb-2 font-body text-sm font-medium text-foreground">Last Name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              className="w-full rounded-sm border-2 border-border bg-background px-3 py-2 font-body text-foreground focus:border-primary focus:outline-none"
              placeholderTextColor="#64748B"
              editable={!isLoading}
            />
          </View>

          {/* Email */}
          <View className="mb-4 rounded-sm border-2 border-border bg-card p-4">
            <Text
              className={`mb-2 font-body text-sm font-medium ${fieldErrors.email ? 'text-destructive' : 'text-foreground'}`}
            >
              Email Address
            </Text>
            <TextInput
              value={email}
              onChangeText={(val) => {
                setEmail(val);
                if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: true }));
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              className={`w-full rounded-sm border-2 bg-background px-3 py-2 font-body text-foreground focus:border-primary focus:outline-none ${fieldErrors.email ? 'border-destructive' : 'border-border'}`}
              placeholderTextColor="#64748B"
              editable={!isLoading}
            />
          </View>
        </View>

        {/* Security Override */}
        <View className="mb-8">
          <Text className="mb-4 font-technical text-xs uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
            Security Settings
          </Text>

          <View className="rounded-sm border-2 border-border bg-card p-4">
            <View className="mb-4">
              <Text className="mb-1 font-body text-sm font-medium text-foreground">
                Change Password
              </Text>
              <Text className="font-body text-xs text-muted-foreground">
                Update your account password to keep it secure
              </Text>
            </View>

            {/* Current Password */}
            <View className="mb-4">
              <Text
                className={`mb-2 font-body text-sm font-medium ${fieldErrors.current ? 'text-destructive' : 'text-foreground'}`}
              >
                Current Password
              </Text>
              <View className="relative justify-center">
                <TextInput
                  value={currentPassword}
                  onChangeText={(val) => {
                    setCurrentPassword(val);
                    if (fieldErrors.current)
                      setFieldErrors((prev) => ({ ...prev, current: false }));
                  }}
                  secureTextEntry={!showCurrent}
                  className={`w-full rounded-sm border-2 bg-background px-3 py-2 pr-10 font-body text-foreground focus:border-primary focus:outline-none ${fieldErrors.current ? 'border-destructive' : 'border-border'}`}
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
              <Text
                className={`mb-2 font-body text-sm font-medium ${fieldErrors.new ? 'text-destructive' : 'text-foreground'}`}
              >
                New Password
              </Text>
              <View className="relative justify-center">
                <TextInput
                  value={newPassword}
                  onChangeText={(val) => {
                    setNewPassword(val);
                    if (fieldErrors.new) setFieldErrors((prev) => ({ ...prev, new: false }));
                  }}
                  secureTextEntry={!showNew}
                  className={`w-full rounded-sm border-2 bg-background px-3 py-2 pr-10 font-body text-foreground focus:border-primary focus:outline-none ${fieldErrors.new ? 'border-destructive' : 'border-border'}`}
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
                    {passwordScore < 3 ? 'Weak Password' : 'Strong Password'}
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password */}
            <View className="mb-4">
              <Text
                className={`mb-2 font-body text-sm ${fieldErrors.confirm ? 'text-destructive' : 'text-foreground'}`}
              >
                Confirm New Password
              </Text>
              <View className="relative justify-center">
                <TextInput
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (fieldErrors.confirm)
                      setFieldErrors((prev) => ({ ...prev, confirm: false }));
                  }}
                  secureTextEntry={!showConfirm}
                  className={`w-full rounded-sm border-2 bg-background px-3 py-2 pr-10 font-body text-foreground focus:border-primary focus:outline-none ${fieldErrors.confirm ? 'border-destructive' : 'border-border'}`}
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
            <View className="mt-2 rounded-sm border-2 border-border bg-background p-3">
              <Text className="mb-1 font-body text-xs font-bold text-foreground">
                Security Requirements
              </Text>
              <Text className="font-body text-xs leading-relaxed text-muted-foreground">
                Our system uses dynamic entropy checking. Please use long phrases, unpredictable
                words, or a mix of characters to ensure your account remains secure.
              </Text>
            </View>
          </View>
        </View>

        {/* Danger Zone */}
        <View className="mb-8">
          <Text className="text-destructive mb-4 font-technical text-xs uppercase tracking-wider">
            Danger Zone
          </Text>
          <TouchableOpacity
            onPress={() => setShowDeleteConfirm(true)}
            className="border-destructive w-full flex-row items-center justify-between rounded-sm border-2 bg-card p-4 active:opacity-80"
          >
            <View className="flex-row items-center gap-3">
              <View className="border-destructive h-10 w-10 items-center justify-center rounded-sm border-2 bg-background">
                <Ionicons name="trash" size={20} color="#ef4444" />
              </View>
              <View>
                <Text className="text-destructive font-body font-bold">Delete Account</Text>
                <Text className="text-destructive mt-0.5 font-body text-xs opacity-80">
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
        className="flex-row gap-3 border-t border-border bg-card p-4 shadow-md"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={isLoading}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-sm border-2 border-border bg-card py-3 active:bg-muted"
        >
          <Ionicons name="close" size={20} color="#64748B" />
          <Text className="font-body font-semibold text-foreground">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isLoading || !isFormValid}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-sm py-3 shadow-sm ${isLoading || !isFormValid ? 'bg-slate-400 opacity-70 dark:bg-slate-600' : 'bg-primary active:opacity-90'}`}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="save" size={20} color="#FFFFFF" />
          )}
          <Text className="font-body font-bold text-primary-foreground">
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={showDeleteConfirm}
        title="Delete_Account"
        message="Are you absolutely sure? This action cannot be undone. This will permanently delete your account, and remove all your skills, trades, and messages from our servers."
        confirmText="Delete Forever"
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
