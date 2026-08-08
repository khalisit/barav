import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  HelpCircle,
  ListOrdered,
  FolderTree,
  Crown,
  Bell,
  Image,
  HardDrive,
  ScrollText,
  BarChart3,
  FileBarChart,
  Settings,
  UserCircle,
} from 'lucide-react';
import type { Permission } from '@/features/auth/types';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  badge?: string;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { label: 'Analytics', href: '/analytics', icon: BarChart3, permission: 'analytics.view' },
      { label: 'Reports', href: '/reports', icon: FileBarChart, permission: 'reports.view' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Quizzes', href: '/quizzes', icon: HelpCircle, permission: 'quizzes.view' },
      { label: 'Questions', href: '/questions', icon: ListOrdered, permission: 'questions.view' },
      { label: 'Categories', href: '/categories', icon: FolderTree, permission: 'categories.manage' },
    ],
  },
  {
    label: 'Compete',
    items: [
      { label: 'Leaderboard', href: '/leaderboard', icon: Crown },
    ],
  },
  {
    label: 'Users',
    items: [
      { label: 'Users', href: '/users', icon: Users, permission: 'users.view' },
      { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText, permission: 'audit.view' },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Media', href: '/media', icon: Image, permission: 'media.manage' },
      { label: 'Storage', href: '/storage', icon: HardDrive, permission: 'media.manage' },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Settings', href: '/settings', icon: Settings, permission: 'settings.manage' },
      { label: 'Profile', href: '/profile', icon: UserCircle },
    ],
  },
];
