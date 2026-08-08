'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  const v = variant ?? mapStatusToVariant(status);
  return (
    <Badge
      variant="outline"
      className={cn('font-medium capitalize', variantStyles[v], className)}
    >
      {status.replace('_', ' ')}
    </Badge>
  );
}

function mapStatusToVariant(status: string): StatusVariant {
  const map: Record<string, StatusVariant> = {
    active: 'success',
    published: 'success',
    running: 'info',
    completed: 'success',
    finished: 'muted',
    draft: 'muted',
    scheduled: 'warning',
    upcoming: 'info',
    registration: 'info',
    waiting: 'warning',
    archived: 'muted',
    banned: 'destructive',
    suspended: 'warning',
    failed: 'destructive',
    generated: 'success',
  };
  return map[status] ?? 'default';
}
