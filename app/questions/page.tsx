'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2, Plus } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { api } from '@/lib/api-client';
import type { Question } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';

export default function QuestionsPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const { data: questionsResult, isLoading } = useQuery<{ data: Question[] }>({
    queryKey: ['questions'],
    queryFn: () => api.get('/questions'),
  });

  const data = useMemo(() => Array.isArray(questionsResult?.data) ? questionsResult.data : Array.isArray(questionsResult) ? questionsResult : [], [questionsResult]);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/questions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      toast.success(language === 'ku' ? 'پرسیارەکە بەسەرکەوتوویی سڕایەوە' : 'Question deleted');
      setDeleteTarget(null);
    },
  });

  const columns = useMemo<ColumnDef<Question>[]>(
    () => [
      {
        accessorKey: 'text',
        header: 'Question',
        cell: ({ row }) => (
          <p className="max-w-md truncate font-medium">{row.original.text}</p>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.type.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'points',
        header: 'Points',
        cell: ({ row }) => <span className="text-sm">{row.original.points}</span>,
      },
      {
        accessorKey: 'timer',
        header: 'Timer',
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.timer}s</span>,
      },
      {
        accessorKey: 'quizId',
        header: 'Quiz',
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-xs">{row.original.quizId}</Badge>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Created',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
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
              <DropdownMenuItem asChild>
                <a href={`/questions/${row.original.id}`}>
                  <Pencil className="me-2 h-4 w-4" /> {language === 'ku' ? 'دەستکاری' : 'Edit'}
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteTarget(row.original)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="me-2 h-4 w-4" /> {language === 'ku' ? 'سڕینەوە' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [language]
  );

  if (isLoading) {
    return <DashboardShell><PageHeader title="Questions" description="Loading questions..." /></DashboardShell>;
  }

  return (
    <DashboardShell>
      <PageHeader
        title="Questions"
        description="Manage quiz questions across all quizzes"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Questions' }]}
      />
      <DataTable
        columns={columns}
        data={data}
        searchKey="text"
        searchPlaceholder={language === 'ku' ? 'گەڕانی پرسیارەکان...' : 'Search questions...'}
        exportFilename="questions"
        onBulkDelete={(rows) => {
          rows.forEach((r) => deleteMutation.mutate(r.id));
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={language === 'ku' ? 'پرسیار بسڕدرێتەوە؟' : 'Delete question?'}
        description={language === 'ku' ? `پرسیاری "${deleteTarget?.text}" بەتەواوی دەسڕێتەوە.` : `"${deleteTarget?.text}" will be permanently deleted.`}
        confirmLabel={language === 'ku' ? 'بسڕەوە' : 'Delete'}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
    </DashboardShell>
  );
}
