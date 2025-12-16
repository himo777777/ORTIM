import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Target, CheckCircle2 } from 'lucide-react';

interface LearningObjective {
  id: string;
  code: string;
  description: string;
}

interface LearningObjectivesProps {
  objectives: LearningObjective[];
  completedIds: Set<string>;
  onToggle: (id: string) => void;
  onClose: () => void;
}

export function LearningObjectives({
  objectives,
  completedIds,
  onToggle,
  onClose,
}: LearningObjectivesProps) {
  const completedCount = completedIds.size;
  const totalCount = objectives.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-card border rounded-xl p-6 mb-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Lärandemål</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
        <div className="flex-1">
          <div className="h-2 bg-background rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                progress === 100 ? 'bg-green-500' : 'bg-primary'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        <span className="text-sm font-medium">
          {completedCount}/{totalCount}
        </span>
        {progress === 100 && (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        )}
      </div>

      {/* Objectives List */}
      <div className="space-y-3">
        {objectives.map((objective) => {
          const isCompleted = completedIds.has(objective.id);

          return (
            <label
              key={objective.id}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                isCompleted
                  ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                  : 'hover:bg-accent'
              )}
            >
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => onToggle(objective.id)}
                className="mt-0.5"
              />
              <div className="flex-1">
                <span className="text-xs font-mono text-muted-foreground">
                  {objective.code}
                </span>
                <p
                  className={cn(
                    'text-sm',
                    isCompleted && 'text-muted-foreground line-through'
                  )}
                >
                  {objective.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      {progress === 100 && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300 text-center">
            🎉 Alla lärandemål uppfyllda!
          </p>
        </div>
      )}
    </div>
  );
}
