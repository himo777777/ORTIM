import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  ThumbsUp,
  ThumbsDown,
  Meh,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { useAILearningStore, ReviewCard } from '@/stores/aiLearningStore';
import { useGamificationStore } from '@/stores/gamificationStore';
import confetti from 'canvas-confetti';

interface Question {
  id: string;
  questionText: string;
  options: { id: string; label: string; text: string; isCorrect?: boolean }[];
  explanation?: string;
}

interface SpacedRepetitionReviewProps {
  questions: Question[];
  onComplete?: (stats: { reviewed: number; correct: number; avgQuality: number }) => void;
  onClose?: () => void;
}

type QualityRating = 0 | 1 | 2 | 3 | 4 | 5;

const QUALITY_LABELS: Record<QualityRating, { label: string; icon: React.ReactNode; color: string }> = {
  0: { label: 'Helt fel', icon: <XCircle className="w-5 h-5" />, color: 'bg-red-500' },
  1: { label: 'Fel', icon: <ThumbsDown className="w-5 h-5" />, color: 'bg-red-400' },
  2: { label: 'Nästan', icon: <Meh className="w-5 h-5" />, color: 'bg-orange-500' },
  3: { label: 'Svårt men rätt', icon: <Meh className="w-5 h-5" />, color: 'bg-yellow-500' },
  4: { label: 'Rätt', icon: <ThumbsUp className="w-5 h-5" />, color: 'bg-green-400' },
  5: { label: 'Lätt!', icon: <Zap className="w-5 h-5" />, color: 'bg-green-500' },
};

export function SpacedRepetitionReview({
  questions,
  onComplete,
  onClose,
}: SpacedRepetitionReviewProps) {
  const { reviewCards, updateReviewCard, addReviewCard } = useAILearningStore();
  const { addXp } = useGamificationStore();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [stats, setStats] = useState({ reviewed: 0, correct: 0, totalQuality: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [startTime] = useState(Date.now());

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Find or create review card for current question
  const getReviewCard = useCallback((questionId: string): ReviewCard | undefined => {
    return reviewCards.find(c => c.questionId === questionId);
  }, [reviewCards]);

  const handleSelectOption = (optionId: string) => {
    if (showAnswer) return;

    setSelectedOption(optionId);
    const option = currentQuestion.options.find(o => o.id === optionId);
    const correct = option?.isCorrect ?? false;
    setIsCorrect(correct);
    setShowAnswer(true);

    // Record the attempt
    if (correct) {
      addXp(10, 'Korrekt svar på repetitionskort');
    }
  };

  const handleRateQuality = (quality: QualityRating) => {
    const card = getReviewCard(currentQuestion.id);

    if (card) {
      updateReviewCard(card.id, quality);
    } else {
      // Create new review card
      addReviewCard({
        questionId: currentQuestion.id,
        chapterId: 'default',
      });
    }

    // Update stats
    const newStats = {
      reviewed: stats.reviewed + 1,
      correct: stats.correct + (quality >= 3 ? 1 : 0),
      totalQuality: stats.totalQuality + quality,
    };
    setStats(newStats);

    // Move to next question or complete
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setSelectedOption(null);
      setIsCorrect(null);
    } else {
      // Complete!
      setIsComplete(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      const avgQuality = newStats.totalQuality / newStats.reviewed;
      addXp(
        Math.round(newStats.reviewed * 5 + newStats.correct * 10),
        `Repetition avslutad (${newStats.reviewed} kort)`
      );
      onComplete?.({
        reviewed: newStats.reviewed,
        correct: newStats.correct,
        avgQuality,
      });
    }
  };

  const handleSkip = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  };

  if (isComplete) {
    const avgQuality = stats.totalQuality / stats.reviewed;
    const accuracy = (stats.correct / stats.reviewed) * 100;
    const duration = Math.round((Date.now() - startTime) / 1000 / 60);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 max-w-md w-full text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center"
          >
            <Trophy className="w-10 h-10 text-white" />
          </motion.div>

          <h2 className="text-2xl font-bold mb-2">Repetition klar! 🎉</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Bra jobbat! Här är din sammanfattning:
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-2xl font-bold text-primary-500">{stats.reviewed}</p>
              <p className="text-sm text-gray-500">Kort</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-2xl font-bold text-green-500">{Math.round(accuracy)}%</p>
              <p className="text-sm text-gray-500">Rätt</p>
            </div>
            <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800">
              <p className="text-2xl font-bold text-blue-500">{duration}m</p>
              <p className="text-sm text-gray-500">Tid</p>
            </div>
          </div>

          {avgQuality >= 4 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 mb-6"
            >
              <Zap className="w-5 h-5 inline mr-2" />
              Utmärkt! Du behärskar dessa koncept väl.
            </motion.div>
          )}

          {avgQuality < 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 mb-6"
            >
              <RotateCcw className="w-5 h-5 inline mr-2" />
              Dessa kort kommer tillbaka snart för mer övning.
            </motion.div>
          )}

          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
          >
            Fortsätt
          </button>
        </div>
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
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold">Spaced Repetition</p>
              <p className="text-sm text-gray-500">
                {currentIndex + 1} av {questions.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Avsluta
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-4 max-w-2xl mx-auto">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-600"
            />
          </div>
        </div>
      </div>

      {/* Question Card */}
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
              {/* Question */}
              <div className="p-6">
                <p className="text-lg font-medium leading-relaxed">
                  {currentQuestion.questionText}
                </p>
              </div>

              {/* Options */}
              <div className="p-6 pt-0 space-y-3">
                {currentQuestion.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const showCorrect = showAnswer && option.isCorrect;
                  const showWrong = showAnswer && isSelected && !option.isCorrect;

                  return (
                    <motion.button
                      key={option.id}
                      whileHover={!showAnswer ? { scale: 1.02 } : {}}
                      whileTap={!showAnswer ? { scale: 0.98 } : {}}
                      onClick={() => handleSelectOption(option.id)}
                      disabled={showAnswer}
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
                      <div className="flex items-start gap-3">
                        <span className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center font-medium text-sm">
                          {option.label}
                        </span>
                        <span className="flex-1">{option.text}</span>
                        {showCorrect && <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" />}
                        {showWrong && <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Explanation */}
              <AnimatePresence>
                {showAnswer && currentQuestion.explanation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-gray-200 dark:border-gray-700"
                  >
                    <div className="p-6">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <strong>Förklaring:</strong> {currentQuestion.explanation}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>

          {/* Quality Rating */}
          <AnimatePresence>
            {showAnswer && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6"
              >
                <p className="text-center text-gray-600 dark:text-gray-400 mb-4">
                  Hur väl kom du ihåg svaret?
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {([0, 1, 2] as QualityRating[]).map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRateQuality(rating)}
                      className={`p-3 rounded-xl ${QUALITY_LABELS[rating].color} text-white flex flex-col items-center gap-1 hover:opacity-90 transition-opacity`}
                    >
                      {QUALITY_LABELS[rating].icon}
                      <span className="text-sm font-medium">{QUALITY_LABELS[rating].label}</span>
                    </button>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-3">
                  {([3, 4, 5] as QualityRating[]).map((rating) => (
                    <button
                      key={rating}
                      onClick={() => handleRateQuality(rating)}
                      className={`p-3 rounded-xl ${QUALITY_LABELS[rating].color} text-white flex flex-col items-center gap-1 hover:opacity-90 transition-opacity`}
                    >
                      {QUALITY_LABELS[rating].icon}
                      <span className="text-sm font-medium">{QUALITY_LABELS[rating].label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Skip button */}
          {!showAnswer && (
            <div className="mt-6 text-center">
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-2 mx-auto"
              >
                Hoppa över <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
