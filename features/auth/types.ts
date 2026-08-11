export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role?: string;
  permissions?: string[];
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: AuthUser;
  tokens: AuthTokens;
}
