import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuestionCard } from './QuestionCard';
import { QuizProgress } from './QuizProgress';
import { QuizResults } from './QuizResults';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/db';
import { ChevronLeft, ChevronRight, Clock, AlertTriangle } from 'lucide-react';

interface QuizQuestion {
  id: string;
  code: string;
  bloomLevel: string;
  questionText: string;
  options: {
    id: string;
    label: string;
    text: string;
    isCorrect?: boolean;
  }[];
  explanation?: string;
}

interface QuizContainerProps {
  quizId: string;
  questions: QuizQuestion[];
  title: string;
  mode: 'practice' | 'exam';
  timeLimit?: number; // in minutes
  passingScore?: number; // percentage
  onComplete: (result: QuizResult) => void;
}

interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  passed: boolean;
  timeSpent: number;
  answers: { questionId: string; selectedOption: string; isCorrect: boolean }[];
}

export function QuizContainer({
  quizId,
  questions,
  title,
  mode,
  timeLimit,
  passingScore = 70,
  onComplete,
}: QuizContainerProps) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [showResults, setShowResults] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(timeLimit ? timeLimit * 60 : 0);
  const [startTime] = useState(Date.now());
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  // Timer for exam mode
  useEffect(() => {
    if (mode !== 'exam' || !timeLimit || showResults) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, timeLimit, showResults]);

  const currentQuestion = questions[currentIndex];

  const handleSelect = (optionLabel: string) => {
    const newAnswers = new Map(answers);
    newAnswers.set(currentQuestion.id, optionLabel);
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleJumpTo = (index: number) => {
    setCurrentIndex(index);
  };

  const calculateResult = useCallback((): QuizResult => {
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    let correctCount = 0;
    const answerDetails: QuizResult['answers'] = [];

    questions.forEach((question) => {
      const selectedOption = answers.get(question.id);
      const correctOption = question.options.find((o) => o.isCorrect);
      const isCorrect = selectedOption === correctOption?.label;

      if (isCorrect) correctCount++;

      answerDetails.push({
        questionId: question.id,
        selectedOption: selectedOption || '',
        isCorrect,
      });
    });

    const score = Math.round((correctCount / questions.length) * 100);

    return {
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      score,
      passed: score >= passingScore,
      timeSpent,
      answers: answerDetails,
    };
  }, [answers, questions, passingScore, startTime]);

  const handleSubmit = useCallback(async () => {
    const quizResult = calculateResult();
    setResult(quizResult);
    setShowResults(true);

    // Save to IndexedDB
    try {
      await db.saveQuizAttempt({
        id: `${quizId}-${Date.now()}`,
        type: mode === 'exam' ? 'exam' : 'chapter',
        chapterId: null,
        score: quizResult.score,
        totalQuestions: quizResult.totalQuestions,
        correctAnswers: quizResult.correctAnswers,
        passed: quizResult.passed,
        answers: quizResult.answers.map(a => ({
          ...a,
          timeSpent: 0,
        })),
        startedAt: startTime,
        completedAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to save quiz attempt:', error);
    }

    onComplete(quizResult);
  }, [calculateResult, quizId, startTime, onComplete]);

  const handleExit = () => {
    if (answers.size > 0 && !showResults) {
      setShowExitDialog(true);
    } else {
      navigate(-1);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const answeredCount = answers.size;
  const unansweredCount = questions.length - answeredCount;

  if (showResults && result) {
    return (
      <QuizResults
        result={result}
        questions={questions}
        answers={answers}
        passingScore={passingScore}
        onRetry={() => {
          setAnswers(new Map());
          setCurrentIndex(0);
          setShowResults(false);
          setResult(null);
        }}
        onExit={() => navigate(-1)}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">
            {mode === 'exam' ? 'Examination' : 'Övningsläge'}
          </p>
        </div>

        {mode === 'exam' && timeLimit && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
            timeRemaining < 300 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' : 'bg-muted'
          }`}>
            <Clock className="h-5 w-5" />
            <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>

      {/* Progress */}
      <QuizProgress
        total={questions.length}
        current={currentIndex}
        answered={Array.from(answers.keys())}
        questions={questions}
        onJumpTo={handleJumpTo}
      />

      {/* Question Card */}
      <div className="mt-6">
        <QuestionCard
          questionCode={currentQuestion.code}
          bloomLevel={currentQuestion.bloomLevel}
          questionText={currentQuestion.questionText}
          options={currentQuestion.options}
          selectedOption={answers.get(currentQuestion.id)}
          showFeedback={mode === 'practice'}
          explanation={currentQuestion.explanation}
          onSelect={handleSelect}
        />
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Föregående
        </Button>

        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleExit}>
            Avbryt
          </Button>

          {currentIndex === questions.length - 1 ? (
            <Button onClick={() => {
              if (unansweredCount > 0 && mode === 'exam') {
                setShowSubmitDialog(true);
              } else {
                handleSubmit();
              }
            }}>
              Lämna in
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Nästa
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="mt-6 flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <span>Besvarade: {answeredCount} av {questions.length}</span>
        {unansweredCount > 0 && (
          <span className="text-yellow-600 dark:text-yellow-400">
            Obesvarade: {unansweredCount}
          </span>
        )}
      </div>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avbryt quiz?</AlertDialogTitle>
            <AlertDialogDescription>
              Du har obesvarade frågor. Om du lämnar nu kommer dina framsteg att gå förlorade.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Fortsätt quiz</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(-1)}>
              Avbryt quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Obesvarade frågor
            </AlertDialogTitle>
            <AlertDialogDescription>
              Du har {unansweredCount} obesvarade {unansweredCount === 1 ? 'fråga' : 'frågor'}.
              Vill du lämna in ändå?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Gå tillbaka</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              Lämna in ändå
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
