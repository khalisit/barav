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

const generateBeautifulHtmlReport = (type: string, title: string, results: any, language: string) => {
  const isKu = language === 'ku';
  
  let summaryHtml = '';
  let tableHtml = '';
  
  if (type === 'revenue') {
    const revs = results.revenue || [];
    const exps = results.expenses || [];
    
    const sumByCurrency = (list: any[], currency: 'USD' | 'IQD') => 
      list.reduce((acc, item) => (item.currency || 'USD') === currency ? acc + Number(item.amount || 0) : acc, 0);

    const totalRevUsd = sumByCurrency(revs, 'USD');
    const totalRevIqd = sumByCurrency(revs, 'IQD');
    const totalExpUsd = sumByCurrency(exps, 'USD');
    const totalExpIqd = sumByCurrency(exps, 'IQD');
    const netUsd = totalRevUsd - totalExpUsd;
    const netIqd = totalRevIqd - totalExpIqd;
    
    summaryHtml = `
      <div class="summary">
        <div class="stat">
          <div class="stat-val">$${totalRevUsd.toLocaleString()}</div>
          <div class="stat-val" style="font-size: 16px; margin-top: 4px;">${totalRevIqd.toLocaleString()} IQD</div>
          <div class="stat-label">${isKu ? 'کۆی داهات' : 'Total Revenue'}</div>
        </div>
        <div class="stat">
          <div class="stat-val">$${totalExpUsd.toLocaleString()}</div>
          <div class="stat-val" style="font-size: 16px; margin-top: 4px;">${totalExpIqd.toLocaleString()} IQD</div>
          <div class="stat-label">${isKu ? 'کۆی خەرجی' : 'Total Expense'}</div>
        </div>
        <div class="stat">
          <div class="stat-val" style="color: ${netUsd >= 0 ? '#10B981' : '#EF4444'}">$${netUsd.toLocaleString()}</div>
          <div class="stat-val" style="color: ${netIqd >= 0 ? '#10B981' : '#EF4444'}; font-size: 16px; margin-top: 4px;">${netIqd.toLocaleString()} IQD</div>
          <div class="stat-label">${isKu ? 'قازانجی پوخت' : 'Net Profit'}</div>
        </div>
      </div>
    `;
    
    const rows = [
      ...revs.map((r: any) => ({ ...r, kind: isKu ? 'داهات' : 'Revenue', color: '#10B981' })),
      ...exps.map((e: any) => ({ ...e, kind: isKu ? 'خەرجی' : 'Expense', color: '#EF4444' }))
    ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    
    tableHtml = `
      <table class="table-container">
        <thead>
          <tr>
            <th>${isKu ? 'جۆر' : 'Type'}</th>
            <th>${isKu ? 'وردەکاری' : 'Description'}</th>
            <th>${isKu ? 'بڕ' : 'Amount'}</th>
            <th>${isKu ? 'بەروار' : 'Date'}</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(r => `
            <tr>
              <td style="color: ${r.color}; font-weight: bold;">${r.kind}</td>
              <td>${r.description || '-'}</td>
              <td dir="ltr" style="text-align: right; font-weight: 500;">${(r.currency || 'USD') === 'IQD' ? Number(r.amount).toLocaleString() + ' IQD' : '$' + Number(r.amount).toLocaleString()}</td>
              <td dir="ltr" style="text-align: right">${new Date(r.date || new Date()).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } else if (type === 'quizzes') {
    const quizzes = results.quizzes || [];
    
    summaryHtml = `
      <div class="summary">
        <div class="stat"><div class="stat-val">${quizzes.length}</div><div class="stat-label">${isKu ? 'کۆی کویزەکان' : 'Total Quizzes'}</div></div>
        <div class="stat"><div class="stat-val">${quizzes.filter((q: any) => q.status === 'live' || q.status === 'running').length}</div><div class="stat-label">${isKu ? 'کویزە چالاکەکان' : 'Active Quizzes'}</div></div>
      </div>
    `;
    
    tableHtml = `
      <table class="table-container">
        <thead>
          <tr>
            <th>${isKu ? 'ناونیشان' : 'Title'}</th>
            <th>${isKu ? 'ئاست' : 'Difficulty'}</th>
            <th>${isKu ? 'پرسیارەکان' : 'Questions'}</th>
            <th>${isKu ? 'بەروار' : 'Created At'}</th>
          </tr>
        </thead>
        <tbody>
          ${quizzes.map((q: any) => `
            <tr>
              <td style="font-weight: 500;">${q.title || '-'}</td>
              <td>${q.difficulty || '-'}</td>
              <td>${q.questionCount || 0}</td>
              <td dir="ltr" style="text-align: right">${new Date(q.createdAt || new Date()).toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  const html = `<!DOCTYPE html>
<html lang="${isKu ? 'ku' : 'en'}" dir="${isKu ? 'rtl' : 'ltr'}">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;800&display=swap');
    body { font-family: ${isKu ? "'Noto Sans Arabic', " : ""}system-ui, -apple-system, sans-serif; margin: 0; padding: 40px; color: #1f2937; background: #fff; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; }
    .title { font-size: 28px; font-weight: 800; color: #111; margin-bottom: 8px; }
    .date { font-size: 14px; color: #6b7280; }
    .table-container { width: 100%; border-collapse: collapse; margin-top: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th { background: #4F46E5; color: white; padding: 14px; text-align: ${isKu ? 'right' : 'left'}; font-weight: 600; font-size: 14px; }
    td { padding: 14px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    tr:nth-child(even) { background: #f9fafb; }
    .summary { margin-top: 20px; padding: 24px; background: #f3f4f6; border-radius: 12px; display: flex; justify-content: space-around; }
    .stat { text-align: center; }
    .stat-val { font-size: 28px; font-weight: 800; color: #4F46E5; }
    .stat-label { font-size: 13px; color: #6b7280; margin-top: 6px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .print-btn { position: fixed; top: 20px; ${isKu ? 'left' : 'right'}: 20px; padding: 10px 24px; background: #4F46E5; color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.4); transition: all 0.2s; }
    .print-btn:hover { background: #4338ca; transform: translateY(-1px); }
    @media print {
      @page { size: A4; margin: 15mm; }
      body { padding: 0; }
      .print-btn { display: none; }
      .table-container { box-shadow: none; }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">${isKu ? 'چاپکردن / خەزنکردن وەک PDF' : 'Print / Save PDF'}</button>
  <div class="header">
    <div class="title">${title}</div>
    <div class="date">${new Date().toLocaleDateString(isKu ? 'en-GB' : 'en-US')}</div>
  </div>
  ${summaryHtml}
  ${tableHtml}
  <div style="margin-top: 40px; text-align: center; font-size: 12px; color: #9ca3af;">
    Generated by BARAV QUIZ Admin Panel
  </div>
</body>
</html>`;

  return 'data:text/html;charset=utf-8,' + encodeURIComponent(html);
};

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

  const [formType, setFormType] = useState('revenue');
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

    if (type === 'revenue') {
      title = language === 'ku' ? 'ڕاپۆرتی داهات و خەرجی' : 'Financial Report';
      downloadUrl = generateBeautifulHtmlReport(
        type, 
        title, 
        { revenue: revenueResult?.data || [], expenses: expensesResult?.data || [] }, 
        language
      );
    } else if (type === 'quizzes') {
      title = language === 'ku' ? 'کارایی کویزەکان' : 'Quiz Completion Report';
      downloadUrl = generateBeautifulHtmlReport(
        type, 
        title, 
        { quizzes: quizzesResult?.data || [] }, 
        language
      );
    }

    createMutation.mutate({
      title,
      type,
      status: 'completed',
      format: 'PDF',
      downloadUrl
    });
  };

  const columns = useMemo<ColumnDef<Report>[]>(
    () => [
      {
        accessorKey: 'title',
        header: language === 'ku' ? 'ڕاپۆرت' : 'Report',
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{row.original.title}</span>
          </div>
        ),
      },
      {
        accessorKey: 'type',
        header: language === 'ku' ? 'جۆر' : 'Type',
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.type === 'revenue' && language === 'ku' ? 'داهات و خەرجی' :
             row.original.type === 'quizzes' && language === 'ku' ? 'کویزەکان' : row.original.type}
          </Badge>
        ),
      },
      {
        accessorKey: 'format',
        header: language === 'ku' ? 'فۆرمات' : 'Format',
        cell: ({ row }) => (
          <Badge variant="secondary" className="uppercase text-xs">PDF</Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: language === 'ku' ? 'دۆخ' : 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'createdAt',
        header: language === 'ku' ? 'دروستکراوە لە' : 'Generated',
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
                  const url = row.original.downloadUrl!;
                  if (url.startsWith('data:text/html')) {
                    try {
                      const htmlContent = decodeURIComponent(url.split(',')[1]);
                      const newWin = window.open('', '_blank');
                      if (newWin) {
                        newWin.document.open();
                        newWin.document.write(htmlContent);
                        newWin.document.close();
                      }
                    } catch (e) {
                      console.error('Error opening report:', e);
                    }
                  } else {
                    window.open(url, '_blank');
                  }
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
        title={language === 'ku' ? 'ڕاپۆرتەکان' : 'Reports'}
        description={language === 'ku' ? 'دروستکردن و داگرتنی ڕاپۆرتەکانی سیستەم' : 'Generate and download platform reports'}
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' }, { label: language === 'ku' ? 'ڕاپۆرتەکان' : 'Reports' }]}
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
                  <SelectItem value="revenue">{language === 'ku' ? 'ڕاپۆرتی داهات و خەرجی' : 'Financial Report'}</SelectItem>
                  <SelectItem value="quizzes">{language === 'ku' ? 'کایەکردن و کویزەکان' : 'Quiz Performance'}</SelectItem>
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
