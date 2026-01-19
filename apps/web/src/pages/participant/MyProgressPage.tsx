import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  useOverallProgress,
  useCourseStructure,
} from '@/hooks/useCourse';
import { useGamificationStats, useBadgesWithStatus } from '@/hooks/useGamification';
import { useQuizHistory } from '@/hooks/useQuiz';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import {
  TrendingUp,
  BookOpen,
  Target,
  Clock,
  Award,
  Brain,
  ArrowRight,
  CheckCircle2,
  XCircle,
  BarChart3,
  Flame,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MyProgressPage() {
  const { data: progress, isLoading: progressLoading } = useOverallProgress();
  const { data: courseStructure } = useCourseStructure('ortac-main');
  const { data: gamification, isLoading: gamificationLoading } = useGamificationStats();
  const { badges, earnedCount, totalCount } = useBadgesWithStatus();
  const { data: quizHistory, isLoading: quizLoading } = useQuizHistory();

  const completedChapters = progress?.chaptersCompleted ?? 0;
  const totalChapters = progress?.totalChapters ?? 17;
  const progressPercent = Math.round((completedChapters / totalChapters) * 100);

  // Calculate quiz statistics
  const quizStats = quizHistory
    ? {
        totalAttempts: quizHistory.length,
        averageScore: quizHistory.length > 0
          ? Math.round(quizHistory.reduce((acc, q) => acc + q.score, 0) / quizHistory.length)
          : 0,
        passRate: quizHistory.length > 0
          ? Math.round((quizHistory.filter(q => q.passed).length / quizHistory.length) * 100)
          : 0,
        totalTimeMinutes: Math.round(
          quizHistory.reduce((acc, q) => acc + (q.timeSpent || 0), 0) / 60
        ),
      }
    : null;

  // Activity data for chart (last 7 days)
  const activityData = generateActivityData(quizHistory || []);

  // Bloom level performance data
  const bloomData = calculateBloomPerformance(quizHistory || []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <BarChart3 className="h-8 w-8 text-primary" />
          Min Progress
        </h1>
        <p className="text-muted-foreground mt-1">
          Se din utveckling och prestationer i kursen
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Kursframsteg"
          value={`${progressPercent}%`}
          description={`${completedChapters}/${totalChapters} kapitel`}
          icon={BookOpen}
          loading={progressLoading}
          color="text-primary"
        />
        <StatCard
          title="Total XP"
          value={gamification?.totalXP?.toLocaleString() ?? '0'}
          description={`Nivå ${gamification?.level ?? 1}`}
          icon={Star}
          loading={gamificationLoading}
          color="text-amber-500"
        />
        <StatCard
          title="Daglig Streak"
          value={`${gamification?.currentStreak ?? 0}`}
          description={`Längsta: ${gamification?.longestStreak ?? 0} dagar`}
          icon={Flame}
          loading={gamificationLoading}
          color="text-orange-500"
        />
        <StatCard
          title="Badges"
          value={`${earnedCount}/${totalCount}`}
          description="intjänade"
          icon={Award}
          loading={gamificationLoading}
          color="text-purple-500"
        />
      </div>

      {/* Progress and Activity Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Kapitelframsteg
            </CardTitle>
            <CardDescription>Din progress genom kursen</CardDescription>
          </CardHeader>
          <CardContent>
            {progressLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : (
              <div className="space-y-4">
                {courseStructure?.parts?.map((part, partIndex) => (
                  <div key={part.id}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        Del {partIndex + 1}: {part.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {part.completedChapters}/{part.totalChapters}
                      </span>
                    </div>
                    <Progress
                      value={(part.completedChapters / part.totalChapters) * 100}
                      className="h-2"
                    />
                  </div>
                ))}
                {!courseStructure?.parts && (
                  <div className="text-center py-8 text-muted-foreground">
                    Laddar kursstruktur...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Aktivitet senaste 7 dagarna
            </CardTitle>
            <CardDescription>Quiz och läsaktivitet</CardDescription>
          </CardHeader>
          <CardContent>
            {quizLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                  <Bar dataKey="quizzes" name="Quiz" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Ingen aktivitetsdata ännu
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quiz Performance Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quiz Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Quizprestationer
            </CardTitle>
            <CardDescription>Sammanfattning av dina quizresultat</CardDescription>
          </CardHeader>
          <CardContent>
            {quizLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : quizStats ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-primary">
                    {quizStats.averageScore}%
                  </p>
                  <p className="text-sm text-muted-foreground">Genomsnittlig poäng</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold text-green-500">
                    {quizStats.passRate}%
                  </p>
                  <p className="text-sm text-muted-foreground">Godkännandegrad</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold">{quizStats.totalAttempts}</p>
                  <p className="text-sm text-muted-foreground">Totala försök</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-center">
                  <p className="text-3xl font-bold">{quizStats.totalTimeMinutes}</p>
                  <p className="text-sm text-muted-foreground">Minuter spenderade</p>
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Ingen quizdata tillgänglig
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bloom Level Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Prestation per kunskapsnivå
            </CardTitle>
            <CardDescription>Blooms taxonomi - hur du presterar på olika nivåer</CardDescription>
          </CardHeader>
          <CardContent>
            {quizLoading ? (
              <Skeleton className="h-[200px] w-full" />
            ) : bloomData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={bloomData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="level" className="text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Din poäng"
                    dataKey="score"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.5}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Ingen data för kunskapsnivåer ännu
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Quiz History */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Senaste quizförsök
            </CardTitle>
            <CardDescription>Dina 5 senaste quizförsök</CardDescription>
          </div>
          <Link to="/quiz">
            <Button variant="outline" size="sm">
              Gör ett quiz
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {quizLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : quizHistory && quizHistory.length > 0 ? (
            <div className="space-y-3">
              {quizHistory.slice(0, 5).map((attempt, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-center justify-between p-3 rounded-lg',
                    attempt.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {attempt.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {attempt.type === 'chapter' ? 'Kapitelquiz' : attempt.type === 'exam' ? 'Slutexamen' : 'Övningsquiz'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(attempt.completedAt).toLocaleDateString('sv-SE', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      'font-bold',
                      attempt.passed ? 'text-green-600' : 'text-red-600'
                    )}>
                      {attempt.score}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {attempt.correctAnswers}/{attempt.totalQuestions} rätt
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Du har inte gjort några quiz ännu</p>
              <Link to="/quiz" className="mt-4 inline-block">
                <Button>Gör ditt första quiz</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badges Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Senaste badges
            </CardTitle>
            <CardDescription>
              {earnedCount} av {totalCount} badges intjänade
            </CardDescription>
          </div>
          <Link to="/leaderboard">
            <Button variant="outline" size="sm">
              Se alla
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {badges
              .filter(b => b.earned)
              .slice(0, 6)
              .map(badge => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center p-3 bg-muted/50 rounded-lg"
                >
                  <span className="text-2xl">{badge.icon}</span>
                  <p className="text-xs font-medium mt-1">{badge.name}</p>
                </div>
              ))}
            {earnedCount === 0 && (
              <p className="text-muted-foreground">
                Du har inte tjänat några badges ännu. Fortsätt studera!
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Helper Components
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  loading,
  color,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  loading: boolean;
  color: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn('h-5 w-5', color)} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Helper functions
function generateActivityData(quizHistory: Array<{ completedAt: string | number }>) {
  const days = ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'];
  const today = new Date();
  const data = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.setHours(0, 0, 0, 0));
    const dayEnd = new Date(date.setHours(23, 59, 59, 999));

    const quizzes = quizHistory.filter(q => {
      const qDate = new Date(q.completedAt);
      return qDate >= dayStart && qDate <= dayEnd;
    }).length;

    data.push({
      day: days[new Date(dayStart).getDay()],
      quizzes,
    });
  }

  return data;
}

function calculateBloomPerformance(quizHistory: Array<{
  answers?: Array<{
    bloomLevel?: string;
    isCorrect: boolean;
  }>;
}>) {
  const bloomLevels = ['Minnas', 'Förstå', 'Tillämpa', 'Analysera', 'Utvärdera', 'Skapa'];
  const bloomMap: Record<string, { correct: number; total: number }> = {};

  bloomLevels.forEach(level => {
    bloomMap[level] = { correct: 0, total: 0 };
  });

  quizHistory.forEach(quiz => {
    quiz.answers?.forEach(answer => {
      const level = answer.bloomLevel || 'Förstå';
      if (bloomMap[level]) {
        bloomMap[level].total++;
        if (answer.isCorrect) {
          bloomMap[level].correct++;
        }
      }
    });
  });

  return bloomLevels.map(level => ({
    level,
    score: bloomMap[level].total > 0
      ? Math.round((bloomMap[level].correct / bloomMap[level].total) * 100)
      : 0,
  }));
}
