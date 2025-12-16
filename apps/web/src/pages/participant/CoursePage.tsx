import { Link, useSearchParams } from 'react-router-dom';
import { COURSE_STRUCTURE } from '@b-ortim/shared';
import { useCourseStructure, useOverallProgress } from '@/hooks/useCourse';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Lock, ChevronRight, BookOpen, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CoursePage() {
  const [searchParams] = useSearchParams();
  const selectedPart = searchParams.get('part');

  const { isLoading: structureLoading } = useCourseStructure('b-ortim-main');
  const { data: progress, isLoading: progressLoading } = useOverallProgress();

  const isLoading = structureLoading || progressLoading;

  // Get chapter progress from API or use defaults
  const getChapterStatus = (chapterNumber: number) => {
    if (!progress?.chapterProgress) {
      return { completed: false, current: false, locked: chapterNumber > 1 };
    }

    const chapterData = progress.chapterProgress.find(
      (c: { chapterNumber: number }) => c.chapterNumber === chapterNumber
    );

    if (chapterData?.completed) {
      return { completed: true, current: false, locked: false };
    }

    // Find the first incomplete chapter - that's the current one
    const currentChapter = progress.chapterProgress.find(
      (c: { completed: boolean }) => !c.completed
    )?.chapterNumber || 1;

    const isLocked = chapterNumber > currentChapter;
    const isCurrent = chapterNumber === currentChapter;

    return { completed: false, current: isCurrent, locked: isLocked };
  };

  // Calculate overall and part progress
  const overallProgress = progress?.chaptersCompleted
    ? Math.round((progress.chaptersCompleted / progress.totalChapters) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </div>
        <Skeleton className="h-24 rounded-xl" />
        <div className="space-y-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-primary" />
          Kursinnehåll
        </h1>
        <p className="text-muted-foreground mt-1">
          B-ORTIM - Basic Orthopaedic Resuscitation and Trauma Initial Management
        </p>
      </div>

      {/* Overall Progress Card */}
      <div className="bg-card border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Ditt framsteg</h2>
            <p className="text-sm text-muted-foreground">
              {progress?.chaptersCompleted || 0} av {progress?.totalChapters || 17} kapitel slutförda
            </p>
          </div>
          <span className="text-3xl font-bold text-primary">{overallProgress}%</span>
        </div>
        <Progress value={overallProgress} className="h-3" />
      </div>

      {/* Course Parts */}
      <div className="space-y-6">
        {COURSE_STRUCTURE.parts.map((part) => {
          // Calculate part progress
          const partChapterNumbers = part.chapters.map((c) => c.number);
          const completedInPart = partChapterNumbers.filter(
            (num) => getChapterStatus(num).completed
          ).length;
          const partProgress = Math.round((completedInPart / part.chapters.length) * 100);

          return (
            <div
              key={part.number}
              className={cn(
                'bg-card rounded-xl border overflow-hidden',
                selectedPart === `part-${part.number}` && 'ring-2 ring-primary'
              )}
              id={`part-${part.number}`}
            >
              {/* Part Header */}
              <div className="p-6 bg-muted/50 border-b">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">
                    Del {part.number} – {part.title}
                  </h2>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-muted-foreground">
                      {completedInPart}/{part.chapters.length}
                    </span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full transition-all',
                          partProgress === 100 ? 'bg-green-500' : 'bg-primary'
                        )}
                        style={{ width: `${partProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Chapters List */}
              <div className="divide-y">
                {part.chapters.map((chapter) => {
                  const status = getChapterStatus(chapter.number);
                  const chapterProgress = progress?.chapterProgress?.find(
                    (c: { chapterNumber: number }) => c.chapterNumber === chapter.number
                  );

                  return (
                    <Link
                      key={chapter.number}
                      to={status.locked ? '#' : `/chapters/${chapter.slug}`}
                      className={cn(
                        'flex items-center gap-4 p-4 transition-colors',
                        status.locked
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-muted/50',
                        status.current && 'bg-primary/5'
                      )}
                      onClick={(e) => {
                        if (status.locked) {
                          e.preventDefault();
                        }
                      }}
                    >
                      {/* Status Icon */}
                      <div
                        className={cn(
                          'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                          status.completed && 'bg-green-100 dark:bg-green-900/30',
                          status.current && 'bg-primary text-primary-foreground',
                          status.locked && 'bg-muted'
                        )}
                      >
                        {status.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : status.current ? (
                          <Play className="h-5 w-5" />
                        ) : status.locked ? (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <span className="text-sm font-medium">{chapter.number}</span>
                        )}
                      </div>

                      {/* Chapter Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          Kapitel {chapter.number}: {chapter.title}
                        </p>
                        {status.completed && (
                          <p className="text-sm text-green-600 dark:text-green-400">Slutfört</p>
                        )}
                        {status.current && chapterProgress && chapterProgress.scrollPosition && chapterProgress.scrollPosition > 0 && (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary"
                                style={{ width: `${chapterProgress.scrollPosition}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {chapterProgress.scrollPosition}% läst
                            </span>
                          </div>
                        )}
                        {status.current && (!chapterProgress || !chapterProgress.scrollPosition) && (
                          <p className="text-sm text-primary">Börja läsa</p>
                        )}
                      </div>

                      {/* Arrow */}
                      {!status.locked && (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
