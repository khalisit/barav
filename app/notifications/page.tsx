'use client';

import { useState, useMemo } from 'react';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateNotifications } from '@/lib/mock-data';
import type { NotificationItem } from '@/lib/types';
import { timeAgo } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const typeColors = {
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-destructive/10 text-destructive',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => generateNotifications(20));
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [clearOpen, setClearOpen] = useState(false);

  const filtered = useMemo(
    () => filter === 'unread' ? notifications.filter((n) => !n.read) : notifications,
    [notifications, filter]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Notifications"
        description={`${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Notifications' }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
              <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
            </Button>
            <Button variant="outline" onClick={() => setClearOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" /> Clear all
            </Button>
          </div>
        }
      />

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.map((notif, i) => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
          >
            <Card className={cn('transition-colors', !notif.read && 'border-primary/30 bg-primary/5')}>
              <CardContent className="flex items-start gap-4 p-4">
                <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', typeColors[notif.type])}>
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{notif.title}</p>
                    {!notif.read && <Badge variant="secondary" className="text-[10px]">New</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{notif.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(notif.createdAt)}</p>
                </div>
                <div className="flex gap-1">
                  {!notif.read && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => markRead(notif.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteNotification(notif.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <ConfirmDialog
        open={clearOpen}
        onOpenChange={setClearOpen}
        title="Clear all notifications?"
        description="This will permanently delete all notifications."
        confirmLabel="Clear All"
        onConfirm={() => {
          setNotifications([]);
          toast.success('All notifications cleared');
          setClearOpen(false);
        }}
      />
    </DashboardShell>
  );
}
