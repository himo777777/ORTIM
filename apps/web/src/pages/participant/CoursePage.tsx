import { Link } from 'react-router-dom';
import { COURSE_STRUCTURE } from '@b-ortim/shared';
import { CheckCircle, Clock, Lock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CoursePage() {
  // Mock progress data
  const completedChapters = [1, 2, 3, 4, 5];
  const currentChapter = 6;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kursinnehåll</h1>
        <p className="text-muted-foreground mt-1">
          B-ORTIM - Basic Orthopaedic Resuscitation and Trauma Initial Management
        </p>
      </div>

      <div className="space-y-6">
        {COURSE_STRUCTURE.parts.map((part) => (
          <div key={part.number} className="bg-card rounded-xl border overflow-hidden">
            <div className="p-6 bg-muted/50 border-b">
              <h2 className="text-lg font-semibold">
                Del {part.number} – {part.title}
              </h2>
            </div>
            <div className="divide-y">
              {part.chapters.map((chapter) => {
                const isCompleted = completedChapters.includes(chapter.number);
                const isCurrent = chapter.number === currentChapter;
                const isLocked = chapter.number > currentChapter;

                return (
                  <Link
                    key={chapter.number}
                    to={isLocked ? '#' : `/chapter/${chapter.slug}`}
                    className={cn(
                      'flex items-center gap-4 p-4 transition-colors',
                      isLocked
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-muted/50'
                    )}
                  >
                    <div
                      className={cn(
                        'h-10 w-10 rounded-full flex items-center justify-center shrink-0',
                        isCompleted && 'bg-green-100 dark:bg-green-900/30',
                        isCurrent && 'bg-primary/10',
                        isLocked && 'bg-muted'
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      ) : isCurrent ? (
                        <Clock className="h-5 w-5 text-primary" />
                      ) : isLocked ? (
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <span className="text-sm font-medium">{chapter.number}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        Kapitel {chapter.number}: {chapter.title}
                      </p>
                      {isCompleted && (
                        <p className="text-sm text-green-600 dark:text-green-400">Slutfört</p>
                      )}
                      {isCurrent && (
                        <p className="text-sm text-primary">Pågående</p>
                      )}
                    </div>
                    {!isLocked && <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
