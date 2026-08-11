'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type Language = 'ku' | 'en';

const translations: Record<Language, Record<string, string>> = {
  ku: {
    // Navigation
    'nav.overview': 'پێداچوونەوە',
    'nav.dashboard': 'داشبۆرد',
    'nav.analytics': 'شیکارییەکان',
    'nav.reports': 'ڕاپۆرتەکان',
    'nav.revenue': 'داهات و خەرجییەکان',
    'nav.content': 'ناوەڕۆک',
    'nav.quizzes': 'کویزەکان',
    'nav.questions': 'پرسیارەکان',
    'nav.categories': 'جۆری بابەتەکان',
    'nav.sponsors': 'سپۆنسەرەکان',
    'nav.compete': 'پێشبڕکێ',
    'nav.leaderboard': 'ڕیزبەندی',
    'nav.users': 'بەکارهێنەران',
    'nav.audit-logs': 'لۆگەکانی چاودێری',
    'nav.system': 'سیستەم',
    'nav.media': 'میدیا',
    'nav.storage': 'کۆگا',
    'nav.notifications': 'ئاگادارییەکان',
    'nav.settings': 'ڕێکخستنەکان',
    'nav.profile': 'پڕۆفایل',
    'nav.logout': 'چوونەدەرەوە',

    // Dashboard Header & Welcome
    'dash.welcome': 'بەخێربێیتەوە. ئەوەی ئەمڕۆ ڕوودەدات لێرەیە.',
    'dash.title': 'داشبۆرد',

    // Stats
    'stat.totalUsers': 'کۆی بەکارهێنەران',
    'stat.onlineNow': 'چالاک لە ئێستادا',
    'stat.runningQuizzes': 'کویزە کاراکان',
    'stat.scheduled': 'پلان بۆ داڕێژراو',
    'stat.finished': 'کۆتایی پێهاتوو',
    'stat.totalQuestions': 'کۆی پرسیارەکان',
    'stat.totalAnswers': 'کۆی وەڵامەکان',
    'stat.dailyRevenue': 'داهاتی ڕۆژانە',
    'stat.monthlyRevenue': 'داهاتی مانگانە',
    'stat.totalWinners': 'کۆی براوەکان',
    'stat.completionRate': 'ڕێژەی تەواوکردن',

    // Charts
    'chart.userGrowth': 'گەشەی بەکارهێنەران',
    'chart.userGrowthDesc': 'کۆی بەکارهێنەرانی تۆمارکراو لە ٣٠ ڕۆژی ڕابردوودا',
    'chart.revenue': 'ڕەوتی داهات',
    'chart.revenueDesc': 'داهاتی ڕۆژانە بە دۆلاری ئەمریکی',
    'chart.quizActivity': 'چالاکی کویزەکان',
    'chart.quizActivityDesc': 'کویزە دەستپێکراوەکان لە ڕۆژێکدا',
    'chart.answerActivity': 'چالاکی وەڵامەکان',
    'chart.answerActivityDesc': 'کۆی وەڵامە نێردراوەکان',
    'chart.activeUsers': 'بەکارهێنەرە چالاکەکان',
    'chart.activeUsersDesc': 'بەکارهێنەرە چالاکەکانی ڕۆژانە (١٤ ڕۆژ)',

    // Cards & Lists
    'card.recentActivity': 'چالاکییە نوێیەکان',
    'card.topPerformers': 'باشترین یاریزانەکان',
    'card.noActivity': 'هیچ چالاکییەک نییە',
    'card.noData': 'هیچ داتایەک بەردەست نییە',
    'card.pts': 'خاڵ',
    'card.played': 'یاری کردووە',
    
    // Account
    'account.title': 'هەژمارەکەم',
    'account.profile': 'پڕۆفایل',
    'account.settings': 'ڕێکخستنەکان',
  },
  en: {
    // Navigation
    'nav.overview': 'Overview',
    'nav.dashboard': 'Dashboard',
    'nav.analytics': 'Analytics',
    'nav.reports': 'Reports',
    'nav.revenue': 'Revenue & Expenses',
    'nav.content': 'Content',
    'nav.quizzes': 'Quizzes',
    'nav.questions': 'Questions',
    'nav.categories': 'Categories',
    'nav.sponsors': 'Sponsors',
    'nav.compete': 'Compete',
    'nav.leaderboard': 'Leaderboard',
    'nav.users': 'Users',
    'nav.audit-logs': 'Audit Logs',
    'nav.system': 'System',
    'nav.media': 'Media',
    'nav.storage': 'Storage',
    'nav.notifications': 'Notifications',
    'nav.settings': 'Settings',
    'nav.profile': 'Profile',
    'nav.logout': 'Log out',

    // Dashboard Header & Welcome
    'dash.welcome': "Welcome back. Here's what's happening today.",
    'dash.title': 'Dashboard',

    // Stats
    'stat.totalUsers': 'Total Users',
    'stat.onlineNow': 'Online Now',
    'stat.runningQuizzes': 'Running Quizzes',
    'stat.scheduled': 'Scheduled',
    'stat.finished': 'Finished',
    'stat.totalQuestions': 'Total Questions',
    'stat.totalAnswers': 'Total Answers',
    'stat.dailyRevenue': 'Daily Revenue',
    'stat.monthlyRevenue': 'Monthly Revenue',
    'stat.totalWinners': 'Total Winners',
    'stat.completionRate': 'Completion Rate',

    // Charts
    'chart.userGrowth': 'User Growth',
    'chart.userGrowthDesc': 'Total registered users over the last 30 days',
    'chart.revenue': 'Revenue Trend',
    'chart.revenueDesc': 'Daily revenue in USD',
    'chart.quizActivity': 'Quiz Activity',
    'chart.quizActivityDesc': 'Quizzes started per day',
    'chart.answerActivity': 'Answer Activity',
    'chart.answerActivityDesc': 'Total answers submitted',
    'chart.activeUsers': 'Active Users',
    'chart.activeUsersDesc': 'Daily active users (14 days)',

    // Cards & Lists
    'card.recentActivity': 'Recent Activity',
    'card.topPerformers': 'Top Performers',
    'card.noActivity': 'No recent activity',
    'card.noData': 'No data available',
    'card.pts': 'pts',
    'card.played': 'Played',

    // Account
    'account.title': 'My Account',
    'account.profile': 'Profile',
    'account.settings': 'Settings',
  },
};

interface LanguageState {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

function getStorage() {
  if (typeof window !== 'undefined') {
    return window.localStorage;
  }
  return noopStorage as unknown as Storage;
}

export const useLanguage = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'ku',
      setLanguage: (language) => set({ language }),
      t: (key) => {
        const lang = get().language;
        return translations[lang]?.[key] ?? key;
      },
    }),
    {
      name: 'barav-language',
      storage: createJSONStorage(() => getStorage()),
    }
  )
);
