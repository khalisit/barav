'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';

type StatusVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'muted';

const variantStyles: Record<StatusVariant, string> = {
  default: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
  info: 'bg-info/10 text-info border-info/20',
  muted: 'bg-muted text-muted-foreground border-border',
};

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const { language } = useLanguage();
  const v = variant ?? mapStatusToVariant(status);
  
  let displayText = status.replace('_', ' ');
  if (language === 'ku') {
    const s = status.toLowerCase();
    if (s === 'running') displayText = 'دەکرێت بەشداربیت';
    else if (s === 'ready') displayText = 'ئامادەیە و داخراوە';
    else if (s === 'live') displayText = 'ڕاستەوخۆ (یاریەکە)';
    else if (s === 'draft') displayText = 'ڕەشنووس';
    else if (s === 'published') displayText = 'بڵاوکراوەتەوە';
    else if (s === 'archived') displayText = 'ئەرشیڤ کراوە';
    else if (s === 'waiting') displayText = 'لە چاوەڕوانیدایە';
    else if (s === 'finished') displayText = 'کۆتایی پێهاتوو';
    else if (s === 'cancelled') displayText = 'هەڵوەشێنراوەتەوە';
    else displayText = status.replace('_', ' ');
  }

  return (
    <Badge
      variant="outline"
      className={cn('font-medium capitalize', variantStyles[v], className)}
    >
      {displayText}
    </Badge>
  );
}

function mapStatusToVariant(status: string): StatusVariant {
  const map: Record<string, StatusVariant> = {
    active: 'success',
    draft: 'default',
    published: 'success',
    running: 'success',
    ready: 'warning',
    live: 'info',
    upcoming: 'info',
    registration: 'info',
    waiting: 'warning',
    finished: 'success',
    cancelled: 'destructive',
    archived: 'muted',
    banned: 'destructive',
    inactive: 'muted',
    deleted: 'destructive',
    suspended: 'warning',
    failed: 'destructive',
    generated: 'success',
  };
  return map[status.toLowerCase()] ?? 'default';
}
