import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Analytics data types
export interface DailyStats {
  date: string;
  studyTimeMinutes: number;
  questionsAttempted: number;
  questionsCorrect: number;
  chaptersVisited: string[];
  xpEarned: number;
}

export interface ChapterAnalytics {
  chapterId: string;
  chapterTitle: string;
  totalTimeSpent: number;
  questionsAttempted: number;
  questionsCorrect: number;
  averageScore: number;
  lastVisited: string;
  masteryLevel: number; // 0-100
  bloomLevelPerformance: Record<number, { correct: number; total: number }>;
}

export interface QuizAttempt {
  id: string;
  date: string;
  chapterId: string;
  mode: 'practice' | 'exam';
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number;
  bloomLevelBreakdown: Record<number, { correct: number; total: number }>;
}

export interface LearningTrend {
  period: 'week' | 'month' | 'all';
  studyTimeChange: number; // Percentage change
  accuracyChange: number;
  consistencyScore: number; // 0-100 based on study frequency
}

export interface WeakArea {
  topic: string;
  chapterId: string;
  accuracy: number;
  suggestedAction: string;
}

export interface PredictedPerformance {
  chapterId: string;
  predictedScore: number;
  confidence: number;
  recommendedStudyTime: number;
}

export interface AnalyticsState {
  // Raw data
  dailyStats: DailyStats[];
  chapterAnalytics: ChapterAnalytics[];
  quizAttempts: QuizAttempt[];

  // Computed insights
  totalStudyTime: number;
  totalQuestionsAnswered: number;
  overallAccuracy: number;
  currentStreak: number;
  longestStreak: number;
  weeklyGoalProgress: number;

  // Actions
  recordStudySession: (data: {
    chapterId: string;
    chapterTitle: string;
    durationMinutes: number;
  }) => void;

  recordQuizAttempt: (attempt: Omit<QuizAttempt, 'id'>) => void;

  // Computed getters
  getDailyStatsForPeriod: (days: number) => DailyStats[];
  getChapterPerformance: (chapterId: string) => ChapterAnalytics | undefined;
  getLearningTrends: (period: 'week' | 'month') => LearningTrend;
  getWeakAreas: () => WeakArea[];
  getStrongAreas: () => { chapterId: string; chapterTitle: string; accuracy: number }[];
  getPredictedPerformance: (chapterId: string) => PredictedPerformance;
  getStudyTimeByDay: (days: number) => { date: string; minutes: number }[];
  getAccuracyByChapter: () => { chapterId: string; title: string; accuracy: number }[];
  getBloomLevelPerformance: () => { level: number; name: string; accuracy: number }[];
}

const BLOOM_LEVEL_NAMES: Record<number, string> = {
  1: 'Kunskap',
  2: 'Förståelse',
  3: 'Tillämpning',
  4: 'Analys',
  5: 'Syntes',
  6: 'Utvärdering',
};

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date, yesterday);
}

function calculateStreak(dailyStats: DailyStats[]): { current: number; longest: number } {
  if (dailyStats.length === 0) return { current: 0, longest: 0 };

  const sortedStats = [...dailyStats].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  const today = new Date();
  let expectedDate = today;

  // Check if studied today
  if (sortedStats[0] && isSameDay(new Date(sortedStats[0].date), today)) {
    currentStreak = 1;
    expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - 1);
  } else if (sortedStats[0] && isYesterday(new Date(sortedStats[0].date))) {
    currentStreak = 1;
    expectedDate = new Date(sortedStats[0].date);
    expectedDate.setDate(expectedDate.getDate() - 1);
  }

  // Count consecutive days
  for (const stat of sortedStats.slice(currentStreak > 0 ? 1 : 0)) {
    const statDate = new Date(stat.date);
    if (isSameDay(statDate, expectedDate)) {
      currentStreak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak
  for (let i = 0; i < sortedStats.length; i++) {
    tempStreak = 1;
    let checkDate = new Date(sortedStats[i].date);
    checkDate.setDate(checkDate.getDate() - 1);

    for (let j = i + 1; j < sortedStats.length; j++) {
      if (isSameDay(new Date(sortedStats[j].date), checkDate)) {
        tempStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak);
  }

  return { current: currentStreak, longest: longestStreak };
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      dailyStats: [],
      chapterAnalytics: [],
      quizAttempts: [],
      totalStudyTime: 0,
      totalQuestionsAnswered: 0,
      overallAccuracy: 0,
      currentStreak: 0,
      longestStreak: 0,
      weeklyGoalProgress: 0,

      recordStudySession: (data) => {
        const today = new Date().toISOString().split('T')[0];

        set((state) => {
          // Update daily stats
          const existingDayIndex = state.dailyStats.findIndex(
            (d) => d.date === today
          );

          let newDailyStats: DailyStats[];
          if (existingDayIndex >= 0) {
            newDailyStats = state.dailyStats.map((d, i) =>
              i === existingDayIndex
                ? {
                    ...d,
                    studyTimeMinutes: d.studyTimeMinutes + data.durationMinutes,
                    chaptersVisited: [
                      ...new Set([...d.chaptersVisited, data.chapterId]),
                    ],
                  }
                : d
            );
          } else {
            newDailyStats = [
              ...state.dailyStats,
              {
                date: today,
                studyTimeMinutes: data.durationMinutes,
                questionsAttempted: 0,
                questionsCorrect: 0,
                chaptersVisited: [data.chapterId],
                xpEarned: 0,
              },
            ];
          }

          // Update chapter analytics
          const existingChapterIndex = state.chapterAnalytics.findIndex(
            (c) => c.chapterId === data.chapterId
          );

          let newChapterAnalytics: ChapterAnalytics[];
          if (existingChapterIndex >= 0) {
            newChapterAnalytics = state.chapterAnalytics.map((c, i) =>
              i === existingChapterIndex
                ? {
                    ...c,
                    totalTimeSpent: c.totalTimeSpent + data.durationMinutes,
                    lastVisited: new Date().toISOString(),
                  }
                : c
            );
          } else {
            newChapterAnalytics = [
              ...state.chapterAnalytics,
              {
                chapterId: data.chapterId,
                chapterTitle: data.chapterTitle,
                totalTimeSpent: data.durationMinutes,
                questionsAttempted: 0,
                questionsCorrect: 0,
                averageScore: 0,
                lastVisited: new Date().toISOString(),
                masteryLevel: 0,
                bloomLevelPerformance: {},
              },
            ];
          }

          // Calculate streaks
          const { current, longest } = calculateStreak(newDailyStats);

          return {
            dailyStats: newDailyStats,
            chapterAnalytics: newChapterAnalytics,
            totalStudyTime:
              state.totalStudyTime + data.durationMinutes,
            currentStreak: current,
            longestStreak: Math.max(state.longestStreak, longest),
          };
        });
      },

      recordQuizAttempt: (attempt) => {
        const id = `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const today = new Date().toISOString().split('T')[0];

        set((state) => {
          // Add quiz attempt
          const newQuizAttempts = [
            ...state.quizAttempts,
            { ...attempt, id },
          ].slice(-500); // Keep last 500 attempts

          // Update daily stats
          const existingDayIndex = state.dailyStats.findIndex(
            (d) => d.date === today
          );

          let newDailyStats: DailyStats[];
          if (existingDayIndex >= 0) {
            newDailyStats = state.dailyStats.map((d, i) =>
              i === existingDayIndex
                ? {
                    ...d,
                    questionsAttempted: d.questionsAttempted + attempt.totalQuestions,
                    questionsCorrect: d.questionsCorrect + attempt.correctAnswers,
                    xpEarned: d.xpEarned + attempt.correctAnswers * 10,
                  }
                : d
            );
          } else {
            newDailyStats = [
              ...state.dailyStats,
              {
                date: today,
                studyTimeMinutes: Math.round(attempt.timeSpent / 60000),
                questionsAttempted: attempt.totalQuestions,
                questionsCorrect: attempt.correctAnswers,
                chaptersVisited: [attempt.chapterId],
                xpEarned: attempt.correctAnswers * 10,
              },
            ];
          }

          // Update chapter analytics
          const existingChapterIndex = state.chapterAnalytics.findIndex(
            (c) => c.chapterId === attempt.chapterId
          );

          let newChapterAnalytics: ChapterAnalytics[];
          if (existingChapterIndex >= 0) {
            const existing = state.chapterAnalytics[existingChapterIndex];
            const newTotal = existing.questionsAttempted + attempt.totalQuestions;
            const newCorrect = existing.questionsCorrect + attempt.correctAnswers;

            // Merge bloom level performance
            const newBloomPerf = { ...existing.bloomLevelPerformance };
            Object.entries(attempt.bloomLevelBreakdown || {}).forEach(
              ([level, data]) => {
                const lvl = parseInt(level);
                if (!newBloomPerf[lvl]) {
                  newBloomPerf[lvl] = { correct: 0, total: 0 };
                }
                newBloomPerf[lvl].correct += data.correct;
                newBloomPerf[lvl].total += data.total;
              }
            );

            newChapterAnalytics = state.chapterAnalytics.map((c, i) =>
              i === existingChapterIndex
                ? {
                    ...c,
                    questionsAttempted: newTotal,
                    questionsCorrect: newCorrect,
                    averageScore: Math.round((newCorrect / newTotal) * 100),
                    masteryLevel: Math.min(
                      100,
                      Math.round((newCorrect / newTotal) * 100 * (newTotal / 50))
                    ),
                    bloomLevelPerformance: newBloomPerf,
                  }
                : c
            );
          } else {
            newChapterAnalytics = [
              ...state.chapterAnalytics,
              {
                chapterId: attempt.chapterId,
                chapterTitle: attempt.chapterId,
                totalTimeSpent: Math.round(attempt.timeSpent / 60000),
                questionsAttempted: attempt.totalQuestions,
                questionsCorrect: attempt.correctAnswers,
                averageScore: Math.round(
                  (attempt.correctAnswers / attempt.totalQuestions) * 100
                ),
                lastVisited: new Date().toISOString(),
                masteryLevel: Math.round(
                  (attempt.correctAnswers / attempt.totalQuestions) * 20
                ),
                bloomLevelPerformance: attempt.bloomLevelBreakdown || {},
              },
            ];
          }

          // Calculate overall accuracy
          const totalQuestions = newDailyStats.reduce(
            (sum, d) => sum + d.questionsAttempted,
            0
          );
          const totalCorrect = newDailyStats.reduce(
            (sum, d) => sum + d.questionsCorrect,
            0
          );

          return {
            quizAttempts: newQuizAttempts,
            dailyStats: newDailyStats,
            chapterAnalytics: newChapterAnalytics,
            totalQuestionsAnswered: totalQuestions,
            overallAccuracy:
              totalQuestions > 0
                ? Math.round((totalCorrect / totalQuestions) * 100)
                : 0,
          };
        });
      },

      getDailyStatsForPeriod: (days) => {
        const state = get();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        return state.dailyStats.filter(
          (d) => new Date(d.date) >= cutoff
        );
      },

      getChapterPerformance: (chapterId) => {
        return get().chapterAnalytics.find((c) => c.chapterId === chapterId);
      },

      getLearningTrends: (period) => {
        const state = get();
        const days = period === 'week' ? 7 : 30;
        const halfDays = Math.floor(days / 2);

        const recentStats = state.getDailyStatsForPeriod(halfDays);
        const olderStats = state.dailyStats.filter((d) => {
          const date = new Date(d.date);
          const cutoffRecent = new Date();
          cutoffRecent.setDate(cutoffRecent.getDate() - halfDays);
          const cutoffOlder = new Date();
          cutoffOlder.setDate(cutoffOlder.getDate() - days);
          return date < cutoffRecent && date >= cutoffOlder;
        });

        // Calculate study time change
        const recentTime = recentStats.reduce(
          (sum, d) => sum + d.studyTimeMinutes,
          0
        );
        const olderTime = olderStats.reduce(
          (sum, d) => sum + d.studyTimeMinutes,
          0
        );
        const studyTimeChange =
          olderTime > 0
            ? Math.round(((recentTime - olderTime) / olderTime) * 100)
            : recentTime > 0
            ? 100
            : 0;

        // Calculate accuracy change
        const recentCorrect = recentStats.reduce(
          (sum, d) => sum + d.questionsCorrect,
          0
        );
        const recentTotal = recentStats.reduce(
          (sum, d) => sum + d.questionsAttempted,
          0
        );
        const olderCorrect = olderStats.reduce(
          (sum, d) => sum + d.questionsCorrect,
          0
        );
        const olderTotal = olderStats.reduce(
          (sum, d) => sum + d.questionsAttempted,
          0
        );

        const recentAccuracy =
          recentTotal > 0 ? (recentCorrect / recentTotal) * 100 : 0;
        const olderAccuracy =
          olderTotal > 0 ? (olderCorrect / olderTotal) * 100 : 0;
        const accuracyChange = Math.round(recentAccuracy - olderAccuracy);

        // Calculate consistency score (days studied / total days)
        const consistencyScore = Math.round(
          (recentStats.length / halfDays) * 100
        );

        return {
          period,
          studyTimeChange,
          accuracyChange,
          consistencyScore,
        };
      },

      getWeakAreas: () => {
        const state = get();
        const weakAreas: WeakArea[] = [];

        state.chapterAnalytics.forEach((chapter) => {
          if (chapter.questionsAttempted >= 5 && chapter.averageScore < 60) {
            weakAreas.push({
              topic: chapter.chapterTitle,
              chapterId: chapter.chapterId,
              accuracy: chapter.averageScore,
              suggestedAction:
                chapter.averageScore < 40
                  ? 'Läs igenom kapitlet igen'
                  : 'Öva mer på detta område',
            });
          }
        });

        return weakAreas.sort((a, b) => a.accuracy - b.accuracy).slice(0, 5);
      },

      getStrongAreas: () => {
        const state = get();
        return state.chapterAnalytics
          .filter((c) => c.questionsAttempted >= 5 && c.averageScore >= 80)
          .map((c) => ({
            chapterId: c.chapterId,
            chapterTitle: c.chapterTitle,
            accuracy: c.averageScore,
          }))
          .sort((a, b) => b.accuracy - a.accuracy)
          .slice(0, 5);
      },

      getPredictedPerformance: (chapterId) => {
        const state = get();
        const chapter = state.chapterAnalytics.find(
          (c) => c.chapterId === chapterId
        );

        if (!chapter || chapter.questionsAttempted < 5) {
          return {
            chapterId,
            predictedScore: 50,
            confidence: 20,
            recommendedStudyTime: 30,
          };
        }

        // Simple prediction based on recent performance and trend
        const recentAttempts = state.quizAttempts
          .filter((a) => a.chapterId === chapterId)
          .slice(-5);

        const avgRecentScore =
          recentAttempts.reduce((sum, a) => sum + a.score, 0) /
          recentAttempts.length;

        const confidence = Math.min(
          90,
          20 + chapter.questionsAttempted * 2
        );

        const recommendedStudyTime =
          avgRecentScore >= 80
            ? 10
            : avgRecentScore >= 60
            ? 20
            : 30;

        return {
          chapterId,
          predictedScore: Math.round(avgRecentScore),
          confidence,
          recommendedStudyTime,
        };
      },

      getStudyTimeByDay: (days) => {
        const state = get();
        const result: { date: string; minutes: number }[] = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];

          const stats = state.dailyStats.find((d) => d.date === dateStr);
          result.push({
            date: dateStr,
            minutes: stats?.studyTimeMinutes || 0,
          });
        }

        return result;
      },

      getAccuracyByChapter: () => {
        const state = get();
        return state.chapterAnalytics
          .filter((c) => c.questionsAttempted > 0)
          .map((c) => ({
            chapterId: c.chapterId,
            title: c.chapterTitle,
            accuracy: c.averageScore,
          }))
          .sort((a, b) => b.accuracy - a.accuracy);
      },

      getBloomLevelPerformance: () => {
        const state = get();
        const aggregated: Record<number, { correct: number; total: number }> = {};

        state.chapterAnalytics.forEach((chapter) => {
          Object.entries(chapter.bloomLevelPerformance).forEach(
            ([level, data]) => {
              const lvl = parseInt(level);
              if (!aggregated[lvl]) {
                aggregated[lvl] = { correct: 0, total: 0 };
              }
              aggregated[lvl].correct += data.correct;
              aggregated[lvl].total += data.total;
            }
          );
        });

        return Object.entries(aggregated)
          .map(([level, data]) => ({
            level: parseInt(level),
            name: BLOOM_LEVEL_NAMES[parseInt(level)] || `Nivå ${level}`,
            accuracy:
              data.total > 0
                ? Math.round((data.correct / data.total) * 100)
                : 0,
          }))
          .sort((a, b) => a.level - b.level);
      },
    }),
    {
      name: 'bortim-analytics',
      partialize: (state) => ({
        dailyStats: state.dailyStats.slice(-90), // Keep last 90 days
        chapterAnalytics: state.chapterAnalytics,
        quizAttempts: state.quizAttempts.slice(-100), // Keep last 100 attempts
      }),
    }
  )
);
