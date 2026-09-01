'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Pencil,
  Trash2,
  Video,
  Image as ImageIcon,
  Upload,
  Loader2,
  Home,
  HelpCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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

function getMediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
    'https://barav-backend.khalistanya.workers.dev';
  return `${baseUrl}/media/${path.replace(/^\//, '')}`;
}

export default function SponsorsPage() {
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'home' | 'quiz'>('home');

  const { data: fetchResult, isLoading } = useQuery<{ data: Sponsor[] }>({
    queryKey: ['sponsors'],
    queryFn: async () => {
      try {
        return await api.get<{ data: Sponsor[] }>('/sponsors');
      } catch (error) {
        return { data: [] };
      }
    },
  });

  const sponsors: Sponsor[] = fetchResult?.data || [];
  const homeSponsors = sponsors.filter((s) => (s.type || 'home') === 'home');
  const quizSponsors = sponsors.filter((s) => s.type === 'quiz');

  const [deleteTarget, setDeleteTarget] = useState<Sponsor | null>(null);
  
  // Dialog Open States (Split)
  const [homeOpen, setHomeOpen] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  
  const [editing, setEditing] = useState<Sponsor | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [targetType, setTargetType] = useState<'home' | 'quiz'>('home');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'sponsors');

      const uploadRes = await client.post('/admin/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadRes.data?.success || uploadRes.data?.key) {
        const url =
          uploadRes.data.data?.url ||
          uploadRes.data?.url ||
          uploadRes.data.data?.key ||
          uploadRes.data?.key ||
          '';
        setImageUrl(url);
        toast.success(language === 'ku' ? 'وێنەکە بارکرا' : 'Image uploaded');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err: any) {
      console.error('Upload Error:', err);
      const errorMsg =
        err?.response?.data?.message || err?.message || 'هەڵە لە بارکردندا';
      toast.error(language === 'ku' ? `هەڵە: ${errorMsg}` : `Upload failed: ${errorMsg}`);
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'sponsors');

      const uploadRes = await client.post('/admin/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (uploadRes.data?.success || uploadRes.data?.key) {
        const url =
          uploadRes.data.data?.url ||
          uploadRes.data?.url ||
          uploadRes.data.data?.key ||
          uploadRes.data?.key ||
          '';
        setVideoUrl(url);
        toast.success(language === 'ku' ? 'ڤیدیۆکە بارکرا' : 'Video uploaded');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err: any) {
      console.error('Upload Error:', err);
      const errorMsg =
        err?.response?.data?.message || err?.message || 'هەڵە لە بارکردندا';
      toast.error(language === 'ku' ? `هەڵە: ${errorMsg}` : `Upload failed: ${errorMsg}`);
    } finally {
      setIsUploadingVideo(false);
      e.target.value = '';
    }
  };

  const createMutation = useMutation({
    mutationFn: (newSponsor: Partial<Sponsor>) => api.post('/sponsors', newSponsor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      toast.success(
        language === 'ku' ? 'سپۆنسەرەکە بەسەرکەوتوویی دروستکرا' : 'Sponsor created'
      );
      setHomeOpen(false);
      setQuizOpen(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (updatedSponsor: Partial<Sponsor>) =>
      api.put(`/sponsors/${editing?.id}`, updatedSponsor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      toast.success(language === 'ku' ? 'سپۆنسەرەکە نوێکرایەوە' : 'Sponsor updated');
      setHomeOpen(false);
      setQuizOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/sponsors/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sponsors'] });
      toast.success(
        language === 'ku' ? 'سپۆنسەرەکە بە سەرکەوتوویی سڕایەوە' : 'Sponsor deleted'
      );
      setDeleteTarget(null);
    },
  });

  const openCreateHome = () => {
    setEditing(null);
    setName('');
    setTargetType('home');
    setMediaType('image');
    setImageUrl('');
    setVideoUrl('');
    setHomeOpen(true);
  };

  const openCreateQuiz = () => {
    setEditing(null);
    setName('');
    setTargetType('quiz');
    setImageUrl('');
    setVideoUrl('');
    setQuizOpen(true);
  };

  const openEdit = (sponsor: Sponsor) => {
    setEditing(sponsor);
    setName(sponsor.name);
    const tType = sponsor.type || 'home';
    setTargetType(tType);
    setImageUrl(sponsor.imageUrl || '');
    setVideoUrl(sponsor.videoUrl || '');
    setMediaType(sponsor.videoUrl ? 'video' : 'image');
    
    if (tType === 'home') {
      setHomeOpen(true);
    } else {
      setQuizOpen(true);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error(language === 'ku' ? 'تکایە ناو بنووسە' : 'Please provide a name');
      return;
    }

    if (targetType === 'home') {
      if (mediaType === 'image' && !imageUrl.trim()) {
        toast.error(language === 'ku' ? 'تکایە وێنەیەک باربکە' : 'Please upload an image');
        return;
      }
      if (mediaType === 'video' && !videoUrl.trim()) {
        toast.error(language === 'ku' ? 'تکایە ڤیدیۆیەک باربکە' : 'Please upload a video');
        return;
      }
    } else {
      if (!imageUrl.trim()) {
        toast.error(language === 'ku' ? 'تکایە وێنەیەک باربکە' : 'Please upload an image');
        return;
      }
    }

    const payload = {
      name: name.trim(),
      type: targetType,
      imageUrl: targetType === 'quiz' ? imageUrl.trim() : (mediaType === 'image' ? imageUrl.trim() : null),
      videoUrl: targetType === 'home' && mediaType === 'video' ? videoUrl.trim() : null,
      link: null,
    };

    if (editing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const renderSponsorCard = (sponsor: Sponsor, i: number) => {
    const isHome = (sponsor.type || 'home') === 'home';
    const hasVideo = !!sponsor.videoUrl;
    const hasImage = !!sponsor.imageUrl;

    return (
      <motion.div
        key={sponsor.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
      >
        <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:border-primary/30 h-full flex flex-col">
          <CardContent className="p-5 flex-grow flex flex-col justify-between">
            <div>
              {/* Media Preview & Actions */}
              <div className="flex items-start justify-between mb-4 gap-3">
                <div className="relative w-36 overflow-hidden rounded-xl border bg-muted flex items-center justify-center shadow-inner" style={{ aspectRatio: sponsor.type === 'quiz' ? '2.55' : '2.05' }}>
                  {hasVideo ? (
                    <div className="relative w-full h-full bg-slate-950 flex items-center justify-center">
                      <video
                        src={getMediaUrl(sponsor.videoUrl)}
                        className="w-full h-full object-cover"
                        muted
                        playsInline
                        preload="metadata"
                      />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <Video className="h-6 w-6 text-white drop-shadow" />
                      </div>
                    </div>
                  ) : hasImage ? (
                    <Image
                      src={getMediaUrl(sponsor.imageUrl)}
                      alt={sponsor.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                <div className="flex gap-1 opacity-90 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                    onClick={() => openEdit(sponsor)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-destructive/10 text-destructive"
                    onClick={() => setDeleteTarget(sponsor)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Title and Badges */}
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors truncate max-w-[180px]">
                  {sponsor.name}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {isHome ? (
                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                    <Home className="h-3 w-3 me-1" /> {language === 'ku' ? 'سەرەکی' : 'Home'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-xs">
                    <HelpCircle className="h-3 w-3 me-1" /> {language === 'ku' ? 'کویز' : 'Quiz'}
                  </Badge>
                )}

                {hasVideo && (
                  <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-normal">
                    <Video className="h-3 w-3 me-1" /> {language === 'ku' ? 'ڤیدیۆ' : 'Video'}
                  </Badge>
                )}
                {hasImage && !hasVideo && (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs font-normal">
                    <ImageIcon className="h-3 w-3 me-1" /> {language === 'ku' ? 'وێنە' : 'Image'}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  if (isLoading) {
    return (
      <DashboardShell>
        <PageHeader
          title={language === 'ku' ? 'Lowding...' : 'Loading...'}
          description=""
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'سپۆنسەرەکان و ڕیکلام' : 'Sponsors & Ads'}
        description={
          language === 'ku'
            ? 'سڵایدەری سەرەکی (وێنە و ڤیدیۆ) و سڵایدەری ناو پەڕەی کویز (تەنها وێنە) بەڕێوەببە'
            : 'Manage Home slider (image & video) and Quiz page slider (image only)'
        }
        breadcrumbs={[
          { label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' },
          { label: language === 'ku' ? 'سپۆنسەرەکان' : 'Sponsors' },
        ]}
        actions={
          <Button
            onClick={activeTab === 'home' ? openCreateHome : openCreateQuiz}
            className="shadow-md"
          >
            <Plus className="me-2 h-4 w-4" />
            {activeTab === 'home'
              ? (language === 'ku' ? 'زیادکردن بۆ سەرەکی' : 'Add to Home')
              : (language === 'ku' ? 'زیادکردن بۆ کویز' : 'Add to Quiz')}
          </Button>
        }
      />

      {/* Tabs for Home Slider vs Quiz Page Slider */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'home' | 'quiz')}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 h-11 p-1 bg-muted/80 rounded-xl">
          <TabsTrigger
            value="home"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm font-semibold"
          >
            <Home className="h-4 w-4" />
            <span>{language === 'ku' ? 'سڵایدەری سەرەکی' : 'Home Slider'}</span>
            <Badge variant="secondary" className="ms-1 text-xs px-1.5 py-0">
              {homeSponsors.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="quiz"
            className="flex items-center gap-2 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm font-semibold"
          >
            <HelpCircle className="h-4 w-4" />
            <span>{language === 'ku' ? 'سڵایدەری کویز' : 'Quiz Slider'}</span>
            <Badge variant="secondary" className="ms-1 text-xs px-1.5 py-0">
              {quizSponsors.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        {/* Home Slider Tab Content */}
        <TabsContent value="home" className="space-y-4 outline-none">
          <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/15">
            <div>
              <h4 className="font-semibold text-sm text-foreground">
                {language === 'ku'
                  ? 'ڕیکلام و سپۆنسەری پەڕەی سەرەکی'
                  : 'Home Page Sponsors & Ads'}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'ku'
                  ? 'ئەم بەشە پشتگیری هەردوو شێوازی وێنە و ڤیدیۆ دەکات لە سڵایدەری سەرەکی ئەپەکە.'
                  : 'This section supports both images and videos on the main home screen slider.'}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={openCreateHome}>
              <Plus className="h-3.5 w-3.5 me-1" />
              {language === 'ku' ? 'زیادکردن' : 'Add'}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {homeSponsors.map((sponsor, i) => renderSponsorCard(sponsor, i))}
            {homeSponsors.length === 0 && (
              <div className="col-span-full py-16 text-center rounded-2xl border-2 border-dashed bg-muted/20">
                <Video className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-semibold text-base">
                  {language === 'ku' ? 'هیچ سپۆنسەرێک لە سەرەکی نییە' : 'No home sponsors'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {language === 'ku'
                    ? 'دەتوانیت وێنە یان ڤیدیۆی سپۆنسەر بۆ سڵایدەری سەرەکی زیاد بکەیت.'
                    : 'Add image or video sponsors to display on the mobile app home slider.'}
                </p>
                <Button className="mt-4" size="sm" onClick={openCreateHome}>
                  <Plus className="me-1 h-4 w-4" />
                  {language === 'ku' ? 'زیادکردنی سپۆنسەری سەرەکی' : 'Add Home Sponsor'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Quiz Page Slider Tab Content */}
        <TabsContent value="quiz" className="space-y-4 outline-none">
          <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
            <div>
              <h4 className="font-semibold text-sm text-foreground">
                {language === 'ku'
                  ? 'ڕیکلام و سپۆنسەری ناو پەڕەی کویز'
                  : 'Quiz Page Sponsors'}
              </h4>
              <p className="text-xs text-muted-foreground mt-0.5">
                {language === 'ku'
                  ? 'ئەم بەشە تەنها وێنە لەخۆدەگرێت بۆ سڵایدەری ناو پەڕەی کویز (Live Quiz Banner).'
                  : 'This section is strictly image-only for the slider banner inside live quiz.'}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={openCreateQuiz}>
              <Plus className="h-3.5 w-3.5 me-1" />
              {language === 'ku' ? 'زیادکردن' : 'Add'}
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {quizSponsors.map((sponsor, i) => renderSponsorCard(sponsor, i))}
            {quizSponsors.length === 0 && (
              <div className="col-span-full py-16 text-center rounded-2xl border-2 border-dashed bg-muted/20">
                <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
                <h3 className="font-semibold text-base">
                  {language === 'ku'
                    ? 'هیچ سپۆنسەرێک بۆ پەڕەی کویز نییە'
                    : 'No quiz page sponsors'}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                  {language === 'ku'
                    ? 'دەتوانیت وێنەی ڕیکلام بۆ سڵایدەری ناو کویز زیاد بکەیت.'
                    : 'Add image banners to display inside the quiz screen.'}
                </p>
                <Button className="mt-4" size="sm" onClick={openCreateQuiz}>
                  <Plus className="me-1 h-4 w-4" />
                  {language === 'ku' ? 'زیادکردنی سپۆنسەری کویز' : 'Add Quiz Sponsor'}
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 1. Home Sponsor Dialog (With Video Support)                       */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <Dialog open={homeOpen} onOpenChange={setHomeOpen}>
        <DialogContent className="sm:max-w-lg overflow-hidden border-none rounded-2xl shadow-2xl bg-background/95 backdrop-blur-md">
          <DialogHeader className="pb-4 border-b border-muted">
            <DialogTitle className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              {editing
                ? (language === 'ku' ? 'دەستکاریکردنی سپۆنسەری سەرەکی' : 'Edit Home Sponsor')
                : (language === 'ku' ? 'تۆمارکردنی سپۆنسەری سەرەکی نوێ' : 'Register New Home Sponsor')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4 max-h-[70vh] overflow-y-auto px-1">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="home-sp-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {language === 'ku' ? 'ناوی سپۆنسەر یان براند' : 'Sponsor or Brand Name'}
              </Label>
              <Input
                id="home-sp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'ku' ? 'بۆ نموونە: فاستلینک، کۆڕەک' : 'e.g. Fastlink, Korek'}
                className="h-11 rounded-xl"
              />
            </div>

            {/* Media Type Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {language === 'ku' ? 'جۆری میدیا' : 'Media Type'}
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMediaType('image');
                    setVideoUrl(''); // Clear video
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold transition-all ${
                    mediaType === 'image'
                      ? 'border-primary bg-primary/5 text-primary ring-4 ring-primary/10'
                      : 'border-muted hover:bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>{language === 'ku' ? 'وێنە (Image)' : 'Image'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMediaType('video');
                    setImageUrl(''); // Clear image
                  }}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 font-bold transition-all ${
                    mediaType === 'video'
                      ? 'border-primary bg-primary/5 text-primary ring-4 ring-primary/10'
                      : 'border-muted hover:bg-muted/30 text-muted-foreground'
                  }`}
                >
                  <Video className="h-4 w-4" />
                  <span>{language === 'ku' ? 'ڤیدیۆ (Video)' : 'Video'}</span>
                </button>
              </div>
            </div>

            {/* Image Upload Zone */}
            {mediaType === 'image' && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {language === 'ku' ? 'وێنەی ڕیکلام (پێویستە)' : 'Ad Image (Required)'}
                </Label>
                
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={imageInputRef}
                  onChange={handleImageUpload}
                />

                {!imageUrl ? (
                  <div
                    onClick={() => imageInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary bg-muted/20 cursor-pointer transition-all hover:bg-muted/30 group"
                    style={{ aspectRatio: '2.05' }}
                  >
                    {isUploadingImage ? (
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="h-10 w-10 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all mb-2" />
                        <span className="text-sm font-medium text-foreground">
                          {language === 'ku' ? 'کلیک بکە بۆ بارکردنی وێنە' : 'Click to upload image'}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-1">
                          {language === 'ku' ? 'تکایە وێنەی ئاسۆیی 2.05 بەکاربهێنە' : 'Please use landscape 2.05 ratio'}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div
                    className="relative w-full rounded-xl overflow-hidden border border-border group bg-slate-950 flex items-center justify-center"
                    style={{ aspectRatio: '2.05' }}
                  >
                    <Image
                      src={getMediaUrl(imageUrl)}
                      alt="Sponsor Image Preview"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                    <div className="absolute inset-0 border-4 border-black/10 pointer-events-none flex items-center justify-center">
                      <div className="w-full h-full border-2 border-dashed border-white/40 opacity-70 flex items-center justify-center">
                        <span className="text-[10px] text-white bg-black/60 px-2 py-0.5 rounded-full font-mono font-bold">
                          Landscape (2.05) Viewport
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs bg-white/90 hover:bg-white text-black font-bold shadow-md"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploadingImage}
                      >
                        <Upload className="h-3 w-3 me-1" />
                        {language === 'ku' ? 'گۆڕین' : 'Change'}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-8 text-xs font-bold shadow-md"
                        onClick={() => setImageUrl('')}
                      >
                        {language === 'ku' ? 'سڕینەوە' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="p-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/5 text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-2 border border-amber-500/20">
                  <span className="text-xs">⚠️</span>
                  <span className="font-medium leading-relaxed">
                    {language === 'ku'
                      ? 'دڵنیابە لەوەی وێنەکە پێش بارکردن بە شێوەی ئاسۆیی (Landscape 2.05) بڕاوە بۆ ئەوەی بە جوانی نیشان بدرێت.'
                      : 'Make sure your image is cropped to landscape (2.05) beforehand to guarantee correct layout.'}
                  </span>
                </div>
              </div>
            )}

            {/* Video Upload Zone */}
            {mediaType === 'video' && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Video className="h-4.5 w-4.5 text-purple-500" />
                  <span>{language === 'ku' ? 'ڤیدیۆی ڕیکلام (پێویستە)' : 'Ad Video (Required)'}</span>
                </Label>

                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  className="hidden"
                  ref={videoInputRef}
                  onChange={handleVideoUpload}
                />

                {!videoUrl ? (
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary bg-muted/20 cursor-pointer transition-all hover:bg-muted/30 group"
                    style={{ aspectRatio: '2.05' }}
                  >
                    {isUploadingVideo ? (
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    ) : (
                      <>
                        <Video className="h-10 w-10 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all mb-2" />
                        <span className="text-sm font-medium text-foreground">
                          {language === 'ku' ? 'کلیک بکە بۆ بارکردنی ڤیدیۆ' : 'Click to upload video'}
                        </span>
                        <span className="text-[11px] text-muted-foreground mt-1">
                          {language === 'ku' ? 'ڕێژەی دیمەنی ئاسۆیی 2.05' : 'Landscape 2.05 format video'}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <div
                    className="relative w-full rounded-xl overflow-hidden border border-border group bg-slate-950 flex items-center justify-center"
                    style={{ aspectRatio: '2.05' }}
                  >
                    <video
                      src={getMediaUrl(videoUrl)}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                    />
                    <div className="absolute inset-0 border-4 border-black/10 pointer-events-none flex items-center justify-center">
                      <div className="w-full h-full border-2 border-dashed border-white/40 opacity-70 flex items-center justify-center">
                        <span className="text-[10px] text-white bg-black/60 px-2 py-0.5 rounded-full font-mono font-bold">
                          Landscape (2.05) Viewport
                        </span>
                      </div>
                    </div>
                    <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-8 text-xs bg-white/90 hover:bg-white text-black font-bold shadow-md"
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isUploadingVideo}
                      >
                        <Upload className="h-3 w-3 me-1" />
                        {language === 'ku' ? 'گۆڕین' : 'Change'}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-8 text-xs font-bold shadow-md"
                        onClick={() => setVideoUrl('')}
                      >
                        {language === 'ku' ? 'سڕینەوە' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="p-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/5 text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-2 border border-amber-500/20">
                  <span className="text-xs">⚠️</span>
                  <span className="font-medium leading-relaxed">
                    {language === 'ku'
                      ? 'دڵنیابە ڤیدیۆکەش بە شێوەی ئاسۆیی (Landscape 2.05) بڕاوە بۆ پاراستنی نیشاندانی دروست.'
                      : 'Ensure video is pre-cropped to landscape (2.05) to keep correct presentation format.'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4 pt-4 border-t border-muted">
            <Button
              variant="outline"
              onClick={() => setHomeOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-xl h-11 px-6 font-semibold"
            >
              {language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                isUploadingImage ||
                isUploadingVideo
              }
              className="rounded-xl h-11 px-8 font-bold bg-gradient-to-r from-primary to-purple-600 text-white shadow-lg hover:opacity-90 transition-opacity"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin me-1.5" />
              ) : null}
              {createMutation.isPending || updateMutation.isPending
                ? (language === 'ku' ? 'پاشەکەوت دەکرێت...' : 'Saving...')
                : (language === 'ku' ? 'پاشەکەوتکردن' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* ───────────────────────────────────────────────────────────────── */}
      {/* 2. Quiz Sponsor Dialog (Strictly Image-Only, No Video)            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      <Dialog open={quizOpen} onOpenChange={setQuizOpen}>
        <DialogContent className="sm:max-w-lg overflow-hidden border-none rounded-2xl shadow-2xl bg-background/95 backdrop-blur-md">
          <DialogHeader className="pb-4 border-b border-muted">
            <DialogTitle className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
              {editing
                ? (language === 'ku' ? 'دەستکاریکردنی سپۆنسەری کویز' : 'Edit Quiz Sponsor')
                : (language === 'ku' ? 'تۆمارکردنی سپۆنسەری کویز نوێ' : 'Register New Quiz Sponsor')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4 max-h-[70vh] overflow-y-auto px-1">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="quiz-sp-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {language === 'ku' ? 'ناوی سپۆنسەر یان brاند' : 'Sponsor or Brand Name'}
              </Label>
              <Input
                id="quiz-sp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={language === 'ku' ? 'بۆ نموونە: ئاسیاسێل، فاستلینک' : 'e.g. Asiacell, Fastlink'}
                className="h-11 rounded-xl"
              />
            </div>

            {/* Image Upload Zone */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {language === 'ku' ? 'وێنەی ڕیکلام (پێویستە)' : 'Ad Image (Required)'}
              </Label>
              
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={imageInputRef}
                onChange={handleImageUpload}
              />

              {!imageUrl ? (
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed border-muted-foreground/20 hover:border-primary bg-muted/20 cursor-pointer transition-all hover:bg-muted/30 group"
                  style={{ aspectRatio: '2.55' }}
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  ) : (
                    <>
                      <ImageIcon className="h-10 w-10 text-muted-foreground group-hover:text-primary group-hover:scale-110 transition-all mb-2" />
                      <span className="text-sm font-medium text-foreground">
                        {language === 'ku' ? 'کلیک بکە بۆ بارکردنی وێنە' : 'Click to upload image'}
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-1">
                        {language === 'ku' ? 'تکایە وێنەی ئاسۆیی 2.55 بەکاربهێنە' : 'Please use landscape 2.55 ratio'}
                      </span>
                    </>
                  )}
                </div>
              ) : (
                <div
                  className="relative w-full rounded-xl overflow-hidden border border-border group bg-slate-950 flex items-center justify-center"
                  style={{ aspectRatio: '2.55' }}
                >
                  <Image
                    src={getMediaUrl(imageUrl)}
                    alt="Sponsor Image Preview"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                  <div className="absolute inset-0 border-4 border-black/10 pointer-events-none flex items-center justify-center">
                    <div className="w-full h-full border-2 border-dashed border-white/40 opacity-70 flex items-center justify-center">
                      <span className="text-[10px] text-white bg-black/60 px-2 py-0.5 rounded-full font-mono font-bold">
                        Landscape (2.55) Viewport
                      </span>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-8 text-xs bg-white/90 hover:bg-white text-black font-bold shadow-md"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={isUploadingImage}
                    >
                      <Upload className="h-3 w-3 me-1" />
                      {language === 'ku' ? 'گۆڕین' : 'Change'}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="h-8 text-xs font-bold shadow-md"
                      onClick={() => setImageUrl('')}
                    >
                      {language === 'ku' ? 'سڕینەوە' : 'Remove'}
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="p-2.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/5 text-[11px] text-amber-600 dark:text-amber-400 flex items-start gap-2 border border-amber-500/20">
                <span className="text-xs">⚠️</span>
                <span className="font-medium leading-relaxed">
                  {language === 'ku'
                    ? 'دڵنیابە لەوەی وێنەکە پێش بارکردن بە شێوەی ئاسۆیی (Landscape 2.55) بڕاوە بۆ ئەوەی بە جوانی نیشان بدرێت.'
                    : 'Make sure your image is cropped to landscape (2.55) beforehand to guarantee correct layout.'}
                </span>
              </div>
            </div>

            {/* Video Disabled Indicator */}
            <div className="p-4 rounded-xl bg-muted/40 border text-xs text-muted-foreground flex items-center gap-2.5">
              <ImageIcon className="h-5 w-5 shrink-0 text-amber-500 animate-pulse" />
              <span className="leading-relaxed">
                {language === 'ku'
                  ? 'ئەم سپۆنسەرە لە ناو پەڕەی یاری لایڤ پیشان دەدرێت و تەنها پشتگیری وێنە دەکات. ڤیدیۆ ڕێگەپێنەدراوە.'
                  : 'This sponsor will appear inside the live quiz screen, which only supports static image ads.'}
              </span>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-4 border-t border-muted">
            <Button
              variant="outline"
              onClick={() => setQuizOpen(false)}
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded-xl h-11 px-6 font-semibold"
            >
              {language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                createMutation.isPending ||
                updateMutation.isPending ||
                isUploadingImage
              }
              className="rounded-xl h-11 px-8 font-bold bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg hover:opacity-90 transition-opacity"
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin me-1.5" />
              ) : null}
              {createMutation.isPending || updateMutation.isPending
                ? (language === 'ku' ? 'پاشەکەوت دەکرێت...' : 'Saving...')
                : (language === 'ku' ? 'پاشەکەوتکردن' : 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
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
