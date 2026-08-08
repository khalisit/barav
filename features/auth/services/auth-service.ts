import { api } from '@/lib/api-client';
import type { AuthResponse, LoginCredentials, AuthUser } from '../types';
import { ROLE_PERMISSIONS } from '../types';

const DEMO_USER: AuthUser = {
  id: 'usr_001',
  name: 'Alex Morgan',
  email: 'admin@baravquiz.com',
  avatarUrl: null,
  role: 'super_admin',
  permissions: ROLE_PERMISSIONS.super_admin,
};

const DEMO_RESPONSE: AuthResponse = {
  user: DEMO_USER,
  tokens: {
    accessToken: 'demo-access-token',
    refreshToken: 'demo-refresh-token',
    expiresIn: 3600,
  },
};

export async function login(
  credentials: LoginCredentials
): Promise<AuthResponse> {
  try {
    return await api.post<AuthResponse>('/auth/login', credentials);
  } catch {
    if (
      credentials.email === 'admin@baravquiz.com' &&
      credentials.password === 'password123'
    ) {
      return DEMO_RESPONSE;
    }
    throw new Error('Invalid email or password');
  }
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    // ignore — demo mode
  }
}

export async function getProfile(): Promise<AuthUser> {
  try {
    return await api.get<AuthUser>('/auth/me');
  } catch {
    return DEMO_USER;
  }
}

export async function updateProfile(
  data: Partial<Pick<AuthUser, 'name' | 'email' | 'avatarUrl'>>
): Promise<AuthUser> {
  try {
    return await api.patch<AuthUser>('/auth/me', data);
  } catch {
    return { ...DEMO_USER, ...data };
  }
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
