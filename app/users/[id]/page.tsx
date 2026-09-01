export const runtime = 'edge';
'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, Trophy, Gamepad2, Target, Ban, Trash2, CheckCircle, RotateCcw, AlertTriangle, Pencil, Phone, FastForward } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatCard } from '@/components/shared/stat-card';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PasswordInput } from '@/components/ui/password-input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SupportChat } from '@/components/users/support-chat';
import { api } from '@/lib/api-client';
import type { User } from '@/lib/types';
import { formatDate, formatDateTime, getInitials } from '@/lib/format';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'activity';
  const queryClient = useQueryClient();
  const { language } = useLanguage();

  const { data: userResult, isLoading } = useQuery<{ data: User }>({
    queryKey: ['users', params.id],
    queryFn: () => api.get(`/users/${params.id}`)
  });

  // Extract user safely
  const user = userResult?.data || (userResult as any) || ({} as any);

  const { data: activitiesResult } = useQuery({
    queryKey: ['users', params.id, 'activities'],
    queryFn: () => api.get(`/users/${params.id}/activities`),
    enabled: !!params.id
  });

  const activityData = activitiesResult?.data || [];

  // States for different confirmation dialogs
  const [statusTarget, setStatusTarget] = useState<'banned' | 'active' | 'inactive' | 'deleted' | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editPhone, setEditPhone] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => api.put(`/users/${params.id}`, { status }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });

      let message = 'User status updated';
      if (language === 'ku') {
        if (variables === 'banned') message = 'بەکارهێنەر بلۆک کرا';
        else if (variables === 'active') message = 'بەکارهێنەر چالاک کرا';
        else if (variables === 'inactive') message = 'بەکارهێنەر ناچالاک کرا';
        else if (variables === 'deleted') message = 'بەکارهێنەر سڕایەوە';
      } else {
        if (variables === 'banned') message = 'User banned successfully';
        else if (variables === 'active') message = 'User activated successfully';
        else if (variables === 'inactive') message = 'User deactivated successfully';
        else if (variables === 'deleted') message = 'User deleted successfully';
      }

      toast.success(message);
      setStatusTarget(null);

      // If deleted, maybe go back to users list
      if (variables === 'deleted') {
        router.push('/users');
      }
    }
  });

  const updateInfoMutation = useMutation({
    mutationFn: (data: { fullName?: string; phone?: string; email?: string; username?: string; password?: string }) => api.put(`/users/${params.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', params.id] });
      toast.success(language === 'ku' ? 'زانیارییەکان نوێکرانەوە' : 'User info updated');
      setEditOpen(false);
    }
  });

  const handleOpenEdit = () => {
    setEditFullName(user.fullName || '');
    setEditPhone(user.phone || '');
    setEditEmail(user.email || '');
    setEditUsername(user.username || '');
    setEditPassword('');
    setEditOpen(true);
  };

  if (isLoading || !user.id) {
    return (
      <DashboardShell>
        <PageHeader title={language === 'ku' ? 'چاوەڕێبە...' : 'Loading...'} description={language === 'ku' ? 'زانیارییەکان دەهێنرێن' : 'Fetching details'} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title={user.fullName || (language === 'ku' ? 'بەکارهێنەری نەناسراو' : 'Unknown User')}
        description={language === 'ku' ? 'پڕۆفایل و زانیاری چالاکییەکانی بەکارهێنەر' : 'User profile and activity overview'}
        breadcrumbs={[
          { label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' },
          { label: language === 'ku' ? 'بەکارهێنەران' : 'Users', href: '/users' },
          { label: user.fullName || 'User Details' },
        ]}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" /> {language === 'ku' ? 'گەڕانەوە' : 'Back'}
            </Button>

            <Button variant="outline" onClick={handleOpenEdit}>
              <Pencil className="me-2 h-4 w-4" /> {language === 'ku' ? 'دەستکاری' : 'Edit'}
            </Button>

            {user.status === 'banned' ? (
              <Button variant="outline" className="text-success hover:text-success" onClick={() => setStatusTarget('active')}>
                <CheckCircle className="me-2 h-4 w-4" /> {language === 'ku' ? 'لابردنی بلۆک' : 'Unban'}
              </Button>
            ) : (
              <Button variant="outline" className="text-warning hover:text-warning" onClick={() => setStatusTarget('banned')}>
                <Ban className="me-2 h-4 w-4" /> {language === 'ku' ? 'بلۆککردن' : 'Ban'}
              </Button>
            )}

            {user.status === 'active' && (
              <Button variant="outline" onClick={() => setStatusTarget('inactive')}>
                <AlertTriangle className="me-2 h-4 w-4" /> {language === 'ku' ? 'ناچالاککردن' : 'Deactivate'}
              </Button>
            )}

            {(user.status === 'inactive' || user.status === 'deleted') && (
              <Button variant="outline" className="text-success hover:text-success" onClick={() => setStatusTarget('active')}>
                <RotateCcw className="me-2 h-4 w-4" /> {language === 'ku' ? 'چالاککردنەوە' : 'Restore Active'}
              </Button>
            )}

            {user.status !== 'deleted' && (
              <Button variant="destructive" onClick={() => setStatusTarget('deleted')}>
                <Trash2 className="me-2 h-4 w-4" /> {language === 'ku' ? 'سڕینەوە' : 'Delete'}
              </Button>
            )}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 shadow-sm">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <Avatar className="h-24 w-24 shadow-sm">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
              <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary uppercase">
                {user.fullName ? user.fullName.charAt(0) : 'U'}
              </AvatarFallback>
            </Avatar>
            <h2 className="mt-4 text-xl font-bold">{user.fullName}</h2>
            <p className="text-sm text-muted-foreground" dir="ltr">@{user.username} &bull; {user.email}</p>
            <div className="mt-3 flex gap-2">
              <StatusBadge status={user.status} />
              {user.provider && <Badge variant="outline" className="capitalize">{user.provider === 'local' ? 'email' : user.provider}</Badge>}
            </div>
            <Separator className="my-4" />
            <div className="w-full space-y-3 text-start text-sm">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0 text-primary" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{user.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                <span>{language === 'ku' ? 'بەرواری پەیوەندیکردن' : 'Joined'} {formatDate(user.joinedAt)}</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-4 w-4 shrink-0 text-primary" />
                <span>{language === 'ku' ? 'دوایین چالاکی' : 'Last active'} {formatDateTime(user.lastActiveAt)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:col-span-2">
          <StatCard title={language === 'ku' ? 'کویزە ئەنجامدراوەکان' : 'Quizzes Played'} value={user.quizzesPlayed} icon={Gamepad2} />
          <StatCard title={language === 'ku' ? 'کویزە براوەکان' : 'Quizzes Won'} value={user.quizzesWon} icon={Trophy} accent="success" />
          <StatCard title={language === 'ku' ? 'کۆی خاڵەکان' : 'Total Points'} value={user.totalPoints} icon={Target} accent="warning" />
          <StatCard title={language === 'ku' ? 'کۆی هەلەکان' : 'Total Skips'} value={user.skip || 0} icon={FastForward} accent="primary" />
          <div className="col-span-2 md:col-span-2">
            <StatCard
              title={language === 'ku' ? 'ڕێژەی بردنەوە' : 'Win Rate'}
              value={user.quizzesPlayed > 0 ? Math.round((user.quizzesWon / user.quizzesPlayed) * 100) : 0}
              icon={Trophy}
              format="percent"
              accent="info"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue={defaultTab} className="mt-6">
        <TabsList className="mb-4">
          <TabsTrigger value="activity">{language === 'ku' ? 'چالاکییەکان' : 'Activity'}</TabsTrigger>
          <TabsTrigger value="support">{language === 'ku' ? 'پشتیوانی' : 'Support Chat'}</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{language === 'ku' ? 'دوایین چالاکییەکان' : 'Recent Activity'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {activityData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {language === 'ku' ? 'هیچ چالاکییەک نییە' : 'No recent activity'}
            </p>
          ) : (
            activityData.map((item: any, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-muted/30"
              >
                <div>
                  <p className="text-sm">
                    <span className="font-medium">{item.isWinner ? (language === 'ku' ? 'کویزی بردەوە' : 'Won quiz') : (language === 'ku' ? 'بەشداری کویزی کرد' : 'Played quiz')}</span>{' '}
                    <span className="text-muted-foreground">{item.quizTitle || 'Unknown Quiz'}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(item.completedAt)}</p>
                </div>
                {item.score > 0 && (
                  <div className="flex items-center justify-center px-3 py-1 rounded-full bg-gradient-to-r from-success/20 to-success/5 border border-success/20 text-success font-semibold text-xs shadow-sm shadow-success/10">
                    +{item.score} {language === 'ku' ? 'خاڵ' : 'pts'}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </CardContent>
      </Card>
        </TabsContent>
        <TabsContent value="support">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">{language === 'ku' ? 'نامەکانی پشتیوانی' : 'Support Messages'}</CardTitle>
            </CardHeader>
            <CardContent>
              {typeof params.id === 'string' && <SupportChat userId={params.id} />}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={statusTarget === 'banned'}
        onOpenChange={(v) => !v && setStatusTarget(null)}
        title={language === 'ku' ? 'بلۆککردنی بەکارهێنەر؟' : 'Ban user?'}
        description={language === 'ku' ? `${user.fullName} چیتر ناتوانێت بچێتە ناو پلاتفۆرمەکەوە.` : `${user.fullName} will no longer be able to access the platform.`}
        confirmLabel={language === 'ku' ? 'بلۆک بکە' : 'Ban User'}
        onConfirm={() => updateStatusMutation.mutate('banned')}
      />

      <ConfirmDialog
        open={statusTarget === 'active'}
        onOpenChange={(v) => !v && setStatusTarget(null)}
        title={language === 'ku' ? 'چالاککردنی بەکارهێنەر؟' : 'Activate user?'}
        description={language === 'ku' ? `${user.fullName} جارێکی تر دەتوانێت پلاتفۆرمەکە بەکاربهێنێت.` : `${user.fullName} will be able to access the platform again.`}
        confirmLabel={language === 'ku' ? 'چالاک بکە' : 'Activate User'}
        onConfirm={() => updateStatusMutation.mutate('active')}
      />

      <ConfirmDialog
        open={statusTarget === 'inactive'}
        onOpenChange={(v) => !v && setStatusTarget(null)}
        title={language === 'ku' ? 'ناچالاککردنی بەکارهێنەر؟' : 'Deactivate user?'}
        description={language === 'ku' ? `${user.fullName} ناتوانێت بەشدار بێت تاوەکو چالاک دەکرێتەوە.` : `${user.fullName} will be deactivated temporarily.`}
        confirmLabel={language === 'ku' ? 'ناچالاک بکە' : 'Deactivate'}
        onConfirm={() => updateStatusMutation.mutate('inactive')}
      />

      <ConfirmDialog
        open={statusTarget === 'deleted'}
        onOpenChange={(v) => !v && setStatusTarget(null)}
        title={language === 'ku' ? 'سڕینەوەی بەکارهێنەر؟' : 'Delete user?'}
        description={language === 'ku' ? `ئەم بەکارهێنەرە دەچێتە لیستی سڕاوەکانەوە، لە داهاتوودا دەتوانیت بیهێنیتەوە.` : `This user will be soft-deleted. You can restore them later.`}
        confirmLabel={language === 'ku' ? 'سڕینەوە' : 'Delete User'}
        onConfirm={() => updateStatusMutation.mutate('deleted')}
      />

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{language === 'ku' ? 'دەستکاری زانیارییەکان' : 'Edit User Info'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{language === 'ku' ? 'ناوی تەواو' : 'Full Name'}</Label>
              <Input value={editFullName} onChange={e => setEditFullName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{language === 'ku' ? 'ناوی بەکارهێنەر' : 'Username'}</Label>
              <Input value={editUsername} onChange={e => setEditUsername(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{language === 'ku' ? 'ئیمەیل' : 'Email'}</Label>
              <Input type="email" value={editEmail} onChange={e => setEditEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>{language === 'ku' ? 'ژمارەی تەلەفۆن' : 'Phone Number'}</Label>
              <Input type="tel" dir="ltr" value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="07XX XXX XXXX" />
            </div>
            <div className="space-y-2">
              <Label>{language === 'ku' ? 'وشەی تێپەڕی نوێ (بەتاڵی جێبهێڵە ئەگەر نایگۆڕیت)' : 'New Password (leave blank to keep current)'}</Label>
              <PasswordInput value={editPassword} onChange={e => setEditPassword(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}</Button>
            <Button onClick={() => updateInfoMutation.mutate({
              fullName: editFullName,
              phone: editPhone,
              email: editEmail,
              username: editUsername,
              ...(editPassword ? { password: editPassword } : {})
            })} disabled={updateInfoMutation.isPending}>
              {updateInfoMutation.isPending ? (language === 'ku' ? 'پاشەکەوت دەکرێت...' : 'Saving...') : (language === 'ku' ? 'پاشەکەوتکردن' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
