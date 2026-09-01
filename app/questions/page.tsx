'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
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
        header: language === 'ku' ? 'پرسیار' : 'Question',
        cell: ({ row }) => (
          <p className="max-w-md truncate font-medium">{row.original.text}</p>
        ),
      },
      {
        accessorKey: 'categoryName',
        header: language === 'ku' ? 'جۆری بابەت' : 'Category',
        cell: ({ row }) => {
          const catName = (row.original as any).categoryName;
          if (!catName) return <span className="text-muted-foreground text-xs">—</span>;
          return <Badge variant="secondary" className="text-xs">{catName}</Badge>;
        },
      },
      {
        accessorKey: 'type',
        header: language === 'ku' ? 'جۆر' : 'Type',
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.type === 'multiple_choice' ? (language === 'ku' ? 'هەڵبژاردن' : 'Multiple Choice') : (language === 'ku' ? 'وێنە' : 'Image')}
          </Badge>
        ),
      },
      {
        accessorKey: 'points',
        header: language === 'ku' ? 'خاڵ' : 'Points',
        cell: ({ row }) => <span className="text-sm font-bold text-amber-600">{row.original.points}</span>,
      },
      {
        accessorKey: 'timer',
        header: language === 'ku' ? 'کات' : 'Timer',
        cell: ({ row }) => <span className="text-sm font-bold text-blue-600">{row.original.timer}{language === 'ku' ? 'چ' : 's'}</span>,
      },
      {
        accessorKey: 'createdAt',
        header: language === 'ku' ? 'دروستکراوە' : 'Created',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <Button variant="outline" size="sm" asChild className="rounded-full">
            <a href={`/questions/${row.original.id}`}>
              {language === 'ku' ? 'بینین' : 'View'}
            </a>
          </Button>
        ),
      },
    ],
    [language]
  );

  if (isLoading) {
    return <DashboardShell><PageHeader title={language === 'ku' ? 'پرسیارەکان' : 'Questions'} description={language === 'ku' ? 'بارکردنی پرسیارەکان...' : 'Loading questions...'} /></DashboardShell>;
  }

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'پرسیارەکان' : 'Questions'}
        description={language === 'ku' ? 'سەرجەم پرسیارەکانی ناو سیستەمەکە' : 'Manage quiz questions across all quizzes'}
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' }, { label: language === 'ku' ? 'پرسیارەکان' : 'Questions' }]}
      />
      <DataTable
        columns={columns}
        data={data}
        searchKey="text"
        searchPlaceholder={language === 'ku' ? 'گەڕانی پرسیارەکان...' : 'Search questions...'}
        exportFilename="questions"
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
