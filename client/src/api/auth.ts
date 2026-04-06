import * as SecureStore from 'expo-secure-store';
import { BASE_URL } from '.';
import { Platform } from 'react-native';

export interface ILocationData {
  _id: string;
  city: string;
  province: string;
  country: string;
  address?: string;
  geo_location: {
    type: string;
    coordinates: [number, number]; // [lng, lat]
  };
}

export interface IUser {
  _id?: string;
  id?: string;
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  location?: ILocationData;
  offering?: string[];
  seeking?: string[];
  average_rating?: number;
  total_reviews?: number;
}

export interface SignupUser {
  firstname: string;
  lastname: string;
  username: string;
  email: string;
  password: string;
  lat: number;
  lng: number;
  city: string;
  province: string;
  country: string;
  address?: string;
}

export interface Login {
  email: string;
  password: string;
}

export interface AuthResultType {
  message: string;
  user: IUser;
  token?: string;
}

export const saveToken = async (token: string) => {
  if (Platform.OS === 'web') {
    localStorage.setItem('jwt_token', token);
  } else {
    await SecureStore.setItemAsync('jwt_token', token);
  }
};

export const getToken = async () => {
  if (Platform.OS === 'web') {
    return localStorage.getItem('jwt_token');
  } else {
    return await SecureStore.getItemAsync('jwt_token');
  }
};

export const clearToken = async () => {
  if (Platform.OS === 'web') {
    localStorage.removeItem('jwt_token');
  } else {
    await SecureStore.deleteItemAsync('jwt_token');
  }
};

export const getAuthHeaders = async () => {
  const token = await getToken();
  return {
    'content-type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const signup = async (signupInfo: SignupUser): Promise<AuthResultType | null> => {
  try {
    const res = await fetch(`${BASE_URL}/users/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(signupInfo),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Signup Failed', err.message);
      return null;
    }

    const data: AuthResultType = await res.json();
    if (data.token) await saveToken(data.token);

    return data;
  } catch (err) {
    console.error('Signup network error:', err);
    return null;
  }
};

export const login = async (loginInfo: Login): Promise<AuthResultType | null> => {
  try {
    const res = await fetch(`${BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(loginInfo),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Login Failed', err.message);
      return null;
    }

    const data: AuthResultType = await res.json();
    if (data.token) await saveToken(data.token);

    return data;
  } catch (err) {
    console.error('Login network error:', err);
    return null;
  }
};

export const checkAuth = async (): Promise<IUser | null> => {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`${BASE_URL}/users/me`, {
      method: 'GET',
      headers,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`checkAuth Failed! Status: ${res.status}. Message:`, errorText);
      return null;
    }

    const data: IUser = await res.json();
    return data;
  } catch (err) {
    console.error('Check auth error:', err);
    return null;
  }
};

export const logout = async (): Promise<boolean> => {
  try {
    await clearToken();
    return true;
  } catch (err) {
    console.error('Logout error:', err);
    return false;
  }
};
