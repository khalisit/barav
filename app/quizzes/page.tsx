'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Pencil, Archive, Play, Square, Trash2, Plus, Send } from 'lucide-react';
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
import { generateQuizzes } from '@/lib/mock-data';
import type { Quiz, QuizStatus } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

export default function QuizzesPage() {
  const [data, setData] = useState<Quiz[]>(() => generateQuizzes(30));
  const [deleteTarget, setDeleteTarget] = useState<Quiz | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<Quiz | null>(null);
  const [publishTarget, setPublishTarget] = useState<Quiz | null>(null);
  const [startTarget, setStartTarget] = useState<Quiz | null>(null);
  const [endTarget, setEndTarget] = useState<Quiz | null>(null);

  const updateStatus = (id: string, status: QuizStatus) => {
    setData((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
  };

  const columns = useMemo<ColumnDef<Quiz>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Quiz',
        cell: ({ row }) => (
          <div>
            <Link href={`/quizzes/${row.original.id}`} className="font-medium text-foreground hover:text-primary">
              {row.original.title}
            </Link>
            <p className="text-xs text-muted-foreground">{row.original.categoryName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'difficulty',
        header: 'Difficulty',
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
            {row.original.difficulty}
          </Badge>
        ),
      },
      {
        accessorKey: 'questionCount',
        header: 'Questions',
        cell: ({ row }) => <span className="text-sm">{row.original.questionCount}</span>,
      },
      {
        accessorKey: 'participantCount',
        header: 'Participants',
        cell: ({ row }) => <span className="text-sm">{row.original.participantCount}</span>,
      },
      {
        accessorKey: 'duration',
        header: 'Duration',
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{row.original.duration} min</span>,
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
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <Link href={`/quizzes/${row.original.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> View
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/quizzes/${row.original.id}/edit`}>
                  <Pencil className="mr-2 h-4 w-4" /> Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {row.original.status === 'draft' && (
                <DropdownMenuItem onClick={() => setPublishTarget(row.original)}>
                  <Send className="mr-2 h-4 w-4" /> Publish
                </DropdownMenuItem>
              )}
              {row.original.status === 'published' && (
                <DropdownMenuItem onClick={() => setStartTarget(row.original)}>
                  <Play className="mr-2 h-4 w-4" /> Start
                </DropdownMenuItem>
              )}
              {row.original.status === 'running' && (
                <DropdownMenuItem onClick={() => setEndTarget(row.original)}>
                  <Square className="mr-2 h-4 w-4" /> End
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setArchiveTarget(row.original)}>
                <Archive className="mr-2 h-4 w-4" /> Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
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
        title="Quizzes"
        description="Create and manage quiz content"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Quizzes' }]}
        actions={
          <Button asChild>
            <Link href="/quizzes/create">
              <Plus className="mr-2 h-4 w-4" /> Create Quiz
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        searchKey="title"
        searchPlaceholder="Search quizzes..."
        exportFilename="quizzes"
        onBulkDelete={(rows) => {
          const ids = new Set(rows.map((r) => r.id));
          setData((prev) => prev.filter((q) => !ids.has(q.id)));
          toast.success(`Deleted ${rows.length} quiz(zes)`);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete quiz?"
        description={`"${deleteTarget?.title}" will be permanently deleted.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            setData((prev) => prev.filter((q) => q.id !== deleteTarget.id));
            toast.success('Quiz deleted');
            setDeleteTarget(null);
          }
        }}
      />
      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(o) => !o && setArchiveTarget(null)}
        title="Archive quiz?"
        description={`"${archiveTarget?.title}" will be moved to the archive.`}
        confirmLabel="Archive"
        onConfirm={() => {
          if (archiveTarget) {
            updateStatus(archiveTarget.id, 'archived');
            toast.success('Quiz archived');
            setArchiveTarget(null);
          }
        }}
      />
      <ConfirmDialog
        open={!!publishTarget}
        onOpenChange={(o) => !o && setPublishTarget(null)}
        title="Publish quiz?"
        description={`"${publishTarget?.title}" will be available to all users.`}
        confirmLabel="Publish"
        variant="default"
        onConfirm={() => {
          if (publishTarget) {
            updateStatus(publishTarget.id, 'published');
            toast.success('Quiz published');
            setPublishTarget(null);
          }
        }}
      />
      <ConfirmDialog
        open={!!startTarget}
        onOpenChange={(o) => !o && setStartTarget(null)}
        title="Start quiz?"
        description={`"${startTarget?.title}" will go live immediately.`}
        confirmLabel="Start"
        variant="default"
        onConfirm={() => {
          if (startTarget) {
            updateStatus(startTarget.id, 'running');
            toast.success('Quiz started');
            setStartTarget(null);
          }
        }}
      />
      <ConfirmDialog
        open={!!endTarget}
        onOpenChange={(o) => !o && setEndTarget(null)}
        title="End quiz?"
        description={`"${endTarget?.title}" will be stopped immediately.`}
        confirmLabel="End"
        onConfirm={() => {
          if (endTarget) {
            updateStatus(endTarget.id, 'finished');
            toast.success('Quiz ended');
            setEndTarget(null);
          }
        }}
      />
    </DashboardShell>
  );
}
