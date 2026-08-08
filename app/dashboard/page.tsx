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
  Trophy,
} from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { StatCard } from '@/components/shared/stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { chartColors } from '@/components/shared/chart-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getDashboardData } from '@/features/dashboard/services/dashboard-service';
import { formatCurrency, formatNumber, timeAgo } from '@/lib/format';

const recentActivity = [
  { id: '1', user: 'Sarah Chen', action: 'completed quiz', target: 'World Capitals', time: new Date(Date.now() - 120000), type: 'quiz' },
  { id: '2', user: 'Mike Johnson', action: 'completed quiz', target: 'Math Challenge', time: new Date(Date.now() - 300000), type: 'quiz' },
  { id: '3', user: 'Emma Wilson', action: 'created quiz', target: 'History Masters', time: new Date(Date.now() - 600000), type: 'create' },
  { id: '4', user: 'David Kim', action: 'created quiz', target: 'Science Basics', time: new Date(Date.now() - 900000), type: 'create' },
  { id: '5', user: 'Lisa Park', action: 'registered', target: '', time: new Date(Date.now() - 1200000), type: 'user' },
];

export default function DashboardPage() {
  const data = useMemo(() => getDashboardData(), []);

  return (
    <DashboardShell>
      <PageHeader
        title="Dashboard"
        description="Welcome back, Alex. Here's what's happening today."
        breadcrumbs={[{ label: 'Home' }, { label: 'Dashboard' }]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <StatCard title="Total Users" value={data.stats.totalUsers} icon={Users} change={12.5} delay={0} />
        <StatCard title="Online Now" value={data.stats.onlineUsers} icon={Wifi} change={8.2} accent="success" delay={0.05} />
        <StatCard title="Running Quizzes" value={data.stats.runningQuizzes} icon={PlayCircle} change={-2.3} accent="warning" delay={0.1} />
        <StatCard title="Scheduled" value={data.stats.scheduledQuizzes} icon={CalendarClock} change={15.7} delay={0.15} />
        <StatCard title="Finished" value={data.stats.finishedQuizzes} icon={CheckCircle2} change={9.4} accent="success" delay={0.2} />
        <StatCard title="Total Questions" value={data.stats.totalQuestions} icon={HelpCircle} change={6.8} delay={0.25} />
        <StatCard title="Total Answers" value={data.stats.totalAnswers} icon={MessageSquare} change={18.2} accent="info" delay={0.3} />
        <StatCard title="Daily Revenue" value={data.stats.dailyRevenue} icon={DollarSign} format="currency" change={7.5} accent="success" delay={0.35} />
        <StatCard title="Monthly Revenue" value={data.stats.monthlyRevenue} icon={TrendingUp} format="currency" change={11.3} accent="success" delay={0.4} />
        <StatCard title="Total Winners" value={data.stats.totalWinners} icon={Trophy} change={4.6} accent="warning" delay={0.45} />
        <StatCard title="Completion Rate" value={87} icon={CheckCircle2} format="percent" change={2.1} accent="success" delay={0.5} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard
          title="User Growth"
          description="Total registered users over the last 30 days"
          data={data.userGrowth}
          type="area"
          color={chartColors.primary}
          height={260}
        />
        <ChartCard
          title="Revenue"
          description="Daily revenue in USD"
          data={data.revenue}
          type="area"
          color={chartColors.success}
          height={260}
        />
        <ChartCard
          title="Quiz Activity"
          description="Quizzes started per day"
          data={data.quizActivity}
          type="bar"
          color={chartColors.warning}
          height={260}
        />
        <ChartCard
          title="Answer Activity"
          description="Total answers submitted"
          data={data.answerActivity}
          type="line"
          color={chartColors.info}
          height={260}
        />
        <ChartCard
          title="Active Users"
          description="Daily active users (14 days)"
          data={data.activeUsers}
          type="area"
          color={chartColors.purple}
          height={260}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                    {item.user.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-sm">
                  <span className="font-medium text-foreground">{item.user}</span>{' '}
                  <span className="text-muted-foreground">{item.action}</span>{' '}
                  {item.target && <span className="font-medium text-foreground">{item.target}</span>}
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(item.time)}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Performers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'Sarah Chen', score: 9850, rank: 1 },
              { name: 'Mike Johnson', score: 9200, rank: 2 },
              { name: 'Emma Wilson', score: 8750, rank: 3 },
              { name: 'David Kim', score: 8100, rank: 4 },
              { name: 'Lisa Park', score: 7650, rank: 5 },
            ].map((p) => (
              <div key={p.rank} className="flex items-center gap-3">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  p.rank === 1 ? 'bg-warning/20 text-warning' :
                  p.rank === 2 ? 'bg-muted text-muted-foreground' :
                  p.rank === 3 ? 'bg-orange-500/20 text-orange-500' :
                  'bg-muted text-muted-foreground'
                }`}>
                  {p.rank}
                </div>
                <span className="flex-1 text-sm font-medium">{p.name}</span>
                <Badge variant="secondary">{formatNumber(p.score)} pts</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
