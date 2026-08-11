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
  Wallet,
  Star,
} from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
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
      { label: 'Analytics', href: '/analytics', icon: BarChart3 },
      { label: 'Reports', href: '/reports', icon: FileBarChart },
      { label: 'Revenue & Expenses', href: '/revenue', icon: Wallet },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Quizzes', href: '/quizzes', icon: HelpCircle },
      { label: 'Questions', href: '/questions', icon: ListOrdered },
      { label: 'Categories', href: '/categories', icon: FolderTree },
      { label: 'Sponsors', href: '/sponsors', icon: Star },
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
      { label: 'Users', href: '/users', icon: Users },
      { label: 'Audit Logs', href: '/audit-logs', icon: ScrollText },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Storage', href: '/storage', icon: HardDrive },
      { label: 'Notifications', href: '/notifications', icon: Bell },
      { label: 'Settings', href: '/settings', icon: Settings },
      { label: 'Profile', href: '/profile', icon: UserCircle },
    ],
  },
];
