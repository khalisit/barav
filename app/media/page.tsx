'use client';

import { useState, useMemo } from 'react';
import { Image as ImageIcon, Mic, Video, Upload, Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateMedia } from '@/lib/mock-data';
import type { MediaItem } from '@/lib/types';
import { timeAgo } from '@/lib/format';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const typeIcons = {
  image: ImageIcon,
  audio: Mic,
  video: Video,
};

const typeColors = {
  image: 'bg-primary/10 text-primary',
  audio: 'bg-success/10 text-success',
  video: 'bg-info/10 text-info',
};

export default function MediaPage() {
  const [media, setMedia] = useState<MediaItem[]>(() => generateMedia(24));
  const [filter, setFilter] = useState<'all' | 'image' | 'audio' | 'video'>('all');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);

  const filtered = useMemo(
    () => media.filter((m) => {
      const typeMatch = filter === 'all' || m.type === filter;
      const searchMatch = m.name.toLowerCase().includes(search.toLowerCase());
      return typeMatch && searchMatch;
    }),
    [media, filter, search]
  );

  return (
    <DashboardShell>
      <PageHeader
        title="Media Library"
        description="Upload and manage images, audio, and video assets"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Media' }]}
        actions={
          <Button onClick={() => toast.info('File upload dialog would open here')}>
            <Upload className="mr-2 h-4 w-4" /> Upload
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="image">Images</TabsTrigger>
            <TabsTrigger value="audio">Audio</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search media..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {filtered.map((item, i) => {
          const Icon = typeIcons[item.type];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.02 }}
            >
              <Card className="group relative overflow-hidden">
                <CardContent className="p-0">
                  <div className={cn('flex h-32 items-center justify-center', typeColors[item.type])}>
                    <Icon className="h-10 w-10" />
                  </div>
                  <div className="p-3">
                    <p className="truncate text-xs font-medium">{item.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <Badge variant="secondary" className="text-[10px] capitalize">{item.type}</Badge>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(item.uploadedAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-background/80 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete media file?"
        description={`"${deleteTarget?.name}" will be permanently deleted.`}
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) {
            setMedia((prev) => prev.filter((m) => m.id !== deleteTarget.id));
            toast.success('Media deleted');
            setDeleteTarget(null);
          }
        }}
      />
    </DashboardShell>
  );
}
