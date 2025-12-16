import { useState } from 'react';
import { Trophy, Medal, Crown, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useQuery } from '@tanstack/react-query';

interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  userId: string;
  userName: string;
  avatarUrl?: string;
  totalXP: number;
  level: number;
  currentStreak: number;
  isCurrentUser?: boolean;
}

// Mock API - replace with real API call
const fetchLeaderboard = async (period: 'weekly' | 'monthly' | 'allTime'): Promise<LeaderboardEntry[]> => {
  // Simulated data - in production this would come from the API
  await new Promise(resolve => setTimeout(resolve, 500));

  const mockData: LeaderboardEntry[] = [
    { rank: 1, previousRank: 1, userId: '1', userName: 'Anna Svensson', totalXP: 15420, level: 32, currentStreak: 45 },
    { rank: 2, previousRank: 3, userId: '2', userName: 'Erik Johansson', totalXP: 14850, level: 30, currentStreak: 28 },
    { rank: 3, previousRank: 2, userId: '3', userName: 'Maria Lindberg', totalXP: 14200, level: 29, currentStreak: 35 },
    { rank: 4, previousRank: 4, userId: '4', userName: 'Johan Andersson', totalXP: 13100, level: 27, currentStreak: 12 },
    { rank: 5, previousRank: 7, userId: '5', userName: 'Sara Nilsson', totalXP: 12500, level: 26, currentStreak: 20 },
    { rank: 6, previousRank: 5, userId: '6', userName: 'Peter Karlsson', totalXP: 11800, level: 25, currentStreak: 8 },
    { rank: 7, previousRank: 6, userId: '7', userName: 'Lisa Eriksson', totalXP: 11200, level: 24, currentStreak: 15 },
    { rank: 8, previousRank: 9, userId: '8', userName: 'Anders Olsson', totalXP: 10500, level: 22, currentStreak: 5 },
    { rank: 9, previousRank: 8, userId: '9', userName: 'Emma Persson', totalXP: 9800, level: 21, currentStreak: 10 },
    { rank: 10, previousRank: 10, userId: '10', userName: 'Karl Larsson', totalXP: 9200, level: 20, currentStreak: 3, isCurrentUser: true },
  ];

  return mockData;
};

interface LeaderboardProps {
  className?: string;
}

export function Leaderboard({ className }: LeaderboardProps) {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'allTime'>('weekly');

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => fetchLeaderboard(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500 fill-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="w-5 text-center font-medium text-muted-foreground">{rank}</span>;
    }
  };

  const getRankChange = (current: number, previous?: number) => {
    if (!previous) return null;

    const diff = previous - current;
    if (diff > 0) {
      return (
        <span className="flex items-center text-green-500 text-xs">
          <TrendingUp className="h-3 w-3 mr-0.5" />
          {diff}
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="flex items-center text-red-500 text-xs">
          <TrendingDown className="h-3 w-3 mr-0.5" />
          {Math.abs(diff)}
        </span>
      );
    }
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Topplista</h3>
        </div>
      </div>

      <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="weekly">Vecka</TabsTrigger>
          <TabsTrigger value="monthly">Månad</TabsTrigger>
          <TabsTrigger value="allTime">Totalt</TabsTrigger>
        </TabsList>

        <TabsContent value={period} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Top 3 Podium */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {entries.slice(0, 3).map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={cn(
                      'flex flex-col items-center p-3 rounded-lg',
                      index === 0 && 'bg-gradient-to-b from-yellow-500/20 to-transparent order-2',
                      index === 1 && 'bg-gradient-to-b from-gray-400/20 to-transparent order-1',
                      index === 2 && 'bg-gradient-to-b from-amber-600/20 to-transparent order-3',
                      entry.isCurrentUser && 'ring-2 ring-primary'
                    )}
                  >
                    {getRankIcon(entry.rank)}
                    <Avatar className={cn('mt-2', index === 0 ? 'w-14 h-14' : 'w-12 h-12')}>
                      <AvatarImage src={entry.avatarUrl} />
                      <AvatarFallback>{getInitials(entry.userName)}</AvatarFallback>
                    </Avatar>
                    <p className="text-sm font-medium mt-2 text-center truncate w-full">
                      {entry.userName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.totalXP.toLocaleString()} XP
                    </p>
                  </div>
                ))}
              </div>

              {/* Rest of the list */}
              <div className="space-y-2">
                {entries.slice(3).map((entry) => (
                  <div
                    key={entry.userId}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-lg',
                      entry.isCurrentUser
                        ? 'bg-primary/10 ring-1 ring-primary'
                        : 'bg-muted/50 hover:bg-muted'
                    )}
                  >
                    <div className="flex items-center gap-2 w-12">
                      {getRankIcon(entry.rank)}
                      {getRankChange(entry.rank, entry.previousRank)}
                    </div>

                    <Avatar className="w-10 h-10">
                      <AvatarImage src={entry.avatarUrl} />
                      <AvatarFallback>{getInitials(entry.userName)}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {entry.userName}
                        {entry.isCurrentUser && (
                          <span className="ml-2 text-xs text-primary">(Du)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Nivå {entry.level} · {entry.currentStreak} dagars streak
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold">{entry.totalXP.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">XP</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
