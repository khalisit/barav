'use client';

import { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ScrollText } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { Badge } from '@/components/ui/badge';
import { generateAuditLogs } from '@/lib/mock-data';
import type { AuditLog } from '@/lib/types';
import { formatDateTime } from '@/lib/format';

export default function AuditLogsPage() {
  const [data] = useState<AuditLog[]>(() => generateAuditLogs(30));

  const columns = useMemo<ColumnDef<AuditLog>[]>(
    () => [
      {
        accessorKey: 'userName',
        header: 'User',
        cell: ({ row }) => <span className="font-medium">{row.original.userName}</span>,
      },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: ({ row }) => (
          <Badge variant="outline" className="font-mono text-xs">
            {row.original.action}
          </Badge>
        ),
      },
      {
        accessorKey: 'resource',
        header: 'Resource',
        cell: ({ row }) => <span className="text-sm">{row.original.resource}</span>,
      },
      {
        accessorKey: 'resourceId',
        header: 'Resource ID',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.resourceId}</span>
        ),
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP Address',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">{row.original.ipAddress}</span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Timestamp',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>
        ),
      },
    ],
    []
  );

  return (
    <DashboardShell>
      <PageHeader
        title="Audit Logs"
        description="Track all administrative actions on the platform"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Audit Logs' }]}
      />
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-info/20 bg-info/5 px-4 py-3">
        <ScrollText className="h-4 w-4 text-info" />
        <p className="text-sm text-muted-foreground">
          Logs are retained for 90 days. Export for long-term archival.
        </p>
      </div>
      <DataTable columns={columns} data={data} searchKey="userName" searchPlaceholder="Search by user..." exportFilename="audit-logs" />
    </DashboardShell>
  );
}
