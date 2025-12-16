import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuizQuestions, useSubmitQuiz } from '@/hooks/useQuiz';
import { QuizContainer } from '@/components/quiz';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle, BookOpen, Brain } from 'lucide-react';

export default function QuizPage() {
  const { chapterId } = useParams<{ chapterId: string }>();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'practice' | 'exam' | null>(null);

  const { data: questions, isLoading, error } = useQuizQuestions(chapterId, mode || undefined);
  const submitQuiz = useSubmitQuiz();

  const handleComplete = (result: {
    totalQuestions: number;
    correctAnswers: number;
    score: number;
    passed: boolean;
    timeSpent: number;
    answers: { questionId: string; selectedOption: string; isCorrect: boolean }[];
  }) => {
    if (chapterId && mode) {
      submitQuiz.mutate({
        chapterId,
        answers: result.answers.map((a) => ({
          questionId: a.questionId,
          selectedOption: a.selectedOption,
        })),
        mode,
        timeSpent: result.timeSpent,
      });
    }
  };

  // Mode selection screen
  if (!mode) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>

        <h1 className="text-3xl font-bold mb-2">Kunskapstest</h1>
        <p className="text-muted-foreground mb-8">
          Välj hur du vill genomföra testet.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => setMode('practice')}
            className="p-6 bg-card border rounded-xl text-left hover:border-primary hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Övningsläge</h3>
            <p className="text-sm text-muted-foreground">
              Se direkt om du svarar rätt eller fel. Bra för inlärning.
            </p>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              <li>• Omedelbar feedback</li>
              <li>• Förklaringar visas</li>
              <li>• Ingen tidsbegränsning</li>
            </ul>
          </button>

          <button
            onClick={() => setMode('exam')}
            className="p-6 bg-card border rounded-xl text-left hover:border-primary hover:shadow-lg transition-all group"
          >
            <div className="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Brain className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Testläge</h3>
            <p className="text-sm text-muted-foreground">
              Simulera en riktig examination. Se resultat i slutet.
            </p>
            <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
              <li>• Resultat efter genomförande</li>
              <li>• Tidsbegränsning (valfritt)</li>
              <li>• 70% för godkänt</li>
            </ul>
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
        <div className="mt-8">
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !questions || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-6">
          <AlertTriangle className="h-8 w-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Inga frågor tillgängliga</h1>
        <p className="text-muted-foreground mb-6">
          Det finns inga quizfrågor för detta kapitel ännu.
        </p>
        <Button onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Gå tillbaka
        </Button>
      </div>
    );
  }

  return (
    <QuizContainer
      quizId={chapterId || 'general'}
      questions={questions}
      title={`Kunskapstest${chapterId ? '' : ' - Alla kapitel'}`}
      mode={mode}
      passingScore={70}
      onComplete={handleComplete}
    />
  );
}
