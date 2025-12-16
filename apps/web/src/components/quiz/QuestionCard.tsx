import { useState } from 'react';
import { cn } from '@/lib/utils';
import { BLOOM_LEVELS } from '@b-ortim/shared';
import { CheckCircle, XCircle } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  text: string;
  isCorrect?: boolean;
}

interface QuestionCardProps {
  questionCode: string;
  bloomLevel: string;
  questionText: string;
  options: Option[];
  selectedOption?: string;
  showFeedback?: boolean;
  explanation?: string;
  onSelect: (optionLabel: string) => void;
  disabled?: boolean;
}

export function QuestionCard({
  questionCode,
  bloomLevel,
  questionText,
  options,
  selectedOption,
  showFeedback = false,
  explanation,
  onSelect,
  disabled = false,
}: QuestionCardProps) {
  const [revealed, setRevealed] = useState(false);

  const bloomInfo = BLOOM_LEVELS[bloomLevel as keyof typeof BLOOM_LEVELS];
  const correctOption = options.find((o) => o.isCorrect);
  const isCorrect = selectedOption === correctOption?.label;

  const handleSelect = (label: string) => {
    if (disabled || (showFeedback && revealed)) return;
    onSelect(label);
    if (showFeedback) {
      setRevealed(true);
    }
  };

  return (
    <div className="bg-card border rounded-xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground font-mono">
          Fråga {questionCode}
        </span>
        {bloomInfo && (
          <span
            className={cn(
              'px-2 py-1 rounded text-xs font-medium',
              bloomLevel === 'KNOWLEDGE' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
              bloomLevel === 'COMPREHENSION' && 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
              bloomLevel === 'APPLICATION' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
              bloomLevel === 'ANALYSIS' && 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
              bloomLevel === 'SYNTHESIS' && 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            )}
          >
            {bloomInfo.label}
          </span>
        )}
      </div>

      {/* Question text */}
      <p className="text-lg font-medium mb-6">{questionText}</p>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option) => {
          const isSelected = selectedOption === option.label;
          const showCorrect = showFeedback && revealed && option.isCorrect;
          const showIncorrect = showFeedback && revealed && isSelected && !option.isCorrect;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.label)}
              disabled={disabled || (showFeedback && revealed)}
              className={cn(
                'w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-all',
                'hover:bg-accent hover:border-accent',
                isSelected && !showFeedback && 'bg-primary/10 border-primary',
                showCorrect && 'bg-green-100 border-green-500 dark:bg-green-900/30',
                showIncorrect && 'bg-red-100 border-red-500 dark:bg-red-900/30',
                disabled && 'opacity-60 cursor-not-allowed'
              )}
            >
              <span
                className={cn(
                  'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm',
                  'bg-muted',
                  isSelected && !showFeedback && 'bg-primary text-primary-foreground',
                  showCorrect && 'bg-green-500 text-white',
                  showIncorrect && 'bg-red-500 text-white'
                )}
              >
                {showCorrect ? (
                  <CheckCircle className="h-5 w-5" />
                ) : showIncorrect ? (
                  <XCircle className="h-5 w-5" />
                ) : (
                  option.label
                )}
              </span>
              <span className="flex-1 pt-1">{option.text}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {showFeedback && revealed && (
        <div
          className={cn(
            'mt-6 p-4 rounded-lg',
            isCorrect
              ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
              : 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800'
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {isCorrect ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800 dark:text-green-300">Rätt svar!</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="font-medium text-red-800 dark:text-red-300">
                  Fel. Rätt svar är {correctOption?.label}.
                </span>
              </>
            )}
          </div>
          {explanation && (
            <p className="text-sm text-muted-foreground mt-2">{explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}
