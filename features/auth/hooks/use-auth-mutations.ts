'use client';

import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../store/auth-store';
import { login as loginApi, logout as logoutApi } from '../services/auth-service';
import type { LoginCredentials } from '../types';
import { setAccessToken } from '@/lib/api-client';

export function useLogin() {
  const { setUser, setTokens } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => loginApi(credentials),
    onSuccess: (data) => {
      setTokens(data.tokens.accessToken);
      setAccessToken(data.tokens.accessToken);
      sessionStorage.setItem(
        'barav-access-token',
        data.tokens.accessToken
      );
      setUser(data.user);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      router.push('/dashboard');
    },
    onError: () => {
      toast.error('Invalid email or password');
    },
  });
}

export function useLogout() {
  const { clearAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: () => logoutApi(),
    onSettled: () => {
      sessionStorage.removeItem('barav-access-token');
      clearAuth();
      router.push('/login');
    },
  });
}
