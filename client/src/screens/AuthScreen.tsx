import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Defs, Line, Path, Pattern, Rect } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { login, signup } from '../api/auth';
import zxcvbn from 'zxcvbn';
import { useAuthStore } from '../store/auth.store';
import AlertModal from '../components/AlertModal';
import { Country, State, City } from 'country-state-city';
import SelectModal from '../components/SelectModal';

const AuthScreen = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const navigation = useNavigation<any>();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  const [fieldErrors, setFieldErrors] = useState({
    email: false,
    username: false,
    password: false,
    location: false,
  });

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: 'default' | 'error' | 'success';
  }>({
    visible: false,
    title: '',
    message: '',
    variant: 'default',
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    lat: null as number | null,
    lng: null as number | null,
    city: '',
    province: '',
    provinceCode: '',
    country: '',
    countryCode: '',
  });

  const countryOptions = useMemo(() => {
    return Country.getAllCountries().map((c) => ({
      label: c.name,
      value: c.isoCode,
    }));
  }, []);

  const provinceOptions = useMemo(() => {
    if (!formData.countryCode) return [];
    return State.getStatesOfCountry(formData.countryCode).map((s) => ({
      label: s.name,
      value: s.isoCode,
    }));
  }, [formData.countryCode]);

  const cityOptions = useMemo(() => {
    if (!formData.countryCode || !formData.provinceCode) return [];
    return City.getCitiesOfState(formData.countryCode, formData.provinceCode).map((c) => ({
      label: c.name,
      value: c.name,
      lat: c.latitude,
      lng: c.longitude,
    }));
  }, [formData.countryCode, formData.provinceCode]);

  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    if (mode === newMode) return;

    setMode(newMode);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFieldErrors({
      email: false,
      username: false,
      password: false,
      location: false,
    });
    setFormData((prev) => ({
      ...prev,
      password: '',
      confirmPassword: '',
    }));
  };

  const handleBackendError = (errorMessage: string) => {
    const msg = errorMessage.toLowerCase();
    let title = mode === 'login' ? 'Login Failed' : 'Signup Failed';
    let displayMessage = errorMessage;

    // Check Duplicate Username (Signup)
    if (msg.includes('username') || msg.includes('taken')) {
      setFieldErrors((prev) => ({ ...prev, username: true }));
      title = 'Username Unavailable';
      displayMessage = 'This username is already taken. Please choose another.';
    }
    // Check Duplicate Email (Signup)
    else if (msg.includes('email') && msg.includes('registered')) {
      setFieldErrors((prev) => ({ ...prev, email: true }));
      title = 'Email Unavailable';
      displayMessage = 'This email is already registered. Please log in instead.';
    }
    // Check Incorrect Credentials (Login)
    else if (msg.includes('incorrect') || (msg.includes('email') && msg.includes('password'))) {
      setFieldErrors((prev) => ({ ...prev, email: true, password: true }));
      title = 'Access Denied';
      displayMessage = 'Incorrect email or password. Please try again.';
    } else if (msg.includes('password')) {
      setFieldErrors((prev) => ({ ...prev, password: true }));
    }

    setAlertConfig({
      visible: true,
      title,
      message: displayMessage,
      variant: 'error',
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFieldErrors({ email: false, username: false, password: false, location: false });

    try {
      if (mode === 'signup') {
        const strength = zxcvbn(formData.password);
        if (strength.score < 3) {
          setFieldErrors((prev) => ({ ...prev, password: true }));
          setAlertConfig({
            visible: true,
            title: 'Weak Password',
            message: 'Please create a stronger password before continuing.',
            variant: 'error',
          });
          setIsSubmitting(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          setFieldErrors((prev) => ({ ...prev, password: true }));
          setAlertConfig({
            visible: true,
            title: 'Password Mismatch',
            message: 'Your passwords do not match.',
            variant: 'error',
          });
          setIsSubmitting(false);
          return;
        }

        let finalLat = formData.lat;
        let finalLng = formData.lng;

        if (!formData.city.trim() || !formData.province.trim() || !formData.country.trim()) {
          setFieldErrors((prev) => ({ ...prev, location: true }));
          setAlertConfig({
            visible: true,
            title: 'Missing Information',
            message: 'Please select your Country, Province, and City.',
            variant: 'error',
          });
          setIsSubmitting(false);
          return;
        }

        if (!finalLat || !finalLng) {
          finalLat = 49.2827;
          finalLng = -123.1207;
        }

        const signupPayload = {
          firstname: formData.firstName.trim(),
          lastname: formData.lastName.trim(),
          username: formData.username.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password,
          lat: finalLat,
          lng: finalLng,
          city: formData.city.trim(),
          province: formData.provinceCode || formData.province.trim(),
          country: formData.countryCode || formData.country.trim(),
        };

        const result = await signup(signupPayload);

        if (result && result.user) {
          setIsSuccess(true);
          setSuccessMessage(`Welcome to Swappa, ${result.user.firstname}!`);
          setTimeout(() => {
            setAuth(result.user, result.token);
          }, 1500);
        } else {
          handleBackendError(result?.message || 'Please check your information and try again.');
        }
      } else {
        // Handle Login
        const cleanEmail = formData.email.trim().toLowerCase();

        const result = await login({ email: cleanEmail, password: formData.password });

        if (result && result.user) {
          setIsSuccess(true);
          setSuccessMessage(`Welcome back, ${result.user.firstname}!`);
          setTimeout(() => {
            setAuth(result.user, result.token);
          }, 1500);
        } else {
          handleBackendError(result?.message || 'Incorrect email or password.');
        }
      }
    } catch (err: any) {
      console.error(err);
      handleBackendError(err.message || 'Something went wrong connecting to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordStrength = formData.password ? zxcvbn(formData.password) : { score: 0 };
  const getMeterColor = (level: number) => {
    if (!formData.password) return 'bg-[#E2E8F0]';
    if (passwordStrength.score < level) return 'bg-[#E2E8F0]';

    if (passwordStrength.score === 0) return 'bg-red-500';
    if (passwordStrength.score === 1) return 'bg-orange-500';
    if (passwordStrength.score === 2) return 'bg-yellow-500';
    if (passwordStrength.score === 3) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getMeterText = () => {
    if (!formData.password) return 'Enter a password';
    if (passwordStrength.score < 3) return 'Too Weak (Keep going!)';
    if (passwordStrength.score === 3) return 'Strong (Good to go)';
    return 'Very Strong (Excellent)';
  };

  const isFormValid =
    mode === 'login'
      ? formData.email.trim() && formData.password !== ''
      : formData.firstName.trim() !== '' &&
        formData.lastName.trim() !== '' &&
        formData.username.trim() !== '' &&
        formData.email.trim() !== '' &&
        formData.password.trim() !== '' &&
        formData.confirmPassword.trim() !== '' &&
        formData.country.trim() !== '' &&
        formData.province.trim() !== '' &&
        formData.city.trim() !== '';

  return (
    <View className="flex-1 flex-row bg-[#F8FAFC]">
      {/* Desktop Brand Panel - Left Side */}
      {isDesktop && (
        <View className="relative h-full w-2/5 overflow-hidden bg-[#1E40AF]">
          {/* Background Pattern */}
          <View className="absolute inset-0 opacity-10" pointerEvents="none">
            <Svg width="100%" height="100%">
              <Defs>
                <Pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <Circle cx="20" cy="20" r="1" fill="white" />
                </Pattern>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#grid)" />
            </Svg>
          </View>

          {/* Architectural Schematic Overlay */}
          <View className="absolute inset-0 opacity-20">
            <Svg width="100%" height="100%" viewBox="0 0 500 800">
              <Line
                x1="50"
                y1="100"
                x2="450"
                y2="100"
                stroke="white"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <Line
                x1="50"
                y1="200"
                x2="450"
                y2="200"
                stroke="white"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <Line
                x1="100"
                y1="50"
                x2="100"
                y2="750"
                stroke="white"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <Line
                x1="300"
                y1="50"
                x2="300"
                y2="750"
                stroke="white"
                strokeWidth="1"
                strokeDasharray="5,5"
              />
              <Circle cx="250" cy="400" r="80" stroke="white" strokeWidth="2" fill="none" />
              <Rect
                x="150"
                y="300"
                width="200"
                height="200"
                stroke="white"
                strokeWidth="1"
                fill="none"
              />
            </Svg>
          </View>

          {/* Brand Content */}
          <View className="relative z-10 flex-1 items-start justify-center p-16">
            <Svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-8">
              <Rect x="2" y="2" width="76" height="76" stroke="white" strokeWidth="3" fill="none" />
              <Path d="M24 30 L40 30 L40 24 L56 34 L40 44 L40 38 L24 38 Z" fill="white" />
              <Path d="M56 50 L40 50 L40 56 L24 46 L40 36 L40 42 L56 42 Z" fill="#EAB308" />
              <Rect x="6" y="6" width="8" height="8" fill="#EAB308" />
              <Rect x="66" y="66" width="8" height="8" fill="#EAB308" />
              <Circle cx="20" cy="60" r="2" fill="white" opacity="0.7" />
              <Circle cx="60" cy="20" r="2" fill="white" opacity="0.7" />
            </Svg>

            <Text className="mb-4 font-bungee text-5xl font-bold uppercase tracking-wider text-white">
              Swappa
            </Text>
            <View className="space-y-2 opacity-90">
              <Text className="font-mono text-lg tracking-wider text-white">
                Build. Trade. Grow.
              </Text>
              <Text className="font-mono text-sm uppercase tracking-wider text-white opacity-75">
                Join the Community
              </Text>
            </View>
            <View className="absolute left-8 top-8 h-8 w-8 border-l-2 border-t-2 border-[#EAB308]" />
            <View className="absolute bottom-8 right-8 h-8 w-8 border-b-2 border-r-2 border-[#EAB308]" />
          </View>
        </View>
      )}

      {/* Main Auth Form - Right Side */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="relative flex-1 items-center justify-center p-4 sm:p-6"
      >
        {/* Mobile Grid Pattern */}
        <View className="absolute inset-0 opacity-30" pointerEvents="none">
          <Svg width="100%" height="100%">
            <Defs>
              <Pattern id="dotgrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <Circle cx="10" cy="10" r="0.5" fill="#94A3B8" />
              </Pattern>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#dotgrid)" />
          </Svg>
        </View>

        {/* Auth Card Container */}
        <ScrollView
          className="w-full max-w-md"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}
          showsVerticalScrollIndicator={Platform.OS === 'web' ? true : false}
        >
          {/* Mobile Logo */}
          {!isDesktop && (
            <View className="mb-8 flex-col items-center">
              <Svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="mb-4">
                <Rect
                  x="1"
                  y="1"
                  width="58"
                  height="58"
                  stroke="#1E40AF"
                  strokeWidth="2"
                  fill="none"
                />
                <Path
                  d="M18 22.5 L30 22.5 L30 18 L42 25.5 L30 33 L30 28.5 L18 28.5 Z"
                  fill="#1E40AF"
                />
                <Path
                  d="M42 37.5 L30 37.5 L30 42 L18 34.5 L30 27 L30 31.5 L42 31.5 Z"
                  fill="#EAB308"
                />
                <Rect x="4" y="4" width="6" height="6" fill="#EAB308" />
                <Rect x="50" y="50" width="6" height="6" fill="#EAB308" />
              </Svg>
              <Text className="font-bungee text-2xl font-bold uppercase tracking-wider text-[#0F172A]">
                Swappa
              </Text>
            </View>
          )}

          {/* Secure Access Card */}
          <View className="rounded border-2 border-[#CBD5E1] bg-white p-6 shadow-lg sm:p-8">
            {/* Mode Switcher */}
            <View className="mb-6 flex-row gap-2 rounded border-2 border-[#CBD5E1] bg-[#F1F5F9] p-1">
              <TouchableOpacity
                onPress={() => handleModeSwitch('login')}
                className="flex-1 items-center justify-center rounded px-4 py-2.5"
                style={{ backgroundColor: mode === 'login' ? '#EAB308' : 'transparent' }}
              >
                <Text
                  className={`font-mono text-sm font-bold uppercase tracking-wider ${mode === 'login' ? 'text-[#0F172A]' : 'text-[#64748B]'}`}
                >
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleModeSwitch('signup')}
                className="flex-1 items-center justify-center rounded px-4 py-2.5"
                style={{ backgroundColor: mode === 'signup' ? '#EAB308' : 'transparent' }}
              >
                <Text
                  className={`font-mono text-sm font-bold uppercase tracking-wider ${mode === 'signup' ? 'text-[#0F172A]' : 'text-[#64748B]'}`}
                >
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View className="flex-col gap-4">
              {/* Conditional Signup Fields */}
              {mode === 'signup' && (
                <>
                  <View className="flex flex-col gap-4 sm:flex-row">
                    <View className="flex-1">
                      <Text className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#475569]">
                        First Name
                      </Text>
                      <TextInput
                        value={formData.firstName}
                        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                        className="h-12 w-full rounded border-2 border-[#94A3B8] bg-white px-4 font-body text-[#0F172A] focus:border-[#1E40AF] focus:outline-none"
                        placeholder="Enter your first name"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#475569]">
                        Last Name
                      </Text>
                      <TextInput
                        value={formData.lastName}
                        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                        className="h-12 w-full rounded border-2 border-[#94A3B8] bg-white px-4 font-body text-[#0F172A] focus:border-[#1E40AF] focus:outline-none"
                        placeholder="Enter your last name"
                        placeholderTextColor="#94A3B8"
                      />
                    </View>
                  </View>

                  <View>
                    <Text
                      className={`mb-2 font-mono text-xs font-bold uppercase tracking-wider ${fieldErrors.username ? 'text-red-500' : 'text-[#475569]'}`}
                    >
                      Display Name
                    </Text>
                    <TextInput
                      value={formData.username}
                      onChangeText={(text) => {
                        setFormData({ ...formData, username: text });
                        if (fieldErrors.username)
                          setFieldErrors((prev) => ({ ...prev, username: false }));
                      }}
                      autoCapitalize="none"
                      className={`h-12 w-full rounded border-2 bg-white px-4 font-body text-[#0F172A] focus:border-[#1E40AF] focus:outline-none ${fieldErrors.username ? 'border-red-500' : 'border-[#94A3B8]'}`}
                      placeholder="Enter your display name"
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View
                    className={`mb-2 mt-4 border-t pt-4 ${fieldErrors.location ? 'border-red-500' : 'border-[#E2E8F0]'}`}
                  >
                    <View className="mb-4 flex-row items-center justify-between">
                      <Text
                        className={`font-mono text-xs font-bold uppercase tracking-wider ${fieldErrors.location ? 'text-red-500' : 'text-[#475569]'}`}
                      >
                        Your Location
                      </Text>
                    </View>

                    <View className="flex-col gap-3">
                      {/* Country Dropdown */}
                      <TouchableOpacity
                        onPress={() => setShowCountryModal(true)}
                        className={`h-12 w-full flex-row items-center justify-between rounded border-2 bg-white px-4 ${fieldErrors.location ? 'border-red-500' : 'border-[#94A3B8]'}`}
                      >
                        <Text
                          className={`font-body ${formData.country ? 'text-[#0F172A]' : 'text-[#94A3B8]'}`}
                        >
                          {formData.country || 'Select Country'}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#64748B" />
                      </TouchableOpacity>

                      <View className="w-full flex-col gap-4 sm:flex-row">
                        {/* Province Dropdown */}
                        <View className="flex-1">
                          {formData.countryCode && provinceOptions.length === 0 ? (
                            <TextInput
                              value={formData.province}
                              onChangeText={(text) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  province: text,
                                  provinceCode: '',
                                }))
                              }
                              placeholder="Type Region"
                              placeholderTextColor="#64748B"
                              className={`h-12 w-full rounded-md border-2 bg-white px-4 font-body text-xs text-[#0F172A] focus:border-[#1E40AF] focus:outline-none ${fieldErrors.location ? 'border-red-500' : 'border-[#CBD5E1]'}`}
                            />
                          ) : (
                            <TouchableOpacity
                              onPress={() => setShowProvinceModal(true)}
                              disabled={!formData.countryCode}
                              className={`h-12 w-full flex-row items-center justify-between rounded border-2 px-4 ${!formData.countryCode ? 'bg-[#F1F5F9] opacity-50' : 'bg-white'} ${fieldErrors.location ? 'border-red-500' : 'border-[#94A3B8]'}`}
                            >
                              <Text
                                className={`font-body ${formData.province ? 'text-[#0F172A]' : 'text-[#94A3B8]'} flex-1`}
                                numberOfLines={1}
                              >
                                {formData.province || 'Select Region'}
                              </Text>
                              <Ionicons name="chevron-down" size={16} color="#64748B" />
                            </TouchableOpacity>
                          )}
                        </View>

                        {/* City Dropdown */}
                        <View className="flex-1">
                          {(formData.countryCode && !formData.provinceCode) ||
                          (formData.provinceCode && cityOptions.length === 0) ? (
                            <TextInput
                              value={formData.city}
                              onChangeText={(text) =>
                                setFormData((prev) => ({ ...prev, city: text }))
                              }
                              placeholder="Type City"
                              placeholderTextColor="#64748B"
                              className={`h-12 w-full rounded-md border-2 bg-white px-4 font-body text-xs text-[#0F172A] focus:border-[#1E40AF] focus:outline-none ${fieldErrors.location ? 'border-red-500' : 'border-[#CBD5E1]'}`}
                            />
                          ) : (
                            <TouchableOpacity
                              onPress={() => setShowCityModal(true)}
                              disabled={!formData.provinceCode}
                              className={`h-12 w-full flex-row items-center justify-between rounded border-2 px-4 ${!formData.provinceCode ? 'bg-[#F1F5F9] opacity-50' : 'bg-white'} ${fieldErrors.location ? 'border-red-500' : 'border-[#94A3B8]'}`}
                            >
                              <Text
                                className={`font-body ${formData.city ? 'text-[#0F172A]' : 'text-[#94A3B8]'} flex-1`}
                                numberOfLines={1}
                              >
                                {formData.city || 'Select City'}
                              </Text>
                              <Ionicons name="chevron-down" size={16} color="#64748B" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                </>
              )}

              {/* Always Visible: Email & Password */}
              <View>
                <Text
                  className={`mb-2 font-mono text-xs font-bold uppercase tracking-wider ${fieldErrors.email ? 'text-red-500' : 'text-[#475569]'}`}
                >
                  Email Address
                </Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData({ ...formData, email: text });
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: false }));
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="off"
                  className={`h-12 w-full rounded border-2 bg-white px-4 font-body text-[#0F172A] focus:border-[#1E40AF] focus:outline-none ${fieldErrors.email ? 'border-red-500' : 'border-[#94A3B8]'}`}
                  placeholder="user@example.com"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View>
                <Text
                  className={`mb-2 font-mono text-xs font-bold uppercase tracking-wider ${fieldErrors.password ? 'text-red-500' : 'text-[#475569]'}`}
                >
                  Password
                </Text>
                <View className="relative justify-center">
                  <TextInput
                    value={formData.password}
                    onChangeText={(text) => {
                      setFormData({ ...formData, password: text });
                      if (fieldErrors.password)
                        setFieldErrors((prev) => ({ ...prev, password: false }));
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    className={`h-12 w-full rounded border-2 bg-white px-4 font-body text-[#0F172A] focus:border-[#1E40AF] focus:outline-none ${fieldErrors.password ? 'border-red-500' : 'border-[#94A3B8]'}`}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1"
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off' : 'eye'}
                      size={20}
                      color={fieldErrors.password ? '#ef4444' : '#64748B'}
                    />
                  </TouchableOpacity>
                </View>

                {mode === 'signup' && (
                  <View className="mt-2">
                    <View className="flex-row gap-1">
                      {[0, 1, 2, 3, 4].map((level) => (
                        <View
                          key={level}
                          className={`h-1.5 flex-1 rounded-sm ${getMeterColor(level)}`}
                        />
                      ))}
                    </View>
                    <Text
                      className={`mt-1 text-right font-mono text-[10px] uppercase tracking-wider ${!formData.password ? 'text-[#64748B]' : passwordStrength.score < 3 ? 'text-red-500' : 'text-green-600'}`}
                    >
                      {getMeterText()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Conditional Confirm Password */}
              {mode === 'signup' && (
                <View>
                  <Text
                    className={`mb-2 font-mono text-xs font-bold uppercase tracking-wider ${fieldErrors.password ? 'text-red-500' : 'text-[#475569]'}`}
                  >
                    Confirm Password
                  </Text>
                  <View className="relative justify-center">
                    <TextInput
                      value={formData.confirmPassword}
                      onChangeText={(text) => {
                        setFormData({ ...formData, confirmPassword: text });
                        if (fieldErrors.password)
                          setFieldErrors((prev) => ({ ...prev, password: false }));
                      }}
                      secureTextEntry={!showConfirmPassword}
                      autoCapitalize="none"
                      autoCorrect={false}
                      className={`h-12 w-full rounded border-2 bg-white px-4 font-body text-[#0F172A] focus:border-[#1E40AF] focus:outline-none ${fieldErrors.password ? 'border-red-500' : 'border-[#94A3B8]'}`}
                      placeholder="Confirm your password"
                      placeholderTextColor="#94A3B8"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 p-1"
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color={fieldErrors.password ? '#ef4444' : '#64748B'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting || isSuccess || !isFormValid}
                className={`mt-2 w-full flex-row items-center justify-center rounded py-4 shadow-md transition-colors duration-300 ${isSuccess ? 'bg-emerald-700' : isSubmitting || !isFormValid ? 'bg-slate-400 opacity-70 dark:bg-slate-600' : 'bg-[#1E40AF]'}`}
              >
                {isSubmitting && !isSuccess && (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                )}
                {isSuccess && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                  {isSuccess
                    ? successMessage
                    : isSubmitting
                      ? 'Processing...'
                      : mode === 'login'
                        ? 'Log In'
                        : 'Create Account'}
                </Text>
              </TouchableOpacity>

              {mode === 'login' && (
                <TouchableOpacity className="mt-2 items-center">
                  <Text className="font-mono text-xs uppercase tracking-wider text-[#1E40AF]">
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Technical Corner Markers on Card */}
            <View className="absolute left-2 top-2 h-4 w-4 border-l-2 border-t-2 border-[#EAB308]" />
            <View className="absolute bottom-2 right-2 h-4 w-4 border-b-2 border-r-2 border-[#EAB308]" />
          </View>

          <Text className="mt-6 text-center font-body text-xs text-[#64748B]">
            By continuing, you agree to Swappa's Terms of Service and Privacy Policy
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <AlertModal
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.variant}
        onClose={() => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
        }}
      />

      <SelectModal
        visible={showCountryModal}
        title="Select Country"
        options={countryOptions}
        onClose={() => setShowCountryModal(false)}
        onSelect={(option) => {
          setFormData((prev) => ({
            ...prev,
            country: option.label,
            countryCode: option.value,
            province: '',
            provinceCode: '',
            city: '',
            lat: null,
            lng: null,
          }));
          if (fieldErrors.location) setFieldErrors((prev) => ({ ...prev, location: false }));
          setShowCountryModal(false);
        }}
      />

      <SelectModal
        visible={showProvinceModal}
        title="Select Region"
        options={provinceOptions}
        onClose={() => setShowProvinceModal(false)}
        onSelect={(option) => {
          setFormData((prev) => ({
            ...prev,
            province: option.label,
            provinceCode: option.value,
            city: '',
            lat: null,
            lng: null,
          }));
          if (fieldErrors.location) setFieldErrors((prev) => ({ ...prev, location: false }));
          setShowProvinceModal(false);
        }}
      />

      <SelectModal
        visible={showCityModal}
        title="Select City"
        options={cityOptions}
        onClose={() => setShowCityModal(false)}
        onSelect={(option: any) => {
          setFormData((prev) => ({
            ...prev,
            city: option.label,
            lat: parseFloat(option.lat),
            lng: parseFloat(option.lng),
          }));
          if (fieldErrors.location) setFieldErrors((prev) => ({ ...prev, location: false }));
          setShowCityModal(false);
        }}
      />
    </View>
  );
};

export default AuthScreen;
