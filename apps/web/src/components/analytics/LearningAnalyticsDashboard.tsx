import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Brain,
  Zap,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BookOpen,
} from 'lucide-react';
import { useAnalyticsStore } from '@/stores/analyticsStore';
import { ProgressRing } from '@/components/dashboard/ProgressRing';

interface LearningAnalyticsDashboardProps {
  userId?: string;
  isInstructor?: boolean;
}

export function LearningAnalyticsDashboard({
  userId,
  isInstructor = false,
}: LearningAnalyticsDashboardProps) {
  const {
    totalStudyTime,
    totalQuestionsAnswered,
    overallAccuracy,
    currentStreak,
    longestStreak,
    getLearningTrends,
    getWeakAreas,
    getStrongAreas,
    getStudyTimeByDay,
    getAccuracyByChapter,
    getBloomLevelPerformance,
  } = useAnalyticsStore();

  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const trends = getLearningTrends(period);
  const weakAreas = getWeakAreas();
  const strongAreas = getStrongAreas();
  const studyTimeData = getStudyTimeByDay(period === 'week' ? 7 : 30);
  const chapterAccuracy = getAccuracyByChapter();
  const bloomPerformance = getBloomLevelPerformance();

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Lärande Analys</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Dina studieinsikter och framsteg
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('week')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'week'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Vecka
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              period === 'month'
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            Månad
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Total studietid"
          value={formatTime(totalStudyTime)}
          color="blue"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Frågor besvarade"
          value={totalQuestionsAnswered.toString()}
          color="green"
        />
        <StatCard
          icon={<CheckCircle className="w-5 h-5" />}
          label="Träffsäkerhet"
          value={`${overallAccuracy}%`}
          color="purple"
        />
        <StatCard
          icon={<Zap className="w-5 h-5" />}
          label="Streak"
          value={`${currentStreak} dagar`}
          subValue={`Längsta: ${longestStreak}`}
          color="orange"
        />
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TrendCard
          label="Studietid"
          value={trends.studyTimeChange}
          positive={trends.studyTimeChange >= 0}
        />
        <TrendCard
          label="Träffsäkerhet"
          value={trends.accuracyChange}
          positive={trends.accuracyChange >= 0}
          suffix="%"
        />
        <TrendCard
          label="Regelbundenhet"
          value={trends.consistencyScore}
          isPercentage
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Time Chart */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            Studietid per dag
          </h3>
          <StudyTimeChart data={studyTimeData} />
        </div>

        {/* Bloom Level Performance */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            Prestanda per Bloom-nivå
          </h3>
          <BloomLevelChart data={bloomPerformance} />
        </div>
      </div>

      {/* Areas Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weak Areas */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Områden att förbättra
          </h3>
          {weakAreas.length > 0 ? (
            <div className="space-y-3">
              {weakAreas.map((area) => (
                <div
                  key={area.chapterId}
                  className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">{area.topic}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      {area.accuracy}%
                    </span>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    {area.suggestedAction}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">
              Inga svaga områden identifierade än
            </p>
          )}
        </div>

        {/* Strong Areas */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Starka områden
          </h3>
          {strongAreas.length > 0 ? (
            <div className="space-y-3">
              {strongAreas.map((area) => (
                <div
                  key={area.chapterId}
                  className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{area.chapterTitle}</span>
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      {area.accuracy}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-6">
              Fortsätt öva för att bygga starka områden
            </p>
          )}
        </div>
      </div>

      {/* Chapter Performance */}
      <div className="p-6 rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          Prestanda per kapitel
        </h3>
        {chapterAccuracy.length > 0 ? (
          <div className="space-y-3">
            {chapterAccuracy.map((chapter) => (
              <div key={chapter.chapterId} className="flex items-center gap-4">
                <span className="flex-1 truncate">{chapter.title}</span>
                <div className="w-48 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${chapter.accuracy}%` }}
                      className={`h-full rounded-full ${
                        chapter.accuracy >= 80
                          ? 'bg-green-500'
                          : chapter.accuracy >= 60
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {chapter.accuracy}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-6">
            Börja svara på frågor för att se din prestation
          </p>
        )}
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  subValue,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
      {subValue && (
        <p className="text-xs text-gray-400 mt-1">{subValue}</p>
      )}
    </motion.div>
  );
}

// Trend Card Component
function TrendCard({
  label,
  value,
  positive,
  suffix = '%',
  isPercentage = false,
}: {
  label: string;
  value: number;
  positive?: boolean;
  suffix?: string;
  isPercentage?: boolean;
}) {
  const displayValue = isPercentage
    ? `${value}%`
    : `${positive ? '+' : ''}${value}${suffix}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <span className="text-gray-500">{label}</span>
        {!isPercentage && (
          positive ? (
            <TrendingUp className="w-5 h-5 text-green-500" />
          ) : (
            <TrendingDown className="w-5 h-5 text-red-500" />
          )
        )}
      </div>
      <p
        className={`text-2xl font-bold mt-2 ${
          isPercentage
            ? value >= 70
              ? 'text-green-500'
              : value >= 40
              ? 'text-yellow-500'
              : 'text-red-500'
            : positive
            ? 'text-green-500'
            : 'text-red-500'
        }`}
      >
        {displayValue}
      </p>
    </motion.div>
  );
}

// Study Time Chart Component
function StudyTimeChart({ data }: { data: { date: string; minutes: number }[] }) {
  const maxMinutes = Math.max(...data.map((d) => d.minutes), 30);

  return (
    <div className="flex items-end justify-between gap-2 h-40">
      {data.map((day, i) => {
        const height = day.minutes > 0 ? (day.minutes / maxMinutes) * 100 : 2;
        const dayName = new Date(day.date).toLocaleDateString('sv-SE', {
          weekday: 'short',
        });

        return (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-2">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: i * 0.05 }}
              className={`w-full rounded-t-lg ${
                day.minutes > 0
                  ? 'bg-gradient-to-t from-indigo-500 to-purple-500'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
              title={`${day.minutes} min`}
            />
            <span className="text-xs text-gray-500">{dayName}</span>
          </div>
        );
      })}
    </div>
  );
}

// Bloom Level Chart Component
function BloomLevelChart({
  data,
}: {
  data: { level: number; name: string; accuracy: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="text-gray-500 text-center py-6">
        Svara på frågor för att se din Bloom-nivå prestanda
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((item) => (
        <div key={item.level} className="flex items-center gap-3">
          <span className="w-24 text-sm truncate">{item.name}</span>
          <div className="flex-1 h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${item.accuracy}%` }}
              className={`h-full rounded-full ${
                item.accuracy >= 80
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                  : item.accuracy >= 60
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                  : 'bg-gradient-to-r from-red-400 to-rose-500'
              }`}
            />
          </div>
          <span className="w-12 text-sm font-medium text-right">
            {item.accuracy}%
          </span>
        </div>
      ))}
    </div>
  );
}
