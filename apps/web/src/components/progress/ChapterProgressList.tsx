import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Lock, BookOpen, Play } from 'lucide-react';

interface ChapterProgress {
  id: string;
  number: number;
  title: string;
  progress: number; // 0-100
  completed: boolean;
  locked: boolean;
  estimatedTime: number; // in minutes
}

interface ChapterProgressListProps {
  chapters: ChapterProgress[];
  className?: string;
}

export function ChapterProgressList({
  chapters,
  className,
}: ChapterProgressListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {chapters.map((chapter) => (
        <ChapterProgressItem key={chapter.id} chapter={chapter} />
      ))}
    </div>
  );
}

function ChapterProgressItem({ chapter }: { chapter: ChapterProgress }) {
  const className = cn(
    'flex items-center gap-4 p-4 rounded-lg border transition-all',
    chapter.locked
      ? 'bg-muted/50 cursor-not-allowed opacity-60'
      : 'hover:bg-accent hover:shadow-sm cursor-pointer',
    chapter.completed && 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
  );

  const content = (
    <>
      {/* Status Icon */}
      <div
        className={cn(
          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
          chapter.completed && 'bg-green-500 text-white',
          !chapter.completed && !chapter.locked && 'bg-primary/10 text-primary',
          chapter.locked && 'bg-muted text-muted-foreground'
        )}
      >
        {chapter.locked ? (
          <Lock className="h-5 w-5" />
        ) : chapter.completed ? (
          <CheckCircle className="h-5 w-5" />
        ) : chapter.progress > 0 ? (
          <Play className="h-5 w-5" />
        ) : (
          <span className="font-bold">{chapter.number}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            Kapitel {chapter.number}
          </span>
          {chapter.completed && (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Slutfört
            </span>
          )}
        </div>
        <h4 className="font-medium truncate">{chapter.title}</h4>

        {!chapter.locked && !chapter.completed && (
          <div className="flex items-center gap-2 mt-2">
            <Progress value={chapter.progress} className="h-1.5 flex-1" />
            <span className="text-xs text-muted-foreground">
              {chapter.progress}%
            </span>
          </div>
        )}
      </div>

      {/* Time estimate */}
      {!chapter.completed && !chapter.locked && (
        <div className="text-xs text-muted-foreground">
          ~{chapter.estimatedTime} min
        </div>
      )}
    </>
  );

  if (chapter.locked) {
    return <div className={className}>{content}</div>;
  }

  return (
    <Link to={`/chapter/${chapter.id}`} className={className}>
      {content}
    </Link>
  );
}
