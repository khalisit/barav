'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Link as LinkIcon, Video, Image as ImageIcon, Upload, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import client, { api } from '@/lib/api-client';
import type { Sponsor } from '@/lib/types';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';

export default function SponsorsPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const { data: fetchResult, isLoading } = useQuery<{ data: Sponsor[] }>({
    queryKey: ['sponsors'],
    queryFn: async () => {
      try {
        return await api.get<{ data: Sponsor[] }>('/sponsors');
      } catch (error) {
        return { data: [] };
      }
    }
  });
  
  const sponsors: Sponsor[] = fetchResult?.data || [];

  const [deleteTarget, setDeleteTarget] = useState<Sponsor | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Sponsor | null>(null);
  
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [link, setLink] = useState('');
  
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingImage(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadRes = await client.post('/media-items/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (uploadRes.data?.success || uploadRes.data?.key) {
        // Fallback for different response structures
        const url = uploadRes.data.data?.url || uploadRes.data?.url || uploadRes.data.data?.key || uploadRes.data?.key || '';
        
        setImageUrl(url);
        toast.success(language === 'ku' ? 'وێنەکە بارکرا' : 'Image uploaded');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err: any) {
      console.error('Upload Error:', err?.response?.data || err?.message || err);
      const errorMsg = err?.response?.data?.message || err?.message || 'هەڵە لە بارکردندا';
      toast.error(language === 'ku' ? `هەڵە: ${errorMsg}` : `Upload failed: ${errorMsg}`);
    } finally {
      setIsUploadingImage(false);
      // Reset input
      e.target.value = '';
    }
  };

  const createMutation = useMutation({
    mutationFn: (newSponsor: Partial<Sponsor>) => api.post('/sponsors', newSponsor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      toast.success(language === 'ku' ? 'سپۆنسەرەکە بەسەرکەوتوویی دروستکرا' : 'Sponsor created');
      setEditOpen(false);
    }
  });

  const updateMutation = useMutation({
    mutationFn: (updatedSponsor: Partial<Sponsor>) => api.put(`/sponsors/${editing?.id}`, updatedSponsor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      toast.success(language === 'ku' ? 'سپۆنسەرەکە نوێکرایەوە' : 'Sponsor updated');
      setEditOpen(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sponsors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      toast.success(language === 'ku' ? 'سپۆنسەرەکە بە سەرکەوتوویی سڕایەوە' : 'Sponsor deleted');
      setDeleteTarget(null);
    }
  });

  const openCreate = () => {
    setEditing(null);
    setName('');
    setImageUrl('');
    setLink('');
    setEditOpen(true);
  };

  const openEdit = (sponsor: Sponsor) => {
    setEditing(sponsor);
    setName(sponsor.name);
    setImageUrl(sponsor.imageUrl || '');
    setLink(sponsor.link || '');
    setEditOpen(true);
  };

  const handleSave = () => {
    const payload = {
      name,
      imageUrl,
      link,
    };
    if (editing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return <DashboardShell><PageHeader title="Sponsors" description="Loading..." /></DashboardShell>;
  }

  return (
    <DashboardShell>
      <PageHeader
        title="sponsors"
        description="manage-sponsors-and-partners"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Sponsors' }]}
        actions={
          <Button onClick={openCreate}>
            <Plus className="me-2 h-4 w-4" /> {language === 'ku' ? 'زیادکردنی سپۆنسەر' : 'Add Sponsor'}
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {sponsors.map((sponsor, i) => (
          <motion.div
            key={sponsor.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="group relative overflow-hidden transition-shadow hover:shadow-md h-full flex flex-col">
              <CardContent className="p-5 flex-grow">
                <div className="flex items-start justify-between mb-4">
                  {sponsor.imageUrl ? (
                    <div className="relative h-16 w-28 overflow-hidden rounded-lg border bg-muted flex items-center justify-center">
                      <Image 
                        src={sponsor.imageUrl.startsWith('http') ? sponsor.imageUrl : `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://barav-backend.khalistanya.workers.dev'}/media/${sponsor.imageUrl.replace(/^\//, '')}`} 
                        alt={sponsor.name} 
                        fill
                        unoptimized
                        className="object-cover" 
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-28 items-center justify-center rounded-lg border bg-muted">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(sponsor)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteTarget(sponsor)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-semibold text-lg">{sponsor.name}</h3>
                
                <div className="mt-4 flex flex-col gap-2 text-sm">
                  {sponsor.link && (
                    <div className="flex items-center gap-2 text-primary hover:underline">
                      <LinkIcon className="h-4 w-4" />
                      <a href={sponsor.link} target="_blank" rel="noopener noreferrer" className="truncate">
                        {sponsor.link}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
        {sponsors.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            {language === 'ku' ? 'هیچ سپۆنسەرێک نەدۆزرایەوە.' : 'No sponsors found.'}
          </div>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing
                ? (language === 'ku' ? 'دەستکاری سپۆنسەر' : 'Edit Sponsor')
                : (language === 'ku' ? 'سپۆنسەری نوێ' : 'New Sponsor')}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sp-name">{language === 'ku' ? 'ناو' : 'Name'}</Label>
              <Input
                id="sp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'ku' ? 'ناوی سپۆنسەر بنووسە' : 'Sponsor name'}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="sp-image">{language === 'ku' ? 'لینکی وێنە / بارکردن' : 'Image URL / Upload'}</Label>
              <div className="flex gap-2">
                <Input
                  id="sp-image"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.png"
                  className="flex-1"
                />
                <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleFileUpload} />
                <Button type="button" variant="outline" size="icon" onClick={() => imageInputRef.current?.click()} disabled={isUploadingImage}>
                  {isUploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
            </div>



            <div className="space-y-2">
              <Label htmlFor="sp-link">{language === 'ku' ? 'لینکی وێبسایت' : 'Website Link'}</Label>
              <Input
                id="sp-link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending
                ? (language === 'ku' ? 'پاشەکەوت دەکرێت...' : 'Saving...')
                : (language === 'ku' ? 'پاشەکەوتکردن' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={language === 'ku' ? 'سپۆنسەر بسڕدرێتەوە؟' : 'Delete sponsor?'}
        description={
          language === 'ku'
            ? `"${deleteTarget?.name}" بەتەواوی دەسڕێتەوە.`
            : `"${deleteTarget?.name}" will be permanently removed.`
        }
        confirmLabel={language === 'ku' ? 'بسڕەوە' : 'Delete'}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id);
          }
        }}
      />
    </DashboardShell>
  );
}
