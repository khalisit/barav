export type UserStatus = 'active' | 'banned' | 'inactive' | 'deleted';


export type AuthProvider = 'email' | 'gmail' | 'appleid';

export interface User {
  id: string;
  fullName: string;
  username: string;
  phone: string | null;
  email: string;
  provider: AuthProvider;
  password?: string;
  avatarUrl: string | null;
  status: UserStatus;
  profileLastChangedAt?: string | null;
  currentSessionToken?: string | null;
  quizzesPlayed: number;
  quizzesWon: number;
  totalPoints: number;
  skip: number;
  joinedAt: string;
  lastActiveAt: string;
}

export type QuizStatus = 'draft' | 'published' | 'scheduled' | 'running' | 'finished' | 'archived';
export type QuizDifficulty = 'easy' | 'medium' | 'hard';

export interface Quiz {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  categoryName: string;
  status: QuizStatus;
  difficulty: QuizDifficulty;
  questionCount: number;
  participantCount: number;
  duration: number;
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type QuestionType = 'multiple_choice' | 'image';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  quizId: string;
  type: QuestionType;
  text: string;
  options: QuestionOption[];
  explanation: string;
  points: number;
  timer: number;
  mediaUrl: string | null;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color: string | null;
  icon: string | null;
  quizCount: number;
  questionCount: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  id: string;
  rank: number;
  name: string;
  avatarUrl: string | null;
  totalPoints: number;
  quizzesWon: number;
  winRate: number;
  quizzesPlayed: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}


export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  createdAt: string;
}

export interface Report {
  id: string;
  title: string;
  type: 'users' | 'quizzes' | 'revenue' | 'performance' | 'engagement';
  status: 'generated' | 'scheduled' | 'failed';
  format: 'pdf' | 'csv' | 'xlsx';
  createdAt: string;
  downloadUrl: string | null;
}

export type RevenueSource = 'subscription' | 'ads' | 'sponcers' | 'supporters';
export type RevenueStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Revenue {
  id: string;
  amount: number;
  currency: string;
  source: RevenueSource;
  description: string;
  date: string;
  status: RevenueStatus;
  userId?: string | null;
  createdAt: string;
}

export interface Admin {
  id: string;
  username: string;
  password?: string;
  currentSessionToken?: string | null;
  createdAt: string;
}

export interface Sponsor {
  id: string;
  name: string;
  imageUrl: string | null;
  videoUrl: string | null;
  link: string | null;
  createdAt: string;
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string;
  status: string;
  createdAt: string;
}
