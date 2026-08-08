export interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
}

export type ChartType = 'area' | 'bar' | 'line';

export const chartColors = {
  primary: 'hsl(var(--chart-1))',
  secondary: 'hsl(var(--chart-2))',
  accent: 'hsl(var(--chart-3))',
  success: 'hsl(var(--chart-4))',
  warning: 'hsl(var(--chart-3))',
  info: 'hsl(var(--chart-6))',
  destructive: 'hsl(var(--chart-5))',
  purple: 'hsl(var(--chart-2))',
};
