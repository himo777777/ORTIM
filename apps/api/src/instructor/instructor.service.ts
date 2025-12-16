import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class InstructorService {
  constructor(private prisma: PrismaService) {}

  async findCohorts(instructorId: string) {
    return this.prisma.cohort.findMany({
      where: { instructorId },
      include: {
        course: { select: { name: true, code: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findCohort(id: string) {
    return this.prisma.cohort.findUnique({
      where: { id },
      include: {
        course: true,
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                workplace: true,
              },
            },
            osceAssessments: true,
          },
        },
      },
    });
  }

  async createCohort(instructorId: string, data: {
    courseId: string;
    name: string;
    description?: string;
    startDate: Date;
    endDate?: Date;
    maxParticipants?: number;
  }) {
    return this.prisma.cohort.create({
      data: {
        ...data,
        instructorId,
      },
    });
  }

  async getCohortStats(cohortId: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        enrollments: {
          include: {
            user: true,
            osceAssessments: true,
          },
        },
      },
    });

    if (!cohort) return null;

    const totalParticipants = cohort.enrollments.length;
    const completedParticipants = cohort.enrollments.filter(
      (e: { status: string }) => e.status === 'completed'
    ).length;

    return {
      totalParticipants,
      activeParticipants: totalParticipants - completedParticipants,
      completedParticipants,
      averageProgress: 0, // TODO: Calculate from chapter progress
    };
  }

  async getCohortParticipants(cohortId: string) {
    const cohort = await this.prisma.cohort.findUnique({
      where: { id: cohortId },
      include: {
        enrollments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                workplace: true,
                speciality: true,
              },
            },
            osceAssessments: {
              orderBy: { stationNumber: 'asc' },
            },
          },
          orderBy: { enrolledAt: 'asc' },
        },
      },
    });

    if (!cohort) return null;

    // Get chapter progress for each participant
    const participantIds = cohort.enrollments.map((e: { user: { id: string } }) => e.user.id);
    const progressData = await this.prisma.chapterProgress.findMany({
      where: { userId: { in: participantIds } },
    });

    // Group progress by user
    type ProgressItem = typeof progressData[number];
    const progressByUser = progressData.reduce((acc: Record<string, ProgressItem[]>, p: ProgressItem) => {
      if (!acc[p.userId]) acc[p.userId] = [];
      acc[p.userId].push(p);
      return acc;
    }, {} as Record<string, ProgressItem[]>);

    type EnrollmentType = typeof cohort.enrollments[number];
    return cohort.enrollments.map((enrollment: EnrollmentType) => {
      const userProgress = progressByUser[enrollment.user.id] || [];
      const completedChapters = userProgress.filter((p: ProgressItem) => p.quizPassed).length;
      const totalChapters = 17; // B-ORTIM has 17 chapters

      // Calculate OSCE status
      const osceStations = enrollment.osceAssessments;
      const osceCompleted = osceStations.length;
      const oscePassed = osceStations.filter((a: { passed: boolean }) => a.passed).length;

      return {
        enrollmentId: enrollment.id,
        status: enrollment.status,
        user: enrollment.user,
        progress: {
          chaptersCompleted: completedChapters,
          totalChapters,
          percentage: Math.round((completedChapters / totalChapters) * 100),
        },
        osce: {
          completed: osceCompleted,
          passed: oscePassed,
          total: 5, // Standard OSCE stations
          assessments: osceStations,
        },
      };
    });
  }

  async createOsceAssessment(assessorId: string, enrollmentId: string, data: {
    stationNumber: number;
    stationName: string;
    passed: boolean;
    score?: number;
    comments?: string;
  }) {
    return this.prisma.oSCEAssessment.create({
      data: {
        enrollmentId,
        assessorId,
        stationNumber: data.stationNumber,
        stationName: data.stationName,
        passed: data.passed,
        score: data.score,
        comments: data.comments,
        assessedAt: new Date(),
      },
    });
  }

  async updateOsceAssessment(assessmentId: string, data: {
    passed?: boolean;
    score?: number;
    comments?: string;
  }) {
    return this.prisma.oSCEAssessment.update({
      where: { id: assessmentId },
      data: {
        ...data,
        assessedAt: new Date(),
      },
    });
  }

  async getOsceAssessments(enrollmentId: string) {
    return this.prisma.oSCEAssessment.findMany({
      where: { enrollmentId },
      include: {
        assessor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { stationNumber: 'asc' },
    });
  }
}
