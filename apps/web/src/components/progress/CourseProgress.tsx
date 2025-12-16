import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle, Lock, ChevronRight } from 'lucide-react';

interface Phase {
  id: string;
  name: string;
  chapters: number[];
  completed: boolean;
  current: boolean;
  progress: number;
}

interface CourseProgressProps {
  phases: Phase[];
  overallProgress: number;
  className?: string;
}

export function CourseProgress({
  phases,
  overallProgress,
  className,
}: CourseProgressProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Progress */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Kursframsteg</h3>
          <span className="text-2xl font-bold">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-3" />
        <p className="text-sm text-muted-foreground mt-2">
          {overallProgress < 100
            ? `${100 - overallProgress}% kvar till slutförande`
            : 'Kursen är slutförd!'}
        </p>
      </div>

      {/* Phase Progress */}
      <div className="space-y-4">
        {phases.map((phase, index) => (
          <div
            key={phase.id}
            className={cn(
              'relative pl-8 pb-6',
              index < phases.length - 1 && 'border-l-2 border-muted ml-4'
            )}
          >
            {/* Phase indicator */}
            <div
              className={cn(
                'absolute -left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center',
                phase.completed && 'bg-green-500 text-white',
                phase.current && !phase.completed && 'bg-primary text-primary-foreground',
                !phase.completed && !phase.current && 'bg-muted text-muted-foreground'
              )}
            >
              {phase.completed ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>

            {/* Phase content */}
            <div
              className={cn(
                'bg-card border rounded-lg p-4 ml-4',
                phase.current && 'ring-2 ring-primary'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{phase.name}</h4>
                <span className="text-sm text-muted-foreground">
                  Kapitel {phase.chapters[0]}-{phase.chapters[phase.chapters.length - 1]}
                </span>
              </div>

              {phase.current || phase.completed ? (
                <>
                  <Progress value={phase.progress} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {phase.completed
                      ? 'Fas slutförd'
                      : `${phase.progress}% genomfört`}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Slutför föregående fas först
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
