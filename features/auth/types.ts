export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'viewer';

export type Permission =
  | 'users.view'
  | 'users.manage'
  | 'quizzes.view'
  | 'quizzes.manage'
  | 'questions.view'
  | 'questions.manage'
  | 'categories.manage'
  | 'media.manage'
  | 'reports.view'
  | 'analytics.view'
  | 'audit.view'
  | 'settings.manage';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  permissions: Permission[];
}

export interface LoginCredentials {
  email: string;
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

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  super_admin: [
    'users.view', 'users.manage', 'quizzes.view', 'quizzes.manage',
    'questions.view', 'questions.manage', 'categories.manage',
    'media.manage',
    'reports.view', 'analytics.view', 'audit.view',
    'settings.manage',
  ],
  admin: [
    'users.view', 'users.manage', 'quizzes.view', 'quizzes.manage',
    'questions.view', 'questions.manage', 'categories.manage',
    'media.manage',
    'reports.view', 'analytics.view', 'audit.view',
  ],
  moderator: [
    'users.view', 'quizzes.view', 'questions.view',
    'reports.view', 'audit.view',
  ],
  viewer: ['users.view', 'quizzes.view', 'questions.view', 'reports.view'],
};
