'use client';

import { useState, useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Download, FileBarChart, Calendar } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateReports } from '@/lib/mock-data';
import type { Report } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

export default function ReportsPage() {
  const [data] = useState<Report[]>(() => generateReports(10));

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
          <Badge variant="outline" className="capitalize">{row.original.type}</Badge>
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
        cell: ({ row }) =>
          row.original.downloadUrl ? (
            <Button variant="outline" size="sm" onClick={() => toast.success('Downloading report...')}>
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Unavailable</span>
          ),
      },
    ],
    []
  );

  const quickReports = [
    { label: 'User Report', desc: 'All users with activity stats', icon: 'users' },
    { label: 'Revenue Report', desc: 'Monthly revenue breakdown', icon: 'revenue' },
    { label: 'Quiz Performance', desc: 'Quiz completion and scores', icon: 'performance' },
    { label: 'Engagement Report', desc: 'User engagement metrics', icon: 'engagement' },
  ];

  return (
    <DashboardShell>
      <PageHeader
        title="Reports"
        description="Generate and download platform reports"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Reports' }]}
        actions={
          <Button onClick={() => toast.info('Report builder would open here')}>
            <Plus className="mr-2 h-4 w-4" /> Generate Report
          </Button>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickReports.map((r) => (
          <Card key={r.label} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => toast.success(`Generating ${r.label}...`)}>
            <CardContent className="p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold">{r.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataTable columns={columns} data={data} searchKey="title" searchPlaceholder="Search reports..." exportFilename="reports" />
    </DashboardShell>
  );
}
