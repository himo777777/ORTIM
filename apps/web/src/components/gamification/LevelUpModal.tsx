import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Sparkles, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LevelUpModalProps {
  open: boolean;
  onClose: () => void;
  level: number;
  xpGained?: number;
  unlockedFeatures?: string[];
}

export function LevelUpModal({
  open,
  onClose,
  level,
  xpGained = 0,
  unlockedFeatures = [],
}: LevelUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (open) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={onClose}
        >
          {/* Confetti particles */}
          {showConfetti && <Confetti />}

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            onClick={(e) => e.stopPropagation()}
            className="relative bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8 max-w-md w-full shadow-2xl overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-200/30 dark:bg-amber-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-200/30 dark:bg-orange-500/10 rounded-full blur-2xl" />
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 hover:bg-black/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="relative text-center">
              {/* Level badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', damping: 10 }}
                className="mx-auto mb-6"
              >
                <div className="relative inline-block">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <span className="text-4xl font-bold text-white">{level}</span>
                  </div>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute -inset-2"
                  >
                    {[...Array(8)].map((_, i) => (
                      <Sparkles
                        key={i}
                        className="absolute w-4 h-4 text-amber-400"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `rotate(${i * 45}deg) translateY(-40px) translateX(-50%)`,
                        }}
                      />
                    ))}
                  </motion.div>
                </div>
              </motion.div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Nivå Upp!
                </h2>
                <p className="text-lg text-amber-600 dark:text-amber-400 font-semibold">
                  Du har nått nivå {level}!
                </p>
              </motion.div>

              {/* XP gained */}
              {xpGained > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-white/10 rounded-full"
                >
                  <Star className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold">+{xpGained} XP</span>
                </motion.div>
              )}

              {/* Unlocked features */}
              {unlockedFeatures.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 bg-white/50 dark:bg-white/10 rounded-xl"
                >
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">
                    Nya funktioner upplåsta:
                  </h3>
                  <ul className="space-y-1">
                    {unlockedFeatures.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {/* Continue button */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6"
              >
                <Button
                  onClick={onClose}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  Fortsätt
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Confetti component
function Confetti() {
  const colors = ['#f59e0b', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  const particles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 2 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: 4 + Math.random() * 8,
    rotation: Math.random() * 360,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            x: `${particle.x}vw`,
            y: -20,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            y: '110vh',
            rotate: particle.rotation + 720,
            opacity: 0,
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            ease: 'linear',
          }}
          style={{
            position: 'absolute',
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}
