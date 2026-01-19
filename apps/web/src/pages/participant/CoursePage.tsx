import { Link, useSearchParams } from 'react-router-dom';
import { COURSE_STRUCTURE } from '@ortac/shared';
import { useCourseStructure, useOverallProgress, useCourses, useCourseProgress } from '@/hooks/useCourse';
import { useCheckAndGenerateCertificate } from '@/hooks/useCertificate';
import { useAuthStore } from '@/stores/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Lock, ChevronRight, BookOpen, Play, GraduationCap, Award, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Component for displaying an instructor course with progress
interface InstructorCourse {
  id: string;
  code: string;
  name: string;
  fullName: string;
  parts: Array<{
    id: string;
    partNumber: number;
    title: string;
    chapters: Array<{
      id: string;
      chapterNumber: number;
      title: string;
      slug: string;
      estimatedMinutes: number;
    }>;
  }>;
}

function InstructorCourseCard({ course }: { course: InstructorCourse }) {
  const { data: courseProgress } = useCourseProgress(course.code);
  const checkCertificate = useCheckAndGenerateCertificate();

  // Create a map for quick lookup
  const progressMap = new Map(
    courseProgress?.chapters?.map(c => [c.chapterId, c]) || []
  );

  const totalChapters = courseProgress?.totalChapters || course.parts.reduce((sum, p) => sum + p.chapters.length, 0);
  const completedChapters = courseProgress?.completedChapters || 0;
  const overallProgress = courseProgress?.overallProgress || 0;

  // Check if all chapters are completed (eligible for certificate)
  const quizzesPassed = courseProgress?.chapters?.filter(c => c.quizPassed).length || 0;
  const allCompleted = completedChapters >= totalChapters && quizzesPassed >= totalChapters;

  const handleCheckCertificate = () => {
    checkCertificate.mutate(course.code);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{course.name}</h3>
          <p className="text-sm text-muted-foreground">{course.fullName}</p>
        </div>
        <Badge variant="outline" className="border-amber-500 text-amber-700 dark:text-amber-400">
          {course.code}
        </Badge>
      </div>

      {/* Progress summary */}
      <div className="flex items-center gap-4 p-3 bg-white dark:bg-card rounded-lg border">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Ditt framsteg</span>
            <span className="text-sm text-amber-600 dark:text-amber-400 font-semibold">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {completedChapters} av {totalChapters} kapitel slutförda
            {quizzesPassed > 0 && ` | ${quizzesPassed} av ${totalChapters} quiz godkända`}
          </p>
        </div>
      </div>

      {/* Certificate Status */}
      {checkCertificate.data?.certificate ? (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-400">Instruktörscertifikat</p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Nr: {checkCertificate.data.certificate.certificateNumber}
                </p>
              </div>
            </div>
            <Link to={`/certificates/${checkCertificate.data.certificate.id}`}>
              <Button size="sm" variant="outline" className="border-green-500 text-green-700 hover:bg-green-100">
                Visa certifikat
              </Button>
            </Link>
          </div>
        </div>
      ) : allCompleted ? (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-medium text-amber-700 dark:text-amber-400">Klar för certifikat!</p>
                <p className="text-xs text-amber-600 dark:text-amber-500">
                  Du har slutfört alla kapitel och quiz
                </p>
              </div>
            </div>
            <Button
              size="sm"
              onClick={handleCheckCertificate}
              disabled={checkCertificate.isPending}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              {checkCertificate.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  Genererar...
                </>
              ) : (
                'Hämta certifikat'
              )}
            </Button>
          </div>
          {checkCertificate.isError && (
            <p className="text-xs text-red-600 mt-2">
              Kunde inte generera certifikat. Försök igen.
            </p>
          )}
        </div>
      ) : null}

      {/* Instructor Course Parts */}
      {course.parts.map((part) => (
        <div key={part.id} className="bg-white dark:bg-card rounded-lg border overflow-hidden">
          <div className="p-4 bg-amber-100/50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <h4 className="font-medium">
              Del {part.partNumber}: {part.title}
            </h4>
          </div>
          <div className="divide-y">
            {part.chapters.map((chapter) => {
              const chapterProgress = progressMap.get(chapter.id);
              const isCompleted = chapterProgress?.completed || false;
              const readProgress = chapterProgress?.readProgress || 0;
              const quizPassed = chapterProgress?.quizPassed || false;

              return (
                <Link
                  key={chapter.id}
                  to={`/chapter/${chapter.slug}`}
                  className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center shrink-0",
                    isCompleted ? "bg-green-100 dark:bg-green-900/30" : "bg-amber-100 dark:bg-amber-900/30"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    ) : (
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        {chapter.chapterNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      Kapitel {chapter.chapterNumber}: {chapter.title}
                    </p>
                    {isCompleted ? (
                      <p className="text-sm text-green-600 dark:text-green-400">Slutfört</p>
                    ) : readProgress > 0 ? (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500" style={{ width: `${readProgress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{Math.round(readProgress)}% läst</span>
                        {quizPassed && <Badge variant="outline" className="text-xs">Quiz ✓</Badge>}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        ca {chapter.estimatedMinutes} min
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CoursePage() {
  const [searchParams] = useSearchParams();
  const selectedPart = searchParams.get('part');
  const { user } = useAuthStore();
  const isInstructor = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';

  const { isLoading: structureLoading } = useCourseStructure('ortac-main');
  const { data: progress, isLoading: progressLoading } = useOverallProgress();
  const { data: allCourses } = useCourses();

  // Filter instructor-only courses
  const instructorCourses = allCourses?.filter(course => course.instructorOnly) || [];

  const isLoading = structureLoading || progressLoading;

  // Get chapter progress from API or use defaults
  // TEMP: Disabled locking for development/testing
  const getChapterStatus = (chapterNumber: number) => {
    if (!progress?.chapterProgress) {
      // Never lock chapters - allow access to all
      return { completed: false, current: chapterNumber === 1, locked: false };
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

    const isCurrent = chapterNumber === currentChapter;

    // TEMP: Never lock - allow access to all chapters during development
    return { completed: false, current: isCurrent, locked: false };
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
          ORTAC - Orthopaedic Resuscitation and Trauma Acute Care
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
                      to={status.locked ? '#' : `/chapter/${chapter.slug}`}
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

      {/* Instructor Courses Section */}
      {isInstructor && instructorCourses.length > 0 && (
        <div className="mt-8 border-t pt-8">
          <div className="flex items-center gap-2 mb-6">
            <GraduationCap className="h-6 w-6 text-amber-500" />
            <h2 className="text-xl font-semibold">Instruktörskurser</h2>
            <Badge className="bg-amber-500 hover:bg-amber-600 text-white">
              Endast för instruktörer
            </Badge>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6 space-y-6">
            {instructorCourses.map((course) => (
              <InstructorCourseCard key={course.id} course={course as InstructorCourse} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
