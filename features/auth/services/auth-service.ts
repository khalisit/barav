import { api } from '@/lib/api-client';
import type { AuthResponse, LoginCredentials, AuthUser } from '../types';
export async function login(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  try {
    return await api.post<AuthResponse>('/auth/admin/login', credentials);
  } catch {
    throw new Error('Invalid username or password');
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/admin/logout');
  } catch {
    // ignore
  }
}

export async function getProfile(): Promise<AuthUser> {
  return await api.get<AuthUser>('/auth/admin/me');
}

export async function updateProfile(
  data: Partial<Pick<AuthUser, 'name' | 'email' | 'avatarUrl'>>
): Promise<AuthUser> {
  return await api.patch<AuthUser>('/auth/admin/me', data);
}

export async function changePassword(
  _currentPassword: string,
  _newPassword: string
): Promise<void> {
  try {
    await api.post('/auth/change-password', {
      currentPassword: _currentPassword,
      newPassword: _newPassword,
    });
  } catch {
    // demo mode — accept
  }
}
