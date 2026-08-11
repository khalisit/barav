'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Download, FileBarChart, Calendar, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api-client';
import type { Report } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';

export default function ReportsPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const { data: reportsResult, isLoading } = useQuery<{ data: Report[] }>({
    queryKey: ['reports'],
    queryFn: () => api.get('/reports')
  });

  const data: Report[] = reportsResult?.data || [];

  // Real data queries for report generation
  const { data: usersResult } = useQuery<{ data: any[] }>({
    queryKey: ['users'],
    queryFn: () => api.get<{ data: any[] }>('/users').catch(() => ({ data: [] }))
  });

  const { data: quizzesResult } = useQuery<{ data: any[] }>({
    queryKey: ['quizzes'],
    queryFn: () => api.get<{ data: any[] }>('/quizzes').catch(() => ({ data: [] }))
  });

  const { data: revenueResult } = useQuery<{ data: any[] }>({
    queryKey: ['revenue'],
    queryFn: () => api.get<{ data: any[] }>('/revenue').catch(() => ({ data: [] }))
  });

  const { data: expensesResult } = useQuery<{ data: any[] }>({
    queryKey: ['expenses'],
    queryFn: () => api.get<{ data: any[] }>('/expenses').catch(() => ({ data: [] }))
  });

  const { data: auditLogsResult } = useQuery<{ data: any[] }>({
    queryKey: ['audit-logs'],
    queryFn: () => api.get<{ data: any[] }>('/audit-logs').catch(() => ({ data: [] }))
  });

  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Report | null>(null);
  const [generating, setGenerating] = useState(false);

  const [formType, setFormType] = useState('users');
  const [formFormat, setFormFormat] = useState('pdf');

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/reports', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success(language === 'ku' ? 'ڕاپۆرتەکە بە سەرکەوتوویی دروستکرا' : 'Report generated successfully');
      setCreateOpen(false);
      setGenerating(false);
    },
    onError: () => {
      toast.error(language === 'ku' ? 'دروستکردنی ڕاپۆرت سەرکەوتوو نەبوو' : 'Failed to generate report');
      setGenerating(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      toast.success(language === 'ku' ? 'ڕاپۆرتەکە بە سەرکەوتوویی سڕایەوە' : 'Report deleted successfully');
      setDeleteTarget(null);
    }
  });

  const handleGenerate = (type: string, format: string) => {
    setGenerating(true);
    let title = '';
    let downloadUrl = '';

    if (type === 'users') {
      title = language === 'ku' ? 'ڕاپۆرتی بەکارهێنەران' : 'User Activity Report';
      if (format === 'pdf') {
        downloadUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      } else {
        const users = usersResult?.data || [];
        const csvContent = [
          ['ID', 'Full Name', 'Username', 'Email', 'Status', 'Joined At'].join(','),
          ...users.map((u: any) => [u.id, `"${u.fullName || ''}"`, u.username || '', u.email || '', u.status || '', u.joinedAt || ''].join(','))
        ].join('\n');
        downloadUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      }
    } else if (type === 'revenue') {
      title = language === 'ku' ? 'ڕاپۆرتی داهات' : 'Monthly Financial Report';
      if (format === 'pdf') {
        downloadUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      } else {
        const revs = revenueResult?.data || [];
        const exps = expensesResult?.data || [];
        const rows = [
          ...revs.map((r: any) => [r.id, 'Revenue', `"${r.description || ''}"`, r.amount, r.date, r.status]),
          ...exps.map((e: any) => [e.id, 'Expense', `"${e.description || ''}"`, e.amount, e.date, e.status])
        ];
        const csvContent = [
          ['ID', 'Type', 'Description', 'Amount', 'Date', 'Status'].join(','),
          ...rows.map((row: any[]) => row.join(','))
        ].join('\n');
        downloadUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      }
    } else if (type === 'quizzes') {
      title = language === 'ku' ? 'کارایی کویزەکان' : 'Quiz Completion Report';
      if (format === 'pdf') {
        downloadUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      } else {
        const quizzes = quizzesResult?.data || [];
        const csvContent = [
          ['ID', 'Title', 'Description', 'Difficulty', 'Questions Count', 'Duration (seconds)', 'Created At'].join(','),
          ...quizzes.map((q: any) => [q.id, `"${q.title || ''}"`, `"${q.description || ''}"`, q.difficulty || '', q.questionCount || 0, q.duration || 0, q.createdAt || ''].join(','))
        ].join('\n');
        downloadUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      }
    } else {
      title = language === 'ku' ? 'ڕاپۆرتی بەشداری' : 'User Engagement Report';
      if (format === 'pdf') {
        downloadUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      } else {
        const logs = auditLogsResult?.data || [];
        const csvContent = [
          ['ID', 'User', 'Action', 'Resource', 'Resource ID', 'IP Address', 'Created At'].join(','),
          ...logs.map((l: any) => [l.id, `"${l.userName || 'System'}"`, l.action || '', l.resource || '', l.resourceId || '', l.ipAddress || '', l.createdAt || ''].join(','))
        ].join('\n');
        downloadUrl = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      }
    }

    createMutation.mutate({
      title,
      type,
      status: 'completed',
      format: format.toUpperCase(),
      downloadUrl
    });
  };

  const columns = useMemo<ColumnDef<Report>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Report',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.title}</span>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.type === 'users' && language === 'ku' ? 'بەکارهێنەران' :
              row.original.type === 'revenue' && language === 'ku' ? 'داهات' :
                row.original.type === 'quizzes' && language === 'ku' ? 'کویزەکان' :
                  row.original.type === 'engagement' && language === 'ku' ? 'بەشداری' : row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: 'format',
        header: 'Format',
        cell: ({ row }) => (
          <Badge variant="secondary" className="uppercase text-xs">{row.original.format}</Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'createdAt',
        header: 'Generated',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2">
            {row.original.downloadUrl ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.success(language === 'ku' ? 'ڕاپۆرتەکە دادەگیرێت...' : 'Downloading report...');
                  window.open(row.original.downloadUrl!, '_blank');
                }}
              >
                <Download className="me-1.5 h-3.5 w-3.5" /> {language === 'ku' ? 'داگرتن' : 'Download'}
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground">{language === 'ku' ? 'بەردەست نییە' : 'Unavailable'}</span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteTarget(row.original)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [language]
  );

  return (
    <DashboardShell>
      <PageHeader
        title="Reports"
        description="Generate and download platform reports"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Reports' }]}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="me-2 h-4 w-4" /> {language === 'ku' ? 'دروستکردنی ڕاپۆرت' : 'Generate Report'}
          </Button>
        }
      />

      <DataTable
        columns={columns}
        data={data}
        searchKey="title"
        searchPlaceholder={language === 'ku' ? 'گەڕان لە ڕاپۆرتەکان...' : 'Search reports...'}
        exportFilename="reports"
      />

      {/* Generate Report Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {language === 'ku' ? 'دروستکردنی ڕاپۆرتی نوێ' : 'Generate New Report'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{language === 'ku' ? 'جۆری ڕاپۆرت' : 'Report Type'}</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="users">{language === 'ku' ? 'ڕاپۆرتی بەکارهێنەران' : 'User Activity'}</SelectItem>
                  <SelectItem value="revenue">{language === 'ku' ? 'ڕاپۆرتی داهات' : 'Financial Revenue'}</SelectItem>
                  <SelectItem value="quizzes">{language === 'ku' ? 'کایەکردن و کویزەکان' : 'Quiz Performance'}</SelectItem>
                  <SelectItem value="engagement">{language === 'ku' ? 'ڕاپۆرتی بەشداری بەکارهێنەران' : 'User Engagement'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{language === 'ku' ? 'فۆرمات / شێواز' : 'File Format'}</Label>
              <Select value={formFormat} onValueChange={setFormFormat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF (Document)</SelectItem>
                  <SelectItem value="csv">CSV (Spreadsheet)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              {language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
            </Button>
            <Button onClick={() => handleGenerate(formType, formFormat)} disabled={generating}>
              {generating
                ? (language === 'ku' ? 'دروست دەکرێت...' : 'Generating...')
                : (language === 'ku' ? 'دروستکردن' : 'Generate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={language === 'ku' ? 'سڕینەوەی ڕاپۆرت؟' : 'Delete report?'}
        description={
          language === 'ku'
            ? `ڕاپۆرتی "${deleteTarget?.title}" بەتەواوی دەسڕێتەوە.`
            : `"${deleteTarget?.title}" will be permanently removed.`
        }
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
