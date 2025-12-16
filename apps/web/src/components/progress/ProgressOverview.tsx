import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BookOpen,
  CheckCircle,
  Clock,
  Brain,
  Trophy,
  TrendingUp,
} from 'lucide-react';

interface ProgressStats {
  chaptersCompleted: number;
  totalChapters: number;
  quizzesPassed: number;
  totalQuizzes: number;
  averageScore: number;
  totalStudyTime: number; // in minutes
  reviewCardsDue: number;
  streak: number;
}

interface ProgressOverviewProps {
  stats: ProgressStats;
  className?: string;
}

export function ProgressOverview({ stats, className }: ProgressOverviewProps) {
  const chapterProgress = Math.round(
    (stats.chaptersCompleted / stats.totalChapters) * 100
  );
  const quizProgress = Math.round(
    (stats.quizzesPassed / stats.totalQuizzes) * 100
  );

  const formatTime = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      {/* Chapters Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kapitel</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.chaptersCompleted}/{stats.totalChapters}
          </div>
          <Progress value={chapterProgress} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {chapterProgress}% genomfört
          </p>
        </CardContent>
      </Card>

      {/* Quiz Progress */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Kunskapstester</CardTitle>
          <CheckCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.quizzesPassed}/{stats.totalQuizzes}
          </div>
          <Progress value={quizProgress} className="h-2 mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            Snittbetyg: {stats.averageScore}%
          </p>
        </CardContent>
      </Card>

      {/* Study Time */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Studietid</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatTime(stats.totalStudyTime)}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Total tid
          </p>
        </CardContent>
      </Card>

      {/* Spaced Repetition */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Repetition</CardTitle>
          <Brain className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.reviewCardsDue}</div>
          <p className="text-xs text-muted-foreground mt-2">
            Kort att repetera idag
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
