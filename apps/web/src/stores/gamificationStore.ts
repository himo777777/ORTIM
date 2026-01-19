import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  requirement: {
    type: 'chapters_completed' | 'quizzes_passed' | 'streak_days' | 'total_xp' | 'certificates' | 'review_cards';
    count: number;
  };
}

export interface UnlockedAchievement {
  id: string;
  unlockedAt: string;
}

export interface GamificationState {
  // State
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string | null;
  achievements: Achievement[];
  unlockedAchievements: UnlockedAchievement[];
  xpToNextLevel: number;

  // Computed getters
  getCurrentLevelXP: () => number;
  getAchievementProgress: (achievementId: string) => number;

  // Actions
  addXp: (amount: number, reason: string) => void;
  updateStreak: () => void;
  unlockAchievement: (achievementId: string) => void;
  checkAchievements: (stats: {
    chaptersCompleted: number;
    quizzesPassed: number;
    totalXp: number;
    certificates: number;
    reviewCards: number;
  }) => void;
}

const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_chapter',
    title: 'Första steget',
    description: 'Slutför ditt första kapitel',
    icon: '📖',
    requirement: { type: 'chapters_completed', count: 1 },
  },
  {
    id: 'five_chapters',
    title: 'Läshäst',
    description: 'Slutför 5 kapitel',
    icon: '📚',
    requirement: { type: 'chapters_completed', count: 5 },
  },
  {
    id: 'all_chapters',
    title: 'Bokmal',
    description: 'Slutför alla kapitel',
    icon: '🎓',
    requirement: { type: 'chapters_completed', count: 10 },
  },
  {
    id: 'first_quiz',
    title: 'Quizmaster Apprentice',
    description: 'Klara ditt första quiz',
    icon: '✅',
    requirement: { type: 'quizzes_passed', count: 1 },
  },
  {
    id: 'ten_quizzes',
    title: 'Quizmaster',
    description: 'Klara 10 quiz',
    icon: '🏆',
    requirement: { type: 'quizzes_passed', count: 10 },
  },
  {
    id: 'streak_3',
    title: 'På rulle',
    description: '3 dagar i rad',
    icon: '🔥',
    requirement: { type: 'streak_days', count: 3 },
  },
  {
    id: 'streak_7',
    title: 'Veckorutinen',
    description: '7 dagar i rad',
    icon: '💪',
    requirement: { type: 'streak_days', count: 7 },
  },
  {
    id: 'streak_30',
    title: 'Månadsmästare',
    description: '30 dagar i rad',
    icon: '👑',
    requirement: { type: 'streak_days', count: 30 },
  },
  {
    id: 'xp_100',
    title: 'Nybörjare',
    description: 'Samla 100 XP',
    icon: '⭐',
    requirement: { type: 'total_xp', count: 100 },
  },
  {
    id: 'xp_500',
    title: 'Avancerad',
    description: 'Samla 500 XP',
    icon: '🌟',
    requirement: { type: 'total_xp', count: 500 },
  },
  {
    id: 'xp_1000',
    title: 'Expert',
    description: 'Samla 1000 XP',
    icon: '💫',
    requirement: { type: 'total_xp', count: 1000 },
  },
  {
    id: 'first_certificate',
    title: 'Certifierad',
    description: 'Få ditt första certifikat',
    icon: '📜',
    requirement: { type: 'certificates', count: 1 },
  },
  {
    id: 'review_master',
    title: 'Repetitionsexpert',
    description: 'Granska 50 repetitionskort',
    icon: '🧠',
    requirement: { type: 'review_cards', count: 50 },
  },
];

const XP_PER_LEVEL = 100;

function calculateLevel(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isYesterday(date1: Date, date2: Date): boolean {
  const yesterday = new Date(date2);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(date1, yesterday);
}

export const useGamificationStore = create<GamificationState>()(
  persist(
    (set, get) => ({
      totalXP: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      achievements: ACHIEVEMENTS,
      unlockedAchievements: [],
      xpToNextLevel: XP_PER_LEVEL,

      getCurrentLevelXP: () => {
        const state = get();
        return state.totalXP % XP_PER_LEVEL;
      },

      getAchievementProgress: (achievementId: string) => {
        const state = get();
        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return 0;

        const { type, count } = achievement.requirement;
        let currentValue = 0;

        switch (type) {
          case 'chapters_completed':
            // This would need to be fetched from course progress
            currentValue = 0;
            break;
          case 'quizzes_passed':
            currentValue = 0;
            break;
          case 'streak_days':
            currentValue = state.currentStreak;
            break;
          case 'total_xp':
            currentValue = state.totalXP;
            break;
          case 'certificates':
            currentValue = 0;
            break;
          case 'review_cards':
            currentValue = 0;
            break;
        }

        return Math.min(currentValue, count);
      },

      addXp: (amount, reason) => {
        set((state) => {
          const newXp = state.totalXP + amount;
          const newLevel = calculateLevel(newXp);
          console.log(`+${amount} XP: ${reason}`);
          return {
            totalXP: newXp,
            level: newLevel,
          };
        });
        get().updateStreak();
      },

      updateStreak: () => {
        set((state) => {
          const today = new Date();
          const lastActivity = state.lastActivityDate
            ? new Date(state.lastActivityDate)
            : null;

          if (!lastActivity) {
            return {
              currentStreak: 1,
              longestStreak: Math.max(state.longestStreak, 1),
              lastActivityDate: today.toISOString(),
            };
          }

          if (isSameDay(lastActivity, today)) {
            return state; // Already counted today
          }

          if (isYesterday(lastActivity, today)) {
            const newStreak = state.currentStreak + 1;
            return {
              currentStreak: newStreak,
              longestStreak: Math.max(state.longestStreak, newStreak),
              lastActivityDate: today.toISOString(),
            };
          }

          // Streak broken
          return {
            currentStreak: 1,
            longestStreak: state.longestStreak,
            lastActivityDate: today.toISOString(),
          };
        });
      },

      unlockAchievement: (achievementId) => {
        set((state) => {
          if (state.unlockedAchievements.some(a => a.id === achievementId)) {
            return state;
          }
          return {
            unlockedAchievements: [
              ...state.unlockedAchievements,
              { id: achievementId, unlockedAt: new Date().toISOString() }
            ],
          };
        });
      },

      checkAchievements: (stats) => {
        const state = get();
        const allStats = {
          ...stats,
          streak_days: state.currentStreak,
        };

        ACHIEVEMENTS.forEach((achievement) => {
          if (state.unlockedAchievements.some(a => a.id === achievement.id)) {
            return;
          }

          const { type, count } = achievement.requirement;
          let currentValue = 0;

          switch (type) {
            case 'chapters_completed':
              currentValue = allStats.chaptersCompleted;
              break;
            case 'quizzes_passed':
              currentValue = allStats.quizzesPassed;
              break;
            case 'streak_days':
              currentValue = allStats.streak_days;
              break;
            case 'total_xp':
              currentValue = allStats.totalXp;
              break;
            case 'certificates':
              currentValue = allStats.certificates;
              break;
            case 'review_cards':
              currentValue = allStats.reviewCards;
              break;
          }

          if (currentValue >= count) {
            state.unlockAchievement(achievement.id);
          }
        });
      },
    }),
    {
      name: 'ortac-gamification',
    }
  )
);
