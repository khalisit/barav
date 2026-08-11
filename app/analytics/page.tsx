'use client';

import { useMemo } from 'react';
import { Users, HelpCircle, DollarSign, TrendingUp, TrendingDown, Trophy } from 'lucide-react';
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
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => getDashboardData(),
  });

  const engagement = useMemo(() => generateSeries(30, 60, 20, 0.5), []);
  const retention = useMemo(() => generateSeries(30, 75, 10, -0.1), []);

  if (isLoading || !data) {
    return (
      <DashboardShell>
        <PageHeader title="Analytics" description={language === 'ku' ? 'بارکردنی شیکارییەکان...' : 'Loading analytics...'} />
        <LoadingSpinner />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title="Analytics"
        description="Deep insights into platform performance and user engagement"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Analytics' }]}
      />

      {/* Stats Cards Grid - 3 Columns for perfect width, consistency, and identical heights */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          delay={0.05}
        />
        <StatCard
          title={language === 'ku' ? 'کۆی پرسیارەکان' : 'Total Questions'}
          value={data.stats.totalQuestions}
          icon={HelpCircle}
          change={data.stats.totalQuestionsTrend}
          accent="warning"
          delay={0.1}
        />
        <StatCard
          title={language === 'ku' ? 'داهات' : 'Revenue'}
          value={data.stats.monthlyRevenue}
          icon={DollarSign}
          format="currency"
          change={data.stats.monthlyRevenueTrend}
          accent="success"
          delay={0.15}
        />
        <StatCard
          title={language === 'ku' ? 'خەرجییەکان' : 'Expenses'}
          value={data.stats.monthlyExpense}
          icon={TrendingDown}
          format="currency"
          change={data.stats.monthlyExpenseTrend}
          accent="destructive"
          delay={0.2}
        />
        <StatCard
          title={language === 'ku' ? 'کۆی براوەکان' : 'Total Winners'}
          value={data.stats.totalWinners}
          icon={Trophy}
          change={data.stats.totalWinnersTrend}
          accent="warning"
          delay={0.25}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title={language === 'ku' ? 'گەشەی بەکارهێنەر' : 'User Growth'}
          description={language === 'ku' ? 'کۆی گشتی تۆماربوونی بەکارهێنەران' : 'Cumulative user registrations'}
          data={data.userGrowth}
          type="area"
          color={chartColors.primary}
          height={280}
        />
        <ChartCard
          title={language === 'ku' ? 'ڕەوتی داهات' : 'Revenue Trend'}
          description={language === 'ku' ? 'داڕشتەی داهاتی مانگانە' : 'Monthly revenue breakdown'}
          data={data.revenue}
          type="area"
          color={chartColors.success}
          height={280}
        />
        <ChartCard
          title={language === 'ku' ? 'چالاکی کویز' : 'Quiz Activity'}
          description={language === 'ku' ? 'کویزە دەستپێکراوەکان لە ڕۆژێکدا' : 'Quizzes started per day'}
          data={data.quizActivity}
          type="bar"
          color={chartColors.warning}
          height={280}
        />
        <ChartCard
          title={language === 'ku' ? 'چالاکی وەڵامدانەوە' : 'Answer Activity'}
          description={language === 'ku' ? 'وەڵامە نێردراوەکان لە ڕۆژێکدا' : 'Answers submitted per day'}
          data={data.answerActivity}
          type="line"
          color={chartColors.info}
          height={280}
        />
        <ChartCard
          title={language === 'ku' ? 'بەشداری بەکارهێنەر' : 'User Engagement'}
          description={language === 'ku' ? 'نمرەی بەشداری ڕۆژانە' : 'Daily engagement score'}
          data={engagement}
          type="area"
          color={chartColors.purple}
          height={280}
        />
        <ChartCard
          title={language === 'ku' ? 'ڕێژەی مانەوە' : 'Retention Rate'}
          description={language === 'ku' ? 'ڕێژەی مانەوەی بەکارهێنەر لە ٣٠ ڕۆژدا' : '30-day user retention'}
          data={retention}
          type="line"
          color={chartColors.destructive}
          height={280}
        />
      </div>
    </DashboardShell>
  );
}
