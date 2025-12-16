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
      e => e.status === 'completed'
    ).length;

    return {
      totalParticipants,
      activeParticipants: totalParticipants - completedParticipants,
      completedParticipants,
      averageProgress: 0, // TODO: Calculate from chapter progress
    };
  }
}
