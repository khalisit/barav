'use client';

import { useMemo } from 'react';
import {
  Users,
  Wifi,
  PlayCircle,
  CalendarClock,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Trophy,
  Gift,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { chartColors } from '@/components/shared/chart-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '@/features/dashboard/services/dashboard-service';
import { formatCurrency, formatNumber, timeAgo, getInitials } from '@/lib/format';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/features/auth/components/auth-provider';

import { api } from '@/lib/api-client';

const translateAction = (action: string, language: string) => {
  if (language !== 'ku') return action.replace('_', ' ');
  if (action === 'CREATE') return 'دروستکردن';
  if (action === 'UPDATE') return 'نوێکردنەوە';
  if (action === 'DELETE') return 'سڕینەوە';
  if (action === 'PUBLISH') return 'بڵاوکردنەوە';
  if (action === 'ARCHIVE') return 'ئەرشیفکردن';
  if (action === 'UPLOAD_AVATAR' || action === 'UPDATE_AVATAR') return 'گۆڕینی ئەڤەتار';
  if (action === 'CREATE_RECEIPT') return 'دروستکردنی پسوولە';
  if (action === 'DELETE_RECEIPT') return 'سڕینەوەی پسوولە';
  if (action === 'UPLOAD_MEDIA') return 'بارکردنی مێدیا';
  if (action === 'DELETE_MEDIA') return 'سڕینەوەی مێدیا';
  if (action.startsWith('UPDATE_STATUS')) {
    const status = action.split('(')[1]?.replace(')', '');
    const statusKu = status === 'banned' ? 'بلۆککرا' : status === 'active' ? 'چالاککرا' : status === 'deleted' ? 'سڕایەوە' : status;
    return `گۆڕینی دۆخ (${statusKu})`;
  }
  return action.replace('_', ' ');
};

const translateResource = (resource: string, language: string) => {
  if (language !== 'ku') return resource;
  const map: Record<string, string> = {
    'User': 'بەکارهێنەر',
    'Quiz': 'کویز',
    'Question': 'پرسیار',
    'Category': 'هاوپۆل',
    'Sponsor': 'سپۆنسەر',
    'Admin': 'ئەدمین',
    'Notification': 'ئاگادارکەرەوە',
    'Receipt': 'پسوولە',
    'Storage': 'کۆگا',
  };
  return map[resource] || resource;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardData(),
  });

  const { data: auditLogsRes } = useQuery({
    queryKey: ['dashboard-audit-logs'],
    queryFn: () => api.get<{ data: any[] }>('/audit-logs'),
  });

  const { data: leaderboardRes } = useQuery({
    queryKey: ['dashboard-leaderboard'],
    queryFn: () => api.get<{ data: any[] }>('/users'),
  });

  const auditLogs = useMemo(() => Array.isArray(auditLogsRes?.data) ? auditLogsRes.data : [], [auditLogsRes]);
  const leaderboard = useMemo(() => {
    const raw = Array.isArray(leaderboardRes?.data) ? leaderboardRes.data : [];
    return [...raw]
      .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
      .map((u, i) => ({
        id: u.id,
        rank: i + 1,
        name: u.fullName || u.username,
        avatarUrl: u.avatarKey,
        totalPoints: u.totalPoints || 0,
        quizzesWon: u.quizzesWon || 0,
        quizzesPlayed: u.quizzesPlayed || 0,
      }));
  }, [leaderboardRes]);

  if (isLoading || !data) {
    return (
      <DashboardShell>
        <PageHeader title="Dashboard" description="Loading dashboard stats..." />
        <LoadingSpinner />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title={t('dash.title')}
        description={language === 'ku' ? `بەخێربێیتەوە، ${user?.name || 'ئەدمین'}. ئەوەی ئەمڕۆ ڕوودەدات لێرەیە.` : `Welcome back, ${user?.name || 'Admin'}. Here's what's happening today.`}
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home' }, { label: t('dash.title') }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard title={t('stat.totalUsers')} value={data.stats.totalUsers} icon={Users} change={data.stats.totalUsersTrend} delay={0} />
        <StatCard title={t('stat.onlineNow')} value={data.stats.onlineUsers} icon={Wifi} change={data.stats.onlineUsersTrend} accent="success" delay={0.05} />
        <StatCard title={language === 'ku' ? 'دەستپێکردن' : 'Running'} value={data.stats.runningQuizzes} icon={PlayCircle} change={data.stats.runningQuizzesTrend} accent="warning" delay={0.1} />
        <StatCard title={language === 'ku' ? 'ئامادەیە' : 'Ready'} value={data.stats.scheduledQuizzes} icon={CalendarClock} change={data.stats.scheduledQuizzesTrend} delay={0.15} />
        <StatCard title={language === 'ku' ? 'کویزی ڕاستەوخۆ' : 'Live'} value={data.stats.liveQuizzes} icon={CheckCircle2} change={data.stats.liveQuizzesTrend} accent="success" delay={0.2} />
        <StatCard title={t('stat.totalQuestions')} value={data.stats.totalQuestions} icon={HelpCircle} change={data.stats.totalQuestionsTrend} delay={0.25} />
        <StatCard title={t('stat.totalAnswers')} value={data.stats.totalAnswers} icon={MessageSquare} change={data.stats.totalAnswersTrend} accent="info" delay={0.3} />
        <StatCard
          title={t('stat.dailyRevenue')}
          value={`$${Math.round(data.stats.dailyRevenueUsd).toLocaleString()} / ${Math.round(data.stats.dailyRevenueIqd).toLocaleString()} ${language === 'ku' ? 'د.ع' : 'IQD'}`}
          icon={DollarSign}
          format="raw"
          change={data.stats.dailyRevenueTrend}
          accent="success"
          delay={0.35}
        />
        <StatCard
          title={t('stat.monthlyRevenue')}
          value={`$${Math.round(data.stats.monthlyRevenueUsd).toLocaleString()} / ${Math.round(data.stats.monthlyRevenueIqd).toLocaleString()} ${language === 'ku' ? 'د.ع' : 'IQD'}`}
          icon={TrendingUp}
          format="raw"
          change={data.stats.monthlyRevenueTrend}
          accent="success"
          delay={0.4}
        />
        <StatCard
          title={language === 'ku' ? 'خەرجی ڕۆژانە' : 'Daily Expenses'}
          value={`$${Math.round(data.stats.dailyExpenseUsd).toLocaleString()} / ${Math.round(data.stats.dailyExpenseIqd).toLocaleString()} ${language === 'ku' ? 'د.ع' : 'IQD'}`}
          icon={DollarSign}
          format="raw"
          change={data.stats.dailyExpenseTrend}
          accent="destructive"
          delay={0.42}
        />
        <StatCard
          title={language === 'ku' ? 'خەرجی مانگانە' : 'Monthly Expenses'}
          value={`$${Math.round(data.stats.monthlyExpenseUsd).toLocaleString()} / ${Math.round(data.stats.monthlyExpenseIqd).toLocaleString()} ${language === 'ku' ? 'د.ع' : 'IQD'}`}
          icon={TrendingDown}
          format="raw"
          change={data.stats.monthlyExpenseTrend}
          accent="destructive"
          delay={0.45}
        />
        <StatCard title={t('stat.totalWinners')} value={data.stats.totalWinners} icon={Trophy} change={data.stats.totalWinnersTrend} accent="warning" delay={0.48} />
        <StatCard
          title={language === 'ku' ? 'خەڵاتی دراو' : 'Paid Rewards'}
          value={`${Math.round(data.stats.paidRewards).toLocaleString('en-US')} ${language === 'ku' ? 'د.ع' : 'IQD'}`}
          icon={Gift}
          accent="success"
          delay={0.5}
        />
        <StatCard
          title={language === 'ku' ? 'خەڵاتی نەدراو' : 'Unclaimed Rewards'}
          value={`${Math.round(data.stats.unclaimedRewards).toLocaleString('en-US')} ${language === 'ku' ? 'د.ع' : 'IQD'}`}
          icon={Gift}
          accent="warning"
          delay={0.52}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title={t('chart.userGrowth')}
          description={t('chart.userGrowthDesc')}
          data={data.userGrowth}
          type="area"
          color={chartColors.primary}
          height={260}
        />
        <ChartCard
          title={t('chart.revenue')}
          description={t('chart.revenueDesc')}
          data={data.revenue}
          type="area"
          color={chartColors.success}
          height={260}
        />
        <ChartCard
          title={t('chart.quizActivity')}
          description={t('chart.quizActivityDesc')}
          data={data.quizActivity}
          type="bar"
          color={chartColors.warning}
          height={260}
        />
        <ChartCard
          title={t('chart.answerActivity')}
          description={t('chart.answerActivityDesc')}
          data={data.answerActivity}
          type="line"
          color={chartColors.info}
          height={260}
        />
        <ChartCard
          title={t('chart.activeUsers')}
          description={t('chart.activeUsersDesc')}
          data={data.activeUsers}
          type="area"
          color={chartColors.purple}
          height={260}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t('card.recentActivity')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {auditLogs.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{t('card.noActivity')}</div>
            ) : (
              auditLogs.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(item.userName || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-sm text-start">
                    <span className="font-medium text-foreground">{item.userName || 'System'}</span>{' '}
                    <span className="text-muted-foreground">{translateAction(item.action, language)}</span>{' '}
                    {item.resource && <span className="font-medium text-foreground">{translateResource(item.resource, language)}</span>}
                  </div>
                  <span className="text-xs text-muted-foreground">{timeAgo(new Date(item.createdAt))}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('card.topPerformers')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{t('card.noData')}</div>
            ) : (
              leaderboard.slice(0, 5).map((p: any, idx: number) => (
                <div key={p.id} className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    idx === 0 ? 'bg-warning/20 text-warning' :
                    idx === 1 ? 'bg-muted text-muted-foreground' :
                    idx === 2 ? 'bg-orange-500/20 text-orange-500' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="flex-1 text-sm font-medium">{p.name}</span>
                  <Badge variant="secondary">{formatNumber(p.totalPoints)} {t('card.pts')}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
