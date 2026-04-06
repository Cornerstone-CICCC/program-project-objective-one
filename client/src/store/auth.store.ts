import { create } from 'zustand';
import { IUser } from '../api/auth';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: IUser, token?: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  setAuth: (userData, token) =>
    set((state) => ({
      user: userData,
      isAuthenticated: true,
      token: token !== undefined ? token : state.token,
    })),

  setToken: (newToken) => set({ token: newToken }),

  logout: () => set({ user: null, isAuthenticated: false }),
}));
