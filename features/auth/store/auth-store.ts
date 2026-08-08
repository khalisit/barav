'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthUser, Permission, UserRole } from '../types';
import { ROLE_PERMISSIONS } from '../types';
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
  hasPermission: (permission: Permission) => boolean;
  hasRole: (role: UserRole | UserRole[]) => boolean;
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
      hasPermission: (permission) => {
        const user = get().user;
        if (!user) return false;
        if (user.role === 'super_admin') return true;
        const rolePerms = ROLE_PERMISSIONS[user.role] ?? [];
        return (
          user.permissions.includes(permission) ||
          rolePerms.includes(permission)
        );
      },
      hasRole: (role) => {
        const user = get().user;
        if (!user) return false;
        return Array.isArray(role) ? role.includes(user.role) : user.role === role;
      },
    }),
    {
      name: 'barav-auth',
      storage: createJSONStorage(() => getStorage()),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
