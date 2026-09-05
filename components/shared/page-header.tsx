'use client';

import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useLanguage } from '@/hooks/use-language';

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: ReactNode;
}

const headerTranslations: Record<string, string> = {
  // Titles
  'dashboard': 'داشبۆرد',
  'quizzes': 'کویزەکان',
  'questions': 'پرسیارەکان',
  'categories': 'جۆری بابەتەکان',
  'sponsors': 'سپۆنسەرەکان',
  'leaderboard': 'ڕیزبەندی',
  'winners': 'براوەکان',
  'users': 'بەکارهێنەران',
  'audit-logs': 'لۆگەکانی چاودێری',
  'media-library': 'کتێبخانەی میدیا',
  'settings': 'ڕێکخستنەکان',
  'profile': 'پڕۆفایل',
  'notifications': 'ئاگادارییەکان',
  'analytics': 'شیکارییەکان',
  'revenue-&-expenses': 'داهات و خەرجییەکان',
  'home': 'سەرەکی',

  // Descriptions
  'welcome-back,-alex.-here\'s-what\'s-happening-today.': 'بەخێربێیتەوە. ئەوەی ئەمڕۆ ڕوودەدات لێرەیە.',
  'create-and-manage-quiz-content': 'دروستکردن و بەڕێوەبردنی کویزەکان',
  'create-and-manage-your-trivia-quizzes': 'دروستکردن و بەڕێوەبردنی کویزەکان',
  'manage-quiz-questions-pool': 'بەڕێوەبردنی کۆی پرسیارەکانی کویز',
  'manage-questions-pool-and-options': 'بەڕێوەبردنی پرسیارەکان و وەڵامەکان',
  'organize-quizzes-into-categories': 'ڕێکخستنی کویزەکان بەپێی جۆری بابەت',
  'organize-quizzes-into-different-topics': 'ڕێکخستنی کویزەکان بەپێی جۆری بابەت',
  'manage-sponsors-and-partners': 'بەڕێوەبردنی سپۆنسەرەکان و هاوبەشەکان',
  'view-top-performing-players': 'بینینی باشترین یاریزانەکان و ڕیزبەندی',
  'view-top-performers-and-ranking': 'بینینی باشترین یاریزانەکان و ڕیزبەندی',
  'manage-registered-users': 'بەڕێوەبردنی بەکارهێنەرانی تۆمارکراو',
  'manage-registered-users-and-details': 'بەڕێوەبردنی بەکارهێنەرانی تۆمارکراو و بینینی زانیارییەکانیان',
  'system-activity-and-events': 'لۆگی چالاکییەکانی سیستەم و بەکارهێنەران',
  'system-activity-and-security-events': 'بینینی چالاکییەکانی سیستەم و ئاسایش',
  'upload-and-manage-images,-audio,-and-video-assets': 'بەڕێوەبردنی فایلەکانی میدیا (وێنە، دەنگ و ڤیدیۆ)',
  'system-configuration-and-preferences': 'ڕێکخستنەکانی سیستەم و شێوازی کارکردن',
  'view-and-manage-your-account-details': 'بینینی زانیارییەکانی هەژمارەکەت',
  'detailed-performance-and-user-engagement-metrics': 'شیکاری چالاکی بەکارهێنەران و بەشدارییەکان',
  'manage-revenue,-packages-and-subscriptions': 'بەڕێوەبردنی داهات، پاکێجەکان و بەشداریکردنەکان',
  'loading-quizzes...': 'بارکردنی کویزەکان...',
  'loading-questions...': 'بارکردنی پرسیارەکان...',
  'loading-categories...': 'بارکردنی جۆری بابەتەکان...',
  'loading-sponsors...': 'بارکردنی سپۆنسەرەکان...',
  'loading-leaderboard...': 'بارکردنی ڕیزبەندی...',
  'loading-users...': 'بارکردنی بەکارهێنەران...',
  'loading-audit-logs...': 'بارکردنی لۆگەکانی چاودێری...',
  'loading-media...': 'بارکردنی میدیا...',
  'loading-notifications...': 'بارکردنی ئاگادارییەکان...',
  'loading-settings...': 'بارکردنی ڕێکخستنەکان...',
  'loading-profile...': 'بارکردنی پڕۆفایل...',
  'loading-analytics...': 'بارکردنی شیکارییەکان...',
  'loading-revenue...': 'بارکردنی داهات...',
};

const translateText = (text: string, language: string) => {
  if (language !== 'ku') return text;
  const key = text.toLowerCase().trim().replace(/\s+/g, '-');
  return headerTranslations[key] || text;
};

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
}: PageHeaderProps) {
  const { language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-3 pb-4 sm:gap-4 sm:pb-6 md:flex-row md:items-center md:justify-between"
    >
      <div className="min-w-0 space-y-1.5">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, i) => (
                <BreadcrumbItem key={i}>
                  {i > 0 && <BreadcrumbSeparator />}
                  {crumb.href ? (
                    <BreadcrumbLink href={crumb.href}>
                      {translateText(crumb.label, language)}
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{translateText(crumb.label, language)}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
        <h1 className="truncate text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {translateText(title, language)}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground">{translateText(description, language)}</p>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </motion.div>
  );
}
