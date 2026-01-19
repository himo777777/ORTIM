import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

// XP rewards for different actions
const XP_REWARDS = {
  CHAPTER_COMPLETE: 100,
  QUIZ_PASS: 50,
  QUIZ_PERFECT: 100,
  STREAK_DAY: 10,
  FIRST_LOGIN: 25,
};

// Level thresholds (XP required for each level)
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  800,    // Level 5
  1200,   // Level 6
  1700,   // Level 7
  2300,   // Level 8
  3000,   // Level 9
  3800,   // Level 10
  4700,   // Level 11
  5700,   // Level 12
  6800,   // Level 13
  8000,   // Level 14
  9300,   // Level 15
  10700,  // Level 16
  12200,  // Level 17
  13800,  // Level 18
  15500,  // Level 19
  17300,  // Level 20
  19200,  // Level 21
  21200,  // Level 22
  23300,  // Level 23
  25500,  // Level 24
  27800,  // Level 25
  30200,  // Level 26
  32700,  // Level 27
  35300,  // Level 28
  38000,  // Level 29
  40800,  // Level 30
  43700,  // Level 31
  46700,  // Level 32
  49800,  // Level 33
  53000,  // Level 34
  56300,  // Level 35
];

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Calculate level from XP
   */
  calculateLevel(xp: number): number {
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (xp >= LEVEL_THRESHOLDS[i]) {
        return i + 1;
      }
    }
    return 1;
  }

  /**
   * Get XP needed for next level
   */
  getXPForNextLevel(currentLevel: number): number {
    if (currentLevel >= LEVEL_THRESHOLDS.length) {
      return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + (currentLevel - LEVEL_THRESHOLDS.length + 1) * 5000;
    }
    return LEVEL_THRESHOLDS[currentLevel];
  }

  /**
   * Award XP to a user
   */
  async awardXP(userId: string, amount: number, reason: string): Promise<{
    newTotalXP: number;
    newLevel: number;
    leveledUp: boolean;
    previousLevel: number;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { totalXP: true, level: true, weeklyXP: true, monthlyXP: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const previousLevel = user.level;
    const newTotalXP = user.totalXP + amount;
    const newLevel = this.calculateLevel(newTotalXP);
    const leveledUp = newLevel > previousLevel;

    // Reset weekly/monthly XP if needed
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalXP: newTotalXP,
        level: newLevel,
        weeklyXP: { increment: amount },
        monthlyXP: { increment: amount },
        lastActivityAt: now,
      },
    });

    // Check and award any new badges
    await this.checkAndAwardBadges(userId);

    return {
      newTotalXP,
      newLevel,
      leveledUp,
      previousLevel,
    };
  }

  /**
   * Update user streak
   */
  async updateStreak(userId: string): Promise<{
    currentStreak: number;
    longestStreak: number;
    streakBroken: boolean;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastActivityAt: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const lastActivity = user.lastActivityAt
      ? new Date(user.lastActivityAt.getFullYear(), user.lastActivityAt.getMonth(), user.lastActivityAt.getDate())
      : null;

    let currentStreak = user.currentStreak;
    let streakBroken = false;

    if (!lastActivity) {
      // First activity ever
      currentStreak = 1;
    } else {
      const dayDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 0) {
        // Same day, streak unchanged
      } else if (dayDiff === 1) {
        // Consecutive day, increment streak
        currentStreak++;
        // Award streak XP
        await this.awardXP(userId, XP_REWARDS.STREAK_DAY, 'daily_streak');
      } else {
        // Streak broken
        streakBroken = true;
        currentStreak = 1;
      }
    }

    const longestStreak = Math.max(currentStreak, user.longestStreak);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentStreak,
        longestStreak,
        lastActivityAt: now,
      },
    });

    return {
      currentStreak,
      longestStreak,
      streakBroken,
    };
  }

  /**
   * Get user gamification stats
   */
  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalXP: true,
        level: true,
        currentStreak: true,
        longestStreak: true,
        weeklyXP: true,
        monthlyXP: true,
        lastActivityAt: true,
        badges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const xpForCurrentLevel = LEVEL_THRESHOLDS[user.level - 1] || 0;
    const xpForNextLevel = this.getXPForNextLevel(user.level);
    const xpProgress = user.totalXP - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - xpForCurrentLevel;

    return {
      totalXP: user.totalXP,
      level: user.level,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      weeklyXP: user.weeklyXP,
      monthlyXP: user.monthlyXP,
      xpProgress,
      xpNeeded,
      progressPercent: Math.min(100, Math.round((xpProgress / xpNeeded) * 100)),
      badges: user.badges.map(ub => ({
        ...ub.badge,
        earnedAt: ub.earnedAt,
      })),
    };
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(period: 'weekly' | 'monthly' | 'allTime', limit = 10, userId?: string) {
    const orderByField = period === 'weekly' ? 'weeklyXP' : period === 'monthly' ? 'monthlyXP' : 'totalXP';

    const users = await this.prisma.user.findMany({
      where: {
        role: 'PARTICIPANT',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        totalXP: true,
        weeklyXP: true,
        monthlyXP: true,
        level: true,
        currentStreak: true,
      },
      orderBy: {
        [orderByField]: 'desc',
      },
      take: limit,
    });

    // If user is not in top results, get their rank
    let currentUserEntry = null;
    if (userId) {
      const userInList = users.find(u => u.id === userId);
      if (!userInList) {
        const currentUser = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            totalXP: true,
            weeklyXP: true,
            monthlyXP: true,
            level: true,
            currentStreak: true,
          },
        });

        if (currentUser) {
          // Calculate user's rank
          const xpField = orderByField as 'totalXP' | 'weeklyXP' | 'monthlyXP';
          const userXP = currentUser[xpField];
          const rank = await this.prisma.user.count({
            where: {
              role: 'PARTICIPANT',
              [orderByField]: { gt: userXP },
            },
          });

          currentUserEntry = {
            rank: rank + 1,
            userId: currentUser.id,
            userName: `${currentUser.firstName} ${currentUser.lastName}`,
            totalXP: period === 'allTime' ? currentUser.totalXP :
                     period === 'weekly' ? currentUser.weeklyXP : currentUser.monthlyXP,
            level: currentUser.level,
            currentStreak: currentUser.currentStreak,
            isCurrentUser: true,
          };
        }
      }
    }

    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      totalXP: period === 'allTime' ? user.totalXP :
               period === 'weekly' ? user.weeklyXP : user.monthlyXP,
      level: user.level,
      currentStreak: user.currentStreak,
      isCurrentUser: userId ? user.id === userId : false,
    }));

    return {
      entries: leaderboard,
      currentUserEntry,
    };
  }

  /**
   * Get all available badges
   */
  async getAllBadges() {
    return this.prisma.badge.findMany({
      where: { isActive: true },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
      ],
    });
  }

  /**
   * Get user's earned badges
   */
  async getUserBadges(userId: string) {
    const userBadges = await this.prisma.userBadge.findMany({
      where: { userId },
      include: { badge: true },
      orderBy: { earnedAt: 'desc' },
    });

    return userBadges.map(ub => ({
      ...ub.badge,
      earnedAt: ub.earnedAt,
    }));
  }

  /**
   * Check and award badges based on user progress
   */
  async checkAndAwardBadges(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        chapterProgress: true,
        quizAttempts: true,
        badges: { include: { badge: true } },
      },
    });

    if (!user) return [];

    const earnedBadgeCodes = user.badges.map(ub => ub.badge.code);
    const allBadges = await this.prisma.badge.findMany({ where: { isActive: true } });
    const newlyEarned: string[] = [];

    for (const badge of allBadges) {
      if (earnedBadgeCodes.includes(badge.code)) continue;

      const requirement = badge.requirement as Record<string, number> | null;
      let earned = false;

      // Check badge requirements
      switch (badge.code) {
        case 'FIRST_CHAPTER':
          earned = user.chapterProgress.some(cp => cp.completedAt !== null);
          break;
        case 'FIVE_CHAPTERS':
          earned = user.chapterProgress.filter(cp => cp.completedAt !== null).length >= 5;
          break;
        case 'ALL_CHAPTERS':
          earned = user.chapterProgress.filter(cp => cp.completedAt !== null).length >= 17;
          break;
        case 'FIRST_QUIZ':
          earned = user.quizAttempts.some(qa => qa.passed);
          break;
        case 'PERFECT_QUIZ':
          earned = user.quizAttempts.some(qa => qa.score === 100);
          break;
        case 'QUIZ_MASTER':
          earned = user.quizAttempts.filter(qa => qa.passed).length >= 10;
          break;
        case 'STREAK_7':
          earned = user.currentStreak >= 7 || user.longestStreak >= 7;
          break;
        case 'STREAK_30':
          earned = user.currentStreak >= 30 || user.longestStreak >= 30;
          break;
        case 'STREAK_100':
          earned = user.currentStreak >= 100 || user.longestStreak >= 100;
          break;
        case 'LEVEL_5':
          earned = user.level >= 5;
          break;
        case 'LEVEL_10':
          earned = user.level >= 10;
          break;
        case 'LEVEL_20':
          earned = user.level >= 20;
          break;
        case 'LEVEL_30':
          earned = user.level >= 30;
          break;
        case 'XP_1000':
          earned = user.totalXP >= 1000;
          break;
        case 'XP_5000':
          earned = user.totalXP >= 5000;
          break;
        case 'XP_10000':
          earned = user.totalXP >= 10000;
          break;
        default:
          // Check generic requirement format
          if (requirement) {
            if (requirement.chaptersCompleted) {
              earned = user.chapterProgress.filter(cp => cp.completedAt !== null).length >= requirement.chaptersCompleted;
            }
            if (requirement.quizzesPassed) {
              earned = user.quizAttempts.filter(qa => qa.passed).length >= requirement.quizzesPassed;
            }
            if (requirement.streakDays) {
              earned = user.currentStreak >= requirement.streakDays || user.longestStreak >= requirement.streakDays;
            }
            if (requirement.level) {
              earned = user.level >= requirement.level;
            }
            if (requirement.totalXP) {
              earned = user.totalXP >= requirement.totalXP;
            }
          }
      }

      if (earned) {
        await this.prisma.userBadge.create({
          data: {
            userId,
            badgeId: badge.id,
          },
        });

        // Award badge XP
        if (badge.xpReward > 0) {
          await this.prisma.user.update({
            where: { id: userId },
            data: {
              totalXP: { increment: badge.xpReward },
              weeklyXP: { increment: badge.xpReward },
              monthlyXP: { increment: badge.xpReward },
            },
          });
        }

        newlyEarned.push(badge.code);
      }
    }

    return newlyEarned;
  }

  /**
   * Handle quiz completion - award XP and update progress
   */
  async onQuizComplete(userId: string, score: number, passed: boolean): Promise<{
    xpEarned: number;
    newBadges: string[];
  }> {
    let xpEarned = 0;

    if (passed) {
      xpEarned = score === 100 ? XP_REWARDS.QUIZ_PERFECT : XP_REWARDS.QUIZ_PASS;
      await this.awardXP(userId, xpEarned, passed ? 'quiz_pass' : 'quiz_perfect');
    }

    await this.updateStreak(userId);
    const newBadges = await this.checkAndAwardBadges(userId);

    return { xpEarned, newBadges };
  }

  /**
   * Handle chapter completion - award XP
   */
  async onChapterComplete(userId: string): Promise<{
    xpEarned: number;
    newBadges: string[];
  }> {
    const xpEarned = XP_REWARDS.CHAPTER_COMPLETE;
    await this.awardXP(userId, xpEarned, 'chapter_complete');
    await this.updateStreak(userId);
    const newBadges = await this.checkAndAwardBadges(userId);

    return { xpEarned, newBadges };
  }
}
