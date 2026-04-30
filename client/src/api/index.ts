import { Platform } from 'react-native';

export const BASE_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:5000'
    : 'http://localhost:5000'
  : process.env.EXPO_PUBLIC_API_URL;
