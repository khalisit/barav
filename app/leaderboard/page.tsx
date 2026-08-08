'use client';

import { useState, useMemo } from 'react';
import { Crown, Medal, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { generateLeaderboard } from '@/lib/mock-data';
import type { LeaderboardEntry } from '@/lib/types';
import { formatNumber, getInitials } from '@/lib/format';

export default function LeaderboardPage() {
  const [entries] = useState<LeaderboardEntry[]>(() => generateLeaderboard(50));
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'points' | 'won' | 'winRate'>('points');

  const filtered = useMemo(() => {
    const result = entries.filter((e) =>
      e.name.toLowerCase().includes(search.toLowerCase())
    );
    return result.sort((a, b) => {
      if (sortBy === 'points') return b.totalPoints - a.totalPoints;
      if (sortBy === 'won') return b.quizzesWon - a.quizzesWon;
      return b.winRate - a.winRate;
    });
  }, [entries, search, sortBy]);

  const top3 = filtered.slice(0, 3);
  const rest = filtered.slice(3);

  return (
    <DashboardShell>
      <PageHeader
        title="Leaderboard"
        description="Top performing players ranked by score"
        breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Leaderboard' }]}
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex gap-3">
          <div className="space-y-1">
            <Label>Search</Label>
            <Input
              placeholder="Search players..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64"
            />
          </div>
          <div className="space-y-1">
            <Label>Sort by</Label>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="points">Total Points</SelectItem>
                <SelectItem value="won">Quizzes Won</SelectItem>
                <SelectItem value="winRate">Win Rate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {top3.length >= 3 && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 0, 2].map((displayIndex) => {
            const entry = top3[displayIndex];
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
                    <p className="text-xs text-muted-foreground">points</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Full Rankings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {rest.map((entry, i) => (
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
                <p className="text-xs text-muted-foreground">{entry.quizzesPlayed} quizzes played</p>
              </div>
              <div className="hidden gap-6 text-sm sm:flex">
                <div className="text-center">
                  <p className="font-semibold">{formatNumber(entry.totalPoints)}</p>
                  <p className="text-xs text-muted-foreground">points</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold text-success">{entry.quizzesWon}</p>
                  <p className="text-xs text-muted-foreground">won</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">{entry.winRate}%</p>
                  <p className="text-xs text-muted-foreground">win rate</p>
                </div>
              </div>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </DashboardShell>
  );
}
