import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { calculateNextReview, Quality } from '@/lib/sm2';
import { db } from '@/lib/db';
import {
  Brain,
  CheckCircle,
  XCircle,
  RotateCcw,
  ArrowRight,
  Trophy,
  Clock,
} from 'lucide-react';

interface ReviewCard {
  id: string;
  questionId: string;
  questionText: string;
  correctAnswer: string;
  explanation?: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
}

interface ReviewSessionProps {
  cards: ReviewCard[];
  onComplete: (results: ReviewResult[]) => void;
  onExit: () => void;
}

interface ReviewResult {
  cardId: string;
  quality: Quality;
  newInterval: number;
  newEaseFactor: number;
  nextReviewAt: Date;
}

type CardState = 'question' | 'answer' | 'rating';

export function ReviewSession({ cards, onComplete, onExit }: ReviewSessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardState, setCardState] = useState<CardState>('question');
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [startTime] = useState(Date.now());
  const [sessionComplete, setSessionComplete] = useState(false);

  const currentCard = cards[currentIndex];
  const progress = Math.round((currentIndex / cards.length) * 100);

  const handleShowAnswer = () => {
    setShowingAnswer(true);
    setCardState('rating');
  };

  const handleRate = async (quality: Quality) => {
    if (!currentCard) return;

    const result = calculateNextReview(
      {
        easeFactor: currentCard.easeFactor,
        interval: currentCard.interval,
        repetitions: currentCard.repetitions,
      },
      quality
    );

    const reviewResult: ReviewResult = {
      cardId: currentCard.id,
      quality,
      newInterval: result.interval,
      newEaseFactor: result.easeFactor,
      nextReviewAt: result.nextReviewAt,
    };

    // Save to IndexedDB
    try {
      await db.updateReviewCard(currentCard.questionId, {
        easeFactor: result.easeFactor,
        interval: result.interval,
        repetitions: result.repetitions,
        nextReviewAt: result.nextReviewAt.getTime(),
        lastReviewedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to update review card:', error);
    }

    const newResults = [...results, reviewResult];
    setResults(newResults);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCardState('question');
      setShowingAnswer(false);
    } else {
      setSessionComplete(true);
      onComplete(newResults);
    }
  };

  const getQualityLabel = (q: Quality): string => {
    switch (q) {
      case 0: return 'Helt fel';
      case 1: return 'Fel';
      case 2: return 'Nästan';
      case 3: return 'Svårt';
      case 4: return 'Bra';
      case 5: return 'Perfekt';
    }
  };

  const getQualityColor = (q: Quality): string => {
    switch (q) {
      case 0:
      case 1: return 'bg-red-500 hover:bg-red-600';
      case 2: return 'bg-orange-500 hover:bg-orange-600';
      case 3: return 'bg-yellow-500 hover:bg-yellow-600';
      case 4: return 'bg-green-500 hover:bg-green-600';
      case 5: return 'bg-emerald-500 hover:bg-emerald-600';
    }
  };

  if (sessionComplete) {
    const correctCount = results.filter((r) => r.quality >= 3).length;
    const avgQuality = results.reduce((sum, r) => sum + r.quality, 0) / results.length;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-card border rounded-xl p-8">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <Trophy className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>

          <h2 className="text-2xl font-bold mb-2">Session slutförd!</h2>
          <p className="text-muted-foreground mb-8">
            Du har gått igenom alla kort för idag.
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {correctCount}/{cards.length}
              </div>
              <div className="text-sm text-muted-foreground">Rätt</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold">{avgQuality.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">Snittbetyg</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-3xl font-bold flex items-center justify-center gap-1">
                <Clock className="h-6 w-6" />
                {Math.floor(timeSpent / 60)}m
              </div>
              <div className="text-sm text-muted-foreground">Tid</div>
            </div>
          </div>

          <Button onClick={onExit} size="lg">
            Tillbaka till dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">Repetition</h2>
        </div>
        <Button variant="ghost" onClick={onExit}>
          Avsluta
        </Button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-4 mb-8">
        <Progress value={progress} className="flex-1 h-2" />
        <span className="text-sm text-muted-foreground">
          {currentIndex + 1}/{cards.length}
        </span>
      </div>

      {/* Card */}
      <Card className="min-h-[300px] flex flex-col">
        <CardContent className="flex-1 flex flex-col p-6">
          {/* Question */}
          <div className="flex-1">
            <p className="text-xs text-muted-foreground uppercase mb-2">Fråga</p>
            <p className="text-lg">{currentCard?.questionText}</p>
          </div>

          {/* Answer (shown when revealed) */}
          {showingAnswer && currentCard && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-xs text-muted-foreground uppercase mb-2">Rätt svar</p>
              <p className="text-lg font-medium text-green-600 dark:text-green-400">
                {currentCard.correctAnswer}
              </p>
              {currentCard.explanation && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {currentCard.explanation}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="mt-6">
        {!showingAnswer ? (
          <Button onClick={handleShowAnswer} className="w-full" size="lg">
            Visa svar
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Hur väl kunde du svaret?
            </p>
            <div className="grid grid-cols-6 gap-2">
              {([0, 1, 2, 3, 4, 5] as Quality[]).map((q) => (
                <Button
                  key={q}
                  onClick={() => handleRate(q)}
                  className={cn('flex-col h-auto py-3', getQualityColor(q))}
                  variant="default"
                >
                  <span className="text-lg font-bold">{q}</span>
                  <span className="text-xs opacity-80">{getQualityLabel(q)}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <p className="mt-6 text-xs text-center text-muted-foreground">
        0-2 = Fel (kort återkommer snart) • 3-5 = Rätt (längre intervall)
      </p>
    </div>
  );
}
