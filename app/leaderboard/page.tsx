'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, Trophy, Search, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api-client';
import { formatNumber, getInitials } from '@/lib/format';
import { useLanguage } from '@/hooks/use-language';

function getMediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'https://api.baravquiz.com';
  return `${baseUrl}/media/${path.replace(/^\//, '')}`;
}

export default function LeaderboardPage() {
  const { language } = useLanguage();
  const { data: fetchResult, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['users-leaderboard'],
    queryFn: () => api.get('/users')
  });

  const [search, setSearch] = useState('');

  const entries = useMemo(() => {
    const users = Array.isArray(fetchResult?.data) ? fetchResult.data : Array.isArray(fetchResult) ? fetchResult : [];
    
    // Ensure sorted strictly by totalPoints descending
    const sortedUsers = [...users].sort((a: any, b: any) => (b.totalPoints || 0) - (a.totalPoints || 0));

    return sortedUsers.map((u: any, index: number) => {
      const quizzesPlayed = u.quizzesPlayed || 0;
      const fullName = u.fullName?.trim() || '';
      const username = u.username?.trim() || '';
      let displayName = fullName;
      if (!displayName) displayName = username;
      if (!displayName) displayName = language === 'ku' ? 'نەناسراو' : 'Unknown';
      
      return {
        id: u.id,
        rank: index + 1,
        fullName: fullName,
        username: username ? `@${username}` : '',
        displayName: displayName,
        avatarUrl: getMediaUrl(u.avatarKey),
        totalPoints: u.totalPoints || 0,
        quizzesPlayed: quizzesPlayed,
      };
    });
  }, [fetchResult, language]);

  const filtered = useMemo(() => {
    const result = entries.filter((e: any) =>
      e.displayName.toLowerCase().includes(search.toLowerCase()) || 
      e.username.toLowerCase().includes(search.toLowerCase())
    );
    
    return result.map((item: any) => ({
      ...item,
    }));
  }, [entries, search]);

  const top3 = entries.slice(0, 3); // Top 3 is always the global top 3

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



      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="py-16 flex flex-col items-center justify-center text-muted-foreground">
            <UserCircle className="h-12 w-12 opacity-50 mb-4" />
            <p className="text-lg font-medium">{language === 'ku' ? 'هیچ یاریزانێک نەدۆزرایەوە' : 'No players found.'}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {top3.length >= 3 && (
            <div className="mb-12 mt-6 grid grid-cols-3 gap-3 sm:gap-6 items-end max-w-3xl mx-auto">
              {[1, 0, 2].map((displayIndex) => {
                const entry = top3[displayIndex];
                if (!entry) return null;
                
                const isFirst = displayIndex === 0;
                const isSecond = displayIndex === 1;
                
                const colors = isFirst 
                  ? 'from-yellow-400 via-amber-400 to-yellow-600 border-yellow-500 shadow-yellow-500/30' 
                  : isSecond
                  ? 'from-slate-300 via-gray-300 to-slate-400 border-slate-400 shadow-slate-400/20'
                  : 'from-orange-300 via-amber-600 to-orange-700 border-orange-600 shadow-orange-600/20';

                const heights = isFirst ? 'h-40 sm:h-48' : isSecond ? 'h-28 sm:h-36' : 'h-24 sm:h-32';
                const avatarSize = isFirst ? 'h-20 w-20 sm:h-24 sm:w-24 border-4 border-yellow-500' : 'h-14 w-14 sm:h-16 sm:w-16 border-2 border-primary/30';
                const medalColors = isFirst ? 'text-yellow-500' : isSecond ? 'text-slate-400' : 'text-orange-600';
                
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: displayIndex * 0.15, type: 'spring', stiffness: 100 }}
                    className="flex flex-col items-center relative"
                  >
                    {isFirst && <Crown className="absolute -top-8 sm:-top-10 h-8 w-8 sm:h-10 sm:w-10 text-yellow-500 drop-shadow-md z-20" />}
                    
                    <div className="relative z-10 mb-4">
                      <Avatar className={`${avatarSize} shadow-xl bg-background`}>
                        <AvatarImage src={entry.avatarUrl} className="object-cover" />
                        <AvatarFallback className="text-xl sm:text-3xl font-bold bg-primary/5 text-primary">
                          {getInitials(entry.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full bg-background shadow-md border ${medalColors}`}>
                        <span className="font-bold text-sm">{entry.rank}</span>
                      </div>
                    </div>

                    <div className={`w-full rounded-t-2xl bg-gradient-to-t ${colors} flex flex-col items-center justify-start pt-6 px-2 text-white shadow-xl ${heights}`}>
                      <h3 className="font-bold text-[11px] sm:text-sm truncate w-full text-center drop-shadow-md">
                        {entry.displayName}
                      </h3>
                      {entry.username && (
                        <span className="text-[10px] sm:text-xs opacity-90 truncate w-full text-center block mt-0.5">
                          {entry.username}
                        </span>
                      )}
                      
                      <div className="mt-auto pb-4 text-center">
                        <p className="text-base sm:text-2xl font-extrabold drop-shadow-lg">
                          {formatNumber(entry.totalPoints)}
                        </p>
                        <p className="text-[9px] sm:text-xs font-semibold uppercase opacity-90">
                          {language === 'ku' ? 'خاڵ' : 'PTS'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <Card className="border-none shadow-lg overflow-hidden bg-background max-w-4xl mx-auto">
            <div className="bg-muted/40 p-5 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Trophy className="h-6 w-6 text-primary" />
                <h3 className="font-bold text-xl">
                  {language === 'ku' ? 'لیستی یاریزانان' : 'Players List'}
                </h3>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'ku' ? 'گەڕان بەدوای یاریزاناندا...' : 'Search players...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 rounded-full bg-background border-primary/20 shadow-sm focus-visible:ring-primary/30"
                />
              </div>
            </div>
            <CardContent className="p-0">
              <div className="divide-y">
                {filtered.map((entry: any, i: number) => {
                  const isTop3 = entry.rank <= 3;
                  if (isTop3) return null; // We already showed them in podium
                  
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -15 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (i - (search === '' && filtered.length >= 3 ? 3 : 0)) * 0.03 }}
                      className="flex items-center gap-3 sm:gap-6 p-4 sm:p-5 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 font-black text-xl text-muted-foreground/60">
                        {entry.rank}
                      </div>
                      
                      <Avatar className="h-12 w-12 sm:h-16 sm:w-16 border border-border shadow-sm">
                        <AvatarImage src={entry.avatarUrl} className="object-cover" />
                        <AvatarFallback className="bg-primary/5 text-sm sm:text-lg font-bold text-primary">
                          {getInitials(entry.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base sm:text-lg truncate">
                          {entry.displayName}
                        </p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-0.5 text-xs sm:text-sm text-muted-foreground">
                          {entry.username && <span className="truncate">{entry.username}</span>}
                          {entry.username && <span className="hidden sm:inline opacity-50">•</span>}
                          <span className="whitespace-nowrap bg-muted px-2 py-0.5 rounded-full w-fit">
                            <span className="font-semibold text-foreground/80">{entry.quizzesPlayed}</span>{' '}
                            {language === 'ku' ? 'یاری کردووە' : 'Games played'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-black text-xl sm:text-2xl text-primary font-mono tracking-tight">
                          {formatNumber(entry.totalPoints || 0)}
                        </p>
                        <p className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">
                          {language === 'ku' ? 'خاڵ' : 'PTS'}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </DashboardShell>
  );
}
