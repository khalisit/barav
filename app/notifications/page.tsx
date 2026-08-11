'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bell, Check, CheckCheck, Trash2, Plus, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { api } from '@/lib/api-client';
import type { NotificationItem } from '@/lib/types';
import { timeAgo } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/features/auth/components/auth-provider';

const typeColors: Record<string, string> = {
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-destructive/10 text-destructive',
};

const notificationSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  message: z.string().min(5, 'Message is too short'),
  type: z.enum(['info', 'success', 'warning', 'error']),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

export default function NotificationsPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: notificationsResult, isLoading } = useQuery<{ data: NotificationItem[] }>({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications'),
  });

  const notifications = useMemo(() => {
    return Array.isArray(notificationsResult?.data)
      ? notificationsResult.data
      : Array.isArray(notificationsResult)
      ? notificationsResult
      : [];
  }, [notificationsResult]);

  const [dateFilter, setDateFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
      type: 'info',
    }
  });

  const watchType = watch('type');

  const createMutation = useMutation({
    mutationFn: (values: NotificationFormValues) => api.post('/notifications', values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(language === 'ku' ? 'ئاگادارییەکە بە سەرکەوتوویی نێردرا' : 'Notification sent successfully');
      setCreateOpen(false);
      reset();
    }
  });

  const filtered = useMemo(() => {
    if (!dateFilter) return notifications;
    return notifications.filter((n: any) => {
      if (!n.createdAt) return true;
      const notifDate = new Date(n.createdAt).toISOString().split('T')[0];
      return notifDate === dateFilter;
    });
  }, [notifications, dateFilter]);

  const onSubmit = (values: NotificationFormValues) => {
    createMutation.mutate(values);
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <PageHeader title={language === 'ku' ? 'ئاگادارییەکان' : 'Notifications'} description={language === 'ku' ? 'بارکردنی ئاگادارییەکان...' : 'Loading notifications...'} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'ئاگادارییەکان' : 'Notifications'}
        description={
          language === 'ku'
            ? `سەرجەم ئاگادارییەکان: ${notifications.length}`
            : `Total notifications: ${notifications.length}`
        }
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' }, { label: language === 'ku' ? 'ئاگادارییەکان' : 'Notifications' }]}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="shadow-sm">
            <Plus className="me-2 h-4 w-4" /> {language === 'ku' ? 'ئاگاداری نوێ' : 'New Notification'}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground font-medium">
          {language === 'ku' ? 'فلتەرکردن بەپێی بەروار:' : 'Filter by date:'}
        </div>
        <div className="flex items-center gap-2">
          <Input 
            type="date" 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)} 
            className="w-auto"
          />
          {dateFilter && (
            <Button variant="ghost" onClick={() => setDateFilter('')}>
              {language === 'ku' ? 'لابردنی فلتەر' : 'Clear filter'}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            {language === 'ku' ? 'هیچ ئاگادارییەک نەدۆزرایەوە' : 'No notifications found'}
          </div>
        ) : (
          filtered.map((notif: any, i: number) => {
            const colorClass = typeColors[notif.type] || 'bg-info/10 text-info';

            return (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                className="group relative rounded-xl border p-4 sm:p-5 transition-all duration-300 hover:shadow-md bg-card/50 hover:bg-card border-border/40"
              >
                <div className="flex items-start gap-4">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', colorClass)}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{notif.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                    <p className="mt-2 text-xs text-muted-foreground font-medium">{timeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {language === 'ku' ? 'ناردنی ئاگاداری نوێ' : 'Send New Notification'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ku' ? 'ئەم ئاگادارییە ڕاستەوخۆ دەگاتە بەکارهێنەران.' : 'Create a manual notification.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{language === 'ku' ? 'سەردێڕی ئاگاداری' : 'Title'}</Label>
              <Input id="title" placeholder={language === 'ku' ? 'نموونە: نوێکارییەکی گرنگ' : 'e.g. Important Update'} {...register('title')} />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">{language === 'ku' ? 'دەقی ئاگاداری' : 'Message'}</Label>
              <Textarea id="message" rows={3} placeholder={language === 'ku' ? 'وردەکاری ئاگادارییەکە لێرە بنووسە...' : 'Write your message here...'} className="resize-none" {...register('message')} />
              {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>{language === 'ku' ? 'جۆری ئاگاداری' : 'Type'}</Label>
              <Select onValueChange={(v) => setValue('type', v as any)} value={watchType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">{language === 'ku' ? 'زانیاری (شین)' : 'Info'}</SelectItem>
                  <SelectItem value="success">{language === 'ku' ? 'سەرکەوتن (سەوز)' : 'Success'}</SelectItem>
                  <SelectItem value="warning">{language === 'ku' ? 'ئاگادارکردنەوە (زەرد)' : 'Warning'}</SelectItem>
                  <SelectItem value="error">{language === 'ku' ? 'هەڵە (سوور)' : 'Error'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                {language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (language === 'ku' ? 'دەنێردرێت...' : 'Sending...') : (language === 'ku' ? 'ناردن' : 'Send')}
                {!isSubmitting && <Send className="ms-2 h-4 w-4" />}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </DashboardShell>
  );
}
