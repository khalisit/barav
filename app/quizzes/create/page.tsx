'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import * as LucideIcons from 'lucide-react';
import { Save, ArrowLeft, ArrowRight, Plus, GripVertical, Trash2, Clock, Image as ImageIcon, CheckCircle2, FileText, Settings, Play, BarChart, Trophy, Calculator } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import client from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api-client';
import { useLanguage } from '@/hooks/use-language';
import type { Category, Quiz } from '@/lib/types';
import { cn, getMediaUrl } from '@/lib/utils';

function getLocalNow() {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

function cleanExactDateString(dtString: string | null | undefined): string | null {
  if (!dtString || !dtString.trim()) return null;
  const clean = dtString.trim().replace('T', ' ').replace('Z', '').split('.')[0];
  if (clean.length === 16) return `${clean}:00`;
  return clean.slice(0, 19);
}

function toDatetimeLocal(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return '';
  let clean = String(dateStr).trim();
  clean = clean.replace(' ', 'T').replace('Z', '').split('.')[0];
  return clean.slice(0, 16);
}


const quizSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  isPublic: z.boolean(),
  shuffleQuestions: z.boolean(),
  showResults: z.boolean(),
  scheduledAt: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  winnersCount: z.number().min(0).default(0),
  rewards: z.array(z.object({
    rank: z.number(),
    amount: z.number().min(0),
  })).default([]),
});

type QuizFormValues = z.infer<typeof quizSchema>;

interface QuestionDraft {
  id: string;
  text: string;
  type: 'multiple_choice' | 'image';
  points: number;
  timer: number;
  categoryId?: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
  mediaUrl?: string;
}

const STEPS = ['details', 'questions', 'preview'] as const;

export default function CreateQuizPage() {
  const router = useRouter();
  const params = useParams();
  const { language } = useLanguage();
  
  // Detection for Edit Mode
  const isEditMode = !!params.id;
  const quizIdToEdit = params.id as string;

  // Fetch Categories
  const { data: fetchResult, isLoading: loadingCategories } = useQuery<{ data: Category[] }>({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories')
  });
  const categories: Category[] = fetchResult?.data || [];

  const [currentStep, setCurrentStep] = useState(0);
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [deletedQuestionIds, setDeletedQuestionIds] = useState<string[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [totalPrize, setTotalPrize] = useState<number>(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);


  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<QuizFormValues>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'medium',
      isPublic: true,
      shuffleQuestions: false,
      showResults: true,
      scheduledAt: getLocalNow(),
      avatarUrl: '',
      winnersCount: 0,
      rewards: [],
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'quiz_avatars');
      
      const uploadRes = await client.post('/admin/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (uploadRes.data?.success || uploadRes.data?.key) {
        const url = uploadRes.data.key || uploadRes.data.url || '';
        setValue('avatarUrl', url, { shouldValidate: true, shouldDirty: true });
        toast.success(language === 'ku' ? 'لۆگۆکە بارکرا' : 'Logo uploaded');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err: any) {
      console.error('Upload Error:', err);
      toast.error(language === 'ku' ? 'هەڵە لە بارکردندا' : 'Upload failed');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleQuestionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, questionId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingQuestionId(questionId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'questions');
      
      const uploadRes = await client.post('/admin/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      if (uploadRes.data?.success || uploadRes.data?.key) {
        const url = uploadRes.data.key || uploadRes.data.url || '';
        updateQuestion(questionId, { mediaUrl: url });
        toast.success(language === 'ku' ? 'وێنەکە بارکرا' : 'Image uploaded');
      } else {
        throw new Error('Upload failed');
      }
    } catch (err: any) {
      console.error('Upload Error:', err);
      toast.error(language === 'ku' ? 'هەڵە لە بارکردندا' : 'Upload failed');
    } finally {
      setUploadingQuestionId(null);
      e.target.value = '';
    }
  };

  // Hydrate form if in edit mode
  useEffect(() => {
    async function loadQuizData() {
      if (!isEditMode) return;
      try {
        const quizData = await api.get<any>(`/quizzes/${quizIdToEdit}`);
        if (quizData) {
          const isPublished = ['published', 'PUBLISHED'].includes(quizData.status);
          if (isPublished || quizData.sessionStatus === 'LIVE' || quizData.sessionStatus === 'FINISHED') {
            toast.error(
              language === 'ku'
                ? 'ناتوانیت دەستکاری ئەم کویزە بکەیت چونکە بڵاوکراوەتەوە.'
                : 'You cannot edit this quiz because it is published.'
            );
            router.push(`/quizzes/${quizIdToEdit}`);
            return;
          }
          reset({
            title: quizData.title,
            description: quizData.description || '',
            difficulty: quizData.difficulty as 'easy' | 'medium' | 'hard',
            isPublic: true,
            shuffleQuestions: false,
            showResults: true,
            scheduledAt: (quizData.startedAt || quizData.scheduledAt) ? toDatetimeLocal(quizData.startedAt || quizData.scheduledAt) : getLocalNow(),
            avatarUrl: quizData.avatarUrl || '',
            winnersCount: quizData.winnersCount ?? 0,
            rewards: quizData.rewards && quizData.rewards.length > 0 ? quizData.rewards : [],
          });
        }

        const questionsData = await api.get<{ data: QuestionDraft[] }>(`/questions?quizId=${quizIdToEdit}`);
        if (questionsData?.data) {
          setQuestions(questionsData.data.map(q => ({
            ...q,
            type: (q.type === 'image' ? 'image' : 'multiple_choice') as 'multiple_choice' | 'image',
            mediaUrl: (q as any).mediaUrl || ''
          })));
        }
      } catch (error) {
        console.error('Failed to load quiz for editing:', error);
        toast.error(language === 'ku' ? 'نەتوانرا زانیارییەکان بهێندرێتەوە' : 'Failed to load quiz data');
      }
    }
    loadQuizData();
  }, [isEditMode, quizIdToEdit, reset, language]);

  const winnersCount = watch('winnersCount');
  const watchValues = watch();

  // Auto-generate rewards array when winnersCount changes
  useEffect(() => {
    const count = winnersCount || 0;
    const current = watchValues.rewards || [];
    const updated = Array.from({ length: count }, (_, i) => ({
      rank: i + 1,
      amount: current[i]?.amount ?? 0,
    }));
    setValue('rewards', updated);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winnersCount]);

  const handleNext = async () => {
    let isValid = false;
    
    if (currentStep === 0) {
      isValid = await trigger(['title', 'description', 'difficulty']);
    } else if (currentStep === 1) {
      if (questions.length === 0) {
        toast.error(language === 'ku' ? 'لانی کەم پرسیارێک زیاد بکە' : 'Add at least one question');
        return;
      }
      const hasEmptyText = questions.some(q => !q.text.trim());
      if (hasEmptyText) {
        toast.error(language === 'ku' ? 'هەموو پرسیارەکان دەبێت دەقیان هەبێت' : 'All questions must have text');
        return;
      }
      const hasNoCorrectOption = questions.some(q => !q.options.some(o => o.isCorrect));
      if (hasNoCorrectOption) {
        toast.error(language === 'ku' ? 'هەر پرسیارێک دەبێت وەڵامێکی ڕاستی هەبێت' : 'Each question must have a correct option');
        return;
      }
      isValid = true;
    }

    if (isValid && currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo(0, 0);
    }
  };

  const addQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        id: `draft_${Date.now()}`,
        text: '',
        type: 'multiple_choice',
        points: 10,
        timer: 30,
        categoryId: '',
        options: [
          { id: 'a', text: '', isCorrect: true },
          { id: 'b', text: '', isCorrect: false },
          { id: 'c', text: '', isCorrect: false },
          { id: 'd', text: '', isCorrect: false },
        ],
        explanation: '',
        mediaUrl: '',
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
    if (!id.startsWith('draft_')) {
      setDeletedQuestionIds(prev => [...prev, id]);
    }
  };

  const updateQuestion = (id: string, updates: Partial<QuestionDraft>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const handleDragStart = (index: number) => setDragIndex(index);
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setQuestions((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  };

  const onSubmit = async (values: QuizFormValues) => {
    try {
      const quizPayload = {
        title: values.title,
        description: values.description,
        difficulty: values.difficulty,
        avatarUrl: values.avatarUrl || null,
        // Status defaults to 'draft' on creation via backend schema. We don't overwrite it on edit.
        startedAt: cleanExactDateString(values.scheduledAt),
        winnersCount: values.winnersCount,
        rewards: values.rewards,
      };
      
      let quizId = quizIdToEdit;

      if (isEditMode) {
        await api.put(`/quizzes/${quizIdToEdit}`, quizPayload);
      } else {
        const newQuiz = await api.post<{ id: string }>('/quizzes', quizPayload);
        if (!newQuiz || !newQuiz.id) throw new Error('Failed to create quiz record');
        quizId = newQuiz.id;
      }

      // Handle Deleted Questions
      const deletePromises = deletedQuestionIds.map(id => api.delete(`/questions/${id}`));
      await Promise.all(deletePromises);

      // Handle Create / Update Questions
      const questionPromises = questions.map(q => {
        const payload = {
          quizId: quizId,
          type: q.type,
          text: q.text,
          options: q.options,
          explanation: q.explanation,
          points: q.points,
          timer: q.timer,
          categoryId: q.categoryId || null,
          categoryName: categories.find(c => c.id === q.categoryId)?.name || null,
          mediaUrl: q.mediaUrl || null,
        };
        if (q.id.startsWith('draft_')) {
          return api.post('/questions', payload);
        } else {
          return api.put(`/questions/${q.id}`, payload);
        }
      });
      
      await Promise.all(questionPromises);
      
      toast.success(
        language === 'ku' 
          ? (isEditMode ? 'کویزەکە بە سەرکەوتوویی نوێکرایەوە!' : 'کویزەکە بە سەرکەوتوویی دروستکرا!') 
          : (isEditMode ? 'Quiz updated successfully!' : 'Quiz created successfully!')
      );
      router.push('/quizzes');
    } catch (error) {
      console.error(error);
      toast.error(language === 'ku' ? 'هەڵەیەک ڕوویدا' : 'An error occurred');
    }
  };

  return (
    <DashboardShell>
      <PageHeader
        title={isEditMode ? (language === 'ku' ? 'دەستکاریکردنی کویز' : 'Edit Quiz') : (language === 'ku' ? 'دروستکردنی کویز' : 'Create Quiz')}
        description={isEditMode ? (language === 'ku' ? 'زانیارییەکان و پرسیارەکانی ئەم کویزە نوێ بکەوە' : 'Update details and questions for this quiz') : (language === 'ku' ? 'کویزێکی نوێ دروست بکە بە پرسیار و ڕێکخستنەکانەوە' : 'Build a new quiz with questions and settings')}
        breadcrumbs={[
          { label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' },
          { label: language === 'ku' ? 'کویزەکان' : 'Quizzes', href: '/quizzes' },
          { label: isEditMode ? (language === 'ku' ? 'دەستکاریکردن' : 'Edit') : (language === 'ku' ? 'دروستکردن' : 'Create') },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" /> {language === 'ku' ? 'گەڕانەوە' : 'Back'}
          </Button>
        }
      />

      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted rounded-full" />
          <div 
            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary rounded-full transition-all duration-300" 
            style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%`, right: language === 'ku' ? 0 : 'auto', left: language === 'ku' ? 'auto' : 0 }} 
          />
          
          {[
            language === 'ku' ? 'زانیارییەکان' : 'Details', 
            language === 'ku' ? 'پرسیارەکان' : 'Questions', 
            language === 'ku' ? 'پێداچوونەوە' : 'Preview'
          ].map((label, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            return (
              <div key={label} className="relative flex flex-col items-center z-10">
                <div 
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors shadow-sm",
                    isCompleted ? "bg-primary border-primary text-primary-foreground" : 
                    isCurrent ? "bg-background border-primary text-primary" : "bg-background border-muted text-muted-foreground"
                  )}
                >
                  {isCompleted ? <CheckCircle2 className="h-5 w-5" /> : <span className="font-semibold">{index + 1}</span>}
                </div>
                <span className={cn(
                  "absolute -bottom-7 text-sm font-semibold whitespace-nowrap",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-12 space-y-4">
        
        {/* STEP 1: Details */}
        {currentStep === 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-t-4 border-t-primary shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />{language === 'ku' ? 'زانیارییە سەرەکییەکان' : 'Basic Information'}</CardTitle>
                <CardDescription>{language === 'ku' ? 'زانیارییە گشتیەکانی کویزەکەت دیاری بکە.' : 'Set up the general details for your quiz.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-semibold">{language === 'ku' ? 'سەردێڕ' : 'Title'}</Label>
                  <Input id="title" className="h-12 text-lg" placeholder={language === 'ku' ? 'سەردێڕی کویزەکە بنووسە' : 'Enter quiz title'} {...register('title')} />
                  {errors.title && <p className="text-sm text-destructive font-medium">{language === 'ku' ? 'سەردێڕ کورتە' : errors.title.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">{language === 'ku' ? 'ناساندن' : 'Description'}</Label>
                  <Textarea id="description" className="resize-none" placeholder={language === 'ku' ? 'ناساندنێک بۆ کویزەکە بنووسە' : 'Describe what this quiz is about'} rows={4} {...register('description')} />
                  {errors.description && <p className="text-sm text-destructive font-medium">{language === 'ku' ? 'ناساندن پێویستە' : errors.description.message}</p>}
                </div>
                
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold">{language === 'ku' ? 'ئاستی سەختی' : 'Difficulty'}</Label>
                    <Select onValueChange={(v) => setValue('difficulty', v as 'easy' | 'medium' | 'hard')} value={watchValues.difficulty}>
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">{language === 'ku' ? 'ئاسان' : 'Easy'}</SelectItem>
                        <SelectItem value="medium">{language === 'ku' ? 'مامناوەند' : 'Medium'}</SelectItem>
                        <SelectItem value="hard">{language === 'ku' ? 'قورس' : 'Hard'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl" className="text-base font-semibold flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-primary" />
                      {language === 'ku' ? 'لۆگۆ / وێنەی کویز (URL)' : 'Quiz Logo / Avatar URL'}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="avatarUrl"
                        className="h-12 flex-1"
                        placeholder={language === 'ku' ? 'لینکی لۆگۆی کویز بنووسە https://...' : 'Enter logo/avatar image URL'}
                        {...register('avatarUrl')}
                      />
                      <input type="file" accept="image/*" className="hidden" ref={imageInputRef} onChange={handleFileUpload} />
                      <Button type="button" variant="outline" className="h-12 w-12 shrink-0" onClick={() => imageInputRef.current?.click()} disabled={isUploadingImage}>
                        {isUploadingImage ? <LucideIcons.Loader2 className="h-4 w-4 animate-spin" /> : <LucideIcons.Upload className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{language === 'ku' ? 'کاتی دەستپێکردن (ئارەزوومەندانە)' : 'Start Time (Optional)'}</Label>
                    <Input type="datetime-local" className="h-12" {...register('scheduledAt')} />
                    <p className="text-xs text-muted-foreground">{language === 'ku' ? 'ئەگەر کات دیاری بکرێت، کویزەکە دەبێتە scheduled' : 'If set, quiz becomes scheduled'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center gap-2">{language === 'ku' ? 'ژمارەی براوەکان' : 'Number of Winners'}</Label>
                    <Input
                      type="number"
                      min="0"
                      className="h-12"
                      {...register('winnersCount', { valueAsNumber: true })}
                    />
                  </div>
                </div>
                {/* Rewards Section */}
                {(watch('rewards') || []).length > 0 && (
                  <div className="space-y-4 rounded-lg bg-muted/50 p-5 border">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-primary" />
                        {language === 'ku' ? 'خەڵاتەکان بۆ هەر براوەیەک' : 'Prize per Rank'}
                      </Label>
                      <Badge variant="outline" className="text-sm">
                        {language === 'ku' ? 'کۆ:' : 'Total:'} {(watch('rewards') || []).reduce((s, r) => s + (r.amount || 0), 0).toLocaleString()} {language === 'ku' ? 'د.ع' : 'IQD'}
                      </Badge>
                    </div>
                    {/* Total pool + auto-distribute */}
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <span className={cn(
                          "absolute top-1/2 -translate-y-1/2 text-muted-foreground text-sm",
                          language === 'ku' ? "right-3" : "left-3"
                        )}>
                          {language === 'ku' ? 'د.ع' : 'IQD'}
                        </span>
                        <Input
                          type="text"
                          inputMode="numeric"
                          className={cn("h-10", language === 'ku' ? "pr-12" : "pl-12")}
                          placeholder={language === 'ku' ? 'کۆی گشتی خەڵات...' : 'Total prize pool...'}
                          value={totalPrize ? totalPrize.toLocaleString() : ''}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/,/g, '');
                            setTotalPrize(parseInt(raw) || 0);
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="h-10 gap-1.5 shrink-0"
                        onClick={() => {
                          const count = watch('winnersCount') || 0;
                          if (!count || !totalPrize) return;
                          // Weighted distribution: 50%, 30%, 20% for top 3, equal after
                          const weights = Array.from({ length: count }, (_, i) => {
                            if (i === 0) return 0.5;
                            if (i === 1) return 0.3;
                            if (i === 2) return 0.15;
                            return 0.05 / Math.max(count - 3, 1);
                          });
                          const total = weights.reduce((a, b) => a + b, 0);
                          const normalized = weights.map(w => w / total);
                          const distributed = normalized.map((w, i) => ({
                            rank: i + 1,
                            amount: Math.round(totalPrize * w),
                          }));
                          setValue('rewards', distributed);
                        }}
                      >
                        <Calculator className="h-3.5 w-3.5" />
                        {language === 'ku' ? 'دابەشکردن' : 'Auto-split'}
                      </Button>
                    </div>
                    {/* Per-rank inputs */}
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {(watch('rewards') || []).map((r, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="min-w-[80px] text-sm font-medium text-muted-foreground">
                            {language === 'ku' ? `${i + 1}. براوە` : `Rank ${i + 1}`}
                          </span>
                          <div className="relative flex-1">
                            <span className={cn(
                              "absolute top-1/2 -translate-y-1/2 text-muted-foreground text-sm",
                              language === 'ku' ? "right-3" : "left-3"
                            )}>
                              {language === 'ku' ? 'د.ع' : 'IQD'}
                            </span>
                            <Input
                              type="text"
                              inputMode="numeric"
                              className={cn("h-9", language === 'ku' ? "pr-12" : "pl-12")}
                              value={r.amount ? r.amount.toLocaleString() : ''}
                              onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, '');
                                const updated = [...(watch('rewards') || [])];
                                updated[i] = { rank: i + 1, amount: parseInt(raw) || 0 };
                                setValue('rewards', updated);
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 2: Questions */}
        {currentStep === 1 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            {questions.length === 0 ? (
              <Card className="border-dashed border-2">
                <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{language === 'ku' ? 'با دەست پێبکەین!' : 'Let\'s get started!'}</h3>
                  <p className="text-muted-foreground mb-6 max-w-sm">{language === 'ku' ? 'هیچ پرسیارێک نییە. یەکەم پرسیارت زیاد بکە بۆ ئەوەی بەشداربووان تاقیبکەیتەوە.' : 'No questions yet. Add your first question to test your participants.'}</p>
                  <Button type="button" size="lg" className="rounded-full shadow-lg hover:shadow-xl transition-all" onClick={addQuestion}>
                    <Plus className="me-2 h-5 w-5" /> {language === 'ku' ? 'زیادکردنی پرسیار' : 'Add Question'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" /> {language === 'ku' ? 'لیستی پرسیارەکان' : 'Questions List'}</h2>
                  <Badge variant="outline" className="text-sm px-3 py-1">{questions.length} {language === 'ku' ? 'پرسیار' : 'Questions'}</Badge>
                </div>
                {questions.map((q, index) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      className="group cursor-move border-s-4 border-s-primary shadow-sm hover:shadow-md transition-all overflow-hidden relative"
                    >
                      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <CardHeader className="flex flex-row items-center gap-4 pb-4 bg-muted/20 border-b">
                        <div className="p-2 bg-background rounded cursor-grab hover:bg-accent hover:text-accent-foreground transition-colors">
                          <GripVertical className="h-5 w-5" />
                        </div>
                        <div className="flex flex-1 items-center gap-3">
                          <CardTitle className="text-base font-bold">
                            {language === 'ku' ? `پرسیاری ${index + 1}` : `Question ${index + 1}`}
                          </CardTitle>
                          <Badge variant="secondary" className="capitalize">{q.type === 'multiple_choice' ? (language === 'ku' ? 'هەڵبژاردن' : 'Multiple Choice') : (language === 'ku' ? 'وێنە' : 'Image')}</Badge>
                        </div>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeQuestion(q.id)}
                        >
                          <Trash2 className="me-2 h-4 w-4" /> {language === 'ku' ? 'سڕینەوە' : 'Delete'}
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6 cursor-default">
                        <div className="space-y-3">
                          <Label className="text-base font-semibold">{language === 'ku' ? 'دەقی پرسیار' : 'Question Text'}</Label>
                          <Textarea
                            placeholder={language === 'ku' ? 'پرسیارەکەت بە ڕوونی بنووسە...' : 'Write your question clearly...'}
                            className="text-lg font-medium resize-none"
                            rows={2}
                            value={q.text}
                            onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                          />
                        </div>
                        
                        <div className="grid gap-6 sm:grid-cols-4 bg-muted/30 p-4 rounded-xl border">
                          <div className="space-y-2">
                            <Label className="font-semibold">{language === 'ku' ? 'جۆری بابەت' : 'Category'}</Label>
                            <Select
                              value={q.categoryId || ''}
                              onValueChange={(v) => updateQuestion(q.id, { categoryId: v })}
                            >
                              <SelectTrigger><SelectValue placeholder={language === 'ku' ? 'هەڵبژێرە' : 'Select'} /></SelectTrigger>
                              <SelectContent>
                                {categories.map(c => (
                                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="font-semibold">{language === 'ku' ? 'جۆر' : 'Type'}</Label>
                            <Select
                              value={q.type}
                              onValueChange={(v) => updateQuestion(q.id, { type: v as QuestionDraft['type'] })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple_choice">{language === 'ku' ? 'هەڵبژاردن' : 'Multiple Choice'}</SelectItem>
                                <SelectItem value="image">{language === 'ku' ? 'وێنە' : 'Image Question'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="font-semibold text-amber-600 dark:text-amber-500 flex items-center gap-1">
                              <Trophy className="h-4 w-4" /> {language === 'ku' ? 'خاڵەکان (نمرە)' : 'Points'}
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              className="border-amber-300 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 font-bold focus-visible:ring-amber-500 shadow-sm"
                              value={q.points}
                              onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value), type: q.type })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-semibold text-blue-600 dark:text-blue-500 flex items-center gap-1">
                              <Clock className="h-4 w-4" /> {language === 'ku' ? 'کاتی وەڵامدانەوە (چرکە)' : 'Timer (sec)'}
                            </Label>
                            <div className="flex items-center gap-2 relative">
                              <Input
                                type="number"
                                min={5}
                                className="border-blue-300 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 font-bold focus-visible:ring-blue-500 shadow-sm"
                                value={q.timer}
                                onChange={(e) => updateQuestion(q.id, { timer: Number(e.target.value), type: q.type })}
                              />
                            </div>
                          </div>
                        </div>

                        {q.type === 'image' && (
                          <div className="rounded-xl border-2 border-dashed border-border p-8 text-center bg-muted/10 hover:bg-muted/30 transition-colors relative overflow-hidden">
                            {q.mediaUrl ? (
                              <div className="relative group flex justify-center">
                                <img src={getMediaUrl(q.mediaUrl)} alt="Question media" className="max-h-48 object-contain rounded shadow-sm" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded">
                                  <label className="cursor-pointer">
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuestionImageUpload(e, q.id)} />
                                    <Button type="button" variant="secondary" size="sm" className="pointer-events-none">
                                      {language === 'ku' ? 'گۆڕین' : 'Change'}
                                    </Button>
                                  </label>
                                  <Button type="button" variant="destructive" size="sm" onClick={() => updateQuestion(q.id, { mediaUrl: '' })}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center gap-3 text-muted-foreground cursor-pointer">
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleQuestionImageUpload(e, q.id)} />
                                <div className="h-16 w-16 bg-background rounded-full shadow-sm flex items-center justify-center">
                                  <ImageIcon className="h-8 w-8 text-primary" />
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">{language === 'ku' ? 'کلیک بکە بۆ بارکردنی وێنە' : 'Click to upload image'}</p>
                                  <p className="text-xs mt-1">{language === 'ku' ? 'پشتگیری PNG, JPG, WEBP دەکات' : 'Supports PNG, JPG, WEBP'}</p>
                                </div>
                                <Button type="button" variant="secondary" size="sm" className="mt-2 pointer-events-none">{language === 'ku' ? 'هەڵبژاردنی وێنە' : 'Choose Image'}</Button>
                              </label>
                            )}
                            {uploadingQuestionId === q.id && (
                              <div className="absolute inset-0 bg-background/80 flex flex-col items-center justify-center z-10">
                                <LucideIcons.Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                                <p className="text-sm font-medium text-primary">{language === 'ku' ? 'باردەکرێت...' : 'Uploading...'}</p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="space-y-4">
                          <Label className="text-base font-semibold">{language === 'ku' ? 'هەڵبژاردنەکان (وەڵامی ڕاست دیاری بکە)' : 'Options (Mark the correct one)'}</Label>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {q.options.map((opt, optIndex) => (
                              <div 
                                key={opt.id} 
                                className={cn(
                                  "flex items-center gap-3 p-3 rounded-lg border transition-all",
                                  opt.isCorrect ? "bg-success/5 border-success/30 shadow-sm" : "bg-background hover:bg-muted/50"
                                )}
                              >
                                <button
                                  type="button"
                                  title={language === 'ku' ? 'وەڵامی ڕاست دیاری بکە' : 'Mark as correct answer'}
                                  onClick={() => updateQuestion(q.id, {
                                    options: q.options.map((o) => ({ ...o, isCorrect: o.id === opt.id })),
                                    type: q.type,
                                  })}
                                  className={cn(
                                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all shadow-sm",
                                    opt.isCorrect
                                      ? "border-success bg-success text-success-foreground scale-110"
                                      : "border-muted-foreground/30 hover:border-primary/50"
                                  )}
                                >
                                  {opt.isCorrect && <CheckCircle2 className="h-4 w-4" />}
                                </button>
                                <Input
                                  className={cn("border-0 shadow-none focus-visible:ring-1 focus-visible:ring-primary/50 bg-transparent", opt.isCorrect && "font-semibold")}
                                  placeholder={language === 'ku' ? `هەڵبژاردەی ${optIndex + 1}` : `Option ${optIndex + 1}`}
                                  value={opt.text}
                                  onChange={(e) => updateQuestion(q.id, {
                                    options: q.options.map((o) => o.id === opt.id ? { ...o, text: e.target.value } : o),
                                    type: q.type,
                                  })}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-dashed">
                          <Label className="text-sm font-semibold text-muted-foreground">{language === 'ku' ? 'ڕوونکردنەوەی وەڵام (ئارەزوومەندانە)' : 'Explanation (Optional)'}</Label>
                          <Textarea
                            placeholder={language === 'ku' ? 'ئەمە پیشان دەدرێت دوای ئەوەی بەشداربوو وەڵام دەداتەوە...' : 'This will be shown after the participant answers...'}
                            className="bg-muted/20"
                            rows={2}
                            value={q.explanation}
                            onChange={(e) => updateQuestion(q.id, { explanation: e.target.value, type: q.type })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                <div className="flex justify-center pt-4">
                  <Button type="button" size="lg" className="rounded-full shadow-md" onClick={addQuestion}>
                    <Plus className="me-2 h-5 w-5" /> {language === 'ku' ? 'زیادکردنی پرسیارێکی تر' : 'Add Another Question'}
                  </Button>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* STEP 3: Beautiful Preview */}
        {currentStep === 2 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Play className="h-8 w-8 text-primary ms-1" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">{language === 'ku' ? 'ئامادەی بۆ بڵاوکردنەوە؟' : 'Ready to Publish?'}</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                {language === 'ku' ? 'پێداچوونەوەیەکی خێرا بکە بۆ دڵنیابوون لە زانیارییەکان.' : 'Take a quick look to ensure everything is perfect.'}
              </p>
            </div>

            <Card className="overflow-hidden border-2 shadow-xl">
              <div className="bg-primary p-8 text-primary-foreground text-center relative overflow-hidden flex flex-col items-center">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                
                <img
                  src={watchValues.avatarUrl ? getMediaUrl(watchValues.avatarUrl) : '/logo.png'}
                  alt="Quiz Avatar"
                  className="h-20 w-20 rounded-2xl object-cover border-4 border-background bg-background shadow-md mb-4 z-10"
                />

                <h2 className="text-3xl font-bold mb-4 z-10">{watchValues.title || (language === 'ku' ? 'کویزی بێناو' : 'Untitled Quiz')}</h2>
                <p className="max-w-2xl mx-auto text-primary-foreground/80 text-lg z-10">{watchValues.description || (language === 'ku' ? 'هیچ ناساندنێک نییە.' : 'No description provided.')}</p>
              </div>

              <CardContent className="p-0">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 bg-muted/20">
                  <div className="p-6 text-center flex flex-col items-center justify-center">
                    <BarChart className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-muted-foreground">{language === 'ku' ? 'ئاست' : 'Difficulty'}</p>
                    <Badge variant="outline" className={cn("mt-1 capitalize text-sm font-bold", 
                      watchValues.difficulty === 'easy' ? 'text-green-500 border-green-200 bg-green-500/10' :
                      watchValues.difficulty === 'medium' ? 'text-amber-500 border-amber-200 bg-amber-500/10' :
                      'text-red-500 border-red-200 bg-red-500/10'
                    )}>
                      {watchValues.difficulty === 'easy' ? (language === 'ku' ? 'ئاسان' : 'Easy') : 
                       watchValues.difficulty === 'medium' ? (language === 'ku' ? 'مامناوەند' : 'Medium') : 
                       (language === 'ku' ? 'قورس' : 'Hard')}
                    </Badge>
                  </div>
                  <div className="p-6 text-center flex flex-col items-center justify-center">
                    <Clock className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-muted-foreground">{language === 'ku' ? 'ماوە' : 'Duration'}</p>
                    <p className="text-lg font-bold">
                      {Math.ceil(questions.reduce((acc, q) => acc + (q.timer || 0), 0) / 60)} {language === 'ku' ? 'خولەک' : 'min'}
                    </p>
                  </div>
                  <div className="p-6 text-center flex flex-col items-center justify-center">
                    <FileText className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-muted-foreground">{language === 'ku' ? 'پرسیارەکان' : 'Questions'}</p>
                    <p className="text-lg font-bold">{questions.length}</p>
                  </div>
                  <div className="p-6 text-center flex flex-col items-center justify-center">
                    <Settings className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-muted-foreground">{language === 'ku' ? 'گشتی' : 'Public'}</p>
                    <p className="text-lg font-bold">{watchValues.isPublic ? (language === 'ku' ? 'بەڵێ' : 'Yes') : (language === 'ku' ? 'نەخێر' : 'No')}</p>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="p-8 bg-background flex flex-col md:flex-row items-center justify-between gap-4 border-t">
                <Button type="button" variant="outline" size="lg" onClick={handleBack} className="w-full md:w-auto h-12 px-8 rounded-full">
                  <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" /> {language === 'ku' ? 'گەڕانەوە بۆ دەستکاریکردن' : 'Back to Edit'}
                </Button>

                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full md:w-auto h-12 px-12 rounded-full text-lg shadow-lg hover:shadow-xl transition-all">
                  {isSubmitting ? (
                    <span className="flex items-center">{language === 'ku' ? 'پاشەکەوت دەکرێت...' : 'Saving...'}</span>
                  ) : (
                    <span className="flex items-center font-bold">
                      {isEditMode ? (language === 'ku' ? 'پاشەکەوتکردنی گۆڕانکارییەکان' : 'Save Changes') : (language === 'ku' ? 'بڵاوکردنەوەی کویز' : 'Publish Quiz')}
                      <Save className="ms-2 h-5 w-5" />
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )}

        {/* Global Footer (Hidden on Preview step) */}
        {currentStep < 2 && (
          <div className="mt-8 flex justify-between border-t pt-6">
            <Button type="button" variant="outline" size="lg" onClick={handleBack} disabled={currentStep === 0} className="rounded-full">
              <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" /> {language === 'ku' ? 'گەڕانەوە' : 'Back'}
            </Button>

            <div className="flex gap-3">
              {isEditMode && (
                <Button
                  type="submit"
                  size="lg"
                  variant="outline"
                  className="rounded-full border-primary text-primary hover:bg-primary hover:text-primary-foreground shadow-sm"
                >
                  <Save className="me-2 h-4 w-4" />
                  {language === 'ku' ? 'پاشەکەوتکردن' : 'Save'}
                </Button>
              )}
              <Button type="button" size="lg" onClick={handleNext} className="rounded-full shadow-md">
                {language === 'ku' ? 'دواتر' : 'Next'} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
              </Button>
            </div>
          </div>
        )}
      </form>

    </DashboardShell>
  );
}
