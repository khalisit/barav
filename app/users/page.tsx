'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Ban, Trash2, UserPlus, RotateCcw, AlertTriangle, CheckCircle, Ghost } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api-client';
import type { User } from '@/lib/types';
import { formatDate, getInitials } from '@/lib/format';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';

export default function UsersPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [showDeleted, setShowDeleted] = useState(false);
  const [filter30Days, setFilter30Days] = useState(false);

  const { data: fetchResult, isLoading } = useQuery<{ data: User[] }>({
    queryKey: ['users'],
    queryFn: () => api.get('/users')
  });

  const allData: User[] = fetchResult?.data || [];
  const data = allData.filter(user => {
    if (showDeleted) {
      if (user.status !== 'deleted') return false;
      if (filter30Days) {
        if (!user.profileLastChangedAt) return false;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        return new Date(user.profileLastChangedAt) < thirtyDaysAgo;
      }
      return true;
    }
    return user.status !== 'deleted';
  });

  const [statusTarget, setStatusTarget] = useState<{ user: User, action: 'banned' | 'active' | 'inactive' | 'deleted' } | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<User | null>(null);

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => api.put(`/users/${id}`, { status }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });

      let message = 'User status updated';
      if (language === 'ku') {
        if (variables.status === 'banned') message = 'بەکارهێنەر بلۆک کرا';
        else if (variables.status === 'active') message = 'بەکارهێنەر چالاک کرا';
        else if (variables.status === 'inactive') message = 'بەکارهێنەر ناچالاک کرا';
        else if (variables.status === 'deleted') message = 'بەکارهێنەر سڕایەوە';
      }

      toast.success(message);
      setStatusTarget(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(language === 'ku' ? 'بەکارهێنەر بۆ هەمیشە سڕایەوە' : 'User deleted permanently');
      setHardDeleteTarget(null);
    }
  });

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'fullName',
        header: language === 'ku' ? 'بەکارهێنەر' : 'User',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.fullName} />}
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary uppercase">
                  {user.fullName ? user.fullName.charAt(0) : 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link href={`/users/${user.id}`} className="font-medium text-foreground hover:text-primary">
                  {user.fullName || 'Unknown'}
                </Link>
                <p className="text-xs text-muted-foreground" dir="ltr">@{user.username} &bull; {user.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'provider',
        header: language === 'ku' ? 'جۆر' : 'Provider',
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.provider}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: language === 'ku' ? 'دۆخ' : 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'quizzesPlayed',
        header: language === 'ku' ? 'یاریکردوو' : 'Played',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.quizzesPlayed}</span>
        ),
      },
      {
        accessorKey: 'quizzesWon',
        header: language === 'ku' ? 'براوە' : 'Won',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-success">
            {row.original.quizzesWon}
          </span>
        ),
      },
      {
        accessorKey: 'totalPoints',
        header: language === 'ku' ? 'خاڵەکان' : 'Points',
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.totalPoints?.toLocaleString() || 0}</span>
        ),
      },
      {
        accessorKey: 'skip',
        header: language === 'ku' ? 'هەلەکان (سکیپ)' : 'Skips',
        cell: ({ row }) => (
          <span className="text-sm text-primary font-medium">{row.original.skip || 0}</span>
        ),
      },
      {
        accessorKey: 'joinedAt',
        header: language === 'ku' ? 'بەروار' : 'Joined',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.joinedAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{language === 'ku' ? 'کردارەکان' : 'Actions'}</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                  <Link href={`/users/${user.id}`}>
                    <Eye className="me-2 h-4 w-4" /> {language === 'ku' ? 'بینینی زانیاری' : 'View details'}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                {user.status === 'banned' ? (
                  <DropdownMenuItem onClick={() => setStatusTarget({ user, action: 'active' })} className="text-success focus:text-success">
                    <CheckCircle className="me-2 h-4 w-4" /> {language === 'ku' ? 'لابردنی بلۆک' : 'Unban'}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => setStatusTarget({ user, action: 'banned' })} className="text-warning focus:text-warning">
                    <Ban className="me-2 h-4 w-4" /> {language === 'ku' ? 'بلۆککردن' : 'Ban user'}
                  </DropdownMenuItem>
                )}

                {user.status === 'active' && (
                  <DropdownMenuItem onClick={() => setStatusTarget({ user, action: 'inactive' })}>
                    <AlertTriangle className="me-2 h-4 w-4" /> {language === 'ku' ? 'ناچالاککردن' : 'Deactivate'}
                  </DropdownMenuItem>
                )}

                {(user.status === 'inactive' || user.status === 'deleted') && (
                  <DropdownMenuItem onClick={() => setStatusTarget({ user, action: 'active' })} className="text-success focus:text-success">
                    <RotateCcw className="me-2 h-4 w-4" /> {language === 'ku' ? 'چالاککردنەوە' : 'Restore Active'}
                  </DropdownMenuItem>
                )}

                {user.status !== 'deleted' && (
                  <DropdownMenuItem onClick={() => setStatusTarget({ user, action: 'deleted' })} className="text-destructive focus:text-destructive">
                    <Trash2 className="me-2 h-4 w-4" /> {language === 'ku' ? 'سڕینەوە' : 'Delete'}
                  </DropdownMenuItem>
                )}

                {user.status === 'deleted' && (
                  <DropdownMenuItem onClick={() => setHardDeleteTarget(user)} className="text-destructive focus:text-destructive">
                    <Trash2 className="me-2 h-4 w-4" /> {language === 'ku' ? 'سڕینەوەی هەمیشەیی' : 'Delete Forever'}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [language],
  );

  if (isLoading) {
    return <DashboardShell><PageHeader title={language === 'ku' ? 'بەکارهێنەران' : 'Users'} description={language === 'ku' ? 'چاوەڕێبە...' : 'Loading...'} /></DashboardShell>;
  }

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? (showDeleted ? 'بەکارهێنەرە سڕاوەکان' : 'بەکارهێنەران') : (showDeleted ? 'Deleted Users' : 'Users')}
        description={language === 'ku' ? 'بەڕێوەبردنی بەکارهێنەرانی پلاتفۆرمەکە' : 'Manage all users on the platform'}
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' }, { label: language === 'ku' ? 'بەکارهێنەران' : 'Users' }]}
        actions={
          <div className="flex items-center gap-2">
            <Button variant={showDeleted ? 'default' : 'outline'} onClick={() => {
              setShowDeleted(!showDeleted);
              if (!showDeleted) setFilter30Days(false); // reset
            }} className={showDeleted ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}>
              <Ghost className="me-2 h-4 w-4" />
              {language === 'ku' ? (showDeleted ? 'گەڕانەوە بۆ لیستی چالاک' : 'سڕاوەکان') : (showDeleted ? 'Show Active' : 'Deleted Users')}
            </Button>
            {showDeleted && (
              <Button variant={filter30Days ? 'default' : 'outline'} onClick={() => setFilter30Days(!filter30Days)}>
                {language === 'ku' ? 'زیاتر لە ٣٠ ڕۆژ' : 'Older than 30 Days'}
              </Button>
            )}
            {!showDeleted && (
              <Button asChild>
                <Link href="/users/create">
                  <UserPlus className="me-2 h-4 w-4" />
                  {language === 'ku' ? 'زیادکردنی بەکارهێنەر' : 'Add User'}
                </Link>
              </Button>
            )}
          </div>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        searchKey="fullName"
        searchPlaceholder={language === 'ku' ? 'گەڕانی بەکارهێنەران...' : 'Search users...'}
        exportFilename="users"
        bulkActions={(rows, clearSelection) => (
          <>
            <Button
              variant="outline"
              size="sm"
              className="text-success hover:text-success hover:bg-success/10 border-success/20"
              onClick={() => {
                rows.forEach((r) => updateStatusMutation.mutate({ id: r.id, status: 'active' }));
                clearSelection();
              }}
            >
              <CheckCircle className="me-2 h-4 w-4" />
              {language === 'ku' ? 'چالاککردن' : 'Activate'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-warning hover:text-warning hover:bg-warning/10 border-warning/20"
              onClick={() => {
                rows.forEach((r) => updateStatusMutation.mutate({ id: r.id, status: 'inactive' }));
                clearSelection();
              }}
            >
              <AlertTriangle className="me-2 h-4 w-4" />
              {language === 'ku' ? 'ناچالاککردن' : 'Deactivate'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
              onClick={() => {
                rows.forEach((r) => updateStatusMutation.mutate({ id: r.id, status: 'banned' }));
                clearSelection();
              }}
            >
              <Ban className="me-2 h-4 w-4" />
              {language === 'ku' ? 'بلۆککردن' : 'Ban'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                // Bulk soft delete
                rows.forEach((r) => updateStatusMutation.mutate({ id: r.id, status: 'deleted' }));
                clearSelection();
              }}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {language === 'ku' ? 'سڕینەوە' : 'Delete'}
            </Button>
          </>
        )}
      />

      <ConfirmDialog
        open={statusTarget?.action === 'deleted'}
        onOpenChange={(v) => !v && setStatusTarget(null)}
        title={language === 'ku' ? 'سڕینەوەی بەکارهێنەر؟' : 'Delete user?'}
        description={language === 'ku' ? `بەڕاستی دەتەوێت ${statusTarget?.user.fullName} بسڕیتەوە؟ ئەم کردارە بەکارهێنەرەکە دەباتە لیستی سڕاوەکان.` : `Are you sure you want to soft delete ${statusTarget?.user.fullName}?`}
        confirmLabel={language === 'ku' ? 'بسڕەوە' : 'Delete'}
        onConfirm={() => {
          if (statusTarget) updateStatusMutation.mutate({ id: statusTarget.user.id, status: 'deleted' });
        }}
      />

      <ConfirmDialog
        open={!!hardDeleteTarget}
        onOpenChange={(v) => !v && setHardDeleteTarget(null)}
        title={language === 'ku' ? 'سڕینەوەی هەمیشەیی بەکارهێنەر؟' : 'Delete user permanently?'}
        description={language === 'ku' ? `بەڕاستی دەتەوێت ${hardDeleteTarget?.fullName} بۆ هەمیشە بسڕیتەوە؟ ئەم کردارە ناگەڕێتەوە و هەموو داتاکانی لەناو دەچێت.` : `Are you sure you want to permanently delete ${hardDeleteTarget?.fullName}? This action cannot be undone.`}
        confirmLabel={language === 'ku' ? 'سڕینەوەی هەمیشەیی' : 'Delete Permanently'}
        onConfirm={() => {
          if (hardDeleteTarget) deleteMutation.mutate(hardDeleteTarget.id);
        }}
      />

      <ConfirmDialog
        open={statusTarget?.action === 'banned'}
        onOpenChange={(v) => !v && setStatusTarget(null)}
        title={language === 'ku' ? 'بلۆککردنی بەکارهێنەر؟' : 'Ban user?'}
        description={language === 'ku' ? `بەکارهێنەر "${statusTarget?.user.fullName}" چیتر ناتوانێت بچێتە ناو پلاتفۆرمەکەوە.` : `${statusTarget?.user.fullName} will no longer be able to access the platform.`}
        confirmLabel={language === 'ku' ? 'بلۆک بکە' : 'Ban'}
        onConfirm={() => {
          if (statusTarget) updateStatusMutation.mutate({ id: statusTarget.user.id, status: 'banned' });
        }}
      />

      <ConfirmDialog
        open={statusTarget?.action === 'active'}
        onOpenChange={(v) => !v && setStatusTarget(null)}
        title={language === 'ku' ? 'چالاککردنی بەکارهێنەر؟' : 'Activate user?'}
        description={language === 'ku' ? `بەکارهێنەر "${statusTarget?.user.fullName}" دەتوانێت پلاتفۆرمەکە بەکاربهێنێتەوە.` : `${statusTarget?.user.fullName} will be reactivated.`}
        confirmLabel={language === 'ku' ? 'چالاک بکە' : 'Activate'}
        onConfirm={() => {
          if (statusTarget) updateStatusMutation.mutate({ id: statusTarget.user.id, status: 'active' });
        }}
      />

      <ConfirmDialog
        open={statusTarget?.action === 'inactive'}
        onOpenChange={(v) => !v && setStatusTarget(null)}
        title={language === 'ku' ? 'ناچالاککردنی بەکارهێنەر؟' : 'Deactivate user?'}
        description={language === 'ku' ? `بەکارهێنەر "${statusTarget?.user.fullName}" بە کاتی ڕادەگیرێت.` : `${statusTarget?.user.fullName} will be deactivated.`}
        confirmLabel={language === 'ku' ? 'ناچالاک بکە' : 'Deactivate'}
        onConfirm={() => {
          if (statusTarget) updateStatusMutation.mutate({ id: statusTarget.user.id, status: 'inactive' });
        }}
      />
    </DashboardShell>
  );
}
