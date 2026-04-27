import { useEffect, useMemo, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  Image,
  LayoutAnimation,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Country, State, City } from 'country-state-city';
import { useAuthStore } from '../store/auth.store';
import { getAllSkills, ISkill } from '../api/skill';
import { addUserSkill, deleteUserSkill, getMySkills, updateUserSkill } from '../api/userSkill';
import { updateProfile, uploadAvatarImage } from '../api/user';
import AlertModal from '../components/AlertModal';
import { updateUserLocation } from '../api/location';
import SelectModal from '../components/SelectModal';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type Proficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface IUserSkillUI {
  _id?: string;
  skill_id: string;
  name: string;
  type: 'TEACH' | 'LEARN';
  proficiency: Proficiency;
  description: string;
}

const ProfileEditScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const primaryIconColor = isDark ? '#A5B4FC' : '#4F46E5';

  const { user, setAuth } = useAuthStore();

  const [avatar, setAvatar] = useState(user?.avatar_url || 'https://placehold.co/150');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');

  const [city, setCity] = useState(user?.location?.city || '');
  const [province, setProvince] = useState(user?.location?.province || '');
  const [provinceCode, setProvinceCode] = useState('');
  const [country, setCountry] = useState(user?.location?.country || '');
  const [countryCode, setCountryCode] = useState('');
  const [lat, setLat] = useState<number | null>(
    user?.location?.geo_location?.coordinates[1] || null,
  );
  const [lng, setLng] = useState<number | null>(
    user?.location?.geo_location?.coordinates[0] || null,
  );

  const [isLocating, setIsLocating] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);

  const [offering, setOffering] = useState<IUserSkillUI[]>([]);
  const [seeking, setSeeking] = useState<IUserSkillUI[]>([]);
  const [dbSkills, setDbSkills] = useState<ISkill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(true);

  const [activeModal, setActiveModal] = useState<'offer' | 'seek' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalExpandedCategory, setModalExpandedCategory] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingSkill, setEditingSkill] = useState<{
    skill: IUserSkillUI;
    type: 'offer' | 'seek';
    index: number;
  } | null>(null);

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

  const isBioOverLimit = bio.length > 300;
  const isDescOverLimit = (editingSkill?.skill.description?.length || 0) > 500;

  const isFormValid =
    username.trim() !== '' &&
    city.trim() !== '' &&
    province.trim() !== '' &&
    country.trim() !== '' &&
    !isBioOverLimit &&
    !isUploading &&
    !isSaving;

  useEffect(() => {
    if (country) {
      const matchedCountry = Country.getAllCountries().find(
        (c) => c.name === country || c.isoCode === country,
      );
      if (matchedCountry) {
        setCountryCode(matchedCountry.isoCode);
        setCountry(matchedCountry.name);

        if (province) {
          const matchedState = State.getStatesOfCountry(matchedCountry.isoCode).find(
            (s) => s.name === province || s.isoCode === province,
          );
          if (matchedState) {
            setProvinceCode(matchedState.isoCode);
            setProvince(matchedState.name);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [masterSkills, userSkillsData] = await Promise.all([getAllSkills(), getMySkills()]);

        setDbSkills(masterSkills);

        if (userSkillsData) {
          const formattedOffering: IUserSkillUI[] = [];
          const formattedSeeking: IUserSkillUI[] = [];

          userSkillsData.forEach((item: any) => {
            const skillObj: IUserSkillUI = {
              _id: item._id,
              skill_id: item.skill_id?._id || item.skill_id,
              name: item.skill_id?.name || 'Unknown Skill',
              type: item.type,
              proficiency: item.proficiency || 'Beginner',
              description: item.description || '',
            };

            if (item.type === 'TEACH') formattedOffering.push(skillObj);
            else formattedSeeking.push(skillObj);
          });

          setOffering(formattedOffering);
          setSeeking(formattedSeeking);
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      } finally {
        setIsLoadingSkills(false);
      }
    };
    fetchData();
  }, []);

  const groupedSkills = dbSkills.reduce(
    (acc, skill) => {
      const cat = skill.category || 'General';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(skill);
      return acc;
    },
    {} as Record<string, ISkill[]>,
  );

  const countryOptions = useMemo(() => {
    return Country.getAllCountries().map((c) => ({
      label: c.name,
      value: c.isoCode,
    }));
  }, []);

  const provinceOptions = useMemo(() => {
    if (!countryCode) return [];
    return State.getStatesOfCountry(countryCode).map((s) => ({
      label: s.name,
      value: s.isoCode,
    }));
  }, [countryCode]);

  const cityOptions = useMemo(() => {
    if (!countryCode || !provinceCode) return [];
    return City.getCitiesOfState(countryCode, provinceCode).map((c) => ({
      label: c.name,
      value: c.name,
      lat: c.latitude,
      lng: c.longitude,
    }));
  }, [countryCode, provinceCode]);

  const handleAutoLocate = async () => {
    setIsLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setAlertConfig({
          visible: true,
          title: 'Permission Denied',
          message: 'Please allow location access, or select it manually.',
          isSuccess: false,
          variant: 'error',
        });
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      const geo = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geo.length > 0) {
        const place = geo[0];

        const cityStr = place.city || place.subregion || '';
        const isoCountry = place.isoCountryCode || '';
        const countryName = place.country || '';

        const statesForCountry = State.getStatesOfCountry(isoCountry);
        const matchedState = statesForCountry.find(
          (s) => s.name === place.region || s.isoCode === place.region,
        );

        setLat(latitude);
        setLng(longitude);
        setCity(cityStr);
        setCountry(countryName);
        setCountryCode(isoCountry);
        setProvince(matchedState ? matchedState.name : place.region || '');
        setProvinceCode(matchedState ? matchedState.isoCode : '');
      }
    } catch (err) {
      console.error(err);
      setAlertConfig({
        visible: true,
        title: 'Location Error',
        message: 'Could not detect location. Please select it manually.',
        isSuccess: false,
        variant: 'error',
      });
    } finally {
      setIsLocating(false);
    }
  };

  const uploadToServer = async (imageUri: string) => {
    setIsUploading(true);
    try {
      const secureUrl = await uploadAvatarImage(imageUri);

      if (secureUrl) {
        setAvatar(secureUrl);
      } else {
        setAlertConfig({
          visible: true,
          title: 'Erorr',
          message: 'Failed to upload image. Please try again.',
          isSuccess: false,
          variant: 'error',
        });
      }
    } catch (err) {
      console.error('Upload Error:', err);
      setAlertConfig({
        visible: true,
        title: 'System Error',
        message: 'An unexpected error occurred during upload.',
        isSuccess: false,
        variant: 'error',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      await uploadToServer(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!isFormValid) return;

    setIsSaving(true);

    try {
      let finalLat = lat;
      let finalLng = lng;
      if (!finalLat || !finalLng) {
        try {
          const geocoded = await Location.geocodeAsync(`${city}, ${province}, ${country}`);
          if (geocoded.length > 0) {
            finalLat = geocoded[0].latitude;
            finalLng = geocoded[0].longitude;
          }
        } catch {
          finalLat = 49.2827;
          finalLng = -123.1207;
        }
      }

      await updateUserLocation({
        lat: finalLat as number,
        lng: finalLng as number,
        city: city.trim(),
        province: provinceCode || province.trim(),
        country: countryCode || country.trim(),
      });

      const result = await updateProfile({
        username,
        bio,
        avatar_url: avatar,
      });

      if (result && result.user) {
        setAuth(result.user);
        setAlertConfig({
          visible: true,
          title: 'Profile Updated',
          message: 'Your profile and location settings have been successfully saved.',
          isSuccess: true,
          variant: 'success',
        });
      } else {
        setAlertConfig({
          visible: true,
          title: 'Update Failed',
          message: 'Please try again.',
          isSuccess: false,
          variant: 'error',
        });
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setAlertConfig({
        visible: true,
        title: 'System Error',
        message: 'An unexpected error occurred.',
        isSuccess: false,
        variant: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = async (masterSkill: ISkill, type: 'offer' | 'seek') => {
    try {
      const newSkillDoc = await addUserSkill({
        skill_id: masterSkill._id,
        type: type === 'offer' ? 'TEACH' : 'LEARN',
        proficiency: 'Beginner',
        description: '',
      });

      const skillObj: IUserSkillUI = {
        _id: newSkillDoc._id,
        skill_id: masterSkill._id,
        name: masterSkill.name,
        type: type === 'offer' ? 'TEACH' : 'LEARN',
        proficiency: newSkillDoc.proficiency || 'Beginner',
        description: newSkillDoc.description || '',
      };

      if (type === 'offer') setOffering((prev) => [...prev, skillObj]);
      else setSeeking((prev) => [...prev, skillObj]);
    } catch (err: any) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: err.message || 'Could not add skill.',
        isSuccess: false,
        variant: 'error',
      });
    }
  };

  const handleRemoveSkill = async (skillObj: IUserSkillUI, type: 'offer' | 'seek') => {
    try {
      if (skillObj._id) {
        await deleteUserSkill(skillObj._id);
      }

      const setTargetArray = type === 'offer' ? setOffering : setSeeking;
      setTargetArray((prev) => prev.filter((s) => s._id !== skillObj._id));
    } catch (err) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Could not remove skill.',
        isSuccess: false,
        variant: 'error',
      });
    }
  };

  const toggleSearchSkill = async (masterSkillName: string, type: 'offer' | 'seek') => {
    const targetArray = type === 'offer' ? offering : seeking;
    const existingSkill = targetArray.find((s) => s.name === masterSkillName);

    if (existingSkill) {
      await handleRemoveSkill(existingSkill, type);
    } else {
      const masterSkill = dbSkills.find((s) => s.name === masterSkillName);
      if (masterSkill) {
        await handleAddSkill(masterSkill, type);
      }
    }
  };

  const saveSkillDetails = async () => {
    if (!editingSkill || !editingSkill.skill._id || isDescOverLimit) return;

    try {
      await updateUserSkill(editingSkill.skill._id, {
        proficiency: editingSkill.skill.proficiency,
        description: editingSkill.skill.description,
      });

      const setTargetArray = editingSkill.type === 'offer' ? setOffering : setSeeking;
      setTargetArray((prev) => {
        const updated = [...prev];
        updated[editingSkill.index] = editingSkill.skill;
        return updated;
      });

      setEditingSkill(null);
    } catch (err) {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Could not update skill details.',
        isSuccess: false,
        variant: 'error',
      });
    }
  };

  const openSkillEditor = (skill: IUserSkillUI, type: 'offer' | 'seek', index: number) => {
    setEditingSkill({ skill: { ...skill }, type, index });
  };

  const filteredSkills = dbSkills.filter((skill) =>
    skill.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderSkillChips = (skills: IUserSkillUI[], type: 'offer' | 'seek') => (
    <View className="mt-3 flex-row flex-wrap gap-2">
      {skills.map((skillObj, index) => (
        <View
          key={skillObj._id || skillObj.name}
          className="flex-row items-center overflow-hidden rounded-sm border border-solid border-border bg-muted"
        >
          <TouchableOpacity
            onPress={() => openSkillEditor(skillObj, type, index)}
            className="flex-row items-center px-3 py-1.5"
          >
            <Text className="mr-1 font-technical text-xs text-foreground">{skillObj.name}</Text>
            <View
              className={`h-2 w-2 rounded-full ${skillObj.proficiency === 'Expert' ? 'bg-purple-500' : skillObj.proficiency === 'Advanced' ? 'bg-emerald-500' : skillObj.proficiency === 'Intermediate' ? 'bg-amber-500' : 'bg-blue-500'}`}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleRemoveSkill(skillObj, type)}
            className="border-l border-border bg-card px-2 py-1.5 active:bg-red-500/10"
          >
            <Ionicons name="close" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity
        onPress={() => setActiveModal(type)}
        className="flex-row items-center rounded-sm border-2 border-dashed border-border bg-transparent px-3 py-1.5 active:bg-muted"
      >
        <Ionicons name="add" size={14} color="#64748B" />
        <Text className="ml-1 font-technical text-xs font-bold uppercase text-muted-foreground">
          Add
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        className="border-b border-border bg-card p-6"
        style={{ paddingTop: Math.max(insets.top, 24) }}
      >
        <View className="flex-row items-center gap-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="rounded-sm p-2 active:opacity-70"
            disabled={isSaving}
          >
            <Ionicons name="arrow-back" size={24} color="#64748B" />
          </TouchableOpacity>
          <View>
            <Text className="font-technical text-lg uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
              Edit Profile
            </Text>
            <Text className="mt-1 font-body text-xs text-muted-foreground">
              Manage your identity and location
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingVertical: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <View className="mb-8 items-center">
          <View className="relative">
            <View className="h-32 w-32 items-center justify-center overflow-hidden rounded-sm border-2 border-solid border-muted-foreground bg-muted shadow-md">
              {isUploading ? (
                <ActivityIndicator color="#1E40AF" size="large" />
              ) : (
                <Image source={{ uri: avatar }} className="h-full w-full" resizeMode="contain" />
              )}
            </View>
            <TouchableOpacity
              onPress={pickImage}
              disabled={isUploading || isSaving}
              className={`absolute bottom-0 right-0 h-10 w-10 items-center justify-center rounded-sm border-2 border-muted-foreground bg-primary shadow-sm ${isUploading || isSaving ? 'opacity-50' : 'active:opacity-80'}`}
            >
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Username & Bio */}
        <View className="mb-8 space-y-4">
          <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
            Profile Information
          </Text>

          {/* Username */}
          <View className="mb-4 rounded-sm border-2 border-solid border-border bg-card p-4">
            <Text className="mb-2 font-body text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Display Name
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              editable={!isSaving}
              className="w-full rounded-sm border-2 border-solid border-border bg-background px-3 py-2 font-body text-foreground focus:border-primary focus:outline-none"
              placeholderTextColor="#64748B"
            />
          </View>

          {/* Bio */}
          <View
            className={`rounded-sm border-2 border-solid bg-card p-4 transition-colors ${isBioOverLimit ? 'border-destructive' : 'border-border'}`}
          >
            <Text
              className={`mb-2 font-body text-xs font-bold uppercase tracking-wider ${isBioOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              About Me
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              editable={!isSaving}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className={`min-h-[100px] w-full rounded-sm border-2 border-solid bg-background px-3 py-2 font-body text-foreground focus:outline-none ${isBioOverLimit ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`}
              placeholderTextColor="#64748B"
            />
            <Text
              className={`mt-2 text-right font-technical text-[10px] uppercase tracking-wider ${isBioOverLimit ? 'text-destructive font-bold' : 'text-muted-foreground'}`}
            >
              {bio.length}/300 Characters
            </Text>
          </View>
        </View>

        {/* Location Config UI */}
        <View className="mb-8 space-y-4">
          <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
            Location Settings
          </Text>

          <View className="rounded-sm border-2 border-solid border-border bg-card p-4">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Your Location
              </Text>
              <TouchableOpacity
                onPress={handleAutoLocate}
                disabled={isLocating}
                className="flex-row items-center gap-2 rounded bg-muted px-3 py-1.5 active:opacity-80"
              >
                {isLocating ? (
                  <ActivityIndicator size="small" color={primaryIconColor} />
                ) : (
                  <>
                    <Ionicons name="navigate-outline" size={14} color={primaryIconColor} />
                    <Text className="font-technical text-[10px] font-bold uppercase text-primary dark:text-[#A5B4FC]">
                      Auto-Locate
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View className="flex-col gap-3">
              <TouchableOpacity
                onPress={() => setShowCountryModal(true)}
                className="h-12 w-full flex-row items-center justify-between rounded border-2 border-border bg-background px-4"
              >
                <Text
                  className={`font-body ${country ? 'text-foreground' : 'text-muted-foreground'}`}
                >
                  {country || 'Select Country'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748B" />
              </TouchableOpacity>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => setShowProvinceModal(true)}
                  disabled={!countryCode}
                  className={`h-12 flex-1 flex-row items-center justify-between rounded border-2 border-border px-4 ${!countryCode ? 'bg-muted opacity-50' : 'bg-background'}`}
                >
                  <Text
                    className={`flex-1 font-body ${province ? 'text-foreground' : 'text-muted-foreground'}`}
                    numberOfLines={1}
                  >
                    {province || 'Select Province'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#64748B" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowCityModal(true)}
                  disabled={!provinceCode}
                  className={`h-12 flex-1 flex-row items-center justify-between rounded border-2 border-border px-4 ${!provinceCode ? 'bg-muted opacity-50' : 'bg-background'}`}
                >
                  <Text
                    className={`flex-1 font-body ${city ? 'text-foreground' : 'text-muted-foreground'}`}
                    numberOfLines={1}
                  >
                    {city || 'Select City'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Skill Matrix */}
        <View className="mb-8 space-y-4">
          <Text className="mb-2 font-technical text-xs uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
            Manage Skills
          </Text>

          {/* Offering */}
          <View className="mb-4 rounded-sm border-2 border-solid border-border bg-card p-4">
            <Text className="font-body text-xs font-bold uppercase  tracking-wider text-muted-foreground">
              Skills I Can Teach
            </Text>
            <Text className="mt-1 font-body text-xs text-muted-foreground">
              Tap a skill to edit proficiency and details.
            </Text>
            {renderSkillChips(offering, 'offer')}
          </View>

          {/* Seeking */}
          <View className="rounded-sm border-2 border-solid border-border bg-card p-4">
            <Text className="font-body text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Skills I Want To Learn
            </Text>
            <Text className="mt-1 font-body text-xs text-muted-foreground">
              Tap a skill to edit proficiency and details.
            </Text>
            {renderSkillChips(seeking, 'seek')}
          </View>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View
        className="flex-row gap-3 border-t border-border bg-card p-4"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          disabled={isSaving}
          className="flex-1 flex-row items-center justify-center gap-2 rounded-sm border-2 border-solid border-border bg-transparent py-3 active:bg-muted"
        >
          <Ionicons name="close" size={20} color="#64748B" />
          <Text className="font-body font-bold text-foreground">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isBioOverLimit || isUploading || isSaving}
          className={`flex-1 flex-row items-center justify-center gap-2 rounded-sm py-3 shadow-sm transition-colors ${!isFormValid ? 'bg-slate-400 opacity-70' : 'bg-primary active:opacity-90'}`}
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Ionicons name="save" size={20} color="#FFFFFF" />
          )}
          <Text className="font-body font-bold text-white">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Location Modals */}
      <SelectModal
        visible={showCountryModal}
        title="Select Country"
        options={countryOptions}
        variant="themed"
        onClose={() => setShowCountryModal(false)}
        onSelect={(option) => {
          setCountry(option.label);
          setCountryCode(option.value);
          setProvince('');
          setProvinceCode('');
          setCity('');
          setLat(null);
          setLng(null);
          setShowCountryModal(false);
        }}
      />

      <SelectModal
        visible={showProvinceModal}
        title="Select Province/State"
        options={provinceOptions}
        variant="themed"
        onClose={() => setShowProvinceModal(false)}
        onSelect={(option) => {
          setProvince(option.label);
          setProvinceCode(option.value);
          setCity('');
          setLat(null);
          setLng(null);
          setShowProvinceModal(false);
        }}
      />

      <SelectModal
        visible={showCityModal}
        title="Select City"
        options={cityOptions}
        variant="themed"
        onClose={() => setShowCityModal(false)}
        onSelect={(option: any) => {
          setCity(option.label);
          setLat(parseFloat(option.lat));
          setLng(parseFloat(option.lng));
          setShowCityModal(false);
        }}
      />

      {/* Skill Search Modal */}
      <Modal
        visible={activeModal !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setActiveModal(null);
          setSearchQuery('');
          setModalExpandedCategory(null);
        }}
      >
        <View className="flex-1 bg-background pt-12">
          <View className="flex-1 px-6">
            <View className="mb-6 flex-row items-center justify-between">
              <Text className="font-technical text-lg font-bold uppercase tracking-wider text-foreground">
                {activeModal === 'offer' ? 'Select Skills to Teach' : 'Select Skills to Learn'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setActiveModal(null);
                  setSearchQuery('');
                }}
                className="p-2"
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View className="relative mb-4">
              <Ionicons
                name="search"
                size={20}
                color="#64748B"
                className="absolute left-3 top-3 z-10"
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search skills..."
                placeholderTextColor="#64748B"
                className="w-full rounded-sm border-2 border-solid border-border bg-card py-3 pl-10 pr-4 font-body text-foreground focus:border-primary focus:outline-none"
              />
            </View>

            {/* Result List */}
            {isLoadingSkills ? (
              <ActivityIndicator color={primaryIconColor} size="large" className="mt-10" />
            ) : searchQuery ? (
              <FlatList
                data={filteredSkills}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {
                  const targetArray = activeModal === 'offer' ? offering : seeking;
                  const isSelected = !!targetArray.find((s) => s.name === item.name);
                  return (
                    <TouchableOpacity
                      onPress={() => activeModal && toggleSearchSkill(item.name, activeModal)}
                      className={`mb-2 flex-row items-center justify-between rounded-sm border-2 border-solid p-4 ${isSelected ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                    >
                      <Text
                        className={`font-body text-sm font-medium ${isSelected ? 'text-white' : 'text-foreground'}`}
                      >
                        {item.name}
                      </Text>
                      {isSelected && <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />}
                    </TouchableOpacity>
                  );
                }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              />
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                <View className="flex-col gap-3">
                  {Object.entries(groupedSkills).map(([category, skills]) => {
                    const isExpanded = modalExpandedCategory === category;
                    const targetArray = activeModal === 'offer' ? offering : seeking;
                    const selectedCount = skills.filter((s) =>
                      targetArray.find((ts) => ts.name === s.name),
                    ).length;

                    return (
                      <View
                        key={category}
                        className="overflow-hidden rounded-sm border-2 border-solid border-border bg-card"
                      >
                        <TouchableOpacity
                          onPress={() => {
                            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                            setModalExpandedCategory(isExpanded ? null : category);
                          }}
                          className="flex-row items-center justify-between bg-muted p-4 active:bg-border"
                        >
                          <View className="flex-row items-center gap-2">
                            <Text className="font-body text-sm font-bold uppercase tracking-wider text-foreground">
                              {category}
                            </Text>
                            {selectedCount > 0 && (
                              <View className="h-5 w-5 items-center justify-center rounded-full bg-primary">
                                <Text className="font-technical text-[10px] font-bold text-white">
                                  {selectedCount}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Ionicons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color="#64748B"
                          />
                        </TouchableOpacity>

                        {isExpanded && (
                          <View className="flex-row flex-wrap gap-2 p-4">
                            {skills.map((skill) => {
                              const isSelected = !!targetArray.find((ts) => ts.name === skill.name);
                              const textStyle = isSelected ? 'text-white' : 'text-foreground';

                              return (
                                <TouchableOpacity
                                  key={skill._id}
                                  onPress={() =>
                                    activeModal && toggleSearchSkill(skill.name, activeModal)
                                  }
                                  className={`rounded-sm border-2 border-solid px-3 py-2 active:opacity-80 ${isSelected ? 'border-primary bg-primary' : 'border-border bg-background'}`}
                                >
                                  <Text className={`font-body text-xs font-medium ${textStyle}`}>
                                    {skill.name}
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            )}
          </View>

          <View
            className="border-t border-border bg-card p-4 shadow-lg"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <TouchableOpacity
              onPress={() => {
                setActiveModal(null);
                setSearchQuery('');
                setModalExpandedCategory(null);
              }}
              className="w-full flex-row items-center justify-center rounded-sm bg-primary py-3 active:opacity-90"
            >
              <Text className="font-body font-bold text-white">Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Skill Detail Editor Modal */}
      <Modal
        transparent={true}
        visible={editingSkill !== null}
        animationType="fade"
        onRequestClose={() => setEditingSkill(null)}
      >
        <View className="flex-1 justify-center bg-black/60 px-6">
          <View className="w-full rounded-sm border-2 border-solid border-border bg-card p-6 shadow-lg">
            <View className="mb-4 flex-row items-center justify-between border-b border-border pb-4">
              <View>
                <Text className="font-technical text-lg font-bold uppercase tracking-wider text-primary dark:text-[#A5B4FC]">
                  {editingSkill?.skill.name}
                </Text>
                <Text className="font-body text-xs text-muted-foreground">
                  {editingSkill?.type === 'offer'
                    ? 'Configure Teaching Details'
                    : 'Configure Learning Goals'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEditingSkill(null)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text className="mb-2 font-body text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {editingSkill?.type === 'offer'
                ? 'Your Proficiency Level'
                : 'Desired Proficiency Level'}
            </Text>
            <View className="mb-6 flex-row flex-wrap gap-2">
              {['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((level) => {
                const isSelected = editingSkill?.skill.proficiency === level;
                return (
                  <TouchableOpacity
                    key={level}
                    onPress={() =>
                      setEditingSkill((prev) =>
                        prev
                          ? { ...prev, skill: { ...prev.skill, proficiency: level as Proficiency } }
                          : null,
                      )
                    }
                    className={`rounded-sm border-2 px-3 py-2 ${isSelected ? 'border-primary bg-primary' : 'border-border bg-background'}`}
                  >
                    <Text
                      className={`font-body text-xs font-bold tracking-wider ${isSelected ? 'text-white' : 'text-muted-foreground'}`}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text
              className={`mb-2 font-body text-xs font-bold uppercase tracking-wider ${isDescOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {editingSkill?.type === 'offer' ? 'Experience Details' : 'Specific Learning Goals'}
            </Text>
            <TextInput
              value={editingSkill?.skill.description}
              onChangeText={(text) =>
                setEditingSkill((prev) =>
                  prev ? { ...prev, skill: { ...prev.skill, description: text } } : null,
                )
              }
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              placeholder={
                editingSkill?.type === 'offer'
                  ? 'Detail your experience with this skill...'
                  : 'What specific aspects are you looking to learn?'
              }
              placeholderTextColor="#64748B"
              className={`min-h-[80px] w-full rounded-sm border-2 border-solid bg-background px-3 py-2 font-body text-foreground focus:outline-none ${isDescOverLimit ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`}
            />
            <Text
              className={`mb-6 mt-2 text-right font-technical text-[10px] font-bold uppercase tracking-wider ${isDescOverLimit ? 'text-destructive' : 'text-muted-foreground'}`}
            >
              {editingSkill?.skill.description?.length || 0}/500 Characters
            </Text>

            <TouchableOpacity
              onPress={saveSkillDetails}
              disabled={isDescOverLimit}
              className={`w-full rounded-sm bg-primary py-3 shadow-sm ${isDescOverLimit ? 'opacity-50' : 'active:opacity-90'}`}
            >
              <Text className="text-center font-body text-sm font-bold text-white">
                Save Skill Details
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

export default ProfileEditScreen;
