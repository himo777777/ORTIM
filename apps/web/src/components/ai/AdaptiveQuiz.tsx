import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Zap,
  Target,
  Clock,
  ChevronRight,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Flame,
} from 'lucide-react';
import { useAILearningStore } from '@/stores/aiLearningStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import { ProgressRing } from '@/components/dashboard/ProgressRing';
import confetti from 'canvas-confetti';

interface Question {
  id: string;
  code?: string;
  bloomLevel: number;
  questionText: string;
  options: { id: string; label: string; text: string; isCorrect?: boolean }[];
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

interface AdaptiveQuizProps {
  chapterId: string;
  chapterTitle: string;
  questions: Question[];
  onComplete?: (results: QuizResults) => void;
  onClose?: () => void;
}

interface QuizResults {
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  averageTime: number;
  difficultyProgression: ('easy' | 'medium' | 'hard')[];
  xpEarned: number;
}

export function AdaptiveQuiz({
  chapterId,
  chapterTitle,
  questions: allQuestions,
  onComplete,
  onClose,
}: AdaptiveQuizProps) {
  const {
    getAdaptiveDifficulty,
    getOptimalQuestionOrder,
    recordQuestionAttempt,
    addReviewCard,
    startStudySession,
    endStudySession,
  } = useAILearningStore();

  const { addXp } = useGamificationStore();

  const [sessionId] = useState(() => startStudySession());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentDifficulty, setCurrentDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const [stats, setStats] = useState({
    correct: 0,
    total: 0,
    totalTime: 0,
    difficultyProgression: [] as ('easy' | 'medium' | 'hard')[],
    xpEarned: 0,
  });

  // Initialize questions with optimal order
  useEffect(() => {
    const initialDifficulty = getAdaptiveDifficulty(chapterId);
    setCurrentDifficulty(initialDifficulty);

    // Filter and order questions
    const questionIds = allQuestions.map(q => q.id);
    const orderedIds = getOptimalQuestionOrder(questionIds);
    const orderedQuestions = orderedIds
      .map(id => allQuestions.find(q => q.id === id))
      .filter(Boolean) as Question[];

    setQuestions(orderedQuestions.slice(0, 10)); // Limit to 10 questions
    setQuestionStartTime(Date.now());
  }, [allQuestions, chapterId, getAdaptiveDifficulty, getOptimalQuestionOrder]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleSelectOption = useCallback((optionId: string) => {
    if (showResult) return;

    const responseTime = Date.now() - questionStartTime;
    setSelectedOption(optionId);

    const option = currentQuestion.options.find(o => o.id === optionId);
    const correct = option?.isCorrect ?? false;
    setIsCorrect(correct);
    setShowResult(true);

    // Record the attempt
    recordQuestionAttempt({
      questionId: currentQuestion.id,
      chapterId,
      correct,
      responseTime,
      bloomLevel: currentQuestion.bloomLevel,
    });

    // Calculate XP
    let xpGain = 0;
    if (correct) {
      xpGain = currentDifficulty === 'hard' ? 20 : currentDifficulty === 'medium' ? 15 : 10;
      if (responseTime < 15000) xpGain += 5; // Speed bonus

      setStreak(s => {
        const newStreak = s + 1;
        setMaxStreak(m => Math.max(m, newStreak));
        if (newStreak === 3) xpGain += 10; // Streak bonus
        if (newStreak === 5) xpGain += 20;
        if (newStreak === 10) {
          xpGain += 50;
          confetti({ particleCount: 50, spread: 60 });
        }
        return newStreak;
      });
    } else {
      setStreak(0);
      // Add to review cards for spaced repetition
      addReviewCard({
        questionId: currentQuestion.id,
        chapterId,
      });
    }

    if (xpGain > 0) {
      addXp(xpGain, correct ? 'Korrekt svar' : '');
    }

    // Update stats
    setStats(prev => ({
      correct: prev.correct + (correct ? 1 : 0),
      total: prev.total + 1,
      totalTime: prev.totalTime + responseTime,
      difficultyProgression: [...prev.difficultyProgression, currentDifficulty],
      xpEarned: prev.xpEarned + xpGain,
    }));

    // Adapt difficulty for next question
    if (correct) {
      if (currentDifficulty === 'easy') setCurrentDifficulty('medium');
      else if (currentDifficulty === 'medium' && streak >= 2) setCurrentDifficulty('hard');
    } else {
      if (currentDifficulty === 'hard') setCurrentDifficulty('medium');
      else if (currentDifficulty === 'medium') setCurrentDifficulty('easy');
    }
  }, [
    showResult,
    questionStartTime,
    currentQuestion,
    chapterId,
    currentDifficulty,
    recordQuestionAttempt,
    addReviewCard,
    addXp,
    streak,
  ]);

  const handleNext = useCallback(() => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setShowResult(false);
      setIsCorrect(null);
      setQuestionStartTime(Date.now());
    } else {
      // Quiz complete
      setIsComplete(true);
      endStudySession(sessionId, {
        questionsAttempted: stats.total + 1,
        correctAnswers: stats.correct + (isCorrect ? 1 : 0),
        chaptersStudied: [chapterId],
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      onComplete?.({
        score: Math.round(((stats.correct + (isCorrect ? 1 : 0)) / questions.length) * 100),
        totalQuestions: questions.length,
        correctAnswers: stats.correct + (isCorrect ? 1 : 0),
        averageTime: stats.totalTime / stats.total,
        difficultyProgression: stats.difficultyProgression,
        xpEarned: stats.xpEarned,
      });
    }
  }, [currentIndex, questions.length, stats, isCorrect, sessionId, chapterId, endStudySession, onComplete]);

  if (isComplete) {
    const finalScore = Math.round((stats.correct / stats.total) * 100);

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full"
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="w-24 h-24 mx-auto mb-6"
            >
              <ProgressRing
                progress={finalScore}
                size={96}
                strokeWidth={8}
                className={finalScore >= 70 ? 'text-green-500' : finalScore >= 50 ? 'text-amber-500' : 'text-red-500'}
              >
                <span className="text-2xl font-bold">{finalScore}%</span>
              </ProgressRing>
            </motion.div>

            <h2 className="text-2xl font-bold mb-2">
              {finalScore >= 80 ? 'Utmärkt! 🎉' : finalScore >= 60 ? 'Bra jobbat! 👍' : 'Fortsätt öva! 💪'}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{chapterTitle}</p>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-2xl font-bold text-green-500">{stats.correct}</p>
                <p className="text-sm text-gray-500">Rätta svar</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-2xl font-bold text-primary-500">{stats.xpEarned}</p>
                <p className="text-sm text-gray-500">XP tjänat</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-2xl font-bold text-orange-500">{maxStreak}</p>
                <p className="text-sm text-gray-500">Bästa streak</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
                <p className="text-2xl font-bold text-blue-500">
                  {Math.round(stats.totalTime / stats.total / 1000)}s
                </p>
                <p className="text-sm text-gray-500">Snitt/fråga</p>
              </div>
            </div>

            {/* Difficulty progression visualization */}
            <div className="mb-6">
              <p className="text-sm text-gray-500 mb-2">Svårighetsgrad under quizet:</p>
              <div className="flex gap-1">
                {stats.difficultyProgression.map((diff, i) => (
                  <div
                    key={i}
                    className={`flex-1 h-2 rounded-full ${
                      diff === 'easy' ? 'bg-green-400' : diff === 'medium' ? 'bg-yellow-400' : 'bg-red-400'
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Lätt</span>
                <span>Medel</span>
                <span>Svår</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
            >
              Avsluta
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex flex-col bg-gray-50 dark:bg-gray-900"
    >
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">{chapterTitle}</p>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">
                  {currentIndex + 1} av {questions.length}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  currentDifficulty === 'easy'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : currentDifficulty === 'medium'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}>
                  {currentDifficulty === 'easy' ? 'Lätt' : currentDifficulty === 'medium' ? 'Medel' : 'Svår'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Streak indicator */}
            {streak > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400"
              >
                <Flame className="w-4 h-4" />
                <span className="font-bold">{streak}</span>
              </motion.div>
            )}

            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Avsluta
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 max-w-2xl mx-auto">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
            />
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-3 max-w-2xl mx-auto flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>{stats.correct} rätt</span>
          </div>
          <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
            <XCircle className="w-4 h-4" />
            <span>{stats.total - stats.correct} fel</span>
          </div>
          <div className="flex items-center gap-1 text-primary-600 dark:text-primary-400">
            <Zap className="w-4 h-4" />
            <span>{stats.xpEarned} XP</span>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden"
            >
              {/* Difficulty indicator */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Bloom nivå {currentQuestion.bloomLevel}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {currentDifficulty === 'hard' ? (
                    <TrendingUp className="w-4 h-4 text-red-500" />
                  ) : currentDifficulty === 'easy' ? (
                    <TrendingDown className="w-4 h-4 text-green-500" />
                  ) : (
                    <Minus className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-xs text-gray-400">Adaptiv</span>
                </div>
              </div>

              {/* Question text */}
              <div className="p-6">
                <p className="text-lg font-medium leading-relaxed">
                  {currentQuestion.questionText}
                </p>
              </div>

              {/* Options */}
              <div className="p-6 pt-0 space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const showCorrect = showResult && option.isCorrect;
                  const showWrong = showResult && isSelected && !option.isCorrect;

                  return (
                    <motion.button
                      key={option.id}
                      whileHover={!showResult ? { scale: 1.01 } : {}}
                      whileTap={!showResult ? { scale: 0.99 } : {}}
                      onClick={() => handleSelectOption(option.id)}
                      disabled={showResult}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        showCorrect
                          ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500'
                          : showWrong
                          ? 'bg-red-100 dark:bg-red-900/30 border-2 border-red-500'
                          : isSelected
                          ? 'bg-primary-100 dark:bg-primary-900/30 border-2 border-primary-500'
                          : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-medium text-sm ${
                          showCorrect
                            ? 'bg-green-500 text-white'
                            : showWrong
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-600'
                        }`}>
                          {showCorrect ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : showWrong ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            option.label
                          )}
                        </span>
                        <span className="flex-1">{option.text}</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showResult && currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/50">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Förklaring:</strong> {currentQuestion.explanation}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Next button */}
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <button
                  onClick={handleNext}
                  className="w-full py-4 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                >
                  {currentIndex < questions.length - 1 ? (
                    <>
                      Nästa fråga <ChevronRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      Se resultat <Trophy className="w-5 h-5" />
                    </>
                  )}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
