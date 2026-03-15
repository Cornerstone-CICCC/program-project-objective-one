import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { login, signup } from '../api/auth';
import zxcvbn from 'zxcvbn';

const AuthScreen = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const navigation = useNavigation<any>();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    locationDisplay: '',
    lat: null as number | null,
    lng: null as number | null,
    city: '',
    address: '',
  });

  const handleModeSwitch = (newMode: 'login' | 'signup') => {
    if (mode === newMode) return;

    setMode(newMode);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setFormData((prev) => ({
      ...prev,
      password: '',
      confirmPassword: '',
    }));
  };

  const handleAutoLocate = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please allow location access, or type your city manually.',
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo.length > 0) {
        const place = geo[0];
        const cityStr = place.city || place.subregion || 'Unknown City';
        const addressStr = place.name || place.street || cityStr;
        const displayStr = `${cityStr}, ${place.region || place.country}`;

        setFormData((prev) => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          city: cityStr,
          address: addressStr,
          locationDisplay: displayStr,
        }));
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Location Error', 'Could not detect location. Please type it manually.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      if (mode === 'signup') {
        const strength = zxcvbn(formData.password);
        if (strength.score < 3) {
          Alert.alert('Week Password', 'Please create a stronger password beofre continuing.');
          setIsSubmitting(false);
          return;
        }

        if (formData.password !== formData.confirmPassword) {
          Alert.alert('Password Mismatch', 'Your passwords do not match.');
          setIsSubmitting(false);
          return;
        }

        let finalLat = formData.lat;
        let finalLng = formData.lng;
        let finalCity = formData.city;

        if (!finalLat || !finalLng) {
          if (!formData.locationDisplay.trim()) {
            Alert.alert('Missing Info', 'Please provide your location to discover nearby trades.');
            return;
          }

          try {
            const geocoded = await Location.geocodeAsync(formData.locationDisplay);
            if (geocoded.length > 0) {
              finalLat = geocoded[0].latitude;
              finalLng = geocoded[0].longitude;
              finalCity = formData.locationDisplay.split(',')[0];
            } else {
              Alert.alert('Invalid Location', 'Could not find that city. Please try again.');
              setIsSubmitting(false);
              return;
            }
          } catch (err) {
            Alert.alert('Error', 'Failed to search for that location.');
            setIsSubmitting(false);
            return;
          }
        }

        const signupPayload = {
          firstname: formData.firstName,
          lastname: formData.lastName,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          lat: finalLat,
          lng: finalLng,
          city: finalCity,
          address: formData.address || formData.locationDisplay,
        };

        const result = await signup(signupPayload);

        if (result) {
          Alert.alert('Success!', `Welcome to Swappa, ${result.user.firstname}!`);
          navigation.replace('MainApp');
        } else {
          Alert.alert('Signup Failed', 'Please check your information and try again.');
        }
      } else {
        // Handle Login
        const result = await login({ email: formData.email, password: formData.password });

        if (result) {
          Alert.alert('Login Successful', `Welcome back, ${result.user.firstname}!`);
          navigation.replace('MainApp');
        } else {
          Alert.alert('Login Failed', 'Incorrect email or password.');
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Network Error', 'Something went wrong connecting to the server.');
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
                // Objective One. 2026
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
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingVertical: 40 }}
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
                  Signup
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
                      <Text className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#64748B]">
                        User_First_Name
                      </Text>
                      <TextInput
                        value={formData.firstName}
                        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                        className="h-12 w-full rounded border border-[#0F172A] bg-white px-4 font-body text-[#0F172A]"
                        placeholder="Enter your first name"
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#64748B]">
                        User_Last_Name
                      </Text>
                      <TextInput
                        value={formData.lastName}
                        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                        className="h-12 w-full rounded border border-[#0F172A] bg-white px-4 font-body text-[#0F172A]"
                        placeholder="Enter your last name"
                      />
                    </View>
                  </View>

                  <View>
                    <Text className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      User_Display_name
                    </Text>
                    <TextInput
                      value={formData.username}
                      onChangeText={(text) => setFormData({ ...formData, username: text })}
                      autoCapitalize="none"
                      className="h-12 w-full rounded border border-[#0F172A] bg-white px-4 font-body text-[#0F172A]"
                      placeholder="Enter your display name"
                    />
                  </View>

                  <View>
                    <Text className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#64748B]">
                      Location_Data
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <TextInput
                        value={formData.locationDisplay}
                        onChangeText={(text) => {
                          setFormData({ ...formData, locationDisplay: text, lat: null, lng: null });
                        }}
                        className="h-12 flex-1 rounded border border-[#0F172A] bg-white px-4 font-body text-[#0F172A]"
                        placeholder="e.g. Vancouver, BC"
                      />
                      <TouchableOpacity
                        onPress={handleAutoLocate}
                        disabled={isLocating}
                        className="h-12 w-12 items-center justify-center rounded border border-[#0F172A] bg-[#F1F5F9] active:bg-[#E2E8F0]"
                      >
                        {isLocating ? (
                          <ActivityIndicator size="small" color="#1E40AF" />
                        ) : (
                          <Ionicons name="location-outline" size={20} color="#1E40AF" />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}

              {/* Always Visible: Email & Password */}
              <View>
                <Text className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  User_Email
                </Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => setFormData({ ...formData, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="h-12 w-full rounded border border-[#0F172A] bg-white px-4 font-body text-[#0F172A]"
                  placeholder="user@example.com"
                />
              </View>

              <View>
                <Text className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Access_Code
                </Text>
                <View className="relative justify-center">
                  <TextInput
                    value={formData.password}
                    onChangeText={(text) => setFormData({ ...formData, password: text })}
                    secureTextEntry={!showPassword}
                    className="h-12 w-full rounded border border-[#0F172A] bg-white px-4 font-body text-[#0F172A]"
                    placeholder="Enter your password"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    className="absolute right-3 p-1"
                  >
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color="#64748B" />
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
                  <Text className="mb-2 font-mono text-xs font-bold uppercase tracking-wider text-[#64748B]">
                    Confirm_Code
                  </Text>
                  <View className="relative justify-center">
                    <TextInput
                      value={formData.confirmPassword}
                      onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                      secureTextEntry={!showConfirmPassword}
                      className="h-12 w-full rounded border border-[#0F172A] bg-white px-4 font-body text-[#0F172A]"
                      placeholder="Confirm your password"
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 p-1"
                    >
                      <Ionicons
                        name={showConfirmPassword ? 'eye-off' : 'eye'}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isSubmitting}
                className={`mt-2 w-full flex-row items-center justify-center rounded py-4 ${isSubmitting ? 'bg-[#1E40AF]/80' : 'bg-[#1E40AF]'}`}
              >
                {isSubmitting && (
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                )}
                <Text className="font-mono text-sm font-bold uppercase tracking-wider text-white">
                  {isSubmitting
                    ? 'Processing...'
                    : mode === 'login'
                      ? 'Authenticate_Session'
                      : 'Initiate_Blueprint'}
                </Text>
              </TouchableOpacity>

              {mode === 'login' && (
                <TouchableOpacity className="mt-2 items-center">
                  <Text className="font-mono text-xs uppercase tracking-wider text-[#1E40AF]">
                    Forgot_Access_Code?
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
    </View>
  );
};

export default AuthScreen;
