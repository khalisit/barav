'use client';

import { motion } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/format';

import { useLanguage } from '@/hooks/use-language';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  change?: number;
  format?: 'number' | 'currency' | 'percent' | 'raw';
  accent?: 'primary' | 'success' | 'warning' | 'info' | 'destructive';
  delay?: number;
}

const accentMap = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
  destructive: 'bg-destructive/10 text-destructive',
};

export function StatCard({
  title,
  value,
  icon: Icon,
  change,
  format = 'number',
  accent = 'primary',
  delay = 0,
}: StatCardProps) {
  const { language } = useLanguage();
  const formattedValue =
    typeof value === 'string'
      ? value
      : format === 'currency'
        ? `$${formatNumber(value)}`
        : format === 'percent'
          ? `${value}%`
          : format === 'raw'
            ? value.toLocaleString()
            : formatNumber(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      <Card className="relative overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {formattedValue}
              </p>
              {change !== undefined && (
                <div className="flex items-center gap-1 text-xs" dir={language === 'ku' ? 'rtl' : 'ltr'}>
                  {change >= 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-destructive" />
                  )}
                  <span
                    className={cn(
                      'font-medium',
                      change >= 0 ? 'text-success' : 'text-destructive'
                    )}
                  >
                    {change >= 0 ? '+' : ''}
                    {change.toFixed(1)}%
                  </span>
                  <span className="text-muted-foreground">
                    {language === 'ku' ? 'بەراورد بە ماوەی پێشوو' : 'vs last period'}
                  </span>
                </div>
              )}
            </div>
            <div
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-lg',
                accentMap[accent]
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
