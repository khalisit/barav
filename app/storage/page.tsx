'use client';

import { useMemo } from 'react';
import { HardDrive, FileImage, Mic, Video, Folder } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateMedia } from '@/lib/mock-data';
import { formatNumber } from '@/lib/format';

export default function StoragePage() {
  const media = useMemo(() => generateMedia(24), []);
  const totalSize = media.reduce((sum, m) => sum + m.size, 0);
  const totalGB = 50;
  const usedGB = Math.round((totalSize / 1024 / 1024) * 10) / 10;
  const usedPercent = Math.round((usedGB / totalGB) * 100);

  const breakdown = [
    { type: 'Images', icon: FileImage, size: Math.round(usedGB * 0.5 * 10) / 10, color: 'bg-primary', percent: 50 },
    { type: 'Audio', icon: Mic, size: Math.round(usedGB * 0.3 * 10) / 10, color: 'bg-success', percent: 30 },
    { type: 'Videos', icon: Video, size: Math.round(usedGB * 0.15 * 10) / 10, color: 'bg-info', percent: 15 },
    { type: 'Other', icon: Folder, size: Math.round(usedGB * 0.05 * 10) / 10, color: 'bg-warning', percent: 5 },
  ];

  return (
    <DashboardShell>
      <PageHeader
        title="Storage"
        description="Monitor and manage platform storage usage"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Storage' }]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Storage Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative flex h-40 w-40 items-center justify-center"
            >
              <svg className="h-40 w-40 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--primary))" strokeWidth="8"
                  strokeDasharray={`${usedPercent * 2.64} 264`}
                  strokeLinecap="round"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-3xl font-bold">{usedPercent}%</p>
                <p className="text-xs text-muted-foreground">used</p>
              </div>
            </motion.div>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium">{usedGB} GB of {totalGB} GB</p>
              <p className="text-xs text-muted-foreground">{totalGB - usedGB} GB available</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Storage Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {breakdown.map((item, i) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.type}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="mb-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{item.type}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{item.size} GB</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                  </div>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Recent Files</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {media.slice(0, 10).map((file, i) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
            >
              <HardDrive className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm font-medium">{file.name}</span>
              <span className="text-xs text-muted-foreground">{formatNumber(file.size)} KB</span>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
