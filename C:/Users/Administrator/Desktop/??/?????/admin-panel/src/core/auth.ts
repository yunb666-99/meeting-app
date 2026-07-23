import { create } from 'zustand';
import api from './api';
import { getToken, setToken, clearToken } from './token';

export interface AuthUser {
  id: string;
  account: string;
  nickname: string;
  role: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  loading: boolean;
  login: (account: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,
  loading: true,

  login: async (account: string, password: string) => {
    const response = await api.post('/api/auth/login', { account, password });
    const { token, user } = response.data.data;
    setToken(token);
    set({ user, isLoggedIn: true, loading: false });
  },

  logout: () => {
    clearToken();
    set({ user: null, isLoggedIn: false, loading: false });
    window.location.href = '/admin/login';
  },

  checkAuth: async () => {
    const token = getToken();
    if (!token) {
      set({ user: null, isLoggedIn: false, loading: false });
      return;
    }
    try {
      const response = await api.get('/api/auth/profile');
      set({ user: response.data.data, isLoggedIn: true, loading: false });
    } catch {
      clearToken();
      set({ user: null, isLoggedIn: false, loading: false });
    }
  },
}));
