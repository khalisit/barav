'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser } from '../types';
import { setAccessToken } from '@/lib/api-client';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasHydrated: boolean;
  setUser: (user: AuthUser | null) => void;
  setTokens: (accessToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (hydrated: boolean) => void;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function getStorage() {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  return noopStorage as unknown as Storage;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      hasHydrated: false,
      setUser: (user) => {
        set({ user, isAuthenticated: !!user, isLoading: false });
      },
      setTokens: (token) => {
        setAccessToken(token);
      },
      clearAuth: () => {
        setAccessToken(null);
        set({ user: null, isAuthenticated: false, isLoading: false });
      },
      setLoading: (loading) => set({ isLoading: loading }),
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
    }),
    {
      name: 'barav-auth',
      storage: createJSONStorage(() => getStorage()),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Delay setting hydrated to true until after first render to prevent Next.js hydration mismatch
        setTimeout(() => {
          state?.setHasHydrated(true);
        }, 0);
      },
    }
  )
);
