'use client';

import { useMemo, useState } from 'react';
import { Users, HelpCircle, DollarSign, TrendingUp, TrendingDown, Trophy, Gift } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { chartColors } from '@/components/shared/chart-container';
import { getDashboardData, generateSeries } from '@/features/dashboard/services/dashboard-service';
import { useQuery } from '@tanstack/react-query';
import { LoadingSpinner } from '@/components/shared/loading-spinner';
import { useLanguage } from '@/hooks/use-language';

export default function AnalyticsPage() {
  const { language } = useLanguage();
  const [revenueCurrency, setRevenueCurrency] = useState<'USD' | 'IQD'>('USD');
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardData(),
  });

  const engagement = useMemo(() => generateSeries(30, 60, 20, 0.5), []);
  const retention = useMemo(() => generateSeries(30, 75, 10, -0.1), []);

  if (isLoading || !data) {
    return (
      <DashboardShell>
        <PageHeader title={language === 'ku' ? 'شیکارییەکان' : 'Analytics'} description={language === 'ku' ? 'بارکردنی شیکارییەکان...' : 'Loading analytics...'} />
        <LoadingSpinner />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'شیکارییەکان' : 'Analytics'}
        description={language === 'ku' ? 'زانیاری و شیکاریی قوڵ لەسەر کارکردنی پلاتفۆرمەکە و بەشداریی بەکارهێنەران' : 'Deep insights into platform performance and user engagement'}
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' }, { label: language === 'ku' ? 'شیکارییەکان' : 'Analytics' }]}
      />

      {/* Stats Cards Grid - 3 Columns for perfect width, consistency, and identical heights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={language === 'ku' ? 'کۆی بەکارهێنەران' : 'Total Users'}
          value={data.stats.totalUsers}
          icon={Users}
          change={data.stats.totalUsersTrend}
          delay={0}
        />
        <StatCard
          title={language === 'ku' ? 'کویزە چالاکەکان' : 'Active Quizzes'}
          value={data.stats.runningQuizzes}
          icon={HelpCircle}
          change={data.stats.runningQuizzesTrend}
          accent="info"
          delay={0.1}
        />
        <StatCard
          title={language === 'ku' ? 'داهات' : 'Revenue'}
          value={`$${Math.round(data.stats.monthlyRevenueUsd).toLocaleString()} / ${Math.round(data.stats.monthlyRevenueIqd).toLocaleString()} ${language === 'ku' ? 'د.ع' : 'IQD'}`}
          icon={DollarSign}
          format="raw"
          change={data.stats.monthlyRevenueTrend}
          accent="success"
          delay={0.2}
        />
        <StatCard
          title={language === 'ku' ? 'خەرجییەکان' : 'Expenses'}
          value={`$${Math.round(data.stats.monthlyExpenseUsd).toLocaleString()} / ${Math.round(data.stats.monthlyExpenseIqd).toLocaleString()} ${language === 'ku' ? 'د.ع' : 'IQD'}`}
          icon={TrendingDown}
          format="raw"
          change={data.stats.monthlyExpenseTrend}
          accent="destructive"
          delay={0.3}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard
          title={language === 'ku' ? 'گەشەی بەکارهێنەر' : 'User Growth'}
          description={language === 'ku' ? 'کۆی گشتی تۆماربوونی بەکارهێنەران' : 'Cumulative user registrations'}
          data={data.userGrowth}
          type="area"
          color={chartColors.primary}
          height={280}
        />
        <ChartCard
          title={language === 'ku' ? 'داهاتی ڕۆژانە' : 'Daily Revenue'}
          description={language === 'ku' ? 'داڕشتەی داهاتی ڕۆژانە' : 'Daily revenue breakdown'}
          data={revenueCurrency === 'USD' ? data.revenueUsd : data.revenueIqd}
          type="area"
          color={chartColors.success}
          height={280}
          action={
            <div className="flex bg-muted p-1 rounded-md">
              <button
                className={`px-3 py-1 text-xs font-medium rounded-sm ${revenueCurrency === 'USD' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setRevenueCurrency('USD')}
              >
                {language === 'ku' ? 'دۆلار' : 'USD'}
              </button>
              <button
                className={`px-3 py-1 text-xs font-medium rounded-sm ${revenueCurrency === 'IQD' ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                onClick={() => setRevenueCurrency('IQD')}
              >
                {language === 'ku' ? 'دینار' : 'IQD'}
              </button>
            </div>
          }
        />
        <ChartCard
          title={language === 'ku' ? 'چالاکی کویز' : 'Quiz Activity'}
          description={language === 'ku' ? 'کویزە دەستپێکراوەکان لە ڕۆژێکدا' : 'Quizzes started per day'}
          data={data.quizActivity}
          type="bar"
          color={chartColors.warning}
          height={280}
        />
      </div>
    </DashboardShell>
  );
}
