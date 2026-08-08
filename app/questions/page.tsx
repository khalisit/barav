'use client';

import { useMemo, useState } from 'react';
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
import { generateQuestions } from '@/lib/mock-data';
import type { Question } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

export default function QuestionsPage() {
  const [data, setData] = useState<Question[]>(() => generateQuestions(20));
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);

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
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setDeleteTarget(row.original)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  return (
    <DashboardShell>
      <PageHeader
        title="Questions"
        description="Manage quiz questions across all quizzes"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Questions' }]}
        actions={
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Add Question
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        searchKey="text"
        searchPlaceholder="Search questions..."
        exportFilename="questions"
        onBulkDelete={(rows) => {
          const ids = new Set(rows.map((r) => r.id));
          setData((prev) => prev.filter((q) => !ids.has(q.id)));
          toast.success(`Deleted ${rows.length} question(s)`);
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete question?"
        description="This question will be permanently deleted."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            setData((prev) => prev.filter((q) => q.id !== deleteTarget.id));
            toast.success('Question deleted');
            setDeleteTarget(null);
          }
        }}
      />
    </DashboardShell>
  );
}
