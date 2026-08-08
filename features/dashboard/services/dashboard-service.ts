import type { ChartDataPoint } from '@/components/shared/chart-container';

export interface DashboardStats {
  totalUsers: number;
  onlineUsers: number;
  runningQuizzes: number;
  scheduledQuizzes: number;
  finishedQuizzes: number;
  totalQuestions: number;
  totalAnswers: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  totalWinners: number;
}

export interface DashboardData {
  stats: DashboardStats;
  userGrowth: ChartDataPoint[];
  quizActivity: ChartDataPoint[];
  answerActivity: ChartDataPoint[];
  revenue: ChartDataPoint[];
  activeUsers: ChartDataPoint[];
}

export function generateSeries(
  days: number,
  base: number,
  variance: number,
  trend: number
): ChartDataPoint[] {
  const points: ChartDataPoint[] = [];
  let value = base;
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    value = Math.max(0, value + Math.round((Math.random() - 0.45) * variance) + trend);
    points.push({
      date: date.toISOString().slice(0, 10),
      value: Math.round(value),
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    });
  }
  return points;
}

export function getDashboardData(): DashboardData {
  return {
    stats: {
      totalUsers: 12_847,
      onlineUsers: 1_384,
      runningQuizzes: 23,
      scheduledQuizzes: 58,
      finishedQuizzes: 1_294,
      totalQuestions: 8_452,
      totalAnswers: 142_389,
      dailyRevenue: 4_280,
      monthlyRevenue: 128_450,
      totalWinners: 3_671,
    },
    userGrowth: generateSeries(30, 11000, 300, 60),
    quizActivity: generateSeries(30, 20, 15, 0.5),
    answerActivity: generateSeries(30, 4000, 800, 20),
    revenue: generateSeries(30, 3500, 1200, 30),
    activeUsers: generateSeries(14, 900, 400, 5),
  };
}
