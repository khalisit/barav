export type UserStatus = 'active' | 'banned' | 'suspended';
export type UserRole = 'super_admin' | 'admin' | 'moderator' | 'viewer' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  role: UserRole;
  status: UserStatus;
  quizzesPlayed: number;
  quizzesWon: number;
  totalPoints: number;
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

export type QuestionType = 'multiple_choice' | 'true_false' | 'image' | 'audio';

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
  color: string;
  icon: string;
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

export interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'audio' | 'video';
  url: string;
  size: number;
  uploadedAt: string;
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
