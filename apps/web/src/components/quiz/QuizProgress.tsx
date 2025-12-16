import { cn } from '@/lib/utils';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface QuizQuestion {
  id: string;
  code: string;
}

interface QuizProgressProps {
  total: number;
  current: number;
  answered: string[];
  questions: QuizQuestion[];
  onJumpTo: (index: number) => void;
}

export function QuizProgress({
  total,
  current,
  answered,
  questions,
  onJumpTo,
}: QuizProgressProps) {
  const progressPercentage = Math.round((answered.length / total) * 100);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {answered.length}/{total}
        </span>
      </div>

      {/* Question navigator */}
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          {questions.map((question, index) => {
            const isAnswered = answered.includes(question.id);
            const isCurrent = index === current;

            return (
              <button
                key={question.id}
                onClick={() => onJumpTo(index)}
                className={cn(
                  'flex-shrink-0 w-10 h-10 rounded-lg text-sm font-medium transition-all',
                  'border-2 hover:scale-105',
                  isCurrent && 'ring-2 ring-primary ring-offset-2',
                  isAnswered
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-muted-foreground/20 hover:border-primary',
                )}
                title={`Fråga ${index + 1}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
}
