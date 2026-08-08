'use client';

import { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, ArrowLeft, Plus, Trash2, Image as ImageIcon, Mic } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateQuestions } from '@/lib/mock-data';
import { toast } from 'sonner';

const questionSchema = z.object({
  text: z.string().min(5, 'Question must be at least 5 characters'),
  type: z.enum(['multiple_choice', 'true_false', 'image', 'audio']),
  points: z.number().min(1).max(100),
  timer: z.number().min(5).max(300),
  explanation: z.string().optional(),
});

type QuestionFormValues = z.infer<typeof questionSchema>;

export default function QuestionEditorPage() {
  const params = useParams();
  const router = useRouter();
  const allQuestions = useMemo(() => generateQuestions(20), []);
  const existing = useMemo(
    () => allQuestions.find((q) => q.id === params.id) ?? allQuestions[0],
    [allQuestions, params.id]
  );

  const [options, setOptions] = useState(
    existing.options.length > 0
      ? existing.options
      : [{ id: 'a', text: '', isCorrect: true }, { id: 'b', text: '', isCorrect: false }]
  );
  const [correctOption, setCorrectOption] = useState(
    existing.options.find((o) => o.isCorrect)?.id ?? 'a'
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      text: existing.text,
      type: existing.type,
      points: existing.points,
      timer: existing.timer,
      explanation: existing.explanation,
    },
  });

  const type = watch('type');

  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      { id: String.fromCharCode(97 + prev.length), text: '', isCorrect: false },
    ]);
  };

  const removeOption = (id: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== id));
  };

  const onSubmit = (_values: QuestionFormValues) => {
    toast.success('Question saved');
    router.push('/questions');
  };

  return (
    <DashboardShell>
      <PageHeader
        title="Question Editor"
        description="Edit question details, options, and settings"
        breadcrumbs={[
          { label: 'Home', href: '/dashboard' },
          { label: 'Questions', href: '/questions' },
          { label: 'Editor' },
        ]}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Question</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Question Text</Label>
                <Textarea rows={3} placeholder="Enter your question" {...register('text')} />
                {errors.text && <p className="text-xs text-destructive">{errors.text.message}</p>}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={watch('type')}
                    onValueChange={(v) => setValue('type', v as QuestionFormValues['type'])}
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
                  <Input type="number" {...register('points', { valueAsNumber: true })} />
                  {errors.points && <p className="text-xs text-destructive">{errors.points.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Timer (sec)</Label>
                  <Input type="number" {...register('timer', { valueAsNumber: true })} />
                  {errors.timer && <p className="text-xs text-destructive">{errors.timer.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {(type === 'image' || type === 'audio') && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Media Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {type === 'image' ? <ImageIcon className="h-10 w-10" /> : <Mic className="h-10 w-10" />}
                    <p className="text-sm">Click or drag to upload {type}</p>
                    <Button type="button" variant="outline" size="sm">Choose File</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {type === 'true_false' ? (
                <RadioGroup
                  value={correctOption}
                  onValueChange={setCorrectOption}
                  className="grid grid-cols-2 gap-3"
                >
                  {['True', 'False'].map((label, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border p-3">
                      <RadioGroupItem value={i === 0 ? 'a' : 'b'} id={`tf-${i}`} />
                      <Label htmlFor={`tf-${i}`} className="cursor-pointer">{label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : (
                <>
                  {options.map((opt) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCorrectOption(opt.id)}
                        className={`flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
                          correctOption === opt.id
                            ? 'border-success bg-success text-success-foreground'
                            : 'border-border'
                        }`}
                      >
                        {correctOption === opt.id && <span className="text-xs">✓</span>}
                      </button>
                      <Input
                        placeholder={`Option ${opt.id.toUpperCase()}`}
                        value={opt.text}
                        onChange={(e) =>
                          setOptions((prev) =>
                            prev.map((o) => (o.id === opt.id ? { ...o, text: e.target.value } : o))
                          )
                        }
                      />
                      {options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => removeOption(opt.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {options.length < 6 && (
                    <Button type="button" variant="outline" size="sm" onClick={addOption}>
                      <Plus className="mr-2 h-4 w-4" /> Add Option
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={3}
                placeholder="Explain the correct answer (shown after answering)"
                {...register('explanation')}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">{type.replace('_', ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Points</span>
                <span className="font-medium">{watch('points')} pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Timer</span>
                <span className="font-medium">{watch('timer')}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Options</span>
                <span className="font-medium">{type === 'true_false' ? 2 : options.length}</span>
              </div>
            </CardContent>
          </Card>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" /> Save Question
          </Button>
        </div>
      </form>
    </DashboardShell>
  );
}
