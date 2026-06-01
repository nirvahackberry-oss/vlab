import { create } from "zustand";
import {
  apiRequest,
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from "../api/client.js";

export const useAuthStore = create((set, get) => ({
  user: getStoredSession()?.user || null,
  token: getStoredSession()?.token || null,
  isLoading: false,
  error: null,

  isAuthenticated: () => Boolean(get().token),

  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        auth: false,
        body: { email, password },
      });
      const session = { user: data.user, token: data.token };
      setStoredSession(session);
      set({ user: data.user, token: data.token, isLoading: false });
      return data;
    } catch (err) {
      set({ error: err.message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    clearStoredSession();
    set({ user: null, token: null, error: null });
  },

  hydrate: () => {
    const session = getStoredSession();
    if (session?.token) {
      set({ user: session.user, token: session.token });
    }
  },
}));
