'use client';

import { Loader2 } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';

export default function Loading() {
  return (
    <DashboardShell>
      <PageHeader 
        title="Loading..." 
        description="Please wait while we fetch your data." 
      />
      <div className="flex h-[400px] w-full items-center justify-center rounded-md border border-dashed mt-6">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading contents...</p>
        </div>
      </div>
    </DashboardShell>
  );
}
