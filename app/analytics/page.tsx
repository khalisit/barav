'use client';

import { useMemo } from 'react';
import { Users, HelpCircle, DollarSign, TrendingUp, Activity, Target } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { chartColors } from '@/components/shared/chart-container';
import { getDashboardData } from '@/features/dashboard/services/dashboard-service';
import { generateSeries } from '@/features/dashboard/services/dashboard-service';

export default function AnalyticsPage() {
  const data = useMemo(() => getDashboardData(), []);
  const engagement = useMemo(() => generateSeries(30, 60, 20, 0.5), []);
  const retention = useMemo(() => generateSeries(30, 75, 10, -0.1), []);

  return (
    <DashboardShell>
      <PageHeader
        title="Analytics"
        description="Deep insights into platform performance and user engagement"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Analytics' }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total Users" value={data.stats.totalUsers} icon={Users} change={12.5} />
        <StatCard title="Active Quizzes" value={data.stats.runningQuizzes} icon={HelpCircle} change={8.2} accent="info" delay={0.05} />
        <StatCard title="Revenue" value={data.stats.monthlyRevenue} icon={DollarSign} format="currency" change={11.3} accent="success" delay={0.1} />
        <StatCard title="Growth Rate" value={15.2} icon={TrendingUp} format="percent" change={3.4} accent="warning" delay={0.15} />
        <StatCard title="Engagement" value={68} icon={Activity} format="percent" change={5.1} accent="info" delay={0.2} />
        <StatCard title="Retention" value={75} icon={Target} format="percent" change={-1.2} accent="destructive" delay={0.25} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="User Growth" description="Cumulative user registrations" data={data.userGrowth} type="area" color={chartColors.primary} height={280} />
        <ChartCard title="Revenue Trend" description="Monthly revenue breakdown" data={data.revenue} type="area" color={chartColors.success} height={280} />
        <ChartCard title="Quiz Activity" description="Quizzes started per day" data={data.quizActivity} type="bar" color={chartColors.warning} height={280} />
        <ChartCard title="Answer Activity" description="Answers submitted per day" data={data.answerActivity} type="line" color={chartColors.info} height={280} />
        <ChartCard title="User Engagement" description="Daily engagement score" data={engagement} type="area" color={chartColors.purple} height={280} />
        <ChartCard title="Retention Rate" description="30-day user retention" data={retention} type="line" color={chartColors.destructive} height={280} />
      </div>
    </DashboardShell>
  );
}
