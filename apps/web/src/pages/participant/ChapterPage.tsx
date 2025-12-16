import { useParams, useNavigate } from 'react-router-dom';
import { useChapter, useUpdateProgress } from '@/hooks/useCourse';
import { ChapterReader } from '@/components/chapter';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

export default function ChapterPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const { data: chapter, isLoading, error } = useChapter(chapterId!);
  const updateProgress = useUpdateProgress();

  const handleComplete = () => {
    if (!chapterId) return;

    updateProgress.mutate(
      { chapterId, completed: true },
      {
        onSuccess: () => {
          // Navigate to quiz for this chapter
          navigate(`/quiz/${chapterId}`);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-4 mt-8">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Kunde inte ladda kapitlet</h1>
        <p className="text-muted-foreground mb-6">
          {error?.message || 'Något gick fel. Försök igen senare.'}
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Gå tillbaka
        </Button>
      </div>
    );
  }

  return (
    <ChapterReader
      chapterId={chapter.id}
      chapterNumber={chapter.chapterNumber}
      title={chapter.title}
      content={chapter.content}
      learningObjectives={chapter.learningObjectives || []}
      estimatedReadTime={chapter.estimatedMinutes || 15}
      previousChapter={chapter.previousChapter}
      nextChapter={chapter.nextChapter}
      onComplete={handleComplete}
    />
  );
}
