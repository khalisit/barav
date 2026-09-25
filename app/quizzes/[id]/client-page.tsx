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
            {['published', 'PUBLISHED'].includes(quiz.status) && quiz.sessionStatus !== 'FINISHED' && (
              <Button onClick={() => router.push(`/quiz-live/${quiz.id}`)} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25 transition-all group rounded-xl px-5">
                <Play className="me-2 h-4 w-4 group-hover:scale-110 transition-transform" /> {language === 'ku' ? 'دەستپێکردنی لایڤ' : 'Start Live Quiz'}
              </Button>
            )}
            <Button variant="outline" onClick={() => toast.success(language === 'ku' ? 'ئەرشیف کرا' : 'Quiz archived')} className="text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 rounded-xl">
              <Archive className="me-2 h-4 w-4" /> {language === 'ku' ? 'ئەرشیف' : 'Archive'}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title={language === 'ku' ? 'پرسیارەکان' : 'Questions'} value={questions.length} icon={HelpCircle} />
        <StatCard title={language === 'ku' ? 'بەشداربووان' : 'Participants'} value={quiz.participantCount || 0} icon={Users} accent="info" />
        <StatCard title={language === 'ku' ? 'کاتی گشتی' : 'Duration'} value={formattedDuration} icon={Clock} accent="warning" />
        <StatCard title={language === 'ku' ? 'براوەکان' : 'Winners'} value={quiz.winnersCount || 0} icon={Trophy} accent="success" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column: Quiz Information & Rewards */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-t-4 border-t-primary shadow-sm bg-gradient-to-b from-background to-muted/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> {language === 'ku' ? 'زانیاری کویز' : 'Quiz Info'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                <span className="text-muted-foreground font-semibold">{language === 'ku' ? 'دۆخی کویز' : 'Quiz Status'}</span>
                <StatusBadge status={quiz.status} />
              </div>
              {quiz.sessionStatus && (
                <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                  <span className="text-muted-foreground font-semibold">{language === 'ku' ? 'دۆخی یاری' : 'Session Status'}</span>
                  <StatusBadge status={quiz.sessionStatus} />
                </div>
              )}
              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                <span className="text-muted-foreground font-semibold">{language === 'ku' ? 'ئاستی سەختی' : 'Difficulty'}</span>
                <Badge variant="outline" className={cn("capitalize font-bold border-2 shadow-sm px-3",
                  quiz.difficulty === 'easy' ? 'text-green-500 border-green-200 bg-green-500/10' :
                    quiz.difficulty === 'medium' ? 'text-amber-500 border-amber-200 bg-amber-500/10' :
                      'text-red-500 border-red-200 bg-red-500/10'
                )}>
                  {quiz.difficulty === 'easy' ? (language === 'ku' ? 'ئاسان' : 'Easy') :
                    quiz.difficulty === 'medium' ? (language === 'ku' ? 'مامناوەند' : 'Medium') :
                      (language === 'ku' ? 'قورس' : 'Hard')}
                </Badge>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors">
                <span className="text-muted-foreground font-semibold">{language === 'ku' ? 'دروستکراوە لە' : 'Created'}</span>
                <span className="font-bold text-foreground">{formatDate(quiz.createdAt)}</span>
              </div>
              {(quiz.startedAt || quiz.scheduledAt) && (
                <div className="flex justify-between items-center p-3 rounded-xl bg-primary/5 border border-primary/20 shadow-inner">
                  <span className="text-primary font-bold">{language === 'ku' ? 'کاتی دەستپێکردن' : 'Start Time'}</span>
                  <span className="font-black text-primary">{formatDateTime(quiz.startedAt || quiz.scheduledAt)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Winners Section */}
          {quiz.winners && quiz.winners.length > 0 && (
            <Card className="border-t-4 border-t-emerald-500 shadow-sm bg-gradient-to-b from-background to-emerald-50/10 dark:to-emerald-950/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-emerald-500" /> {language === 'ku' ? 'براوەکانی کویز' : 'Quiz Winners'}</CardTitle>
                <CardDescription className="font-medium text-xs">{language === 'ku' ? 'لیستی فەرمی براوەکان لەگەڵ خەڵاتەکانیان' : 'Official list of winners and their prizes'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quiz.winners.map((winner: any, idx: number) => {
                    const formattedPrize = winner.prizeAmount 
                      ? `${winner.prizeAmount.toLocaleString()} ${language === 'ku' ? 'د.ع' : 'IQD'}`
                      : winner.prize;
                    return (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-xl border-2 border-border/50 bg-background shadow-sm hover:border-emerald-500/30 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-black shadow-sm group-hover:scale-110 transition-transform",
                            winner.rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-amber-500/30" :
                              winner.rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 shadow-slate-400/30" :
                                winner.rank === 3 ? "bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-orange-500/30" :
                                  "bg-primary/10 text-primary border border-primary/20"
                          )}>
                            {winner.rank}
                          </div>
                          
                          <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-border/50">
                            <AvatarImage src={winner.avatarUrl || undefined} alt={winner.userName || winner.username} className="object-cover" />
                            <AvatarFallback className="text-xs bg-primary/10 text-primary font-black">
                              {winner.userName ? winner.userName[0].toUpperCase() : winner.username ? winner.username[0].toUpperCase() : 'W'}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex flex-col">
                            <span className="font-bold text-sm tracking-tight">{winner.userName || winner.username || (language === 'ku' ? 'نەناردراو' : 'Unknown')}</span>
                            <span className="text-xs font-semibold text-muted-foreground">{winner.score} {language === 'ku' ? 'خاڵ' : 'pts'}</span>
                          </div>
                        </div>
                        <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
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
            <Card className="border-t-4 border-t-amber-500 shadow-sm bg-gradient-to-b from-background to-amber-50/10 dark:to-amber-950/10">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /> {language === 'ku' ? 'خەڵاتەکان' : 'Rewards'}</CardTitle>
                <CardDescription className="font-medium text-xs">{language === 'ku' ? 'خەڵاتی پێشبینیکراوی براوەکان' : 'Expected prizes for winners'}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quiz.rewards.map((reward: any, idx: number) => {
                    return (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-xl border-2 border-border/50 bg-background shadow-sm hover:border-amber-500/30 transition-all group">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-black shadow-sm group-hover:scale-110 transition-transform",
                            reward.rank === 1 ? "bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-amber-500/30" :
                              reward.rank === 2 ? "bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800 shadow-slate-400/30" :
                                reward.rank === 3 ? "bg-gradient-to-br from-orange-300 to-orange-500 text-white shadow-orange-500/30" :
                                  "bg-primary/10 text-primary border border-primary/20"
                          )}>
                            {reward.rank}
                          </div>
                          <span className="font-bold text-sm text-foreground">
                            {reward.rank === 1 ? (language === 'ku' ? 'براوەی یەکەم' : '1st Place Winner') :
                             reward.rank === 2 ? (language === 'ku' ? 'براوەی دووەم' : '2nd Place Winner') :
                             reward.rank === 3 ? (language === 'ku' ? 'براوەی سێیەم' : '3rd Place Winner') :
                             `${language === 'ku' ? 'براوەی' : 'Winner'} ${reward.rank}`}
                          </span>
                        </div>
                        <span className="font-black text-base text-emerald-600 dark:text-emerald-400">
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
        <Card className="lg:col-span-2 shadow-md border-border/50 overflow-hidden flex flex-col h-[calc(100vh-200px)] max-h-[800px] bg-gradient-to-b from-background to-muted/20">
          <CardHeader className="border-b pb-4 bg-background/95 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2 font-black">
                  <Layers className="h-6 w-6 text-primary" />
                  {language === 'ku' ? 'لیستی پرسیارەکان' : 'Questions List'}
                </CardTitle>
                <CardDescription className="mt-1.5 font-medium">
                  {language === 'ku' ? `کۆی گشتی ${questions.length} پرسیار لەم کویزەدا هەیە` : `Total of ${questions.length} questions in this quiz`}
                </CardDescription>
              </div>
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 text-primary font-black shadow-sm ring-1 ring-primary/20">
                {questions.length}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {isQuestionsLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full drop-shadow-sm"></div>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-20 flex flex-col items-center">
                <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-primary/10">
                  <HelpCircle className="h-10 w-10 text-primary/40" />
                </div>
                <h3 className="text-xl font-black text-foreground">{language === 'ku' ? 'هیچ پرسیارێک نییە' : 'No questions yet'}</h3>
                <p className="text-muted-foreground font-medium mt-2 max-w-sm">{language === 'ku' ? 'ئەم کویزە هێشتا هیچ پرسیارێکی بۆ زیاد نەکراوە.' : 'This quiz does not have any questions added to it yet.'}</p>
                {!['published', 'PUBLISHED', 'running', 'LIVE'].includes(quiz.status) && (
                  <Button asChild className="mt-8 rounded-xl shadow-lg hover:shadow-xl transition-all font-bold px-6">
                    <Link href={`/quizzes/${quiz.id}/edit`}><Plus className="me-2 h-5 w-5" /> {language === 'ku' ? 'زیادکردنی پرسیار' : 'Add Question'}</Link>
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
                    className="flex flex-col sm:flex-row sm:items-start gap-4 rounded-2xl border-2 border-border/50 bg-background p-4 sm:p-5 shadow-sm hover:shadow-md hover:border-primary/30 transition-all group"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 text-lg font-black text-primary group-hover:scale-110 group-hover:shadow-md transition-all">
                      {i + 1}
                    </div>
                    <div className="flex-1 space-y-3 w-full pt-1">
                      <p className="text-base sm:text-lg font-bold leading-relaxed text-foreground">{q.text}</p>

                      <div className="flex flex-wrap items-center gap-2 pt-3">
                        <Badge variant="outline" className="text-xs bg-muted/50 capitalize font-bold text-muted-foreground border-border">
                          {q.type === 'multiple_choice' ? (language === 'ku' ? 'هەڵبژاردن' : 'Multiple Choice') : (language === 'ku' ? 'وێنە' : 'Image')}
                        </Badge>
                        <Badge variant="secondary" className="text-xs font-bold bg-amber-500/10 text-amber-600 border-amber-500/20"><Trophy className="me-1.5 h-3 w-3 inline" /> {q.points} {language === 'ku' ? 'خاڵ' : 'pts'}</Badge>
                        <Badge variant="secondary" className="text-xs font-bold bg-blue-500/10 text-blue-600 border-blue-500/20"><Clock className="me-1.5 h-3 w-3 inline" /> {q.timer} {language === 'ku' ? 'چرکە' : 'sec'}</Badge>
                        {q.categoryName && (
                          <Badge variant="outline" className="text-xs font-bold border-primary/30 text-primary bg-primary/5">{q.categoryName}</Badge>
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
