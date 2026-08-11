'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { HardDrive, FileImage, Video, Folder, Shapes } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api-client';
import { useLanguage } from '@/hooks/use-language';
interface StorageStats {
  success: boolean;
  data: {
    totalBytes: number;
    totalFiles: number;
    storageLimitBytes: number;
    usagePercentage: number;
    images: { bytes: number; files: number };
    videos: { bytes: number; files: number };
    other: { bytes: number; files: number };
  };
}

export default function StoragePage() {
  const { language } = useLanguage();
  const { data: statsResult, isLoading } = useQuery<StorageStats>({
    queryKey: ['storage-stats'],
    queryFn: () => api.get('/admin/storage/stats'),
    refetchOnWindowFocus: true
  });

  const stats = statsResult?.data;
  
  const totalSizeBytes = stats?.totalBytes || 0;
  const totalLimitBytes = stats?.storageLimitBytes || (50 * 1024 * 1024 * 1024);
  const usedPercent = stats?.usagePercentage ? Math.round(stats.usagePercentage) : 0;

  // Format file size dynamically
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const imagesBytes = stats?.images.bytes || 0;
  const videosBytes = stats?.videos.bytes || 0;
  const otherBytes = stats?.other.bytes || 0;

  const breakdown = useMemo(() => [
    {
      type: language === 'ku' ? 'وێنەکان' : 'Images',
      icon: FileImage,
      size: formatBytes(imagesBytes),
      color: 'bg-primary',
      percent: totalSizeBytes > 0 ? (imagesBytes / totalSizeBytes) * 100 : 0
    },
    {
      type: language === 'ku' ? 'ڤیدیۆکان' : 'Videos',
      icon: Video,
      size: formatBytes(videosBytes),
      color: 'bg-info',
      percent: totalSizeBytes > 0 ? (videosBytes / totalSizeBytes) * 100 : 0
    },
    {
      type: language === 'ku' ? 'هیتر' : 'Other',
      icon: Folder,
      size: formatBytes(otherBytes),
      color: 'bg-muted-foreground',
      percent: totalSizeBytes > 0 ? (otherBytes / totalSizeBytes) * 100 : 0
    },
  ], [language, imagesBytes, videosBytes, otherBytes, totalSizeBytes]);

  if (isLoading) {
    return (
      <DashboardShell>
        <PageHeader title="Storage" description={language === 'ku' ? 'بارکردنی کۆگا...' : 'Loading storage...'} />
      </DashboardShell>
    );
  }

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
            <CardTitle className="text-base">{language === 'ku' ? 'کورتەی کۆگا' : 'Storage Overview'}</CardTitle>
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
                <p className="text-xs text-muted-foreground">{language === 'ku' ? 'بەکارهێنراو' : 'used'}</p>
              </div>
            </motion.div>
            <div className="mt-4 text-center">
              <p className="text-sm font-medium">
                {formatBytes(totalSizeBytes)} {language === 'ku' ? 'لە کۆی ٥٠ گێگابایت' : 'of 50 GB'}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatBytes(totalLimitBytes - totalSizeBytes)} {language === 'ku' ? 'بەردەستە' : 'available'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{language === 'ku' ? 'وردەکاری کۆگا' : 'Storage Breakdown'}</CardTitle>
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
                    <span className="text-sm text-muted-foreground">{item.size}</span>
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

    </DashboardShell>
  );
}
