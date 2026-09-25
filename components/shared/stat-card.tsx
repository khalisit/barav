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
  primary: {
    wrapper: 'bg-primary/10 border-primary/20 hover:border-primary/40 hover:bg-primary/15',
    icon: 'text-primary bg-primary/20',
  },
  success: {
    wrapper: 'bg-success/10 border-success/20 hover:border-success/40 hover:bg-success/15',
    icon: 'text-success bg-success/20',
  },
  warning: {
    wrapper: 'bg-warning/10 border-warning/20 hover:border-warning/40 hover:bg-warning/15',
    icon: 'text-warning bg-warning/20',
  },
  info: {
    wrapper: 'bg-info/10 border-info/20 hover:border-info/40 hover:bg-info/15',
    icon: 'text-info bg-info/20',
  },
  destructive: {
    wrapper: 'bg-destructive/10 border-destructive/20 hover:border-destructive/40 hover:bg-destructive/15',
    icon: 'text-destructive bg-destructive/20',
  },
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

  const styles = accentMap[accent];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="h-full"
    >
      <Card className={cn(
        "relative h-full overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-lg border-2",
        styles.wrapper
      )}>
        <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 rounded-full bg-background/20 blur-2xl" />
        <CardContent className="p-4 sm:p-5 h-full flex flex-col justify-center">
          <div className="flex items-center gap-4">
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform duration-300 hover:scale-110',
                styles.icon
              )}
            >
              <Icon className="h-6 w-6 drop-shadow-sm" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-muted-foreground/80 truncate">
                {title}
              </p>
              <p className="truncate text-2xl font-black tracking-tight text-foreground sm:text-3xl drop-shadow-sm">
                {formattedValue}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
