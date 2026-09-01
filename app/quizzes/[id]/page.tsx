'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Play, Archive, Send, Users, Clock, HelpCircle, CheckCircle2, Trophy, BarChart, FileText, Settings, Layers, Plus } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatCard } from '@/components/shared/stat-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api-client';
import type { Quiz, Question } from '@/lib/types';
import { formatDate, formatDateTime } from '@/lib/format';
import { toast } from 'sonner';
import { useLanguage } from '@/hooks/use-language';
import { cn } from '@/lib/utils';

export default function QuizDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { language } = useLanguage();
  const queryClient = useQueryClient();

  const { data: quizResult, isLoading: isQuizLoading } = useQuery<{ data: Quiz }>({
    queryKey: ['quizzes', params.id],
    queryFn: () => api.get(`/quizzes/${params.id}`)
  });

  const { data: questionsResult, isLoading: isQuestionsLoading } = useQuery<{ data: Question[] }>({
    queryKey: ['questions'],
    queryFn: () => api.get('/questions')
  });

  const updateMutation = useMutation({
    mutationFn: (status: string) => api.put(`/quizzes/${params.id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quizzes'] });
      toast.success(language === 'ku' ? 'دۆخی کویزەکە نوێکرایەوە' : 'Quiz status updated');
    }
  });

  const quiz = quizResult?.data || quizResult || ({} as any);
  const questions = ((questionsResult?.data || []) as Question[]).filter(q => String(q.quizId) === String(params.id));

  const totalTimerSeconds = questions.reduce((acc, q) => acc + (q.timer || 0), 0);
  const formattedDuration = totalTimerSeconds >= 60
    ? `${Math.floor(totalTimerSeconds / 60)}${language === 'ku' ? 'خ' : 'm'} ${totalTimerSeconds % 60}${language === 'ku' ? 'چ' : 's'}`
    : `${totalTimerSeconds} ${language === 'ku' ? 'چرکە' : 'sec'}`;

  if (isQuizLoading) {
    return <DashboardShell><PageHeader title={language === 'ku' ? 'زانیاری کویز' : 'Quiz Details'} description={language === 'ku' ? 'چاوەڕێبە...' : 'Loading...'} /></DashboardShell>;
  }

  return (
    <DashboardShell>
      <PageHeader
        title={quiz.title}
        description={quiz.description}
        breadcrumbs={[
          { label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' },
          { label: language === 'ku' ? 'کویزەکان' : 'Quizzes', href: '/quizzes' },
          { label: quiz.title || '' },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => router.back()} className="group">
              <ArrowLeft className="me-2 h-4 w-4 rtl:rotate-180 transition-transform group-hover:-translate-x-1" />
              {language === 'ku' ? 'گەڕانەوە' : 'Back'}
            </Button>
            {!['published', 'PUBLISHED', 'running', 'LIVE'].includes(quiz.status) &&
              quiz.sessionStatus !== 'LIVE' &&
              quiz.sessionStatus !== 'FINISHED' && (
              <Button variant="outline" asChild className="hover:bg-primary/5 hover:text-primary border-primary/20">
                <Link href={`/quizzes/${quiz.id}/edit`}>
                  <Pencil className="me-2 h-4 w-4" /> {language === 'ku' ? 'دەستکاریکردن' : 'Edit'}
                </Link>
              </Button>
            )}
            {['draft', 'DRAFT'].includes(quiz.status) && (
              <Button onClick={() => updateMutation.mutate('published')} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all">
                <Send className="me-2 h-4 w-4" /> {language === 'ku' ? 'بڵاوکردنەوە' : 'Publish'}
              </Button>
            )}
            {['published', 'PUBLISHED'].includes(quiz.status) && (
              <Button onClick={() => router.push(`/quiz-live/${quiz.id}`)} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all group">
                <Play className="me-2 h-4 w-4 group-hover:scale-110 transition-transform" /> {language === 'ku' ? 'دەستپێکردنی لایڤ' : 'Start Live Quiz'}
              </Button>
            )}
            <Button variant="outline" onClick={() => toast.success(language === 'ku' ? 'ئەرشیف کرا' : 'Quiz archived')} className="text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10">
              <Archive className="me-2 h-4 w-4" /> {language === 'ku' ? 'ئەرشیف' : 'Archive'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mb-8">
        <StatCard title={language === 'ku' ? 'پرسیارەکان' : 'Questions'} value={questions.length} icon={HelpCircle} />
        <StatCard title={language === 'ku' ? 'بەشداربووان' : 'Participants'} value={quiz.participantCount || 0} icon={Users} accent="info" />
        <StatCard title={language === 'ku' ? 'کاتی گشتی' : 'Duration'} value={formattedDuration} icon={Clock} accent="warning" />
        <StatCard title={language === 'ku' ? 'براوەکان' : 'Winners'} value={quiz.winnersCount || 0} icon={Trophy} accent="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Quiz Information & Rewards */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-t-4 border-t-primary shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30 pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> {language === 'ku' ? 'زانیاری کویز' : 'Quiz Info'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4 text-sm">
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-muted-foreground font-medium">{language === 'ku' ? 'دۆخی کویز' : 'Quiz Status'}</span>
                <StatusBadge status={quiz.status} />
              </div>
              {quiz.sessionStatus && (
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <span className="text-muted-foreground font-medium">{language === 'ku' ? 'دۆخی یاری' : 'Session Status'}</span>
                  <StatusBadge status={quiz.sessionStatus} />
                </div>
              )}
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-muted-foreground font-medium">{language === 'ku' ? 'ئاستی سەختی' : 'Difficulty'}</span>
                <Badge variant="outline" className={cn("capitalize font-semibold",
                  quiz.difficulty === 'easy' ? 'text-green-500 border-green-200 bg-green-500/10' :
                    quiz.difficulty === 'medium' ? 'text-amber-500 border-amber-200 bg-amber-500/10' :
                      'text-red-500 border-red-200 bg-red-500/10'
                )}>
                  {quiz.difficulty === 'easy' ? (language === 'ku' ? 'ئاسان' : 'Easy') :
                    quiz.difficulty === 'medium' ? (language === 'ku' ? 'مامناوەند' : 'Medium') :
                      (language === 'ku' ? 'قورس' : 'Hard')}
                </Badge>
              </div>

              <Separator className="my-2" />

              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-muted-foreground font-medium">{language === 'ku' ? 'دروستکراوە لە' : 'Created'}</span>
                <span className="font-semibold">{formatDate(quiz.createdAt)}</span>
              </div>
              <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <span className="text-muted-foreground font-medium">{language === 'ku' ? 'نوێکراوەتەوە لە' : 'Updated'}</span>
                <span className="font-semibold">{formatDate(quiz.updatedAt)}</span>
              </div>
              {(quiz.startedAt || quiz.scheduledAt) && (
                <div className="flex justify-between items-center p-2 rounded-lg hover:bg-muted/50 transition-colors bg-primary/5 border border-primary/10">
                  <span className="text-primary font-medium">{language === 'ku' ? 'کاتی دەستپێکردن' : 'Start Time'}</span>
                  <span className="font-bold text-primary">{formatDateTime(quiz.startedAt || quiz.scheduledAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Winners Section */}
          {quiz.winners && quiz.winners.length > 0 && (
            <Card className="border-t-4 border-t-emerald-500 shadow-md">
              <CardHeader className="bg-emerald-500/5 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-emerald-500" /> {language === 'ku' ? 'براوەکانی کویز' : 'Quiz Winners'}</CardTitle>
                <CardDescription>{language === 'ku' ? 'لیستی فەرمی براوەکان لەگەڵ خەڵاتەکانیان' : 'Official list of winners and their prizes'}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {quiz.winners.map((winner: any, idx: number) => {
                    const formattedPrize = winner.prizeAmount 
                      ? `${winner.prizeAmount.toLocaleString()} ${language === 'ku' ? 'د.ع' : 'IQD'}`
                      : winner.prize;
                    return (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg border bg-background shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-inner",
                            winner.rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-300" :
                              winner.rank === 2 ? "bg-slate-100 text-slate-700 border border-slate-300" :
                                winner.rank === 3 ? "bg-orange-100 text-orange-800 border border-orange-300" :
                                  "bg-primary/10 text-primary border border-primary/20"
                          )}>
                            #{winner.rank}
                          </div>
                          
                          <Avatar className="h-8 w-8 border">
                            <AvatarImage src={winner.avatarUrl || undefined} alt={winner.userName || winner.username} />
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                              {winner.userName ? winner.userName[0].toUpperCase() : winner.username ? winner.username[0].toUpperCase() : 'W'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">{winner.userName || winner.username || (language === 'ku' ? 'نەناردراو' : 'Unknown')}</span>
                            <span className="text-xs text-muted-foreground">{winner.score} {language === 'ku' ? 'خاڵ' : 'pts'}</span>
                          </div>
                        </div>
                        <span className="font-extrabold text-base text-emerald-600">
                          {formattedPrize}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rewards Section */}
          {quiz.rewards && quiz.rewards.length > 0 && (
            <Card className="border-t-4 border-t-amber-500 shadow-md">
              <CardHeader className="bg-amber-500/5 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /> {language === 'ku' ? 'خەڵاتەکان' : 'Rewards'}</CardTitle>
                <CardDescription>{language === 'ku' ? 'خەڵاتی براوەکانی کویزەکە' : 'Prizes for the top winners'}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {quiz.rewards.map((reward: any, idx: number) => {
                    return (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg border bg-background shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shadow-inner",
                            reward.rank === 1 ? "bg-amber-100 text-amber-700 border border-amber-300" :
                              reward.rank === 2 ? "bg-slate-100 text-slate-700 border border-slate-300" :
                                reward.rank === 3 ? "bg-orange-100 text-orange-800 border border-orange-300" :
                                  "bg-primary/10 text-primary border border-primary/20"
                          )}>
                            #{reward.rank}
                          </div>
                          <span className="font-semibold text-sm">
                            {reward.rank === 1 ? (language === 'ku' ? 'براوەی یەکەم' : '1st Place Winner') :
                             reward.rank === 2 ? (language === 'ku' ? 'براوەی دووەم' : '2nd Place Winner') :
                             reward.rank === 3 ? (language === 'ku' ? 'براوەی سێیەم' : '3rd Place Winner') :
                             `${language === 'ku' ? 'براوەی' : 'Winner'} ${reward.rank}`}
                          </span>
                        </div>
                        <span className="font-extrabold text-base text-emerald-600">
                          {reward.amount.toLocaleString()} {language === 'ku' ? 'د.ع' : 'IQD'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Questions */}
        <Card className="lg:col-span-2 shadow-lg border-muted/50 overflow-hidden flex flex-col h-[calc(100vh-200px)] max-h-[800px]">
          <CardHeader className="bg-muted/10 border-b pb-4 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Layers className="h-5 w-5 text-primary" />
                  {language === 'ku' ? 'پرسیارەکان' : 'Questions'}
                </CardTitle>
                <CardDescription className="mt-1">
                  {language === 'ku' ? `کۆی گشتی ${questions.length} پرسیار لەم کویزەدا هەیە` : `Total of ${questions.length} questions in this quiz`}
                </CardDescription>
              </div>
              <Badge variant="secondary" className="text-sm px-3 py-1 bg-primary/10 text-primary hover:bg-primary/20">{questions.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/5">
            {isQuestionsLoading ? (
              <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div></div>
            ) : questions.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center">
                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <HelpCircle className="h-8 w-8 text-muted-foreground/60" />
                </div>
                <h3 className="text-lg font-bold">{language === 'ku' ? 'هیچ پرسیارێک نییە' : 'No questions yet'}</h3>
                <p className="text-muted-foreground mt-2 max-w-sm">{language === 'ku' ? 'ئەم کویزە هێشتا هیچ پرسیارێکی بۆ زیاد نەکراوە.' : 'This quiz does not have any questions added to it yet.'}</p>
                {!['published', 'PUBLISHED', 'running', 'LIVE'].includes(quiz.status) && (
                  <Button asChild className="mt-6 rounded-full shadow-md hover:shadow-lg transition-all">
                    <Link href={`/quizzes/${quiz.id}/edit`}><Plus className="me-2 h-4 w-4" /> {language === 'ku' ? 'زیادکردنی پرسیار' : 'Add Question'}</Link>
                  </Button>
                )}
              </div>
            ) : (
              <AnimatePresence>
                {questions.map((q, i) => (
                  <motion.div
                    key={q.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    className="flex flex-col sm:flex-row sm:items-start gap-4 rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-all group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-sm font-bold text-primary group-hover:scale-110 transition-transform">
                      {i + 1}
                    </div>
                    <div className="flex-1 space-y-2 w-full">
                      <p className="text-base font-semibold leading-relaxed">{q.text}</p>

                      <div className="flex flex-wrap items-center gap-2 pt-3 border-t mt-3">
                        <Badge variant="outline" className="text-xs bg-muted/50 capitalize text-foreground/80">
                          {q.type === 'multiple_choice' ? (language === 'ku' ? 'هەڵبژاردن' : 'Multiple Choice') : (language === 'ku' ? 'وێنە' : 'Image')}
                        </Badge>
                        <Badge variant="secondary" className="text-xs font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-100 border border-amber-300"><Trophy className="me-1.5 h-3 w-3 inline" /> {q.points} {language === 'ku' ? 'خاڵ' : 'pts'}</Badge>
                        <Badge variant="secondary" className="text-xs font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-100 border border-blue-300"><Clock className="me-1.5 h-3 w-3 inline" /> {q.timer} {language === 'ku' ? 'چرکە' : 'sec'}</Badge>
                        {q.categoryName && (
                          <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary bg-primary/5">{q.categoryName}</Badge>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
