'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Bell, Check, CheckCheck, Trash2, Plus, Send, ChevronsUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
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
  userId: z.string().optional().nullable(),
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

  const { data: usersResult } = useQuery<{ data: any[] }>({
    queryKey: ['users'],
    queryFn: () => api.get('/users'),
  });

  const usersList = useMemo(() => {
    return Array.isArray(usersResult?.data) ? usersResult.data : [];
  }, [usersResult]);

  const [activeTab, setActiveTab] = useState('general');
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const [dateFilter, setDateFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
      type: 'info',
      userId: null,
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(language === 'ku' ? 'ئاگادارییەکە سڕایەوە' : 'Notification deleted');
    }
  });

  const filtered = useMemo(() => {
    let result = notifications;
    if (activeTab === 'general') {
      result = result.filter((n: any) => !n.userId);
    } else {
      result = result.filter((n: any) => !!n.userId);
    }
    
    if (dateFilter) {
      result = result.filter((n: any) => {
        if (!n.createdAt) return true;
        const notifDate = new Date(n.createdAt).toISOString().split('T')[0];
        return notifDate === dateFilter;
      });
    }
    return result;
  }, [notifications, dateFilter, activeTab]);

  const onSubmit = (values: NotificationFormValues) => {
    createMutation.mutate(values);
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((n: any) => n.id)));
    }
  };

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => api.delete(`/notifications/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setSelectedIds(new Set());
      setShowBulkDeleteConfirm(false);
      toast.success(language === 'ku' ? 'ئاگادارییە دیاریکراوەکان سڕانەوە' : 'Selected notifications deleted');
    }
  });

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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="general">{language === 'ku' ? 'گشتی' : 'General'}</TabsTrigger>
          <TabsTrigger value="specific">{language === 'ku' ? 'تایبەت' : 'Specific'}</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="mb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
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

        {filtered.length > 0 && (
          <div className="flex items-center gap-3 bg-muted/30 px-3 py-1.5 rounded-lg border">
            <Checkbox 
              checked={selectedIds.size === filtered.length && filtered.length > 0}
              onCheckedChange={toggleAll}
              id="select-all"
            />
            <Label htmlFor="select-all" className="text-sm cursor-pointer">
              {language === 'ku' ? 'دیاریکردنی هەمووی' : 'Select All'}
            </Label>
            
            {selectedIds.size > 0 && (
              <Button 
                variant="destructive" 
                size="sm" 
                className="h-7 px-3 text-xs ms-2"
                onClick={() => setShowBulkDeleteConfirm(true)}
              >
                <Trash2 className="h-3 w-3 me-1" />
                {language === 'ku' ? `سڕینەوە (${selectedIds.size})` : `Delete (${selectedIds.size})`}
              </Button>
            )}
          </div>
        )}
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
                  <div className="pt-2.5">
                    <Checkbox
                      checked={selectedIds.has(notif.id)}
                      onCheckedChange={() => toggleSelection(notif.id)}
                    />
                  </div>
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', colorClass)}>
                    <Bell className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold">{notif.title}</p>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setNotificationToDelete(notif.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{notif.message}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <p className="text-xs text-muted-foreground font-medium">{timeAgo(notif.createdAt)}</p>
                      {notif.username && (
                        <Badge variant="outline" className="text-xs bg-muted/50">
                          👤 {notif.username}
                        </Badge>
                      )}
                    </div>
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

            <div className="space-y-2 flex flex-col">
              <Label>{language === 'ku' ? 'بۆ یوزەری (تایبەت)' : 'Target User (Specific)'}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className={cn(
                      "justify-between w-full font-normal",
                      !watch('userId') && "text-muted-foreground"
                    )}
                  >
                    {watch('userId')
                      ? usersList.find((u: any) => u.id === watch('userId'))?.username || 'User selected'
                      : language === 'ku' ? 'بۆ هەمووان (گشتی)' : 'For everyone (Global)'}
                    <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder={language === 'ku' ? 'گەڕان بۆ یوزەر...' : 'Search user...'} />
                    <CommandList>
                      <CommandEmpty>{language === 'ku' ? 'هیچ یوزەرێک نەدۆزرایەوە.' : 'No user found.'}</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="none"
                          onSelect={() => {
                            setValue('userId', null);
                          }}
                        >
                          <Check
                            className={cn(
                              "me-2 h-4 w-4",
                              !watch('userId') ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {language === 'ku' ? 'بۆ هەمووان (Global)' : 'For everyone (Global)'}
                        </CommandItem>
                        {usersList.map((u: any) => (
                          <CommandItem
                            key={u.id}
                            value={u.username || u.fullName || u.id}
                            onSelect={() => {
                              setValue('userId', u.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "me-2 h-4 w-4",
                                watch('userId') === u.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {u.username} ({u.fullName})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
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

      <ConfirmDialog
        open={!!notificationToDelete}
        onOpenChange={(open) => !open && setNotificationToDelete(null)}
        title={language === 'ku' ? 'سڕینەوەی ئاگاداری' : 'Delete Notification'}
        description={language === 'ku' ? 'دڵنیایت لە سڕینەوەی ئەم ئاگادارییە؟' : 'Are you sure you want to delete this notification?'}
        onConfirm={() => {
          if (notificationToDelete) {
            deleteMutation.mutate(notificationToDelete);
            setNotificationToDelete(null);
          }
        }}
        confirmLabel={language === 'ku' ? 'سڕینەوە' : 'Delete'}
        cancelLabel={language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
        variant="destructive"
      />

      <ConfirmDialog
        open={showBulkDeleteConfirm}
        onOpenChange={setShowBulkDeleteConfirm}
        title={language === 'ku' ? 'سڕینەوەی دیاریکراوەکان' : 'Delete Selected'}
        description={language === 'ku' ? `دڵنیایت لە سڕینەوەی ئەم ${selectedIds.size} ئاگادارییە؟` : `Are you sure you want to delete ${selectedIds.size} notifications?`}
        onConfirm={() => {
          bulkDeleteMutation.mutate(Array.from(selectedIds));
        }}
        confirmLabel={language === 'ku' ? 'سڕینەوە' : 'Delete'}
        cancelLabel={language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
        variant="destructive"
      />
    </DashboardShell>
  );
}
