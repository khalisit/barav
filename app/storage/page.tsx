'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HardDrive, FileImage, Video, Folder, Trash2, Search, ExternalLink, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/api-client';
import { useLanguage } from '@/hooks/use-language';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';

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
    usedBytes?: number;
    usedFilesCount?: number;
    unusedBytes?: number;
    unusedFilesCount?: number;
  };
}

interface UploadedFile {
  key: string;
  size: number;
  uploaded: string;
  type: 'image' | 'video' | 'other';
  contentType: string;
  isUsed?: boolean;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://barav-backend.khalistanya.workers.dev/api';

const getMediaUrl = (key: string) => {
  try {
    const origin = new URL(API_URL).origin;
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    return `${origin}/media/${cleanKey}`;
  } catch (e) {
    const cleanKey = key.startsWith('/') ? key.slice(1) : key;
    return `https://barav-backend.khalistanya.workers.dev/media/${cleanKey}`;
  }
};

export default function StoragePage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [usageFilter, setUsageFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Selection & Bulk deletion states
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<UploadedFile | null>(null);
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  const { data: statsResult, isLoading: loadingStats } = useQuery<StorageStats>({
    queryKey: ['storage-stats'],
    queryFn: () => api.get('/admin/storage/overview'),
    refetchOnWindowFocus: true
  });

  const { data: filesResult, isLoading: loadingFiles, refetch: refetchFiles } = useQuery<{ success: boolean; data: UploadedFile[] }>({
    queryKey: ['storage-files'],
    queryFn: () => api.get('/admin/storage')
  });

  const deleteMutation = useMutation({
    mutationFn: (key: string) => api.delete(`/admin/storage?key=${encodeURIComponent(key)}`),
    onSuccess: () => {
      refetchFiles();
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      toast.success(language === 'ku' ? 'فایلەکە بە سەرکەوتوویی سڕایەوە' : 'File deleted successfully');
      setDeleteTarget(null);
      // Remove from selection if deleted
      setSelectedKeys(prev => prev.filter(k => k !== deleteTarget?.key));
    },
    onError: () => {
      toast.error(language === 'ku' ? 'سڕینەوەی فایلەکە سەرکەوتوو نەبوو' : 'Failed to delete file');
    }
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (keys: string[]) => api.delete('/admin/storage', { keys }),
    onSuccess: (res: any) => {
      refetchFiles();
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
      toast.success(
        language === 'ku'
          ? `${res?.message || 'سڕینەوەی فایلەکان سەرکەوتوو بوو'}`
          : `${res?.message || 'Selected files deleted successfully'}`
      );
      setSelectedKeys([]);
      setShowBulkConfirm(false);
    },
    onError: () => {
      toast.error(language === 'ku' ? 'سڕینەوەی بەکۆمەڵ سەرکەوتوو نەبوو' : 'Failed to bulk delete files');
    }
  });

  const stats = statsResult?.data;
  
  const totalSizeBytes = stats?.totalBytes || 0;
  const totalLimitBytes = stats?.storageLimitBytes || (50 * 1024 * 1024 * 1024);
  const usedPercent = stats?.usagePercentage ? Number(stats.usagePercentage.toFixed(2)) : 0;

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

  // System Reference Usage Statistics (Used vs Unused assets)
  const systemUsedBytes = stats?.usedBytes || 0;
  const systemUnusedBytes = stats?.unusedBytes || 0;
  const systemTotalBytes = systemUsedBytes + systemUnusedBytes || totalSizeBytes || 1;

  const systemBreakdown = useMemo(() => [
    {
      type: language === 'ku' ? 'فایلە بەکارهاتووەکان (چالاک)' : 'Used Files (Active)',
      icon: CheckCircle2,
      size: formatBytes(systemUsedBytes),
      count: stats?.usedFilesCount || 0,
      color: 'bg-emerald-500',
      percent: (systemUsedBytes / systemTotalBytes) * 100
    },
    {
      type: language === 'ku' ? 'فایلە بەکارنەهاتووەکان (زیادە)' : 'Unused Files (Orphaned)',
      icon: AlertCircle,
      size: formatBytes(systemUnusedBytes),
      count: stats?.unusedFilesCount || 0,
      color: 'bg-amber-500',
      percent: (systemUnusedBytes / systemTotalBytes) * 100
    }
  ], [language, systemUsedBytes, systemUnusedBytes, systemTotalBytes, stats]);

  const filtered = useMemo(() => {
    let list: UploadedFile[] = filesResult?.data || [];
    if (fileTypeFilter !== 'all') {
      list = list.filter((f: UploadedFile) => f.type === fileTypeFilter);
    }
    if (usageFilter !== 'all') {
      const wantUsed = usageFilter === 'used';
      list = list.filter((f: UploadedFile) => !!f.isUsed === wantUsed);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((f: UploadedFile) => f.key.toLowerCase().includes(q));
    }
    return list;
  }, [filesResult, fileTypeFilter, usageFilter, searchQuery]);

  const pageSize = 10;
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
    setSelectedKeys([]);
  };

  const handleFilterChange = (val: string) => {
    setFileTypeFilter(val);
    setCurrentPage(1);
    setSelectedKeys([]);
  };

  const handleUsageFilterChange = (val: string) => {
    setUsageFilter(val as 'all' | 'used' | 'unused');
    setCurrentPage(1);
    setSelectedKeys([]);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setSelectedKeys([]);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setSelectedKeys([]);
    }
  };

  const handleDeleteConfirm = () => {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.key);
    }
  };

  const handleBulkDeleteConfirm = () => {
    if (selectedKeys.length > 0) {
      bulkDeleteMutation.mutate(selectedKeys);
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image':
        return FileImage;
      case 'video':
        return Video;
      default:
        return Folder;
    }
  };

  // Checkbox selection utilities
  const toggleSelect = (key: string) => {
    setSelectedKeys(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const unusedFiltered = useMemo(() => {
    return filtered.filter(f => !f.isUsed);
  }, [filtered]);

  const isAllUnusedSelected = useMemo(() => {
    return unusedFiltered.length > 0 && unusedFiltered.every(f => selectedKeys.includes(f.key));
  }, [unusedFiltered, selectedKeys]);

  const toggleSelectAllUnused = () => {
    if (isAllUnusedSelected) {
      // Remove all unused keys from selection
      const unusedKeys = unusedFiltered.map(f => f.key);
      setSelectedKeys(prev => prev.filter(k => !unusedKeys.includes(k)));
    } else {
      // Add all unused keys to selection
      const unusedKeys = unusedFiltered.map(f => f.key);
      setSelectedKeys(prev => {
        const union = new Set([...prev, ...unusedKeys]);
        return Array.from(union);
      });
    }
  };

  const isLoading = loadingStats || loadingFiles;

  if (isLoading) {
    return (
      <DashboardShell>
        <PageHeader title={language === 'ku' ? 'کۆگا' : 'Storage'} description={language === 'ku' ? 'بارکردنی کۆگا...' : 'Loading storage...'} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'کۆگا و فایلەکان' : 'Storage'}
        description={language === 'ku' ? 'چاودێری و بەڕێوەبردنی بەکارهێنانی کۆگای مێدیای ئەپەکە' : 'Monitor and manage platform storage usage'}
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' }, { label: language === 'ku' ? 'کۆگا' : 'Storage' }]}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Storage Capacity overview */}
        <Card className="lg:col-span-1 border-none shadow-md bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold">{language === 'ku' ? 'کورتەی کۆگا' : 'Storage Overview'}</CardTitle>
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
                <p className="text-3xl font-extrabold">{usedPercent}%</p>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{language === 'ku' ? 'بەکارهێنراو' : 'used'}</p>
              </div>
            </motion.div>
            <div className="mt-4 text-center space-y-1">
              <p className="text-sm font-semibold">
                {formatBytes(totalSizeBytes)} {language === 'ku' ? 'لە کۆی ٥٠ گێگابایت' : 'of 50 GB'}
              </p>
              <p className="text-xs text-muted-foreground font-medium">
                {formatBytes(totalLimitBytes - totalSizeBytes)} {language === 'ku' ? 'بەردەستە بۆ بارکردن' : 'available for uploads'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Breakdown details */}
        <div className="lg:col-span-2 grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* Format Breakdown */}
          <Card className="border-none shadow-md bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">{language === 'ku' ? 'پۆلێنکردنی فۆرمات' : 'Format Breakdown'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {breakdown.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.type}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-xs font-semibold">{item.type}</span>
                      </div>
                      <span className="text-xs font-bold text-muted-foreground">{item.size}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.percent}%` }} />
                    </div>
                  </motion.div>
                );
              })}
            </CardContent>
          </Card>

          {/* System Usage Reference (Used vs Unused) */}
          <Card className="border-none shadow-md bg-card/60 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">{language === 'ku' ? 'باری بەکارهێنان لە سیستمدا' : 'System Usage Status'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {systemBreakdown.map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.type}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${item.color.replace('bg-', 'text-')}`} />
                        <span className="text-xs font-bold">{item.type}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-extrabold block">{item.size}</span>
                        <span className="text-[10px] text-muted-foreground">{item.count} {language === 'ku' ? 'فایل' : 'file(s)'}</span>
                      </div>
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
      </div>

      {/* Uploaded Files Section */}
      <Card className="mt-6 border-none shadow-md bg-card/60 backdrop-blur-sm">
        <CardHeader className="pb-3 border-b border-muted">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="text-base font-bold">{language === 'ku' ? 'فایلە بارکراوەکان' : 'Uploaded Files'}</CardTitle>
            
            {/* Bulk Deletion floating indicator */}
            {selectedKeys.length > 0 && (
              <div className="flex items-center gap-3 p-1.5 px-3.5 rounded-full bg-destructive/10 border border-destructive/20 animate-in fade-in slide-in-from-top-2 duration-200">
                <span className="text-xs font-bold text-destructive">
                  {language === 'ku'
                    ? `${selectedKeys.length} فایلی بەکارنەهاتوو دەستنیشانکراوە`
                    : `${selectedKeys.length} unused file(s) selected`}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 rounded-full font-bold shadow-sm"
                  onClick={() => setShowBulkConfirm(true)}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="h-3.5 w-3.5 me-1" />
                  {language === 'ku' ? 'سڕینەوەی بەکۆمەڵ' : 'Bulk Delete'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* Search, File Type Filter, and Usage Filter */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={language === 'ku' ? 'گەڕان بەدوای ناوی فایل...' : 'Search file by name...'}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="ps-9 h-10 rounded-xl"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Filter by Asset format */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">{language === 'ku' ? 'جۆری فۆرمات:' : 'Format:'}</span>
                <Select value={fileTypeFilter} onValueChange={handleFilterChange}>
                  <SelectTrigger className="w-[120px] h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ku' ? 'هەموو' : 'All'}</SelectItem>
                    <SelectItem value="image">{language === 'ku' ? 'وێنەکان' : 'Images'}</SelectItem>
                    <SelectItem value="video">{language === 'ku' ? 'ڤیدیۆکان' : 'Videos'}</SelectItem>
                    <SelectItem value="other">{language === 'ku' ? 'هیتر' : 'Other'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filter by Reference status (Used vs Unused) */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground">{language === 'ku' ? 'دۆخی بەکارهێنان:' : 'Usage:'}</span>
                <Select value={usageFilter} onValueChange={handleUsageFilterChange}>
                  <SelectTrigger className="w-[140px] h-10 rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{language === 'ku' ? 'هەموو فایلەکان' : 'All Files'}</SelectItem>
                    <SelectItem value="used">{language === 'ku' ? 'بەکارهاتووەکان (چالاک)' : 'Used / Active'}</SelectItem>
                    <SelectItem value="unused">{language === 'ku' ? 'بەکارنەهاتووەکان (زیادە)' : 'Unused / Orphaned'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {language === 'ku' ? 'هیچ فایلێک بەم مەرجانە نەدۆزرایەوە.' : 'No files matching the criteria were found.'}
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    {/* Header Select All checkbox - strictly for UNUSED files */}
                    <TableHead className="w-[50px] text-center">
                      <input
                        type="checkbox"
                        checked={isAllUnusedSelected}
                        onChange={toggleSelectAllUnused}
                        disabled={unusedFiltered.length === 0}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
                        title={language === 'ku' ? 'دەستنیشانکردنی هەموو فایلە بەکارنەهاتووەکان' : 'Select all unused files'}
                      />
                    </TableHead>
                    <TableHead>{language === 'ku' ? 'فایل' : 'File'}</TableHead>
                    <TableHead>{language === 'ku' ? 'فۆرمات' : 'Format'}</TableHead>
                    <TableHead>{language === 'ku' ? 'دۆخی سیستم' : 'System Status'}</TableHead>
                    <TableHead>{language === 'ku' ? 'قەبارە' : 'Size'}</TableHead>
                    <TableHead>{language === 'ku' ? 'بارکراوە لە' : 'Uploaded At'}</TableHead>
                    <TableHead className="w-[100px] text-end">{language === 'ku' ? 'کردارەکان' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((file: UploadedFile) => {
                    const FileIcon = getFileIcon(file.type);
                    const fileUrl = getMediaUrl(file.key);
                    const isImg = file.type === 'image' && !imageErrors[file.key];
                    const isSelected = selectedKeys.includes(file.key);
                    const isUsed = !!file.isUsed;

                    return (
                      <TableRow key={file.key} className={isUsed ? 'bg-muted/10 opacity-75' : ''}>
                        {/* Checkbox cell - only selectable if NOT in use */}
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={isUsed}
                            onChange={() => toggleSelect(file.key)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer accent-primary disabled:opacity-30 disabled:cursor-not-allowed"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isImg ? (
                              <div className="h-9 w-9 overflow-hidden rounded bg-muted flex items-center justify-center border">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={fileUrl}
                                  alt={file.key}
                                  className="h-full w-full object-cover"
                                  onError={() => {
                                    setImageErrors(prev => ({ ...prev, [file.key]: true }));
                                  }}
                                />
                              </div>
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded bg-muted border">
                                <FileIcon className="h-4.5 w-4.5 text-muted-foreground" />
                              </div>
                            )}
                            <span className="max-w-[240px] truncate text-xs font-semibold text-foreground" title={file.key}>
                              {file.key.split('/').pop()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground capitalize">{file.type}</span>
                        </TableCell>
                        <TableCell>
                          {isUsed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse" />
                              {language === 'ku' ? 'بەکارھاتووە' : 'In Use'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              {language === 'ku' ? 'بەکارنەهاتوو' : 'Unused'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-muted-foreground">
                          {formatBytes(file.size)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(file.uploaded)}
                        </TableCell>
                        <TableCell className="text-end">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => window.open(fileUrl, '_blank')}>
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            {/* Deletion icon button - disabled if file is in use */}
                            <Button
                              variant="ghost"
                              size="icon"
                              disabled={isUsed}
                              className="h-8 w-8 rounded-lg hover:bg-destructive/15 hover:text-destructive disabled:opacity-20 disabled:hover:bg-transparent"
                              onClick={() => setDeleteTarget(file)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground">
                {language === 'ku'
                  ? `لاپەڕە ${currentPage} لە ${totalPages}`
                  : `Page ${currentPage} of ${totalPages}`}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1}>
                  {language === 'ku' ? 'پێشوو' : 'Previous'}
                </Button>
                <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages}>
                  {language === 'ku' ? 'داهاتوو' : 'Next'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation for single file deletion */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={language === 'ku' ? 'سڕینەوەی فایل؟' : 'Delete file?'}
        description={
          language === 'ku'
            ? `ئایا دڵنیای لە سڕینەوەی فایلەکە؟ ئەم کردارە ناگەڕێتەوە و دەستبەجێ لەسەر کۆگای هەوری R2 دەسڕێتەوە.`
            : `Are you sure you want to delete this file? This action is permanent and deletes from R2 storage immediately.`
        }
        confirmLabel={language === 'ku' ? 'بسڕەوە' : 'Delete'}
        onConfirm={handleDeleteConfirm}
      />

      {/* Confirmation for bulk file deletion */}
      <ConfirmDialog
        open={showBulkConfirm}
        onOpenChange={setShowBulkConfirm}
        title={language === 'ku' ? 'سڕینەوەی بەکۆمەڵ؟' : 'Bulk Delete?'}
        description={
          language === 'ku'
            ? `ئایا دڵنیای لە سڕینەوەی بەکۆمەڵی ئەم ${selectedKeys.length} فایلە بەکارنەهاتووە؟ ئەم کردارە ناگەڕێتەوە.`
            : `Are you sure you want to bulk delete the selected ${selectedKeys.length} unused file(s)? This action cannot be undone.`
        }
        confirmLabel={language === 'ku' ? 'سڕینەوەی هەموویان' : 'Delete All Selected'}
        onConfirm={handleBulkDeleteConfirm}
      />
    </DashboardShell>
  );
}
