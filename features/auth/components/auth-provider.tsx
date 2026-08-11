'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth-store';
import { setAccessToken, setOnUnauthorized } from '@/lib/api-client';
import type { AuthUser } from '../types';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, isAuthenticated, hasHydrated, setUser, clearAuth } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    setOnUnauthorized(() => {
      clearAuth();
      router.push('/login');
    });

    const stored = localStorage.getItem('barav-auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as {
          state: { user: AuthUser | null; isAuthenticated: boolean };
        };
        if (parsed.state?.user) {
          setUser(parsed.state.user);
          const token = sessionStorage.getItem('barav-access-token');
          if (token) setAccessToken(token);
        } else {
          setUser(null);
        }
      } catch {
        clearAuth();
      }
    } else {
      setUser(null);
    }
  }, [setUser, clearAuth, router]);

  return <>{children}</>;
}

export function useAuth() {
  const store = useAuthStore();
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading,
    hasHydrated: store.hasHydrated,
  };
}
