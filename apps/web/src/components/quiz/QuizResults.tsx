import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle, XCircle, Trophy, RefreshCw, ArrowLeft, Clock } from 'lucide-react';

interface QuizQuestion {
  id: string;
  code: string;
  bloomLevel: string;
  questionText: string;
  options: {
    id: string;
    label: string;
    text: string;
    isCorrect?: boolean;
  }[];
  explanation?: string;
}

interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  timeSpent: number;
  answers: { questionId: string; selectedOption: string; isCorrect: boolean }[];
}

interface QuizResultsProps {
  result: QuizResult;
  questions: QuizQuestion[];
  answers: Map<string, string>;
  passingScore: number;
  onRetry: () => void;
  onExit: () => void;
}

export function QuizResults({
  result,
  questions,
  answers,
  passingScore,
  onRetry,
  onExit,
}: QuizResultsProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} sekunder`;
    return `${mins} min ${secs} sek`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Result Summary Card */}
      <div
        className={cn(
          'rounded-xl p-8 text-center mb-8',
          result.passed
            ? 'bg-green-50 border-2 border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-red-50 border-2 border-red-200 dark:bg-red-900/20 dark:border-red-800'
        )}
      >
        <div className="flex justify-center mb-4">
          {result.passed ? (
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
              <Trophy className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
          )}
        </div>

        <h1 className="text-3xl font-bold mb-2">
          {result.passed ? 'Grattis!' : 'Tyvärr'}
        </h1>
        <p className="text-lg text-muted-foreground mb-6">
          {result.passed
            ? 'Du klarade provet!'
            : `Du behöver ${passingScore}% för att klara provet.`}
        </p>

        {/* Score */}
        <div className="inline-flex items-baseline gap-1 mb-4">
          <span className="text-6xl font-bold">{result.score}</span>
          <span className="text-2xl text-muted-foreground">%</span>
        </div>

        <Progress
          value={result.score}
          className={cn(
            'h-3 max-w-md mx-auto mb-6',
            result.passed ? '[&>div]:bg-green-500' : '[&>div]:bg-red-500'
          )}
        />

        {/* Stats */}
        <div className="flex justify-center gap-8 text-sm">
          <div>
            <div className="text-2xl font-bold">{result.correctAnswers}</div>
            <div className="text-muted-foreground">Rätt svar</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{result.totalQuestions - result.correctAnswers}</div>
            <div className="text-muted-foreground">Fel svar</div>
          </div>
          <div>
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <Clock className="h-5 w-5" />
              {formatTime(result.timeSpent)}
            </div>
            <div className="text-muted-foreground">Tid</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 mb-8">
        <Button variant="outline" onClick={onExit}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>
        {!result.passed && (
          <Button onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Försök igen
          </Button>
        )}
      </div>

      {/* Question Review */}
      <div className="bg-card border rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Genomgång av frågor</h2>

        <Accordion type="single" collapsible className="space-y-2">
          {questions.map((question, index) => {
            const selectedOption = answers.get(question.id);
            const correctOption = question.options.find((o) => o.isCorrect);
            const isCorrect = selectedOption === correctOption?.label;

            return (
              <AccordionItem
                key={question.id}
                value={question.id}
                className={cn(
                  'border rounded-lg px-4',
                  isCorrect
                    ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10'
                    : 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10'
                )}
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                    )}
                    <span className="font-medium">
                      Fråga {index + 1}: {question.questionText.substring(0, 60)}
                      {question.questionText.length > 60 ? '...' : ''}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <p className="mb-4 text-muted-foreground">{question.questionText}</p>

                  <div className="space-y-2 mb-4">
                    {question.options.map((option) => {
                      const isSelected = selectedOption === option.label;
                      const isCorrectOption = option.isCorrect;

                      return (
                        <div
                          key={option.id}
                          className={cn(
                            'flex items-start gap-3 p-3 rounded-lg border',
                            isCorrectOption && 'bg-green-100 border-green-300 dark:bg-green-900/30 dark:border-green-700',
                            isSelected && !isCorrectOption && 'bg-red-100 border-red-300 dark:bg-red-900/30 dark:border-red-700',
                            !isSelected && !isCorrectOption && 'bg-muted/50'
                          )}
                        >
                          <span
                            className={cn(
                              'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
                              isCorrectOption && 'bg-green-500 text-white',
                              isSelected && !isCorrectOption && 'bg-red-500 text-white',
                              !isSelected && !isCorrectOption && 'bg-muted-foreground/20'
                            )}
                          >
                            {isCorrectOption ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : isSelected ? (
                              <XCircle className="h-4 w-4" />
                            ) : (
                              option.label
                            )}
                          </span>
                          <div className="flex-1">
                            <span>{option.text}</span>
                            {isSelected && !isCorrectOption && (
                              <span className="ml-2 text-xs text-red-600">(Ditt svar)</span>
                            )}
                            {isCorrectOption && (
                              <span className="ml-2 text-xs text-green-600">(Rätt svar)</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {question.explanation && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/20 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
                        Förklaring:
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-200">
                        {question.explanation}
                      </p>
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    </div>
  );
}
