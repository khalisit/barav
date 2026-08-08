'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartDataPoint, ChartType } from './chart-container';
import { chartColors } from './chart-container';

interface ChartCardProps {
  title: string;
  description?: string;
  data: ChartDataPoint[];
  type?: ChartType;
  color?: string;
  height?: number;
  action?: React.ReactNode;
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--popover))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'hsl(var(--popover-foreground))',
};

export function ChartCard({
  title,
  description,
  data,
  type = 'area',
  color = chartColors.primary,
  height = 240,
  action,
}: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          {renderChart(data, type, color)}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function renderChart(data: ChartDataPoint[], type: ChartType, color: string) {
  const commonProps = {
    data,
    margin: { top: 5, right: 10, left: -20, bottom: 0 },
  };

  if (type === 'bar') {
    return (
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'hsl(var(--muted))' }} />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} maxBarSize={32} />
      </BarChart>
    );
  }

  if (type === 'line') {
    return (
      <LineChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip contentStyle={tooltipStyle} />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
      </LineChart>
    );
  }

  return (
    <AreaChart {...commonProps}>
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.3} />
          <stop offset="95%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
      <XAxis
        dataKey="label"
        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        tickLine={false}
        axisLine={false}
      />
      <YAxis
        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        tickLine={false}
        axisLine={false}
      />
      <Tooltip contentStyle={tooltipStyle} />
      <Area
        type="monotone"
        dataKey="value"
        stroke={color}
        strokeWidth={2}
        fill={`url(#gradient-${color})`}
      />
    </AreaChart>
  );
}
