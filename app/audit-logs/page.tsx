'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import { ScrollText } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api-client';
import type { AuditLog } from '@/lib/types';
import { formatDateTime } from '@/lib/format';
import { useLanguage } from '@/hooks/use-language';

const translateAction = (action: string, language: string) => {
  if (language !== 'ku') return action;
  if (action === 'CREATE') return 'دروستکردن';
  if (action === 'UPDATE') return 'نوێکردنەوە';
  if (action === 'DELETE') return 'سڕینەوە';
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
  };
  return map[resource] || resource;
};

export default function AuditLogsPage() {
  const { language } = useLanguage();
  const { data: fetchResult, isLoading } = useQuery<{ data: AuditLog[] }>({
    queryKey: ['audit-logs'],
    queryFn: () => api.get('/audit-logs')
  });

  const data: AuditLog[] = fetchResult?.data || [];

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
    ],
    [language]
  );

  if (isLoading) {
    return <DashboardShell><PageHeader title={language === 'ku' ? 'لۆگەکانی چاودێری' : 'Audit Logs'} description={language === 'ku' ? 'چاوەڕێبە...' : 'Loading logs...'} /></DashboardShell>;
  }

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'لۆگەکانی چاودێری' : 'Audit Logs'}
        description={language === 'ku' ? 'چاودێری هەموو کردارەکانی ئەدمین بکە لەسەر پلاتفۆرمەکە' : 'Track all administrative actions on the platform'}
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' }, { label: language === 'ku' ? 'لۆگەکانی چاودێری' : 'Audit Logs' }]}
      />
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-info/20 bg-info/5 px-4 py-3">
        <ScrollText className="h-4 w-4 text-info" />
        <p className="text-sm text-muted-foreground">
          {language === 'ku'
            ? 'لۆگەکان بۆ ماوەی ٩٠ ڕۆژ دەمێننەوە. هەناردەی بکە بۆ ئەرشیفکردنی درێژخایەن.'
            : 'Logs are retained for 90 days. Export for long-term archival.'}
        </p>
      </div>
      <DataTable
        columns={columns}
        data={data}
        searchKey="userName"
        searchPlaceholder={language === 'ku' ? 'گەڕان بەپێی بەکارهێنەر...' : 'Search by user...'}
        exportFilename="audit-logs"
      />
    </DashboardShell>
  );
}
