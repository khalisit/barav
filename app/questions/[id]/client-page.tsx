'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Trophy, HelpCircle, Layers, Image as ImageIcon } from 'lucide-react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/api-client';
import type { Question } from '@/lib/types';
import { useLanguage } from '@/hooks/use-language';

export default function QuestionViewPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();

  const { data: question, isLoading } = useQuery<Question>({
    queryKey: ['questions', params.id],
    queryFn: () => api.get(`/questions/${params.id}`),
  });

  if (isLoading) {
    return (
      <DashboardShell>
        <PageHeader title={language === 'ku' ? 'زانیاری پرسیار' : 'Question Details'} description={language === 'ku' ? 'چاوەڕێ بکە...' : 'Loading question details...'} />
      </DashboardShell>
    );
  }

  if (!question) {
    return (
      <DashboardShell>
        <PageHeader title={language === 'ku' ? 'نەدۆزرایەوە' : 'Not Found'} description={language === 'ku' ? 'پرسیارەکە نەدۆزرایەوە.' : 'Question not found.'} />
        <Button onClick={() => router.back()} variant="outline">{language === 'ku' ? 'گەڕانەوە' : 'Go Back'}</Button>
      </DashboardShell>
    );
  }

  const options = Array.isArray(question.options) ? question.options : [];

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'زانیاری پرسیار' : 'Question Details'}
        description={language === 'ku' ? 'پێداچوونەوە بە زانیارییەکان و وەڵامەکانی پرسیارەکە (وێب بێ دیاریکردنی وەڵامی ڕاست)' : 'Review question details and options'}
        actions={
          <Button variant="outline" onClick={() => router.back()} className="rounded-full shadow-sm">
            <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180" /> {language === 'ku' ? 'گەڕانەوە' : 'Back'}
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-t-4 border-t-primary shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">{language === 'ku' ? 'دەقی پرسیار' : 'Question Text'}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-medium leading-relaxed bg-muted/20 p-6 rounded-xl border">{question.text}</p>
            </CardContent>
          </Card>

          {(question.type === 'image') && (
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="text-base">{language === 'ku' ? 'میدیا' : 'Media'}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-xl border-2 border-dashed border-border p-8 text-center bg-muted/10">
                  <div className="flex flex-col items-center gap-3 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 opacity-50" />
                    <p className="text-sm font-medium">{language === 'ku' ? 'وێنە یان دەنگی پرسیار لێرە دەردەکەوێت' : 'Media attachment will appear here'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" /> {language === 'ku' ? 'وەڵامەکان (هەڵبژاردنەکان)' : 'Options'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {options.slice(0, 4).map((opt: any, i: number) => {
                  const letters = ['A', 'B', 'C', 'D'];
                  return (
                    <div key={opt.id} className="flex items-center gap-4 p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-lg font-bold text-primary">
                        {letters[i]}
                      </div>
                      <span className="text-lg font-medium">{opt.text}</span>
                    </div>
                  );
                })}
                {options.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">{language === 'ku' ? 'هیچ وەڵامێک نییە.' : 'No options available.'}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="text-lg">{language === 'ku' ? 'کورتەی پرسیار' : 'Question Summary'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-muted-foreground font-medium">{language === 'ku' ? 'جۆر' : 'Type'}</span>
                <Badge variant="outline" className="capitalize bg-background font-semibold">
                  {question.type === 'multiple_choice' ? (language === 'ku' ? 'هەڵبژاردن' : 'Multiple Choice') : (language === 'ku' ? 'وێنە' : 'Image')}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-muted-foreground font-medium">{language === 'ku' ? 'وەڵامەکان' : 'Options'}</span>
                <span className="font-bold">4</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30">
                <span className="text-muted-foreground font-medium">{language === 'ku' ? 'جۆری بابەت' : 'Category'}</span>
                {question.categoryName ? (
                  <Badge variant="secondary" className="bg-background">{question.categoryName}</Badge>
                ) : (
                  <span className="font-medium">—</span>
                )}
              </div>
              <Separator />
              <div className="flex justify-between items-center p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/50">
                <span className="text-amber-700 dark:text-amber-500 font-medium flex items-center gap-2"><Trophy className="h-4 w-4" /> {language === 'ku' ? 'خاڵ' : 'Points'}</span>
                <span className="font-bold text-amber-700 dark:text-amber-500 text-lg">{question.points}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50">
                <span className="text-blue-700 dark:text-blue-500 font-medium flex items-center gap-2"><Clock className="h-4 w-4" /> {language === 'ku' ? 'کات' : 'Timer'}</span>
                <span className="font-bold text-blue-700 dark:text-blue-500 text-lg">{question.timer}s</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
