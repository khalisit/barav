'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/api-client';
import type { LeaderboardEntry } from '@/lib/types';
import { formatNumber, getInitials } from '@/lib/format';
import { useLanguage } from '@/hooks/use-language';

export default function LeaderboardPage() {
  const { language } = useLanguage();
  const { data: fetchResult, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['users-leaderboard'],
    queryFn: () => api.get('/users?onlyParticipants=true')
  });

  const [search, setSearch] = useState('');

  const entries = useMemo(() => {
    const users = Array.isArray(fetchResult?.data) ? fetchResult.data : Array.isArray(fetchResult) ? fetchResult : [];
    
    // Ensure sorted strictly by totalPoints descending
    const sortedUsers = [...users].sort((a: any, b: any) => (b.totalPoints || 0) - (a.totalPoints || 0));

    return sortedUsers.map((u: any, index: number) => {
      const quizzesPlayed = u.quizzesPlayed || 0;
      const quizzesWon = u.quizzesWon || 0;
      const winRate = quizzesPlayed > 0 ? (quizzesWon / quizzesPlayed) * 100 : 0;
      
      return {
        id: u.id,
        rank: index + 1,
        name: u.fullName || u.username || 'Unknown',
        avatarUrl: u.avatarKey,
        totalPoints: u.totalPoints || 0,
        quizzesWon: quizzesWon,
        quizzesPlayed: quizzesPlayed,
        winRate: Number(winRate.toFixed(2)),
      };
    });
  }, [fetchResult]);

  const filtered = useMemo(() => {
    const result = entries.filter((e: any) =>
      e.name.toLowerCase().includes(search.toLowerCase())
    );
    
    // Ranks are strictly preserved by totalPoints order
    return result.map((item: any, index: number) => ({
      ...item,
      rank: index + 1
    }));
  }, [entries, search]);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  if (isLoading) {
    return <DashboardShell><PageHeader title={language === 'ku' ? 'ڕیزبەندی' : 'Leaderboard'} description={language === 'ku' ? 'بارکردنی ڕیزبەندی...' : 'Loading rankings...'} /></DashboardShell>;
  }

  return (
    <DashboardShell>
      <PageHeader
        title={language === 'ku' ? 'ڕیزبەندی یاریزانان' : 'Leaderboard'}
        description={language === 'ku' ? 'لیستی باشترین یاریزانان بەپێی کۆی خاڵەکانیان' : 'Top performing players ranked strictly by total points'}
        breadcrumbs={[{ label: language === 'ku' ? 'سەرەکی' : 'Home', href: '/dashboard' }, { label: language === 'ku' ? 'ڕیزبەندی' : 'Leaderboard' }]}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-3">
          <div className="space-y-1">
            <Label>{language === 'ku' ? 'گەڕان' : 'Search'}</Label>
            <Input
              placeholder={language === 'ku' ? 'گەڕان بەدوای یاریزاناندا...' : 'Search players...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {language === 'ku' ? 'هیچ یاریزانێک نەدۆزرایەوە' : 'No players found.'}
          </CardContent>
        </Card>
      ) : (
        <>
          {filtered.length >= 3 && (
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[1, 0, 2].map((displayIndex) => {
                const entry = top3[displayIndex];
                if (!entry) return null;
                const podiumColors = ['bg-warning', 'bg-muted-foreground/30', 'bg-orange-500/70'];
                const podiumHeights = ['sm:mt-0', 'sm:mt-4', 'sm:mt-8'];
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: displayIndex * 0.1 }}
                    className={podiumHeights[displayIndex]}
                  >
                    <Card className="relative overflow-hidden text-center">
                      <CardContent className="flex flex-col items-center pt-6">
                        <div className={`absolute top-0 left-0 right-0 h-1 ${podiumColors[displayIndex]}`} />
                        <div className="mb-2 flex h-16 w-16 items-center justify-center">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className={`text-lg font-bold ${podiumColors[displayIndex]} text-white`}>
                              {getInitials(entry.name)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        {displayIndex === 0 && <Crown className="mb-1 h-5 w-5 text-warning" />}
                        <p className="font-semibold">{entry.name}</p>
                        <p className="mt-1 text-2xl font-bold text-primary">{formatNumber(entry.totalPoints)}</p>
                        <p className="text-xs text-muted-foreground">{language === 'ku' ? 'خاڵ' : 'points'}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{language === 'ku' ? 'ڕیزبەندی تەواو' : 'Full Rankings'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {filtered.map((entry: any, i: number) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50"
                >
                  <span className="w-8 text-center text-sm font-bold text-muted-foreground">
                    {entry.rank}
                  </span>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(entry.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.quizzesPlayed > 0 
                        ? `${entry.quizzesPlayed} ${language === 'ku' ? 'یاری' : 'played'}`
                        : (language === 'ku' ? 'یاریزان' : 'Player')}
                    </p>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <div className="text-end sm:text-center">
                      <p className="font-bold text-primary">{formatNumber(entry.totalPoints || 0)}</p>
                      <p className="text-xs text-muted-foreground">{language === 'ku' ? 'خاڵ' : 'points'}</p>
                    </div>
                  </div>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </DashboardShell>
  );
}
