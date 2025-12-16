import { useAuthStore } from '@/stores/authStore';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useOverallProgress, useCourseStructure } from '@/hooks/useCourse';
import { useDueReviewCards } from '@/hooks/useReview';
import { useCertificates } from '@/hooks/useCertificate';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  Brain,
  Timer,
  Award,
  ArrowRight,
  CheckCircle,
  Clock,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: progress, isLoading: progressLoading } = useOverallProgress();
  const { data: dueCards, isLoading: dueCardsLoading } = useDueReviewCards();
  const { data: certificates } = useCertificates();
  const { data: courseStructure } = useCourseStructure('b-ortim-main');

  const completedChapters = progress?.chaptersCompleted ?? 0;
  const totalChapters = progress?.totalChapters ?? 17;
  const progressPercent = Math.round((completedChapters / totalChapters) * 100);
  const dueReviewCount = dueCards?.length ?? 0;
  const examReady = progressPercent >= 100;
  const certificateCount = certificates?.length ?? 0;

  const currentChapter = progress?.currentChapter;
  const lastCompletedChapter = progress?.lastCompletedChapter;

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Välkommen, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Fortsätt din utbildning inom ortopedisk traumavård.
          </p>
        </div>
        {examReady && (
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              Redo för examination!
            </span>
          </div>
        )}
      </div>

      {/* Progress overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Chapters progress */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Kapitel</p>
              {progressLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">
                  {completedChapters}/{totalChapters}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{progressPercent}% avklarat</p>
          </div>
        </div>

        {/* Due reviews */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <Timer className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Att repetera</p>
              {dueCardsLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <p className="text-2xl font-bold">{dueReviewCount}</p>
              )}
            </div>
          </div>
          <Link to="/review" className="block mt-4">
            <Button
              variant={dueReviewCount > 0 ? 'default' : 'outline'}
              size="sm"
              className="w-full"
              disabled={dueReviewCount === 0}
            >
              {dueReviewCount > 0 ? 'Starta repetition' : 'Inget att repetera'}
              {dueReviewCount > 0 && <ArrowRight className="ml-2 h-4 w-4" />}
            </Button>
          </Link>
        </div>

        {/* Exam status */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Slutexamen</p>
              <p className="text-2xl font-bold">
                {examReady ? 'Redo' : 'Ej redo'}
              </p>
            </div>
          </div>
          <Link to="/exam" className="block mt-4">
            <Button
              variant={examReady ? 'default' : 'outline'}
              size="sm"
              className="w-full"
              disabled={!examReady}
            >
              {examReady ? 'Ta examen' : 'Slutför kursen först'}
            </Button>
          </Link>
        </div>

        {/* Certificates */}
        <div className="bg-card rounded-xl border p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Award className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Certifikat</p>
              <p className="text-2xl font-bold">{certificateCount}</p>
            </div>
          </div>
          <Link to="/certificates" className="block mt-4">
            <Button variant="outline" size="sm" className="w-full">
              Visa certifikat
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Continue learning */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Fortsätt läsa</h2>
          <div className="space-y-3">
            {lastCompletedChapter && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium">{lastCompletedChapter.title}</p>
                  <p className="text-sm text-muted-foreground">Slutfört</p>
                </div>
              </div>
            )}
            {currentChapter ? (
              <Link
                to={`/chapters/${currentChapter.id}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
              >
                <Clock className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">{currentChapter.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Pågående - {currentChapter.progress}% läst
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary" />
              </Link>
            ) : completedChapters < totalChapters ? (
              <Link
                to="/course"
                className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 hover:bg-primary/10 transition-colors"
              >
                <BookOpen className="h-5 w-5 text-primary" />
                <div className="flex-1">
                  <p className="font-medium">Börja nästa kapitel</p>
                  <p className="text-sm text-muted-foreground">
                    Kapitel {completedChapters + 1} väntar
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-primary" />
              </Link>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium text-green-700 dark:text-green-300">
                    Alla kapitel slutförda!
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Du är redo för examen
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Study tips */}
        <div className="bg-card rounded-xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Studietips</h2>
          <div className="space-y-4">
            {dueReviewCount > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                <Brain className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-700 dark:text-orange-300">
                    Dags att repetera!
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    Du har {dueReviewCount} frågor som behöver repeteras för bästa inlärning.
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p>Läs igenom kapitlet noggrant och markera lärandemålen.</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">2</span>
              </div>
              <p>Gör kunskapstestet efter varje kapitel.</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-muted-foreground">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-primary">3</span>
              </div>
              <p>Använd repetitionsfunktionen dagligen för långsiktig retention.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Course parts overview */}
      <div className="bg-card rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Kursöversikt</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {courseStructure?.parts?.map((part, index) => {
            const partProgress = part.completedChapters / part.totalChapters * 100;

            return (
              <Link
                key={part.id}
                to={`/course?part=${part.id}`}
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <h3 className="font-medium text-sm text-muted-foreground mb-2">
                  Del {index + 1}
                </h3>
                <p className="font-semibold">{part.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {part.totalChapters} kapitel
                </p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      partProgress === 100 ? 'bg-green-500' : 'bg-primary'
                    }`}
                    style={{ width: `${partProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {part.completedChapters}/{part.totalChapters} slutförda
                </p>
              </Link>
            );
          }) ?? (
            // Fallback static data
            <>
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Del I</h3>
                <p className="font-semibold">Principer och systematik</p>
                <p className="text-sm text-muted-foreground mt-1">3 kapitel</p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-green-500" style={{ width: '100%' }} />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Del II</h3>
                <p className="font-semibold">Specifika tillstånd</p>
                <p className="text-sm text-muted-foreground mt-1">9 kapitel</p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: '33%' }} />
                </div>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <h3 className="font-medium text-sm text-muted-foreground mb-2">Del III</h3>
                <p className="font-semibold">Praktisk tillämpning</p>
                <p className="text-sm text-muted-foreground mt-1">5 kapitel</p>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-muted-foreground/20" style={{ width: '0%' }} />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
