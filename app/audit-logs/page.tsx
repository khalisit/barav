'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ScrollText, Trash2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api-client';
import type { AuditLog } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { useLanguage } from '@/hooks/use-language';
import { toast } from 'sonner';

const translateAction = (action: string, language: string) => {
  if (language !== 'ku') return action;
  if (action === 'CREATE') return 'دروستکردن';
  if (action === 'UPDATE') return 'نوێکردنەوە';
  if (action === 'DELETE') return 'سڕینەوە';
  if (action === 'PUBLISH') return 'بڵاوکردنەوە';
  if (action === 'ARCHIVE') return 'ئەرشیفکردن';
  if (action === 'UPLOAD_AVATAR' || action === 'UPDATE_AVATAR') return 'گۆڕینی ئەڤەتار';
  if (action === 'CREATE_RECEIPT') return 'دروستکردنی پسوولە';
  if (action === 'DELETE_RECEIPT') return 'سڕینەوەی پسوولە';
  if (action === 'UPLOAD_MEDIA') return 'بارکردنی مێدیا';
  if (action === 'DELETE_MEDIA') return 'سڕینەوەی مێدیا';
  if (action.startsWith('UPDATE_STATUS')) {
    const status = action.split('(')[1]?.replace(')', '');
    const statusKu = status === 'banned' ? 'بلۆککرا' : status === 'active' ? 'چالاککرا' : status === 'deleted' ? 'سڕایەوە' : status;
    return `گۆڕینی دۆخ (${statusKu})`;
  }
  return action;
};

const translateResource = (resource: string, language: string) => {
  if (language !== 'ku') return resource;
  const map: Record<string, string> = {
    'User': 'بەکارهێنەر',
    'Quiz': 'کویز',
    'Question': 'پرسیار',
    'Category': 'هاوپۆل',
    'Sponsor': 'سپۆنسەر',
    'Admin': 'ئەدمین',
    'Notification': 'ئاگادارکەرەوە',
    'Receipt': 'پسوولە',
    'Storage': 'کۆگا',
  };
  return map[resource] || resource;
};

export default function AuditLogsPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedResource, setSelectedResource] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AuditLog | null>(null);
  const [bulkDeleteTargets, setBulkDeleteTargets] = useState<AuditLog[] | null>(null);

  const { data: fetchResult, isLoading } = useQuery<{ data: AuditLog[] }>({
    queryKey: ['audit-logs'],
    queryFn: () => api.get('/audit-logs')
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/audit-logs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success(language === 'ku' ? 'لۆگەکە بە سەرکەوتوویی سڕایەوە' : 'Audit log deleted successfully');
      setDeleteTarget(null);
    },
    onError: () => {
      toast.error(language === 'ku' ? 'سڕینەوەی لۆگەکە سەرکەوتوو نەبوو' : 'Failed to delete audit log');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(ids.map(id => api.delete(`/audit-logs/${id}`)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
      toast.success(language === 'ku' ? 'لۆگە دیاریکراوەکان بە سەرکەوتوویی سڕانەوە' : 'Selected audit logs deleted successfully');
      setBulkDeleteTargets(null);
    },
    onError: () => {
      toast.error(language === 'ku' ? 'سڕینەوەی لۆگەکان سەرکەوتوو نەبوو' : 'Failed to delete selected audit logs');
    }
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data: AuditLog[] = fetchResult?.data || [];

  const filteredData = useMemo(() => {
    let list = data;
    if (selectedAction !== 'all') {
      list = list.filter(item => {
        if (selectedAction === 'UPDATE_STATUS') {
          return item.action.startsWith('UPDATE_STATUS');
        }
        return item.action === selectedAction;
      });
    }
    if (selectedResource !== 'all') {
      list = list.filter(item => item.resource === selectedResource);
    }
    if (startDate) {
      list = list.filter(item => item.createdAt.substring(0, 10) >= startDate);
    }
    if (endDate) {
      list = list.filter(item => item.createdAt.substring(0, 10) <= endDate);
    }
    return list;
  }, [data, selectedAction, selectedResource, startDate, endDate]);

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  };

  const handleBulkDeleteConfirm = () => {
    if (bulkDeleteTargets) {
      bulkDeleteMutation.mutate(bulkDeleteTargets.map(t => t.id));
    }
  };

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        accessorKey: 'userName',
        header: language === 'ku' ? 'ئەدمین' : 'User',
        cell: ({ row }) => <span className="font-medium">{row.original.userName}</span>,
      },
      {
        accessorKey: 'action',
        header: language === 'ku' ? 'کردار' : 'Action',
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {translateAction(row.original.action, language)}
          </Badge>
        ),
      },
      {
        accessorKey: 'resource',
        header: language === 'ku' ? 'بەش (سەرچاوە)' : 'Resource',
        cell: ({ row }) => <span className="text-sm font-medium">{translateResource(row.original.resource, language)}</span>,
      },
      {
        accessorKey: 'resourceId',
        header: language === 'ku' ? 'ناو / زانیاری' : 'Name / Details',
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.resourceId}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: language === 'ku' ? 'بەروار و کات' : 'Timestamp',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
        ),
      },
      {
        id: 'actions',
        header: language === 'ku' ? 'کردارەکان' : 'Actions',
        cell: ({ row }) => (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
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

  if (isLoading) {
    return <DashboardShell><PageHeader title={language === 'ku' ? 'لۆگەکانی چاودێری' : 'Audit Logs'} description={language === 'ku' ? 'چاوەڕێبە...' : 'Loading logs...'} /></DashboardShell>;
  }

  const isFiltered = selectedAction !== 'all' || selectedResource !== 'all' || startDate !== '' || endDate !== '';

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'لۆگەکانی چاودێری' : 'Audit Logs'}
        description={language === 'ku' ? 'چاودێری هەموو کردارەکانی ئەدمین بکە لەسەر پلاتفۆرمەکە' : 'Track all administrative actions on the platform'}
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' }, { label: language === 'ku' ? 'لۆگەکانی چاودێری' : 'Audit Logs' }]}
      />

      <div className="mb-4 flex items-center">
        <div className="flex items-center gap-1.5 rounded-full bg-info/10 px-3 py-1 text-xs font-semibold text-info">
          <span>{language === 'ku' ? 'کۆی گشتی لۆگەکان:' : 'Total Logs:'}</span>
          <span>{filteredData.length}</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="mb-4 flex flex-col gap-4 rounded-lg border bg-card p-4 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5 sm:max-w-[200px]">
          <span className="text-xs font-medium text-muted-foreground">
            {language === 'ku' ? 'پێشاندانی کردار:' : 'Filter Action:'}
          </span>
          <Select value={selectedAction} onValueChange={setSelectedAction}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ku' ? 'هەموو کردارەکان' : 'All Actions'}</SelectItem>
              <SelectItem value="CREATE">{language === 'ku' ? 'دروستکردن' : 'Create'}</SelectItem>
              <SelectItem value="UPDATE">{language === 'ku' ? 'نوێکردنەوە' : 'Update'}</SelectItem>
              <SelectItem value="DELETE">{language === 'ku' ? 'سڕینەوە' : 'Delete'}</SelectItem>
              <SelectItem value="PUBLISH">{language === 'ku' ? 'بڵاوکردنەوە' : 'Publish'}</SelectItem>
              <SelectItem value="ARCHIVE">{language === 'ku' ? 'ئەرشیفکردن' : 'Archive'}</SelectItem>
              <SelectItem value="UPDATE_STATUS">{language === 'ku' ? 'گۆڕینی دۆخ' : 'Status Update'}</SelectItem>
              <SelectItem value="UPLOAD_MEDIA">{language === 'ku' ? 'بارکردنی مێدیا' : 'Upload Media'}</SelectItem>
              <SelectItem value="DELETE_MEDIA">{language === 'ku' ? 'سڕینەوەی مێدیا' : 'Delete Media'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 sm:max-w-[200px]">
          <span className="text-xs font-medium text-muted-foreground">
            {language === 'ku' ? 'پێشاندانی بەش:' : 'Filter Resource:'}
          </span>
          <Select value={selectedResource} onValueChange={setSelectedResource}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{language === 'ku' ? 'هەموو بەشەکان' : 'All Resources'}</SelectItem>
              <SelectItem value="User">{language === 'ku' ? 'بەکارهێنەر' : 'User'}</SelectItem>
              <SelectItem value="Quiz">{language === 'ku' ? 'کویز' : 'Quiz'}</SelectItem>
              <SelectItem value="Question">{language === 'ku' ? 'پرسیار' : 'Question'}</SelectItem>
              <SelectItem value="Category">{language === 'ku' ? 'هاوپۆل' : 'Category'}</SelectItem>
              <SelectItem value="Sponsor">{language === 'ku' ? 'سپۆنسەر' : 'Sponsor'}</SelectItem>
              <SelectItem value="Notification">{language === 'ku' ? 'ئاگادارکەرەوە' : 'Notification'}</SelectItem>
              <SelectItem value="Receipt">{language === 'ku' ? 'پسوولە' : 'Receipt'}</SelectItem>
              <SelectItem value="Storage">{language === 'ku' ? 'کۆگا' : 'Storage'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 sm:max-w-[150px]">
          <span className="text-xs font-medium text-muted-foreground">
            {language === 'ku' ? 'لە ڕێکەوتی:' : 'From Date:'}
          </span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full text-xs h-9"
          />
        </div>

        <div className="flex flex-1 flex-col gap-1.5 sm:max-w-[150px]">
          <span className="text-xs font-medium text-muted-foreground">
            {language === 'ku' ? 'بۆ ڕێکەوتی:' : 'To Date:'}
          </span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full text-xs h-9"
          />
        </div>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => {
              setSelectedAction('all');
              setSelectedResource('all');
              setStartDate('');
              setEndDate('');
            }}
            className="text-xs text-destructive hover:bg-destructive/10 h-9"
            size="sm"
          >
            {language === 'ku' ? 'پاککردنەوە' : 'Clear'}
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        searchKey="userName"
        searchPlaceholder={language === 'ku' ? 'گەڕان بەپێی بەکارهێنەر...' : 'Search by user...'}
        exportFilename="audit-logs"
        onBulkDelete={(rows) => setBulkDeleteTargets(rows)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={language === 'ku' ? 'سڕینەوەی لۆگ؟' : 'Delete log?'}
        description={
          language === 'ku'
            ? `ئایا دڵنیای لە سڕینەوەی ئەم لۆگی چاودێرییە؟ ئەم کردارە ناگەڕێتەوە.`
            : `Are you sure you want to delete this audit log entry? This action cannot be undone.`
        }
        confirmLabel={language === 'ku' ? 'بسڕەوە' : 'Delete'}
        onConfirm={handleDeleteConfirm}
      />

      <ConfirmDialog
        open={!!bulkDeleteTargets}
        onOpenChange={(o) => !o && setBulkDeleteTargets(null)}
        title={language === 'ku' ? 'سڕینەوەی دیاریکراوەکان؟' : 'Delete selected?'}
        description={
          language === 'ku'
            ? `ئایا دڵنیای لە سڕینەوەی ئەم ${bulkDeleteTargets?.length || 0} لۆگەی چاودێرییە؟ ئەم کردارە ناگەڕێتەوە.`
            : `Are you sure you want to delete these ${bulkDeleteTargets?.length || 0} audit log entries? This action cannot be undone.`
        }
        confirmLabel={language === 'ku' ? 'بسڕەوە' : 'Delete'}
        onConfirm={handleBulkDeleteConfirm}
      />
    </DashboardShell>
  );
}
