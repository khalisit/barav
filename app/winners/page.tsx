'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Crown, Award, Search, Sparkles, Gift, Coins, Receipt, Loader2, Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api-client';
import { formatNumber, getInitials } from '@/lib/format';
import { useLanguage } from '@/hooks/use-language';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Quiz } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

function resolveAvatarUrl(avatarVal?: string | null): string | undefined {
  if (!avatarVal) return undefined;
  if (avatarVal.startsWith('http://') || avatarVal.startsWith('https://') || avatarVal.startsWith('data:')) {
    return avatarVal;
  }
  let cleanKey = avatarVal;
  if (cleanKey.startsWith('/')) cleanKey = cleanKey.slice(1);
  if (!cleanKey.startsWith('users/') && !cleanKey.startsWith('admin/')) {
    if (cleanKey.startsWith('avatars/')) cleanKey = `users/${cleanKey}`;
    else cleanKey = `users/avatars/${cleanKey}`;
  }
  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, '') ?? 'https://api.baravquiz.com';
  return `${apiBase}/api/media/${cleanKey}`;
}

function getPrizeText(obj: any, language: string): string {
  if (!obj) return language === 'ku' ? '0 د.ع' : '0 IQD';

  const rawPrize = obj.prize || obj.prizeName || obj.reward || obj.rewardName;
  if (rawPrize) {
    const num = Number(rawPrize);
    if (!isNaN(num) && num > 0) {
      return language === 'ku'
        ? `${num.toLocaleString('en-US')} د.ع`
        : `${num.toLocaleString('en-US')} IQD`;
    }
    return String(rawPrize);
  }

  const amount = Number(obj.prizeAmount || obj.totalRewards || obj.rewardAmount || 0);
  if (amount > 0) {
    return language === 'ku'
      ? `${amount.toLocaleString('en-US')} د.ع`
      : `${amount.toLocaleString('en-US')} IQD`;
  }

  return language === 'ku' ? '0 د.ع' : '0 IQD';
}

export default function WinnersPage() {
  const { language } = useLanguage();
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<any | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutQuizId, setPayoutQuizId] = useState<string>('general');
  const [payoutNotes, setPayoutNotes] = useState<string>('');

  // Fetch all users to find winners
  const { data: usersResult, isLoading: isUsersLoading } = useQuery<{ data: any[] }>({
    queryKey: ['users-winners'],
    queryFn: () => api.get<{ data: any[] }>('/users?onlyParticipants=true'),
  });

  // Fetch last quiz winners
  const { data: lastWinnersResult } = useQuery<{ data?: any; winners?: any[] }>({
    queryKey: ['last-quiz-winners'],
    queryFn: () => api.get<{ data?: any; winners?: any[] }>('/quizzes/last-winners').catch(() => ({ winners: [] })),
  });

  // Fetch receipts
  const { data: receiptsResult, isLoading: isReceiptsLoading } = useQuery<any[]>({
    queryKey: ['receipts'],
    queryFn: () => api.get<any[]>('/receipts').catch(() => []),
  });

  // Fetch quizzes
  const { data: quizzesResult } = useQuery<{ data: Quiz[] }>({
    queryKey: ['quizzes'],
    queryFn: () => api.get<{ data: Quiz[] }>('/quizzes').catch(() => ({ data: [] }))
  });
  const quizzes = quizzesResult?.data || quizzesResult || [];

  // Fetch won quizzes for the selected winner
  const { data: wonQuizzesResult } = useQuery<any>({
    queryKey: ['won-quizzes', selectedWinner?.id],
    queryFn: () => api.get(`/users/${selectedWinner.id}/won-quizzes`).catch(() => ({ data: [] })),
    enabled: !!selectedWinner?.id,
  });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const wonQuizzes = wonQuizzesResult?.data || wonQuizzesResult || [];

  const paidAmountsByQuiz = useMemo(() => {
    const map = new Map<string, number>();
    if (!selectedWinner?.id || !Array.isArray(receiptsResult)) return map;
    for (const r of receiptsResult) {
      if (r.userId === selectedWinner.id && r.status === 'PAID' && r.quizId) {
        map.set(r.quizId, (map.get(r.quizId) || 0) + Number(r.amount));
      }
    }
    return map;
  }, [receiptsResult, selectedWinner]);

  const unpaidWonQuizzes = useMemo(() => {
    return wonQuizzes.filter((q: any) => {
      const paid = paidAmountsByQuiz.get(q.quizId) || 0;
      return paid < q.amount;
    });
  }, [wonQuizzes, paidAmountsByQuiz]);

  useEffect(() => {
    if (unpaidWonQuizzes.length > 0) {
      const firstQuiz = unpaidWonQuizzes[0];
      setPayoutQuizId(firstQuiz.quizId || '');
      const paid = paidAmountsByQuiz.get(firstQuiz.quizId) || 0;
      setPayoutAmount(String(Math.max(0, firstQuiz.amount - paid)));
    } else {
      setPayoutQuizId('general');
      setPayoutAmount(selectedWinner ? String(selectedWinner.pendingRewards) : '');
    }
  }, [unpaidWonQuizzes, paidAmountsByQuiz, selectedWinner]);

  const userPaidAmounts = useMemo(() => {
    const map = new Map<string, number>();
    const list = Array.isArray(receiptsResult) ? receiptsResult : [];
    for (const r of list) {
      if (r.userId && r.status === 'PAID') {
        map.set(r.userId, (map.get(r.userId) || 0) + Number(r.amount));
      }
    }
    return map;
  }, [receiptsResult]);

  const createReceiptMutation = useMutation({
    mutationFn: (payload: { userId: string; quizId?: string | null; amount: number; notes?: string | null }) =>
      api.post('/receipts', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['users-winners'] });
      toast.success(language === 'ku' ? 'خەڵاتەکە بە سەرکەوتوویی درا!' : 'Reward successfully paid!');
      setIsPayoutDialogOpen(false);
      setSelectedWinner(null);
      setPayoutAmount('');
      setPayoutQuizId('general');
      setPayoutNotes('');
    },
    onError: () => {
      toast.error(language === 'ku' ? 'تۆمارکردنی پێدانی خەڵاتەکە سەرکەوتوو نەبوو' : 'Failed to process payout');
    }
  });

  const deleteReceiptMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/receipts/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      queryClient.invalidateQueries({ queryKey: ['users-winners'] });
      toast.success(language === 'ku' ? 'وەسڵەکە بە سەرکەوتوویی هەڵوەشێنرایەوە' : 'Receipt successfully reversed');
    },
    onError: () => {
      toast.error(language === 'ku' ? 'هەڵوەشاندنەوەی وەسڵەکە سەرکەوتوو نەبوو' : 'Failed to reverse receipt');
    }
  });

  const winnersList = useMemo(() => {
    const users = Array.isArray(usersResult?.data)
      ? usersResult.data
      : Array.isArray(usersResult)
        ? usersResult
        : [];

    // Filter users who have won quizzes or have rewards/payouts
    const winnersOnly = users.filter((u: any) => {
      return (u.quizzesWon || 0) > 0 || (u.totalRewards || 0) > 0 || userPaidAmounts.has(u.id);
    });

    // Sort winners by quizzesWon then totalPoints
    const sorted = [...winnersOnly].sort((a: any, b: any) => {
      const aWon = a.quizzesWon || 0;
      const bWon = b.quizzesWon || 0;
      if (bWon !== aWon) return bWon - aWon;
      return (b.totalPoints || 0) - (a.totalPoints || 0);
    });

    return sorted.map((u: any, index: number) => {
      const paid = userPaidAmounts.get(u.id) || 0;
      const total = u.totalRewards || 0;
      const pending = Math.max(0, total - paid);
      return {
        id: u.id,
        rank: index + 1,
        name: u.fullName || u.username || 'Unknown',
        avatarUrl: resolveAvatarUrl(u.avatarUrl || u.avatarKey),
        totalPoints: u.totalPoints || 0,
        totalRewards: total,
        paidRewards: paid,
        pendingRewards: pending,
        quizzesWon: u.quizzesWon || 0,
        quizzesPlayed: u.quizzesPlayed || 0,
        raw: u,
      };
    });
  }, [usersResult, userPaidAmounts]);

  const filteredWinners = useMemo(() => {
    return winnersList.filter((w) =>
      w.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [winnersList, search]);

  const top3 = filteredWinners.slice(0, 3);

  const recentQuizWinners = useMemo(() => {
    const list = Array.isArray(lastWinnersResult?.winners)
      ? lastWinnersResult.winners
      : Array.isArray(lastWinnersResult?.data?.winners)
        ? lastWinnersResult.data.winners
        : [];

    return list.map((w: any) => ({
      ...w,
      avatarUrl: resolveAvatarUrl(w.avatarUrl || w.avatarKey || w.avatar),
    }));
  }, [lastWinnersResult]);

  const isLoading = isUsersLoading;

  if (isLoading) {
    return (
      <DashboardShell>
        <PageHeader
          title={language === 'ku' ? 'براوەکان' : 'Winners'}
          description={language === 'ku' ? 'بارکردنی براوەکان...' : 'Loading winners...'}
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'براوەکان' : 'Winners'}
        description={
          language === 'ku'
            ? 'سەرجەم براوەکان و پاڵەوانەکانی کویزەکان'
            : 'All-time champions and quiz winners'
        }
        breadcrumbs={[
          { label: language === 'ku' ? 'سەرەتا' : 'Home', href: '/dashboard' },
          { label: language === 'ku' ? 'براوەکان' : 'Winners' },
        ]}
      />

      {/* Top 3 Champions Podium */}
      {top3.length > 0 && (
        <div className="mb-10">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-extrabold flex items-center gap-2.5 text-foreground">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-warning/15 text-warning border border-warning/30 shadow-inner">
                <Trophy className="h-5 w-5" />
              </span>
              {language === 'ku' ? 'پاڵەوانە یەکەمەکان' : 'Top Champions'}
            </h2>
            <Badge variant="outline" className="gap-1.5 py-1 px-3 border-amber-500/30 bg-amber-500/10 text-amber-400 font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              {language === 'ku' ? 'باشترین یاریزانەکان' : 'Hall of Fame'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 items-end">
            {[1, 0, 2].map((displayIndex) => {
              const entry = top3[displayIndex];
              if (!entry) return null;

              const isFirst = displayIndex === 0;
              const isSecond = displayIndex === 1;
              const isThird = displayIndex === 2;

              const prizeText = getPrizeText(entry, language);

              const cardBorders = isFirst
                ? 'border-amber-400/70 bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-amber-950/40 shadow-[0_0_30px_rgba(245,158,11,0.2)]'
                : isSecond
                  ? 'border-slate-300/50 bg-gradient-to-b from-slate-400/20 via-slate-500/10 to-slate-950/40 shadow-[0_0_20px_rgba(148,163,184,0.15)]'
                  : 'border-amber-700/50 bg-gradient-to-b from-amber-700/20 via-amber-800/10 to-stone-950/40 shadow-[0_0_20px_rgba(180,83,9,0.15)]';

              const badgeColors = isFirst
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-amber-500/30'
                : isSecond
                  ? 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-950 shadow-slate-300/30'
                  : 'bg-gradient-to-r from-amber-700 to-amber-800 text-white shadow-amber-700/30';

              const ringColors = isFirst
                ? 'ring-4 ring-amber-400/80 shadow-[0_0_20px_rgba(251,191,36,0.4)]'
                : isSecond
                  ? 'ring-4 ring-slate-300/70 shadow-[0_0_15px_rgba(203,213,225,0.25)]'
                  : 'ring-4 ring-amber-700/70 shadow-[0_0_15px_rgba(180,83,9,0.25)]';

              const rankTitles = [
                language === 'ku' ? 'پلەی یەکەم 🥇' : '1st Place 🥇',
                language === 'ku' ? 'پلەی دووەم 🥈' : '2nd Place 🥈',
                language === 'ku' ? 'پلەی سێیەم 🥉' : '3rd Place 🥉',
              ];

              const orderClasses = ['order-1 sm:order-2', 'order-2 sm:order-1', 'order-3 sm:order-3'];

              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: displayIndex * 0.12 }}
                  className={orderClasses[displayIndex]}
                >
                  <Card className={`relative overflow-hidden text-center border-2 backdrop-blur-xl ${cardBorders} ${isFirst ? 'sm:-translate-y-4 py-2' : ''}`}>
                    <CardContent className="flex flex-col items-center pt-6 pb-6 px-4">
                      <Badge className={`mb-3 ${badgeColors} border-0 font-extrabold px-3 py-1 text-xs shadow-md tracking-wide`}>
                        {rankTitles[displayIndex]}
                      </Badge>

                      <div className="mb-3 flex h-24 w-24 items-center justify-center relative">
                        <Avatar className={`h-24 w-24 border-4 border-background ${ringColors}`}>
                          <AvatarImage src={entry.avatarUrl || undefined} alt={entry.name} />
                          <AvatarFallback className="text-2xl font-black bg-primary/20 text-primary">
                            {getInitials(entry.name)}
                          </AvatarFallback>
                        </Avatar>
                        {isFirst && (
                          <div className="absolute -top-4 -right-1 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full p-1.5 shadow-lg border border-yellow-200">
                            <Crown className="h-6 w-6 text-slate-950 fill-yellow-300" />
                          </div>
                        )}
                      </div>

                      <p className="text-lg font-extrabold text-foreground truncate max-w-full px-2">{entry.name}</p>

                      {/* Prize Display Badge */}
                      <div className="mt-3 flex items-center gap-1.5 rounded-full bg-warning/15 px-3.5 py-1.5 text-warning border border-warning/30 font-extrabold text-xs shadow-sm">
                        <Gift className="h-4 w-4" />
                        <span>{language === 'ku' ? 'خەڵات:' : 'Prize:'} {prizeText}</span>
                      </div>

                      <div className="mt-4 flex items-center justify-center gap-2 w-full">
                        <Badge variant="secondary" className="gap-1 font-bold py-1 px-2.5">
                          <Trophy className="h-3.5 w-3.5 text-warning" />
                          {entry.quizzesWon.toLocaleString('en-US')} {language === 'ku' ? 'کویز' : 'won'}
                        </Badge>
                        <Badge variant="outline" className="gap-1 font-bold py-1 px-2.5 border-primary/30">
                          <Sparkles className="h-3.5 w-3.5 text-primary" />
                          {entry.totalPoints.toLocaleString('en-US')} {language === 'ku' ? 'خاڵ' : 'pts'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Quiz Winners Banner */}
      {recentQuizWinners.length > 0 && (
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award className="h-5 w-5 text-primary" />
              {language === 'ku' ? 'براوەکانی دواین کویز' : 'Recent Quiz Winners'}
            </CardTitle>
            <CardDescription>
              {language === 'ku' ? 'پاڵەوانەکانی دوایین یاری بەکۆمەڵ' : 'Champions from the latest live quiz'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {recentQuizWinners.map((w: any, idx: number) => {
                const rankNum = w.rank || idx + 1;
                const pText = getPrizeText(w, language);

                return (
                  <div
                    key={w.id || idx}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background p-3 shadow-sm"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      #{rankNum}
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={w.avatarUrl || undefined} alt={w.name} />
                      <AvatarFallback>{getInitials(w.name || 'W')}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-semibold">{w.name || 'Winner'}</p>
                      <div className="flex items-center gap-1 text-xs text-warning font-medium">
                        <Gift className="h-3 w-3" />
                        <span>{pText}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs Switcher for Winners vs Receipts */}
      <Tabs defaultValue="winners" className="space-y-6" dir={language === 'ku' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between border-b pb-4">
          <TabsList className="bg-muted/50 p-1 border">
            <TabsTrigger value="winners" className="font-semibold text-sm">
              <Trophy className="me-2 h-4 w-4" />
              {language === 'ku' ? 'لیستی براوەکان' : 'Winners List'}
            </TabsTrigger>
            <TabsTrigger value="receipts" className="font-semibold text-sm">
              <Receipt className="me-2 h-4 w-4" />
              {language === 'ku' ? 'وەسڵەکان' : 'Receipts'}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="winners" className="space-y-6 outline-none">
          {/* All Winners Table */}
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">
                  {language === 'ku' ? 'لیستی تەواوی براوەکان' : 'All Winners List'}
                </CardTitle>
                <CardDescription>
                  {language === 'ku' ? 'بەکارهێنەران بەپێی سەرکەوتنەکان، خەڵاتەکان و خاڵەکان' : 'Players ranked by quiz wins, prizes, and score'}
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className={cn("absolute top-2.5 h-4 w-4 text-muted-foreground", language === 'ku' ? "right-2.5" : "left-2.5")} />
                <Input
                  placeholder={language === 'ku' ? 'گەڕان بەدوای براوەدا...' : 'Search winners...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className={cn(language === 'ku' ? "pr-8" : "pl-8")}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {filteredWinners.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {language === 'ku' ? 'هیچ براوەیەک نەدۆزرایەوە' : 'No winners found.'}
                </div>
              ) : (
                filteredWinners.map((winner, index) => {
                  const prizeText = getPrizeText(winner, language);

                  return (
                    <motion.div
                      key={winner.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="flex items-center gap-4 rounded-lg border border-border/50 bg-card p-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="w-8 text-center text-sm font-bold text-muted-foreground">
                        #{winner.rank}
                      </span>
                      <Avatar className="h-10 w-10 border border-border">
                        <AvatarImage src={winner.avatarUrl || undefined} alt={winner.name} />
                        <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                          {getInitials(winner.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{winner.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {winner.quizzesPlayed > 0
                            ? `${winner.quizzesPlayed.toLocaleString('en-US')} ${language === 'ku' ? 'یاری ئەنجامدراو' : 'played'}`
                            : language === 'ku'
                              ? 'یاریزان'
                              : 'Player'}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        {/* Prize Column */}
                        <div className="text-end sm:text-center min-w-24">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-warning bg-warning/10 px-2.5 py-1 rounded-full border border-warning/20">
                            <Gift className="h-3.5 w-3.5" />
                            {prizeText}
                          </span>
                        </div>

                        {/* Paid vs Pending Status */}
                        <div className="flex flex-col items-end min-w-[120px]">
                          <span className="text-[11px] text-muted-foreground">
                            {language === 'ku' ? 'دراوە:' : 'Paid:'} <span className="font-bold text-foreground">{winner.paidRewards.toLocaleString()} {language === 'ku' ? 'د.ع' : 'IQD'}</span>
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5">
                            {language === 'ku' ? 'ماوە:' : 'Pending:'} <span className={cn("font-bold", winner.pendingRewards > 0 ? "text-amber-500" : "text-emerald-500")}>{winner.pendingRewards.toLocaleString()} {language === 'ku' ? 'د.ع' : 'IQD'}</span>
                          </span>
                        </div>

                        {/* Action Button */}
                        <div className="min-w-[100px] flex justify-end">
                          {winner.pendingRewards > 0 ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 border-warning/30 bg-warning/5 hover:bg-warning hover:text-black text-warning font-semibold gap-1 text-xs"
                              onClick={() => {
                                setSelectedWinner(winner);
                                setPayoutAmount(String(winner.pendingRewards));
                                setIsPayoutDialogOpen(true);
                              }}
                            >
                              <Gift className="h-3.5 w-3.5" />
                              {language === 'ku' ? 'پێدانی خەڵات' : 'Pay Prize'}
                            </Button>
                          ) : winner.totalRewards > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                              <Check className="h-3.5 w-3.5" />
                              {language === 'ku' ? 'دراوە' : 'Paid'}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>

                        <div className="text-end sm:text-center">
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-primary">
                            <Trophy className="h-4 w-4 text-warning" />
                            {winner.quizzesWon.toLocaleString('en-US')}
                          </span>
                          <p className="text-[10px] text-muted-foreground">{language === 'ku' ? 'براوەی کویز' : 'wins'}</p>
                        </div>
                        <div className="text-end sm:text-center min-w-16 hidden sm:block">
                          <p className="font-bold text-primary">{winner.totalPoints.toLocaleString('en-US')}</p>
                          <p className="text-[10px] text-muted-foreground">{language === 'ku' ? 'خاڵ' : 'pts'}</p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="outline-none">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                {language === 'ku' ? 'لیستی تەواوی وەسڵەکان' : 'All Receipts List'}
              </CardTitle>
              <CardDescription>
                {language === 'ku' ? 'مێژووی پێدانی خەڵاتەکان بە براوەکان' : 'Payout history of rewards to winners'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isReceiptsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !receiptsResult || receiptsResult.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  {language === 'ku' ? 'هیچ وەسڵێک تۆمار نەکراوە' : 'No receipts recorded.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-start border-collapse">
                    <thead>
                      <tr className="border-b bg-muted/40 text-muted-foreground font-medium text-xs uppercase tracking-wider">
                        <th className="p-3 text-start">{language === 'ku' ? 'ڕێکەوت' : 'Date'}</th>
                        <th className="p-3 text-start">{language === 'ku' ? 'براوە' : 'Winner'}</th>
                        <th className="p-3 text-start">{language === 'ku' ? 'کویز' : 'Quiz'}</th>
                        <th className="p-3 text-start">{language === 'ku' ? 'بڕی پارە' : 'Amount'}</th>
                        <th className="p-3 text-start">{language === 'ku' ? 'تێبینی' : 'Notes'}</th>
                        <th className="p-3 text-center">{language === 'ku' ? 'کردارەکان' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receiptsResult.map((r: any) => (
                        <tr key={r.id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="p-3 font-medium text-muted-foreground whitespace-nowrap">
                            {formatDate(r.createdAt)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarImage src={resolveAvatarUrl(r.avatarUrl || r.avatarKey)} />
                                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                  {getInitials(r.userName || r.username || 'W')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs">{r.userName || r.username || 'Unknown'}</span>
                                <span className="text-[10px] text-muted-foreground">@{r.username}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            {r.quizTitle ? (
                              <Badge variant="outline" className="font-semibold text-xs border-primary/20 text-primary bg-primary/5">
                                {r.quizTitle}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs text-muted-foreground">
                                {language === 'ku' ? 'گشتی / تر' : 'General / Other'}
                              </Badge>
                            )}
                          </td>
                          <td className="p-3 font-extrabold text-emerald-600">
                            {Number(r.amount).toLocaleString()} IQD
                          </td>
                          <td className="p-3 text-xs text-muted-foreground max-w-xs truncate" title={r.notes || ''}>
                            {r.notes || '—'}
                          </td>
                          <td className="p-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs px-2"
                              onClick={() => {
                                if (confirm(language === 'ku' ? 'دڵنیایت لە هەڵوەشاندنەوەی ئەم وەسڵە؟ (ئەم کردارە بڕی ماوەی یاریزانەکە زیاد دەکاتەوە)' : 'Are you sure you want to reverse this receipt? (This will restore the winner\'s pending balance)')) {
                                  deleteReceiptMutation.mutate(r.id);
                                }
                              }}
                            >
                              {language === 'ku' ? 'هەڵوەشاندنەوە' : 'Reverse'}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payout Dialog */}
      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-warning animate-bounce" />
              {language === 'ku' ? 'تۆمارکردنی پێدانی خەڵات' : 'Process Prize Payout'}
            </DialogTitle>
            <DialogDescription>
              {language === 'ku'
                ? `پێدانی خەڵاتی دارایی بە یاریزان "${selectedWinner?.name}"`
                : `Record a cash payout for player "${selectedWinner?.name}"`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount" className="font-semibold">
                {language === 'ku' ? 'بڕی خەڵات (د.ع)' : 'Payout Amount (IQD)'}
              </Label>
              <Input
                id="amount"
                type="number"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                placeholder="100,000"
                className="h-10 text-lg font-bold"
              />
              <span className="text-xs text-muted-foreground">
                {language === 'ku' ? `زۆرترین بڕی ماوە: ${selectedWinner?.pendingRewards?.toLocaleString()} د.ع` : `Max pending amount: ${selectedWinner?.pendingRewards?.toLocaleString()} IQD`}
              </span>
            </div>

            <div className="grid gap-2">
              <Label className="font-semibold">{language === 'ku' ? 'کویزی پەیوەندیدار' : 'Related Quiz'}</Label>
              <Select onValueChange={(val) => {
                setPayoutQuizId(val);
                if (val !== 'general') {
                  const chosen = unpaidWonQuizzes.find((q: any) => q.quizId === val);
                  if (chosen) {
                    const paid = paidAmountsByQuiz.get(chosen.quizId) || 0;
                    setPayoutAmount(String(Math.max(0, chosen.amount - paid)));
                  }
                } else {
                  setPayoutAmount(String(selectedWinner?.pendingRewards));
                }
              }} value={payoutQuizId}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">{language === 'ku' ? 'پێدانی گشتی / تر' : 'General / Other Payout'}</SelectItem>
                  {unpaidWonQuizzes.map((q: any) => {
                    const paid = paidAmountsByQuiz.get(q.quizId) || 0;
                    const remaining = Math.max(0, q.amount - paid);
                    return (
                      <SelectItem key={q.quizId} value={q.quizId}>
                        {q.quizTitle} ({language === 'ku' ? `پلەی ${q.rank}` : `Rank ${q.rank}`} - {language === 'ku' ? 'ماوە:' : 'Rem:'} {remaining.toLocaleString()} {language === 'ku' ? 'د.ع' : 'IQD'})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes" className="font-semibold">{language === 'ku' ? 'تێبینییەکان' : 'Notes / References'}</Label>
              <Textarea
                id="notes"
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder={language === 'ku' ? 'ژمارەی ترانزاکشن، ژمارەی مۆبایل، یان هەر تێبینییەکی تر...' : 'Transaction ID, phone number, payment details...'}
                rows={3}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setIsPayoutDialogOpen(false)}>
              {language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
            </Button>
            <Button
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold"
              disabled={createReceiptMutation.isPending || !payoutAmount || Number(payoutAmount) <= 0 || !payoutQuizId}
              onClick={() => {
                if (Number(payoutAmount) > selectedWinner?.pendingRewards) {
                  toast.error(
                    language === 'ku'
                      ? 'بڕی پارەکە ناتوانێت لە بڕی ماوەی یاریزانەکە زیاتر بێت!'
                      : 'Payout amount cannot exceed the pending rewards!'
                  );
                  return;
                }
                createReceiptMutation.mutate({
                  userId: selectedWinner.id,
                  quizId: payoutQuizId === 'general' ? null : payoutQuizId,
                  amount: Number(payoutAmount),
                  notes: payoutNotes,
                });
              }}
            >
              {createReceiptMutation.isPending ? (
                <>
                  <Loader2 className="me-2 h-4 w-4 animate-spin" />
                  {language === 'ku' ? 'تۆماردەکرێت...' : 'Saving...'}
                </>
              ) : (
                language === 'ku' ? 'تۆمارکردنی پێدان' : 'Confirm Payout'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
