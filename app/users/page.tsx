'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, Eye, Ban, Trash2, UserPlus } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { DataTable } from '@/components/shared/data-table';
import { StatusBadge } from '@/components/shared/status-badge';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { generateUsers } from '@/lib/mock-data';
import type { User } from '@/lib/types';
import { formatDate, getInitials } from '@/lib/format';
import { toast } from 'sonner';

export default function UsersPage() {
  const [data, setData] = useState<User[]>(() => generateUsers(50));
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [banTarget, setBanTarget] = useState<User | null>(null);

  const columns = useMemo<ColumnDef<User>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'User',
        cell: ({ row }) => {
          const user = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link href={`/users/${user.id}`} className="font-medium text-foreground hover:text-primary">
                  {user.name}
                </Link>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.role.replace('_', ' ')}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'quizzesPlayed',
        header: 'Played',
        cell: ({ row }) => (
          <span className="text-sm">{row.original.quizzesPlayed}</span>
        ),
      },
      {
        accessorKey: 'quizzesWon',
        header: 'Won',
        cell: ({ row }) => (
          <span className="text-sm font-medium text-success">
            {row.original.quizzesWon}
          </span>
        ),
      },
      {
        accessorKey: 'totalPoints',
        header: 'Points',
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.totalPoints.toLocaleString()}</span>
        ),
      },
      {
        accessorKey: 'joinedAt',
        header: 'Joined',
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(row.original.joinedAt)}
          </span>
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
                <Link href={`/users/${row.original.id}`}>
                  <Eye className="mr-2 h-4 w-4" /> View details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setBanTarget(row.original)}
                disabled={row.original.status === 'banned'}
              >
                <Ban className="mr-2 h-4 w-4" /> Ban user
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
        title="Users"
        description="Manage all users on the platform"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Users' }]}
        actions={
          <Button>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={data}
        searchKey="name"
        searchPlaceholder="Search users..."
        exportFilename="users"
        onBulkDelete={(rows) => {
          const ids = new Set(rows.map((r) => r.id));
          setData((prev) => prev.filter((u) => !ids.has(u.id)));
          toast.success(`Deleted ${rows.length} user(s)`);
        }}
      />
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete user?"
        description={`This will permanently delete ${deleteTarget?.name}. This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            setData((prev) => prev.filter((u) => u.id !== deleteTarget.id));
            toast.success(`User ${deleteTarget.name} deleted`);
            setDeleteTarget(null);
          }
        }}
      />
      <ConfirmDialog
        open={!!banTarget}
        onOpenChange={(o) => !o && setBanTarget(null)}
        title="Ban user?"
        description={`${banTarget?.name} will no longer be able to access the platform.`}
        confirmLabel="Ban"
        onConfirm={() => {
          if (banTarget) {
            setData((prev) =>
              prev.map((u) => (u.id === banTarget.id ? { ...u, status: 'banned' } : u))
            );
            toast.success(`User ${banTarget.name} banned`);
            setBanTarget(null);
          }
        }}
      />
    </DashboardShell>
  );
}
