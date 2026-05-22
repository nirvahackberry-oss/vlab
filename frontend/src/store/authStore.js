import { create } from 'zustand';
import { loginWithCredentials } from '../services/authService';

const STORAGE_KEY = 'ignito_user_session';
const savedSession = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
const parsedSession = savedSession ? JSON.parse(savedSession) : null;

export const useAuthStore = create((set) => ({
  user: parsedSession?.user || null,
  token: parsedSession?.token || null,
  isAuthenticated: !!parsedSession?.user,
  isLoading: false,
  error: null,
  login: async (email, password) => {
    set({ isLoading: true, error: null });

    try {
      const session = await loginWithCredentials({ email, password });
      set({
        user: session.user,
        token: session.token || null,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return { success: true };
    } catch (error) {
      set({
        isLoading: false,
        error: error.message || 'Login failed',
        isAuthenticated: false,
      });
      return { success: false, message: error.message || 'Login failed' };
    }
  },
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false, error: null });
    localStorage.removeItem(STORAGE_KEY);
  },
  updateUser: (updates) => {
    set((state) => {
      const newUser = { ...state.user, ...updates };
      const newSession = { user: newUser, token: state.token };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSession));
      return { user: newUser };
    });
  },
}));
