import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Target,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  RefreshCw,
  Sparkles,
  Calendar,
  BarChart3,
  Zap,
} from 'lucide-react';
import { useAILearningStore, StudyRecommendation, KnowledgeGap } from '@/stores/aiLearningStore';
import { ProgressRing } from '@/components/dashboard/ProgressRing';

interface StudyPlanDashboardProps {
  chapters: { id: string; title: string }[];
  onStartStudy?: (chapterId: string) => void;
  onStartReview?: () => void;
}

export function StudyPlanDashboard({
  chapters,
  onStartStudy,
  onStartReview,
}: StudyPlanDashboardProps) {
  const {
    currentPlan,
    knowledgeGaps,
    dailyGoalMinutes,
    studySessions,
    reviewCards,
    generateDailyPlan,
    analyzeKnowledgeGaps,
    getDueReviewCards,
  } = useAILearningStore();

  const [isGenerating, setIsGenerating] = useState(false);

  // Generate plan on mount if none exists or is stale
  useEffect(() => {
    const shouldGenerate = !currentPlan ||
      new Date(currentPlan.date).toDateString() !== new Date().toDateString();

    if (shouldGenerate && chapters.length > 0) {
      generateDailyPlan(chapters);
      analyzeKnowledgeGaps(chapters);
    }
  }, [chapters, currentPlan, generateDailyPlan, analyzeKnowledgeGaps]);

  const handleRefreshPlan = async () => {
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated delay
    generateDailyPlan(chapters);
    analyzeKnowledgeGaps(chapters);
    setIsGenerating(false);
  };

  // Calculate today's progress
  const todaySessions = studySessions.filter(
    s => new Date(s.date).toDateString() === new Date().toDateString()
  );
  const todayMinutes = todaySessions.reduce((sum, s) => sum + s.duration, 0);
  const goalProgress = Math.min(100, (todayMinutes / dailyGoalMinutes) * 100);

  const dueCards = getDueReviewCards();

  return (
    <div className="space-y-6">
      {/* Header with AI indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">AI-studieplan</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Personaliserad för dig
            </p>
          </div>
        </div>
        <button
          onClick={handleRefreshPlan}
          disabled={isGenerating}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span className="text-sm">Uppdatera</span>
        </button>
      </div>

      {/* Daily Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Dagens framsteg</p>
            <p className="text-3xl font-bold mt-1">
              {todayMinutes} / {dailyGoalMinutes} min
            </p>
            <p className="text-blue-100 text-sm mt-2">
              {todaySessions.length} studiepass idag
            </p>
          </div>
          <ProgressRing
            progress={goalProgress}
            size={80}
            strokeWidth={8}
            className="text-white"
          />
        </div>

        {goalProgress >= 100 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mt-4 flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Dagsmål uppnått! 🎉</span>
          </motion.div>
        )}
      </motion.div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <QuickStatCard
          icon={<RefreshCw className="w-5 h-5" />}
          label="Att repetera"
          value={dueCards.length}
          color="amber"
          onClick={onStartReview}
        />
        <QuickStatCard
          icon={<Target className="w-5 h-5" />}
          label="Svaga områden"
          value={currentPlan?.weakAreas.length || 0}
          color="red"
        />
        <QuickStatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Starka områden"
          value={currentPlan?.strongAreas.length || 0}
          color="green"
        />
      </div>

      {/* Due Review Cards Alert */}
      {dueCards.length > 0 && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                {dueCards.length} kort redo för repetition
              </h3>
              <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                Repetition nu ger optimal inlärning enligt SM-2 algoritmen
              </p>
            </div>
            <button
              onClick={onStartReview}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
            >
              Starta
            </button>
          </div>
        </motion.div>
      )}

      {/* AI Recommendations */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold">AI-rekommendationer</h3>
        </div>

        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {currentPlan?.recommendations.map((rec, index) => (
              <RecommendationCard
                key={`${rec.type}-${rec.chapterId || index}`}
                recommendation={rec}
                index={index}
                onStart={() => rec.chapterId && onStartStudy?.(rec.chapterId)}
              />
            ))}

            {(!currentPlan?.recommendations || currentPlan.recommendations.length === 0) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-gray-500"
              >
                <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Börja studera för att få personaliserade rekommendationer</p>
              </motion.div>
            )}
          </div>
        </AnimatePresence>
      </div>

      {/* Knowledge Gaps */}
      {knowledgeGaps.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h3 className="font-semibold">Kunskapsluckor</h3>
          </div>

          <div className="space-y-3">
            {knowledgeGaps.slice(0, 3).map((gap) => (
              <KnowledgeGapCard
                key={gap.chapterId}
                gap={gap}
                onStudy={() => onStartStudy?.(gap.chapterId)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Weekly Overview */}
      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold">Veckoöversikt</h3>
        </div>
        <WeeklyActivityChart sessions={studySessions} />
      </div>
    </div>
  );
}

// Sub-components
function QuickStatCard({
  icon,
  label,
  value,
  color,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: 'amber' | 'red' | 'green';
  onClick?: () => void;
}) {
  const colors = {
    amber: 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={!onClick}
      className={`p-4 rounded-xl ${colors[color]} text-center transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
      }`}
    >
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </motion.button>
  );
}

function RecommendationCard({
  recommendation,
  index,
  onStart,
}: {
  recommendation: StudyRecommendation;
  index: number;
  onStart: () => void;
}) {
  const typeConfig = {
    review: {
      icon: <RefreshCw className="w-4 h-4" />,
      color: 'bg-amber-100 dark:bg-amber-800 text-amber-600 dark:text-amber-400',
      badge: 'Repetition',
    },
    new_content: {
      icon: <BookOpen className="w-4 h-4" />,
      color: 'bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-400',
      badge: 'Nytt innehåll',
    },
    weakness: {
      icon: <Target className="w-4 h-4" />,
      color: 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-400',
      badge: 'Förbättra',
    },
    strength: {
      icon: <Zap className="w-4 h-4" />,
      color: 'bg-green-100 dark:bg-green-800 text-green-600 dark:text-green-400',
      badge: 'Förstärk',
    },
  };

  const config = typeConfig[recommendation.type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${config.color} flex items-center justify-center flex-shrink-0`}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${config.color}`}>
              {config.badge}
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              recommendation.priority === 'high'
                ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                : recommendation.priority === 'medium'
                ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {recommendation.priority === 'high' ? 'Hög' : recommendation.priority === 'medium' ? 'Medel' : 'Låg'} prioritet
            </span>
          </div>
          <h4 className="font-medium truncate">
            {recommendation.chapterTitle || 'Repetitionskort'}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {recommendation.reason}
          </p>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>~{recommendation.estimatedTime} min</span>
          </div>
        </div>
        <button
          onClick={onStart}
          className="px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors"
        >
          Starta
        </button>
      </div>
    </motion.div>
  );
}

function KnowledgeGapCard({
  gap,
  onStudy,
}: {
  gap: KnowledgeGap;
  onStudy: () => void;
}) {
  return (
    <div className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-800">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-medium">{gap.chapterTitle}</h4>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${gap.masteryLevel}%` }}
                className={`h-full rounded-full ${
                  gap.masteryLevel < 40
                    ? 'bg-red-500'
                    : gap.masteryLevel < 70
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
              />
            </div>
            <span className="text-sm font-medium">{gap.masteryLevel}%</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {gap.weakTopics.slice(0, 2).map((topic, i) => (
              <span
                key={i}
                className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={onStudy}
          className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors"
        >
          Studera
        </button>
      </div>
    </div>
  );
}

function WeeklyActivityChart({ sessions }: { sessions: { date: string; duration: number }[] }) {
  const days = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön'];
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1);

  const weekData = days.map((day, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    const dateStr = date.toDateString();

    const dayMinutes = sessions
      .filter(s => new Date(s.date).toDateString() === dateStr)
      .reduce((sum, s) => sum + s.duration, 0);

    return { day, minutes: dayMinutes, isToday: date.toDateString() === today.toDateString() };
  });

  const maxMinutes = Math.max(...weekData.map(d => d.minutes), 30);

  return (
    <div className="flex items-end justify-between gap-2 h-24">
      {weekData.map((data, index) => (
        <div key={index} className="flex-1 flex flex-col items-center gap-1">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(data.minutes / maxMinutes) * 100}%` }}
            className={`w-full rounded-t-md min-h-[4px] ${
              data.isToday
                ? 'bg-primary-500'
                : data.minutes > 0
                ? 'bg-primary-300 dark:bg-primary-700'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
            style={{ maxHeight: '100%' }}
          />
          <span className={`text-xs ${data.isToday ? 'font-bold text-primary-500' : 'text-gray-500'}`}>
            {data.day}
          </span>
        </div>
      ))}
    </div>
  );
}
