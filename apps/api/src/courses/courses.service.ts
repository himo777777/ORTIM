import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { UserRole } from '../types/prisma-types';

@Injectable()
export class CoursesService {
  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) {}

  async findAll(userRole?: UserRole) {
    // Filter out instructor-only courses for non-instructors/admins
    const showInstructorCourses = userRole === UserRole.INSTRUCTOR || userRole === UserRole.ADMIN;

    return this.prisma.course.findMany({
      where: {
        isActive: true,
        ...(showInstructorCourses ? {} : { instructorOnly: false }),
      },
      include: {
        parts: {
          orderBy: { sortOrder: 'asc' },
          include: {
            chapters: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                chapterNumber: true,
                title: true,
                slug: true,
                estimatedMinutes: true,
              },
            },
          },
        },
      },
    });
  }

  async findByCode(code: string) {
    return this.prisma.course.findUnique({
      where: { code },
      include: {
        parts: {
          orderBy: { sortOrder: 'asc' },
          include: {
            chapters: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });
  }

  async findChapter(slug: string) {
    return this.prisma.chapter.findUnique({
      where: { slug },
      include: {
        learningObjectives: { orderBy: { sortOrder: 'asc' } },
        algorithms: { where: { isActive: true } },
        part: {
          include: {
            course: {
              select: { instructorOnly: true },
            },
          },
        },
      },
    });
  }

  async findAlgorithms() {
    return this.prisma.algorithm.findMany({
      where: { isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async findAlgorithm(code: string) {
    return this.prisma.algorithm.findUnique({
      where: { code },
    });
  }

  async getChapterProgress(userId: string, chapterId: string) {
    return this.prisma.chapterProgress.findUnique({
      where: {
        userId_chapterId: { userId, chapterId },
      },
    });
  }

  async updateChapterProgress(
    userId: string,
    chapterId: string,
    data: { readProgress?: number; quizPassed?: boolean; bestQuizScore?: number },
  ) {
    const existing = await this.prisma.chapterProgress.findUnique({
      where: { userId_chapterId: { userId, chapterId } },
    });

    const wasCompleted = existing?.completedAt !== null;
    const isNowComplete = (data.readProgress ?? existing?.readProgress ?? 0) >= 100 &&
                          (data.quizPassed ?? existing?.quizPassed ?? false);

    const progress = await this.prisma.chapterProgress.upsert({
      where: { userId_chapterId: { userId, chapterId } },
      create: {
        userId,
        chapterId,
        readProgress: data.readProgress ?? 0,
        quizPassed: data.quizPassed ?? false,
        bestQuizScore: data.bestQuizScore,
        completedAt: isNowComplete ? new Date() : null,
      },
      update: {
        readProgress: data.readProgress ?? undefined,
        quizPassed: data.quizPassed ?? undefined,
        bestQuizScore: data.bestQuizScore ?? undefined,
        lastAccessedAt: new Date(),
        completedAt: isNowComplete && !wasCompleted ? new Date() : undefined,
      },
    });

    // Award XP if chapter was just completed
    let gamificationResult = null;
    if (isNowComplete && !wasCompleted) {
      gamificationResult = await this.gamificationService.onChapterComplete(userId);
    }

    return {
      progress,
      ...(gamificationResult && {
        xpEarned: gamificationResult.xpEarned,
        newBadges: gamificationResult.newBadges,
      }),
    };
  }

  async getUserProgress(userId: string) {
    const progress = await this.prisma.chapterProgress.findMany({
      where: { userId },
      include: {
        chapter: {
          select: {
            id: true,
            chapterNumber: true,
            title: true,
            slug: true,
            part: {
              select: { partNumber: true, title: true },
            },
          },
        },
      },
    });

    const totalChapters = await this.prisma.chapter.count({
      where: { isActive: true },
    });

    const completedChapters = progress.filter(p => p.completedAt !== null).length;
    const overallProgress = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

    return {
      totalChapters,
      completedChapters,
      overallProgress: Math.round(overallProgress),
      chapters: progress,
    };
  }

  async getCourseProgress(userId: string, courseCode: string) {
    // Get the course with its chapters
    const course = await this.prisma.course.findUnique({
      where: { code: courseCode },
      include: {
        parts: {
          orderBy: { sortOrder: 'asc' },
          include: {
            chapters: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              select: {
                id: true,
                chapterNumber: true,
                title: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!course) {
      return null;
    }

    // Get all chapter IDs for this course
    const chapterIds = course.parts.flatMap(p => p.chapters.map(c => c.id));

    // Get user's progress for these chapters
    const progress = await this.prisma.chapterProgress.findMany({
      where: {
        userId,
        chapterId: { in: chapterIds },
      },
    });

    // Create a map for quick lookup
    const progressMap = new Map(progress.map(p => [p.chapterId, p]));

    // Build chapter progress with details
    const chaptersWithProgress = course.parts.flatMap(part =>
      part.chapters.map(chapter => {
        const chapterProgress = progressMap.get(chapter.id);
        return {
          chapterId: chapter.id,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          slug: chapter.slug,
          partNumber: part.partNumber,
          readProgress: chapterProgress?.readProgress ?? 0,
          quizPassed: chapterProgress?.quizPassed ?? false,
          completed: chapterProgress?.completedAt !== null,
          completedAt: chapterProgress?.completedAt ?? null,
        };
      })
    );

    const totalChapters = chapterIds.length;
    const completedChapters = chaptersWithProgress.filter(c => c.completed).length;
    const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

    return {
      courseCode: course.code,
      courseName: course.name,
      totalChapters,
      completedChapters,
      overallProgress,
      chapters: chaptersWithProgress,
    };
  }
}
