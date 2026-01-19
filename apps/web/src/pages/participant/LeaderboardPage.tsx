import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/authStore';
import { useLeaderboard, useGamificationStats } from '@/hooks/useGamification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Trophy,
  Medal,
  Crown,
  Star,
  Flame,
  TrendingUp,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Period = 'weekly' | 'monthly' | 'allTime';

const periodLabels: Record<Period, string> = {
  weekly: 'Denna vecka',
  monthly: 'Denna månad',
  allTime: 'All tid',
};

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>('weekly');
  const { user } = useAuthStore();
  const { data: leaderboard, isLoading } = useLeaderboard(period, 10);
  const { data: myStats } = useGamificationStats();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-amber-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-700" />;
      default:
        return <span className="w-6 text-center font-bold text-muted-foreground">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-amber-100 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 border-amber-300 dark:border-amber-700';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-300 dark:border-gray-600';
      case 3:
        return 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 border-orange-300 dark:border-orange-700';
      default:
        return 'bg-card border-border';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-amber-500" />
            Topplista
          </h1>
          <p className="text-muted-foreground mt-1">
            Se hur du står dig mot andra deltagare
          </p>
        </div>

        {/* Period tabs */}
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            <TabsTrigger value="weekly">Vecka</TabsTrigger>
            <TabsTrigger value="monthly">Månad</TabsTrigger>
            <TabsTrigger value="allTime">All tid</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Your position card */}
      {myStats && leaderboard && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Din position</p>
                  <p className="text-2xl font-bold">
                    #{leaderboard.currentUserRank || '-'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Star className="w-5 h-5 text-amber-500" />
                  <span className="text-xl font-bold">
                    {period === 'weekly'
                      ? myStats.weeklyXP.toLocaleString()
                      : period === 'monthly'
                      ? myStats.monthlyXP.toLocaleString()
                      : myStats.totalXP.toLocaleString()}{' '}
                    XP
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Nivå {myStats.level} • {myStats.currentStreak} dagars streak
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Top 10 - {periodLabels[period]}</span>
            {isLoading && <Skeleton className="h-5 w-20" />}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : leaderboard?.leaderboard.length === 0 ? (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Inga poäng registrerade ännu</p>
              <p className="text-sm text-muted-foreground mt-1">
                Slutför kapitel och quiz för att samla XP!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {leaderboard?.leaderboard.map((entry, index) => {
                const isCurrentUser = entry.userId === user?.id;

                return (
                  <motion.div
                    key={entry.userId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-xl border transition-all',
                      getRankBg(entry.rank),
                      isCurrentUser && 'ring-2 ring-primary'
                    )}
                  >
                    {/* Rank */}
                    <div className="w-10 flex justify-center">
                      {getRankIcon(entry.rank)}
                    </div>

                    {/* User info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">
                          {entry.firstName} {entry.lastName}
                          {isCurrentUser && (
                            <span className="text-primary ml-2">(Du)</span>
                          )}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          Nivå {entry.level}
                        </Badge>
                      </div>
                      {entry.streak > 0 && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                          {entry.streak} dagars streak
                        </p>
                      )}
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <p className="font-bold text-lg flex items-center gap-1 justify-end">
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                        {entry.xp.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">XP</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-3">Så tjänar du XP</h3>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <span className="font-bold text-blue-600">+100</span>
              </div>
              <div>
                <p className="font-medium text-sm">Slutför kapitel</p>
                <p className="text-xs text-muted-foreground">Per kapitel</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <span className="font-bold text-emerald-600">+50</span>
              </div>
              <div>
                <p className="font-medium text-sm">Godkänd quiz</p>
                <p className="text-xs text-muted-foreground">Per quiz</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span className="font-bold text-amber-600">+100</span>
              </div>
              <div>
                <p className="font-medium text-sm">Perfekt quiz</p>
                <p className="text-xs text-muted-foreground">100% rätt</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <span className="font-bold text-orange-600">+10</span>
              </div>
              <div>
                <p className="font-medium text-sm">Daglig streak</p>
                <p className="text-xs text-muted-foreground">Per dag</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
