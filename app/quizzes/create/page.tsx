'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import * as LucideIcons from 'lucide-react';
import { Save, ArrowLeft, ArrowRight, Plus, GripVertical, Trash2, Clock, Image as ImageIcon, CheckCircle2, FileText, Settings, Play, BarChart } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
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
import { cn } from '@/lib/utils';

const quizSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  description: z.string().min(1, 'Description is required'),
  categoryId: z.string().min(1, 'Select a category'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  duration: z.number().min(1).max(120),
  isPublic: z.boolean(),
  shuffleQuestions: z.boolean(),
  showResults: z.boolean(),
  scheduledAt: z.string().optional().nullable(),
});

type QuizFormValues = z.infer<typeof quizSchema>;

interface QuestionDraft {
  id: string;
  text: string;
  type: 'multiple_choice' | 'image';
  points: number;
  timer: number;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

const STEPS = ['details', 'questions', 'settings', 'preview'] as const;

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
      duration: 15,
      isPublic: true,
      shuffleQuestions: false,
      showResults: true,
      categoryId: '',
      scheduledAt: '',
    },
  });

  // Hydrate form if in edit mode
  useEffect(() => {
    async function loadQuizData() {
      if (!isEditMode) return;
      try {
        const quizData = await api.get<Quiz>(`/quizzes/${quizIdToEdit}`);
        if (quizData) {
          reset({
            title: quizData.title || '',
            description: quizData.description || '',
            categoryId: quizData.categoryId || '',
            difficulty: quizData.difficulty as 'easy' | 'medium' | 'hard' || 'medium',
            duration: quizData.duration || 15,
            isPublic: true, // Mock property mapping
            shuffleQuestions: false, // Mock property mapping
            showResults: true, // Mock property mapping
            scheduledAt: quizData.scheduledAt ? new Date(quizData.scheduledAt).toISOString().slice(0, 16) : '',
          });
        }

        const questionsData = await api.get<{ data: QuestionDraft[] }>(`/questions?quizId=${quizIdToEdit}`);
        if (questionsData?.data) {
          setQuestions(questionsData.data.map(q => ({
            ...q,
            // Fallback for valid types if somehow an old type is fetched
            type: (q.type === 'image' ? 'image' : 'multiple_choice') as 'multiple_choice' | 'image'
          })));
        }
      } catch (error) {
        console.error('Failed to load quiz for editing:', error);
        toast.error(language === 'ku' ? 'نەتوانرا زانیارییەکان بهێندرێتەوە' : 'Failed to load quiz data');
      }
    }
    loadQuizData();
  }, [isEditMode, quizIdToEdit, reset, language]);

  const duration = watch('duration');
  const watchValues = watch();
  const selectedCategoryName = categories.find(c => c.id === watchValues.categoryId)?.name;

  const handleNext = async () => {
    let isValid = false;
    
    if (currentStep === 0) {
      isValid = await trigger(['title', 'description', 'categoryId', 'difficulty', 'duration']);
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
    } else if (currentStep === 2) {
      isValid = await trigger(['isPublic', 'shuffleQuestions', 'showResults']);
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
        options: [
          { id: 'a', text: '', isCorrect: true },
          { id: 'b', text: '', isCorrect: false },
          { id: 'c', text: '', isCorrect: false },
          { id: 'd', text: '', isCorrect: false },
        ],
        explanation: '',
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
      const category = categories.find(c => c.id === values.categoryId);
      const quizPayload = {
        title: values.title,
        description: values.description,
        categoryId: values.categoryId,
        categoryName: category?.name,
        difficulty: values.difficulty,
        duration: values.duration,
        status: values.scheduledAt ? 'scheduled' : 'published',
        questionCount: questions.length,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : null,
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
            language === 'ku' ? 'ڕێکخستنەکان' : 'Settings', 
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
                    <Label className="text-base font-semibold">{language === 'ku' ? 'جۆری بابەت' : 'Category'}</Label>
                    <Select onValueChange={(v) => setValue('categoryId', v)} value={watchValues.categoryId}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder={language === 'ku' ? 'جۆری بابەت هەڵبژێرە' : 'Select category'} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingCategories ? (
                          <SelectItem value="loading" disabled>{language === 'ku' ? 'چاوەڕێبە...' : 'Loading...'}</SelectItem>
                        ) : categories.length > 0 ? (
                          categories.map((c) => {
                            const IconComponent = c.icon && (LucideIcons as any)[c.icon] ? (LucideIcons as any)[c.icon] : null;
                            return (
                              <SelectItem key={c.id} value={c.id}>
                                <div className="flex items-center gap-2">
                                  {IconComponent && <IconComponent className="h-4 w-4" style={{ color: c.color }} />}
                                  <span>{c.name}</span>
                                </div>
                              </SelectItem>
                            );
                          })
                        ) : (
                          <SelectItem value="none" disabled>{language === 'ku' ? 'هیچ جۆرە بابەتێک نییە' : 'No categories found'}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && <p className="text-sm text-destructive font-medium">{language === 'ku' ? 'تکایە جۆرە بابەتێک هەڵبژێرە' : errors.categoryId.message}</p>}
                  </div>
                  
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
                </div>
                
                <div className="space-y-4 rounded-lg bg-muted/50 p-6 border">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> {language === 'ku' ? 'ماوەی کات' : 'Duration'}</Label>
                    <Badge variant="secondary" className="text-sm px-3 py-1">{duration} {language === 'ku' ? 'خولەک' : 'min'}</Badge>
                  </div>
                  <Slider
                    value={[duration]}
                    min={1}
                    max={120}
                    step={1}
                    onValueChange={(v) => setValue('duration', v[0])}
                    className="py-4"
                  />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-base font-semibold flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{language === 'ku' ? 'کاتی دەستپێکردن (ئارەزوومەندانە)' : 'Start Time (Optional)'}</Label>
                    <Input type="datetime-local" className="h-12" {...register('scheduledAt')} />
                    <p className="text-xs text-muted-foreground">{language === 'ku' ? 'ئەگەر کات دیاری بکرێت، کویزەکە دەبێتە scheduled' : 'If set, quiz becomes scheduled'}</p>
                  </div>
                </div>
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
                        
                        <div className="grid gap-6 sm:grid-cols-3 bg-muted/30 p-4 rounded-xl border">
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
                            <Label className="font-semibold">{language === 'ku' ? 'خاڵەکان (نمرە)' : 'Points'}</Label>
                            <Input
                              type="number"
                              min={1}
                              value={q.points}
                              onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="font-semibold">{language === 'ku' ? 'کاتی وەڵامدانەوە (چرکە)' : 'Timer (sec)'}</Label>
                            <div className="flex items-center gap-2 relative">
                              <Clock className="absolute ms-3 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                min={5}
                                className="ps-9"
                                value={q.timer}
                                onChange={(e) => updateQuestion(q.id, { timer: Number(e.target.value) })}
                              />
                            </div>
                          </div>
                        </div>

                        {q.type === 'image' && (
                          <div className="rounded-xl border-2 border-dashed border-border p-8 text-center bg-muted/10 hover:bg-muted/30 transition-colors">
                            <div className="flex flex-col items-center gap-3 text-muted-foreground">
                              <div className="h-16 w-16 bg-background rounded-full shadow-sm flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{language === 'ku' ? 'کلیک بکە یان وێنەیەک ڕابکێشە' : 'Click or drag an image'}</p>
                                <p className="text-xs mt-1">{language === 'ku' ? 'پشتگیری PNG, JPG دەکات' : 'Supports PNG, JPG'}</p>
                              </div>
                              <Button type="button" variant="secondary" size="sm" className="mt-2">{language === 'ku' ? 'هەڵبژاردنی وێنە' : 'Choose Image'}</Button>
                            </div>
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
                            onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
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

        {/* STEP 3: Settings */}
        {currentStep === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className="border-t-4 border-t-primary shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />{language === 'ku' ? 'ڕێکخستنەکانی کویز' : 'Quiz Settings'}</CardTitle>
                <CardDescription>{language === 'ku' ? 'شێوازی کارکردنی کویزەکەت ڕێکبخە پێش بڵاوکردنەوەی.' : 'Configure how your quiz behaves before publishing.'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'isPublic', label: language === 'ku' ? 'کویزی گشتی' : 'Public Quiz', desc: language === 'ku' ? 'ڕێگە بدە هەمووان ئەم کویزە ببینن و بەشداری بکەن' : 'Allow anyone to find and join this quiz in the catalog' },
                  { key: 'shuffleQuestions', label: language === 'ku' ? 'تێکەڵکردنی پرسیارەکان' : 'Shuffle Questions', desc: language === 'ku' ? 'پرسیارەکان بە هەڕەمەکی بۆ هەر بەشداربوویەک دەردەکەون' : 'Randomize question order for each participant automatically' },
                  { key: 'showResults', label: language === 'ku' ? 'پیشاندانی ئەنجام' : 'Show Results', desc: language === 'ku' ? 'دوای تەواوبوون، ئەنجامەکان ڕاستەوخۆ پیشان بدرێت' : 'Display the final score and results after quiz completion' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
                    <div className="pe-4">
                      <Label className="text-base font-bold cursor-pointer" htmlFor={setting.key}>{setting.label}</Label>
                      <p className="text-sm text-muted-foreground mt-1">{setting.desc}</p>
                    </div>
                    <Switch
                      id={setting.key}
                      checked={watchValues[setting.key as 'isPublic' | 'shuffleQuestions' | 'showResults']}
                      onCheckedChange={(v) => setValue(setting.key as 'isPublic' | 'shuffleQuestions' | 'showResults', v)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* STEP 4: Beautiful Preview */}
        {currentStep === 3 && (
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
              <div className="bg-primary p-8 text-primary-foreground text-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <Badge variant="outline" className="bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 mb-4 backdrop-blur-md">
                  {selectedCategoryName || (language === 'ku' ? 'بێ جۆری بابەت' : 'No Category')}
                </Badge>
                <h2 className="text-3xl font-bold mb-4">{watchValues.title || (language === 'ku' ? 'کویزی بێناو' : 'Untitled Quiz')}</h2>
                <p className="max-w-2xl mx-auto text-primary-foreground/80 text-lg">{watchValues.description || (language === 'ku' ? 'هیچ ناساندنێک نییە.' : 'No description provided.')}</p>
              </div>

              <CardContent className="p-0">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 bg-muted/20">
                  <div className="p-6 text-center flex flex-col items-center justify-center">
                    <BarChart className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-muted-foreground">{language === 'ku' ? 'ئاست' : 'Difficulty'}</p>
                    <p className="text-lg font-bold capitalize">{watchValues.difficulty}</p>
                  </div>
                  <div className="p-6 text-center flex flex-col items-center justify-center">
                    <Clock className="h-6 w-6 text-muted-foreground mb-2" />
                    <p className="text-sm font-semibold text-muted-foreground">{language === 'ku' ? 'ماوە' : 'Duration'}</p>
                    <p className="text-lg font-bold">{watchValues.duration} {language === 'ku' ? 'خولەک' : 'min'}</p>
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
        {currentStep < 3 && (
          <div className="mt-8 flex justify-between border-t pt-6">
            <Button type="button" variant="outline" size="lg" onClick={handleBack} disabled={currentStep === 0} className="rounded-full">
              <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" /> {language === 'ku' ? 'گەڕانەوە' : 'Back'}
            </Button>

            <Button type="button" size="lg" onClick={handleNext} className="rounded-full shadow-md">
              {language === 'ku' ? 'دواتر' : 'Next'} <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" />
            </Button>
          </div>
        )}
      </form>
    </DashboardShell>
  );
}
