'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Trophy, Crown, Award, Search, Sparkles, Gift, Receipt, Loader2, Check, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
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
  if (avatarVal.startsWith('http')) return avatarVal;
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NEXT_PUBLIC_API_URL ? new URL(process.env.NEXT_PUBLIC_API_URL).origin : 'https://barav-backend.arkanstudiokrd.workers.dev');
  let cleanKey = avatarVal.replace(/^\/+/, '');
  if (cleanKey.startsWith('media/')) cleanKey = cleanKey.replace(/^media\//, '');
  return `${baseUrl}/media/${cleanKey}`;
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
  const [receiptSearch, setReceiptSearch] = useState('');
  const queryClient = useQueryClient();

  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<any | null>(null);
  const [payoutAmount, setPayoutAmount] = useState<string>('');
  const [payoutQuizId, setPayoutQuizId] = useState<string>('general');
  const [payoutNotes, setPayoutNotes] = useState<string>('');

  // Fetch all users to find winners
  const { data: usersResult, isLoading: isUsersLoading } = useQuery<{ data: any[] }>({
    queryKey: ['users-winners'],
    queryFn: () => api.get<{ data: any[] }>('/users'),
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
      const fullName = u.fullName?.trim() || '';
      const username = u.username?.trim() || '';
      let displayName = fullName;
      if (!displayName) displayName = username;
      if (!displayName) displayName = language === 'ku' ? 'نەناسراو' : 'Unknown';

      return {
        id: u.id,
        rank: index + 1,
        displayName: displayName,
        username: username ? `@${username}` : '',
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
  }, [usersResult, userPaidAmounts, language]);

  const filteredWinners = useMemo(() => {
    return winnersList.filter((w) =>
      w.displayName.toLowerCase().includes(search.toLowerCase()) ||
      w.username.toLowerCase().includes(search.toLowerCase())
    );
  }, [winnersList, search]);

  const top3 = winnersList.slice(0, 3);

  const recentQuizWinners = useMemo(() => {
    const list = Array.isArray(lastWinnersResult?.winners)
      ? lastWinnersResult.winners
      : Array.isArray(lastWinnersResult?.data?.winners)
        ? lastWinnersResult.data.winners
        : [];

    return list.map((w: any) => {
      const fullName = w.fullName?.trim() || '';
      const username = w.username?.trim() || '';
      let displayName = fullName;
      if (!displayName) displayName = username;
      if (!displayName) displayName = language === 'ku' ? 'نەناسراو' : 'Unknown';

      return {
        ...w,
        displayName: displayName,
        username: username ? `@${username}` : '',
        avatarUrl: resolveAvatarUrl(w.avatarUrl || w.avatarKey || w.avatar),
      };
    });
  }, [lastWinnersResult, language]);

  const isLoading = isUsersLoading;

  const filteredReceipts = useMemo(() => {
    if (!receiptsResult) return [];
    return receiptsResult.filter((r: any) => {
      const name = (r.userName || r.username || r.user?.fullName || r.user?.username || '').toLowerCase();
      const s = receiptSearch.toLowerCase();
      return name.includes(s) || (r.quizTitle || '').toLowerCase().includes(s);
    });
  }, [receiptsResult, receiptSearch]);

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
          { label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' },
          { label: language === 'ku' ? 'براوەکان' : 'Winners' },
        ]}
      />

      {/* Recent Quiz Winners Banner */}
      {recentQuizWinners.length > 0 && (
        <Card className="mb-10 border-none bg-primary/5 shadow-sm max-w-4xl mx-auto">
          <div className="p-4 border-b border-primary/10 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-sm sm:text-base">
              {language === 'ku' ? 'براوەکانی دواین کویز' : 'Recent Quiz Winners'}
            </h3>
          </div>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
              {recentQuizWinners.map((w: any, idx: number) => {
                const rankNum = w.rank || idx + 1;
                const pText = getPrizeText(w, language);

                return (
                  <div
                    key={w.id || idx}
                    className="flex items-center gap-3 rounded-xl border border-border/50 bg-background p-3 shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      #{rankNum}
                    </div>
                    <Avatar className="h-10 w-10 border border-primary/10">
                      <AvatarImage src={w.avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-primary/5 text-xs text-primary font-bold">{getInitials(w.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-bold">{w.displayName}</p>
                      <div className="flex items-center gap-1 text-[11px] text-warning font-bold mt-0.5">
                        <Gift className="h-3 w-3" />
                        <span className="truncate">{pText}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="winners" className="max-w-4xl mx-auto space-y-6" dir={language === 'ku' ? 'rtl' : 'ltr'}>
        <div className="flex items-center border-b pb-4">
          <TabsList className="bg-muted/50 p-1 border rounded-full">
            <TabsTrigger value="winners" className="font-bold text-sm rounded-full px-6">
              <Trophy className="me-2 h-4 w-4" />
              {language === 'ku' ? 'لیستی براوەکان' : 'Winners List'}
            </TabsTrigger>
            <TabsTrigger value="receipts" className="font-bold text-sm rounded-full px-6">
              <Receipt className="me-2 h-4 w-4" />
              {language === 'ku' ? 'وەسڵەکان' : 'Receipts'}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="winners" className="space-y-6 outline-none">
          <Card className="border-none shadow-lg overflow-hidden bg-background">
            <div className="bg-muted/40 p-5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Award className="h-6 w-6 text-primary" />
                <h3 className="font-bold text-xl">
                  {language === 'ku' ? 'تەواوی براوەکان' : 'All Winners'}
                </h3>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'ku' ? 'گەڕان بەدوای براوەدا...' : 'Search winners...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 rounded-full bg-background border-primary/20 shadow-sm focus-visible:ring-primary/30"
                />
              </div>
            </div>
            <CardContent className="p-0">
              {filteredWinners.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-muted-foreground">
                  <UserCircle className="h-12 w-12 opacity-50 mb-4" />
                  <p className="text-lg font-medium">{language === 'ku' ? 'هیچ براوەیەک نەدۆزرایەوە' : 'No winners found.'}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {filteredWinners.map((winner, index) => {
                    return (
                      <motion.div
                        key={winner.id}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 sm:p-5 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 sm:gap-6 flex-1 min-w-0">
                          <div className="flex items-center justify-center w-8 font-black text-xl text-muted-foreground/60">
                            {winner.rank}
                          </div>
                          <Avatar className="h-12 w-12 sm:h-14 sm:w-14 border border-border shadow-sm">
                            <AvatarImage src={winner.avatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-primary/5 text-sm font-bold text-primary">
                              {getInitials(winner.displayName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-base sm:text-lg truncate">
                              {winner.displayName}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-0.5 text-xs sm:text-sm text-muted-foreground">
                              {winner.username && <span className="truncate">{winner.username}</span>}
                              {winner.username && <span className="hidden sm:inline opacity-50">•</span>}
                              <span className="whitespace-nowrap flex items-center gap-1">
                                <Trophy className="h-3 w-3 text-warning" />
                                <span className="font-bold text-foreground/80">{winner.quizzesWon}</span>{' '}
                                {language === 'ku' ? 'بردنەوە' : 'Wins'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full pl-11 sm:pl-0">
                          <div className="flex flex-col items-start sm:items-end gap-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">{language === 'ku' ? 'دراوە:' : 'Paid:'}</span>
                              <span className="font-bold text-emerald-500">{formatNumber(winner.paidRewards)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">{language === 'ku' ? 'ماوە:' : 'Pending:'}</span>
                              <span className={cn("font-bold", winner.pendingRewards > 0 ? "text-amber-500" : "text-muted-foreground")}>
                                {formatNumber(winner.pendingRewards)}
                              </span>
                            </div>
                          </div>

                          <div className="w-[110px] flex justify-end shrink-0">
                            {winner.pendingRewards > 0 ? (
                              <Button
                                size="sm"
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold h-9 shadow-sm"
                                onClick={() => {
                                  setSelectedWinner(winner);
                                  setPayoutAmount(String(winner.pendingRewards));
                                  setIsPayoutDialogOpen(true);
                                }}
                              >
                                <Gift className="me-2 h-3.5 w-3.5" />
                                {language === 'ku' ? 'پێدان' : 'Pay'}
                              </Button>
                            ) : winner.totalRewards > 0 ? (
                              <Badge className="w-full justify-center bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 py-2 text-xs font-bold">
                                <Check className="me-1 h-3.5 w-3.5" />
                                {language === 'ku' ? 'دراوە' : 'Paid'}
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground text-sm font-medium">—</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipts" className="outline-none">
          <Card className="border-none shadow-lg overflow-hidden bg-background">
            <div className="bg-muted/40 p-5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Receipt className="h-6 w-6 text-primary" />
                <h3 className="font-bold text-xl">
                  {language === 'ku' ? 'مێژووی وەسڵەکان' : 'Receipts History'}
                </h3>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'ku' ? 'گەڕان بەدوای وەسڵ...' : 'Search receipts...'}
                  value={receiptSearch}
                  onChange={(e) => setReceiptSearch(e.target.value)}
                  className="pl-9 h-10 rounded-full bg-background border-primary/20 shadow-sm focus-visible:ring-primary/30"
                />
              </div>
            </div>
            <CardContent className="p-0">
              {isReceiptsLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : !filteredReceipts || filteredReceipts.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center text-muted-foreground">
                  <Receipt className="h-12 w-12 opacity-50 mb-4" />
                  <p className="text-lg font-medium">{language === 'ku' ? 'هیچ وەسڵێک تۆمار نەکراوە' : 'No receipts recorded.'}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-start border-collapse">
                    <thead>
                      <tr className="bg-muted/20 text-muted-foreground font-semibold text-xs uppercase tracking-wider">
                         <th className="p-4 text-start font-medium">{language === 'ku' ? 'ڕێکەوت' : 'Date'}</th>
                         <th className="p-4 text-start font-medium">{language === 'ku' ? 'براوە' : 'Winner'}</th>
                         <th className="p-4 text-start font-medium">{language === 'ku' ? 'کویز' : 'Quiz'}</th>
                         <th className="p-4 text-start font-medium">{language === 'ku' ? 'بڕی پارە' : 'Amount'}</th>
                         <th className="p-4 text-center font-medium w-[100px]">{language === 'ku' ? 'کردارەکان' : 'Actions'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {filteredReceipts.map((r: any) => {
                        const userMatch = Array.isArray(usersResult?.data) ? usersResult.data.find((u: any) => u.id === r.userId) : null;
                        const avatarVal = userMatch?.avatarUrl || userMatch?.avatarKey || r.avatarUrl || r.avatarKey || r.user?.avatarUrl || r.user?.avatarKey;
                        const finalName = userMatch?.fullName || userMatch?.username || r.userName || r.user?.fullName || r.username || r.user?.username || 'Unknown';
                        const finalUsername = userMatch?.username || r.username || r.user?.username;

                        return (
                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                            {formatDate(r.createdAt)}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10 border border-border shadow-sm">
                                <AvatarImage src={resolveAvatarUrl(avatarVal)} className="object-cover" />
                                <AvatarFallback className="text-xs bg-primary/5 text-primary font-bold">
                                  {getInitials(finalName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-bold text-base">{finalName}</span>
                                {finalUsername && <span className="text-xs text-muted-foreground">@{finalUsername}</span>}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            {r.quizTitle ? (
                              <span className="font-medium text-xs text-foreground bg-muted px-2 py-1 rounded-md">
                                {r.quizTitle}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">
                                {language === 'ku' ? 'گشتی / تر' : 'General / Other'}
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-black text-emerald-500">
                            {formatNumber(r.amount)} {language === 'ku' ? 'د.ع' : 'IQD'}
                          </td>
                          <td className="p-4 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 text-xs px-3 font-semibold w-full"
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
                        );
                      })}
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
        <DialogContent className="sm:max-w-[425px] overflow-hidden rounded-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          <DialogHeader className="pt-2">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-amber-500/10 rounded-full">
                <Gift className="h-5 w-5 text-amber-500" />
              </div>
              {language === 'ku' ? 'پێدانی خەڵات' : 'Pay Prize'}
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm font-medium">
              {language === 'ku'
                ? `پێدانی خەڵات بە یاریزان "${selectedWinner?.displayName}"`
                : `Payout for player "${selectedWinner?.displayName}"`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-5 py-4">
            <div className="grid gap-2">
              <Label htmlFor="amount" className="font-bold text-foreground">
                {language === 'ku' ? 'بڕی خەڵات (د.ع)' : 'Payout Amount (IQD)'}
              </Label>
              <div className="relative">
                <Input
                  id="amount"
                  type="text"
                  inputMode="numeric"
                  value={payoutAmount}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (!raw) {
                      setPayoutAmount('');
                      return;
                    }
                    setPayoutAmount(Number(raw).toLocaleString('en-US'));
                  }}
                  placeholder="100,000"
                  className="h-12 text-lg font-black pl-4 pr-12 rounded-xl bg-muted/50 border-transparent focus-visible:bg-background focus-visible:ring-amber-500/30 focus-visible:border-amber-500/50"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground text-sm">IQD</span>
              </div>
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-medium text-muted-foreground">
                  {language === 'ku' ? `زۆرترین بڕ:` : `Max amount:`} 
                </span>
                <span className="text-xs font-black text-amber-500">
                  {formatNumber(selectedWinner?.pendingRewards)} {language === 'ku' ? 'د.ع' : 'IQD'}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="font-bold text-foreground">{language === 'ku' ? 'کویزی پەیوەندیدار' : 'Related Quiz'}</Label>
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
                <SelectTrigger className="h-12 rounded-xl bg-muted/50 border-transparent">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="general" className="font-medium">{language === 'ku' ? 'پێدانی گشتی / تر' : 'General / Other Payout'}</SelectItem>
                  {unpaidWonQuizzes.map((q: any) => {
                    const paid = paidAmountsByQuiz.get(q.quizId) || 0;
                    const remaining = Math.max(0, q.amount - paid);
                    return (
                      <SelectItem key={q.quizId} value={q.quizId} className="font-medium">
                        {q.quizTitle} ({language === 'ku' ? `پلەی ${q.rank}` : `Rank ${q.rank}`} - {language === 'ku' ? 'ماوە:' : 'Rem:'} {formatNumber(remaining)} {language === 'ku' ? 'د.ع' : 'IQD'})
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes" className="font-bold text-foreground">{language === 'ku' ? 'تێبینییەکان (ئارەزوومەندانە)' : 'Notes (Optional)'}</Label>
              <Textarea
                id="notes"
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                placeholder={language === 'ku' ? 'ژمارەی ترانزاکشن، ژمارەی مۆبایل...' : 'Transaction ID, phone...'}
                rows={2}
                className="resize-none rounded-xl bg-muted/50 border-transparent focus-visible:bg-background"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button variant="ghost" onClick={() => setIsPayoutDialogOpen(false)} className="rounded-xl font-bold">
              {language === 'ku' ? 'پاشگەزبوونەوە' : 'Cancel'}
            </Button>
            <Button
              className="bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md px-6"
              disabled={createReceiptMutation.isPending || !payoutAmount || Number(payoutAmount.replace(/,/g, '')) <= 0 || !payoutQuizId}
              onClick={() => {
                const numericAmount = Number(payoutAmount.replace(/,/g, ''));
                if (numericAmount > selectedWinner?.pendingRewards) {
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
                  amount: numericAmount,
                  notes: payoutNotes,
                });
              }}
            >
              {createReceiptMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                language === 'ku' ? 'تۆمارکردن' : 'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
