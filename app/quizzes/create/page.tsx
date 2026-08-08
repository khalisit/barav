'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Save, Eye, ArrowLeft, Plus, GripVertical, Trash2, Clock, Image as ImageIcon, Mic, Video } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const quizSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  categoryId: z.string().min(1, 'Select a category'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  duration: z.number().min(1).max(120),
  isPublic: z.boolean(),
  shuffleQuestions: z.boolean(),
  showResults: z.boolean(),
});

type QuizFormValues = z.infer<typeof quizSchema>;

interface QuestionDraft {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'image' | 'audio';
  points: number;
  timer: number;
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
}

export default function CreateQuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
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
    },
  });

  const duration = watch('duration');

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

  const onSubmit = (_values: QuizFormValues) => {
    toast.success('Quiz created successfully');
    router.push('/quizzes');
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Create Quiz"
        description="Build a new quiz with questions and settings"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Quizzes', href: '/quizzes' },
          { label: 'Create' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs defaultValue="details" className="space-y-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="details">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quiz Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" placeholder="Enter quiz title" {...register('title')} />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe what this quiz is about" rows={3} {...register('description')} />
                  {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select onValueChange={(v) => setValue('categoryId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {['General', 'Science', 'History', 'Geography', 'Sports', 'Music', 'Movies', 'Technology'].map((c) => (
                          <SelectItem key={c} value={c.toLowerCase()}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select onValueChange={(v) => setValue('difficulty', v as 'easy' | 'medium' | 'hard')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Duration (minutes): {duration}</Label>
                  <Slider
                    value={[duration]}
                    min={1}
                    max={60}
                    step={1}
                    onValueChange={(v) => setValue('duration', v[0])}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="questions" className="space-y-4">
            {questions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-sm text-muted-foreground">No questions yet. Add your first question to get started.</p>
                  <Button className="mt-4" onClick={addQuestion}>
                    <Plus className="mr-2 h-4 w-4" /> Add Question
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {questions.map((q, index) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      className="cursor-move"
                    >
                      <CardHeader className="flex flex-row items-center gap-3 pb-3">
                        <GripVertical className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="flex-1 text-sm font-semibold">
                          Question {index + 1}
                        </CardTitle>
                        <Badge variant="secondary">{q.type.replace('_', ' ')}</Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeQuestion(q.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Question Text</Label>
                          <Textarea
                            placeholder="Enter your question"
                            value={q.text}
                            onChange={(e) => updateQuestion(q.id, { text: e.target.value })}
                          />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                              value={q.type}
                              onValueChange={(v) => updateQuestion(q.id, { type: v as QuestionDraft['type'] })}
                            >
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="true_false">True / False</SelectItem>
                                <SelectItem value="image">Image Question</SelectItem>
                                <SelectItem value="audio">Audio Question</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Points</Label>
                            <Input
                              type="number"
                              value={q.points}
                              onChange={(e) => updateQuestion(q.id, { points: Number(e.target.value) })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Timer (sec)</Label>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                value={q.timer}
                                onChange={(e) => updateQuestion(q.id, { timer: Number(e.target.value) })}
                              />
                            </div>
                          </div>
                        </div>

                        {(q.type === 'image' || q.type === 'audio') && (
                          <div className="rounded-lg border-2 border-dashed border-border p-6 text-center">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              {q.type === 'image' ? <ImageIcon className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                              <p className="text-sm">Click or drag to upload {q.type}</p>
                              <Button type="button" variant="outline" size="sm">Upload</Button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Options</Label>
                          <div className="space-y-2">
                            {q.options.map((opt) => (
                              <div key={opt.id} className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => updateQuestion(q.id, {
                                    options: q.options.map((o) => ({ ...o, isCorrect: o.id === opt.id })),
                                  })}
                                  className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                                    opt.isCorrect
                                      ? 'border-success bg-success text-success-foreground'
                                      : 'border-border'
                                  }`}
                                >
                                  {opt.isCorrect && <span className="text-xs">✓</span>}
                                </button>
                                <Input
                                  placeholder={`Option ${opt.id.toUpperCase()}`}
                                  value={opt.text}
                                  onChange={(e) => updateQuestion(q.id, {
                                    options: q.options.map((o) => o.id === opt.id ? { ...o, text: e.target.value } : o),
                                  })}
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label>Explanation</Label>
                          <Textarea
                            placeholder="Explain the correct answer"
                            value={q.explanation}
                            onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                <Button type="button" variant="outline" className="w-full" onClick={addQuestion}>
                  <Plus className="mr-2 h-4 w-4" /> Add Question
                </Button>
              </>
            )}
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Quiz Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: 'isPublic', label: 'Public Quiz', desc: 'Allow anyone to find and join this quiz' },
                  { key: 'shuffleQuestions', label: 'Shuffle Questions', desc: 'Randomize question order for each participant' },
                  { key: 'showResults', label: 'Show Results', desc: 'Display results after quiz completion' },
                ].map((setting) => (
                  <div key={setting.key} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="text-sm font-medium">{setting.label}</p>
                      <p className="text-xs text-muted-foreground">{setting.desc}</p>
                    </div>
                    <Switch
                      checked={watch(setting.key as 'isPublic' | 'shuffleQuestions' | 'showResults')}
                      onCheckedChange={(v) => setValue(setting.key as 'isPublic' | 'shuffleQuestions' | 'showResults', v)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-muted/30 p-6">
                  <h3 className="text-lg font-bold">{watch('title') || 'Untitled Quiz'}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{watch('description') || 'No description yet.'}</p>
                  <div className="mt-4 flex gap-2">
                    <Badge variant="outline">{watch('difficulty')}</Badge>
                    <Badge variant="outline">{duration} min</Badge>
                    <Badge variant="outline">{questions.length} questions</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline">
            <Eye className="mr-2 h-4 w-4" /> Preview
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" /> Save Quiz
          </Button>
        </div>
      </form>
    </DashboardShell>
  );
}
