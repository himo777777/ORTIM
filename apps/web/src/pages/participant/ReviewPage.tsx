import { useNavigate } from 'react-router-dom';
import { useDueReviewCards, useReviewStats } from '@/hooks/useReview';
import { ReviewSession } from '@/components/review';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Brain, CheckCircle, Calendar, TrendingUp } from 'lucide-react';

export default function ReviewPage() {
  const navigate = useNavigate();
  const { data: dueCards, isLoading: cardsLoading } = useDueReviewCards();
  const { data: stats, isLoading: statsLoading } = useReviewStats();

  const handleComplete = () => {
    // Results are saved within ReviewSession component
    // Could show a summary or navigate back
  };

  const handleExit = () => {
    navigate('/dashboard');
  };

  // Loading state
  if (cardsLoading || statsLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <div className="grid gap-4 md:grid-cols-3 mt-8">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  // No cards due - show stats and empty state
  if (!dueCards || dueCards.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>

        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-6">
            <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Inget att repetera!</h1>
          <p className="text-muted-foreground mb-8">
            Du har repeterat alla kort för idag. Kom tillbaka imorgon för nya repetitioner.
          </p>
        </div>

        {/* Stats cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-3 mt-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Totalt antal kort
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.totalCards}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Repeterade idag
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.reviewedToday}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Snittbetyg
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {stats.averageQuality?.toFixed(1) || '-'}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Next review info */}
        {stats?.nextReviewDate && (
          <div className="mt-8 p-4 bg-muted rounded-xl flex items-center gap-4">
            <Calendar className="h-6 w-6 text-muted-foreground" />
            <div>
              <p className="font-medium">Nästa repetition</p>
              <p className="text-sm text-muted-foreground">
                {new Date(stats.nextReviewDate).toLocaleDateString('sv-SE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Transform API cards to component format
  const reviewCards = dueCards.map((card) => ({
    id: card.id,
    questionId: card.questionId,
    questionText: card.question?.questionText || '',
    correctAnswer: card.question?.options?.find((o: { isCorrect?: boolean }) => o.isCorrect)?.optionText || '',
    explanation: card.question?.explanation,
    easeFactor: card.easeFactor,
    interval: card.interval,
    repetitions: card.repetitions,
  }));

  return (
    <div>
      {/* Header with stats */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              Spaced Repetition
            </h1>
            <p className="text-muted-foreground mt-1">
              {dueCards.length} kort att repetera idag
            </p>
          </div>

          {stats && (
            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-sm">
                Streak: <strong>{stats.streak || 0}</strong> dagar
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Review Session */}
      <ReviewSession
        cards={reviewCards}
        onComplete={handleComplete}
        onExit={handleExit}
      />
    </div>
  );
}
