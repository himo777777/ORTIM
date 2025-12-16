import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Brain, Award, Target, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  image?: string;
}

const steps: OnboardingStep[] = [
  {
    title: 'Välkommen till B-ORTIM!',
    description:
      'B-ORTIM är en interaktiv utbildningsplattform för ortopedisk traumahantering. Här lär du dig genom att läsa, öva och repetera.',
    icon: <BookOpen className="h-8 w-8" />,
  },
  {
    title: 'Läs och lär dig',
    description:
      'Kursen är uppdelad i kapitel med tydliga lärandemål. Läs i din egen takt och markera din progress automatiskt.',
    icon: <BookOpen className="h-8 w-8" />,
  },
  {
    title: 'Testa dina kunskaper',
    description:
      'Efter varje kapitel kan du göra quiz för att kontrollera att du förstått innehållet. Spaced repetition hjälper dig minnas!',
    icon: <Brain className="h-8 w-8" />,
  },
  {
    title: 'Få ditt certifikat',
    description:
      'Slutför kursen och OSCE-examinationen för att få ditt B-ORTIM-certifikat. Certifikatet är giltigt i 3 år.',
    icon: <Award className="h-8 w-8" />,
  },
  {
    title: 'Sätt dina mål',
    description:
      'Hur mycket tid vill du lägga på studier varje dag? Sätt ett mål och håll din streak vid liv!',
    icon: <Target className="h-8 w-8" />,
  },
];

interface OnboardingModalProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onComplete: () => void;
}

export function OnboardingModal({ open, onOpenChange, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<number | null>(null);

  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const goals = [
    { minutes: 5, label: '5 min/dag', description: 'Casual' },
    { minutes: 15, label: '15 min/dag', description: 'Lagom' },
    { minutes: 30, label: '30 min/dag', description: 'Seriöst' },
    { minutes: 60, label: '60 min/dag', description: 'Intensivt' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg [&>button]:hidden">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'h-1.5 rounded-full transition-all',
                    index === currentStep
                      ? 'w-6 bg-primary'
                      : index < currentStep
                        ? 'w-3 bg-primary'
                        : 'w-3 bg-muted'
                  )}
                />
              ))}
            </div>
          </div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="p-4 rounded-full bg-primary/10 text-primary mb-4">
                {step.icon}
              </div>
              <DialogTitle className="text-xl">{step.title}</DialogTitle>
              <DialogDescription className="mt-2 text-base">
                {step.description}
              </DialogDescription>
            </div>

            {isLastStep && (
              <div className="grid grid-cols-2 gap-3">
                {goals.map((goal) => (
                  <button
                    key={goal.minutes}
                    onClick={() => setSelectedGoal(goal.minutes)}
                    className={cn(
                      'p-4 rounded-lg border-2 text-left transition-all',
                      selectedGoal === goal.minutes
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <div className="font-semibold">{goal.label}</div>
                    <div className="text-sm text-muted-foreground">
                      {goal.description}
                    </div>
                    {selectedGoal === goal.minutes && (
                      <Check className="absolute top-2 right-2 h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6">
          <Button variant="ghost" onClick={handleSkip}>
            Hoppa över
          </Button>
          <Button onClick={handleNext}>
            {isLastStep ? (
              'Kom igång'
            ) : (
              <>
                Nästa
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
