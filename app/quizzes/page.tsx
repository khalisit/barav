/* eslint-disable @next/next/no-img-element */
'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Pencil, Archive, Play, Square, Trash2, Plus, Send, Calendar } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api-client';
import type { Quiz, QuizStatus } from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/format';
import { getMediaUrl } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';

export default function QuizzesPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { data: quizzesResult, isLoading } = useQuery<{ data: Quiz[] }>({
    queryKey: ['quizzes'],
    queryFn: () => api.get('/quizzes')
  });
  const data = useMemo(() => Array.isArray(quizzesResult?.data) ? quizzesResult.data : Array.isArray(quizzesResult) ? quizzesResult : [], [quizzesResult]);

  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  const [readyTarget, setReadyTarget] = useState<Quiz | null>(null);
  const [liveTarget, setLiveTarget] = useState<Quiz | null>(null);
  const [publishTarget, setPublishTarget] = useState<Quiz | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Quiz | null>(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: QuizStatus }) => api.put(`/quizzes/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success(language === 'ku' ? 'دۆخی کویزەکە نوێکرایەوە' : 'Quiz status updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/quizzes/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success(language === 'ku' ? 'کویزەکە بەسەرکەوتوویی سڕایەوە' : 'Quiz deleted');
      setDeleteTarget(null);
    }
  });

  const updateStatus = (id: string, status: QuizStatus) => {
    updateMutation.mutate({ id, status });
  };

  const columns = useMemo<ColumnDef<Quiz>[]>(
    () => [
      {
        accessorKey: 'title',
        header: language === 'ku' ? 'کویز' : 'Quiz',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            {row.original.avatarUrl ? (
              <img
                src={getMediaUrl(row.original.avatarUrl)}
                alt={row.original.title}
                className="h-9 w-9 rounded-lg object-cover border bg-background"
              />
            ) : (
              <img
                src="/logo.png"
                alt="Logo"
                className="h-9 w-9 rounded-lg object-contain p-1 border bg-background"
              />
            )}
            <div>
              <Link href={`/quizzes/${row.original.id}`} className="font-medium text-foreground hover:text-primary">
                {row.original.title}
              </Link>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: language === 'ku' ? 'دۆخ' : 'Status',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 flex-wrap">
            <StatusBadge status={row.original.status} />
            {row.original.sessionStatus && (
              <StatusBadge status={row.original.sessionStatus} />
            )}
          </div>
        ),
      },
      {
        accessorKey: 'difficulty',
        header: language === 'ku' ? 'ئاستی سەختی' : 'Difficulty',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={
              row.original.difficulty === 'easy'
                ? 'border-success/20 bg-success/10 text-success'
                : row.original.difficulty === 'medium'
                  ? 'border-warning/20 bg-warning/10 text-warning'
                  : 'border-destructive/20 bg-destructive/10 text-destructive'
            }
          >
            {row.original.difficulty === 'easy' ? (language === 'ku' ? 'ئاسان' : 'Easy') :
              row.original.difficulty === 'medium' ? (language === 'ku' ? 'مامناوەند' : 'Medium') :
                (language === 'ku' ? 'قورس' : 'Hard')}
          </Badge>
        ),
      },
      {
        accessorKey: 'questionCount',
        header: language === 'ku' ? 'پرسیارەکان' : 'Questions',
        cell: ({ row }) => <span className="text-sm">{row.original.questionCount}</span>,
      },
      {
        accessorKey: 'participantCount',
        header: language === 'ku' ? 'بەشداربووان' : 'Participants',
        cell: ({ row }) => <span className="text-sm">{row.original.participantCount}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: language === 'ku' ? 'دروستکراوە' : 'Created',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        accessorKey: 'scheduledAt',
        header: language === 'ku' ? 'کاتی دەستپێکردن' : 'Start Time',
        cell: ({ row }) => {
          const dateVal = row.original.startedAt || row.original.scheduledAt;
          if (!dateVal) {
            return <span className="text-sm text-muted-foreground">{language === 'ku' ? 'دیارینەکراوە' : 'Not set'}</span>;
          }
          return (
            <div className="flex items-center gap-1.5 text-sm text-primary font-medium">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDateTime(dateVal)}</span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{language === 'ku' ? 'کردارەکان' : 'Actions'}</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/quizzes/${row.original.id}`}>
                  <Eye className="me-2 h-4 w-4" /> {language === 'ku' ? 'بینین' : 'View'}
                </Link>
              </DropdownMenuItem>
              {!['published', 'PUBLISHED', 'running', 'LIVE'].includes(row.original.status) &&
                row.original.sessionStatus !== 'LIVE' &&
                row.original.sessionStatus !== 'FINISHED' && (
                  <DropdownMenuItem asChild>
                    <Link href={`/quizzes/${row.original.id}/edit`}>
                      <Pencil className="me-2 h-4 w-4" /> {language === 'ku' ? 'دەستکاری' : 'Edit'}
                    </Link>
                  </DropdownMenuItem>
                )}
              <DropdownMenuSeparator />
              {row.original.status === 'DRAFT' && (
                <DropdownMenuItem onClick={() => setPublishTarget(row.original)}>
                  <Send className="me-2 h-4 w-4" /> {language === 'ku' ? 'بڵاوکردنەوە' : 'Publish'}
                </DropdownMenuItem>
              )}
              {row.original.status === 'PUBLISHED' && (
                <DropdownMenuItem onClick={() => setArchiveTarget(row.original)}>
                  <Archive className="me-2 h-4 w-4" /> {language === 'ku' ? 'ئەرشیڤکردن' : 'Archive'}
                </DropdownMenuItem>
              )}
              {row.original.status === 'running' && (
                <DropdownMenuItem onClick={() => setReadyTarget(row.original)}>
                  <Play className="me-2 h-4 w-4" /> {language === 'ku' ? 'داخستنی بەشداریکردن (ئامادە)' : 'Set Ready'}
                </DropdownMenuItem>
              )}
              {row.original.status === 'ready' && (
                <DropdownMenuItem onClick={() => setLiveTarget(row.original)}>
                  <Play className="me-2 h-4 w-4" /> {language === 'ku' ? 'دەستپێکردنی ڕاستەوخۆ' : 'Start Live'}
                </DropdownMenuItem>
              )}
              {row.original.status !== 'running' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setDeleteTarget(row.original)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="me-2 h-4 w-4" /> {language === 'ku' ? 'سڕینەوە' : 'Delete'}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [language],
  );

  if (isLoading) {
    return <DashboardShell><PageHeader title={language === 'ku' ? 'کویزەکان' : 'Quizzes'} description={language === 'ku' ? 'بارکردنی کویزەکان...' : 'Loading quizzes...'} /></DashboardShell>;
  }

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'کویزەکان' : 'Quizzes'}
        description={language === 'ku' ? 'دروستکردن و بەڕێوەبردنی ناوەڕۆکی کویزەکان' : 'Create and manage quiz content'}
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' }, { label: language === 'ku' ? 'کویزەکان' : 'Quizzes' }]}
        actions={
          <Button asChild>
            <Link href="/quizzes/create">
              <Plus className="me-2 h-4 w-4" /> {language === 'ku' ? 'دروستکردنی کویز' : 'Create Quiz'}
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        searchKey="title"
        searchPlaceholder={language === 'ku' ? 'گەڕانی کویزەکان...' : 'Search quizzes...'}
        exportFilename="quizzes"
        onBulkDelete={(rows) => {
          rows.forEach((r) => deleteMutation.mutate(r.id));
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={language === 'ku' ? 'سڕینەوەی کویز؟' : 'Delete quiz?'}
        description={language === 'ku' ? `بە یەکجاری "${deleteTarget?.title}" دەسڕێتەوە.` : `"${deleteTarget?.title}" will be permanently deleted.`}
        confirmLabel={language === 'ku' ? 'سڕینەوە' : 'Delete'}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
      <ConfirmDialog
        open={!!readyTarget}
        onOpenChange={(o) => !o && setReadyTarget(null)}
        title={language === 'ku' ? 'داخستنی بەشداریکردن؟' : 'Set Ready?'}
        description={language === 'ku' ? `"${readyTarget?.title}" دەگۆڕێت بۆ ئامادە و کەسی تر ناتوانێت بەشدار بێت.` : `"${readyTarget?.title}" will be set to ready and no new participants can join.`}
        confirmLabel={language === 'ku' ? 'بەڵێ' : 'Confirm'}
        variant="default"
        onConfirm={() => {
          if (readyTarget) {
            updateStatus(readyTarget.id, 'ready');
            toast.success(language === 'ku' ? 'بەشداریکردن داخرا' : 'Set to ready');
            setReadyTarget(null);
          }
        }}
      />
      <ConfirmDialog
        open={!!liveTarget}
        onOpenChange={(o) => !o && setLiveTarget(null)}
        title={language === 'ku' ? 'دەستپێکردنی ڕاستەوخۆ؟' : 'Start Live?'}
        description={language === 'ku' ? `"${liveTarget?.title}" ڕاستەوخۆ دەست پێدەکات.` : `"${liveTarget?.title}" will go live immediately.`}
        confirmLabel={language === 'ku' ? 'دەستپێکردن' : 'Start Live'}
        variant="default"
        onConfirm={() => {
          if (liveTarget) {
            updateStatus(liveTarget.id, 'live');
            toast.success(language === 'ku' ? 'کویزەکە دەستی پێکرد' : 'Quiz is live');
            setLiveTarget(null);
          }
        }}
      />
      <ConfirmDialog
        open={!!publishTarget}
        onOpenChange={(o) => !o && setPublishTarget(null)}
        title={language === 'ku' ? 'بڵاوکردنەوەی کویز؟' : 'Publish quiz?'}
        description={language === 'ku' ? `"${publishTarget?.title}" بڵاودەکرێتەوە و بەشداربووان دەتوانن بیبینن.` : `"${publishTarget?.title}" will be published and participants can see it.`}
        confirmLabel={language === 'ku' ? 'بڵاوکردنەوە' : 'Publish'}
        variant="default"
        onConfirm={() => {
          if (publishTarget) {
            updateStatus(publishTarget.id, 'PUBLISHED');
            toast.success(language === 'ku' ? 'کویزەکە بڵاوکرایەوە' : 'Quiz published');
            setPublishTarget(null);
          }
        }}
      />
      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(o) => !o && setArchiveTarget(null)}
        title={language === 'ku' ? 'ئەرشیڤکردنی کویز؟' : 'Archive quiz?'}
        description={language === 'ku' ? `"${archiveTarget?.title}" ئەرشیڤ دەکرێت و ئیتر بەردەست نابێت.` : `"${archiveTarget?.title}" will be archived and no longer available.`}
        confirmLabel={language === 'ku' ? 'ئەرشیڤکردن' : 'Archive'}
        variant="default"
        onConfirm={() => {
          if (archiveTarget) {
            updateStatus(archiveTarget.id, 'ARCHIVED');
            toast.success(language === 'ku' ? 'کویزەکە ئەرشیڤ کرا' : 'Quiz archived');
            setArchiveTarget(null);
          }
        }}
      />
    </DashboardShell>
  );
}
