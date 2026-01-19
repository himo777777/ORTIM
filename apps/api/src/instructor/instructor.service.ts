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
      const totalChapters = 17; // ORTAC has 17 chapters

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

  // ===========================================
  // EPA (Entrustable Professional Activities)
  // ===========================================

  async listEPAs() {
    return this.prisma.ePA.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createEPAAssessment(assessorId: string, data: {
    participantId: string;
    epaId: string;
    entrustmentLevel: number;
    comments?: string;
  }) {
    return this.prisma.ePAAssessment.create({
      data: {
        epaId: data.epaId,
        participantId: data.participantId,
        assessorId: assessorId,
        entrustmentLevel: data.entrustmentLevel,
        comments: data.comments,
        assessedAt: new Date(),
      },
      include: {
        epa: {
          select: {
            code: true,
            title: true,
          },
        },
      },
    });
  }

  async getEPAAssessments(participantId: string) {
    return this.prisma.ePAAssessment.findMany({
      where: { participantId },
      include: {
        epa: {
          select: {
            id: true,
            code: true,
            title: true,
            description: true,
          },
        },
      },
      orderBy: [
        { epa: { sortOrder: 'asc' } },
        { assessedAt: 'desc' },
      ],
    });
  }

  async getCohortEPAAssessments(cohortId: string) {
    // Get all participants in the cohort
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
              },
            },
          },
        },
      },
    });

    if (!cohort) return null;

    const participantIds = cohort.enrollments.map(e => e.user.id);

    // Get all EPA assessments for these participants
    const assessments = await this.prisma.ePAAssessment.findMany({
      where: { participantId: { in: participantIds } },
      include: {
        epa: {
          select: {
            id: true,
            code: true,
            title: true,
          },
        },
      },
      orderBy: { assessedAt: 'desc' },
    });

    // Get all EPAs
    const allEPAs = await this.prisma.ePA.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    // Group assessments by participant
    type AssessmentType = typeof assessments[number];
    const assessmentsByParticipant = assessments.reduce((acc: Record<string, AssessmentType[]>, a: AssessmentType) => {
      if (!acc[a.participantId]) acc[a.participantId] = [];
      acc[a.participantId].push(a);
      return acc;
    }, {} as Record<string, AssessmentType[]>);

    return {
      cohort: {
        id: cohort.id,
        name: cohort.name,
      },
      epas: allEPAs,
      participants: cohort.enrollments.map(e => ({
        userId: e.user.id,
        firstName: e.user.firstName,
        lastName: e.user.lastName,
        assessments: assessmentsByParticipant[e.user.id] || [],
        completedEPAs: new Set(
          (assessmentsByParticipant[e.user.id] || []).map((a: AssessmentType) => a.epaId)
        ).size,
        totalEPAs: allEPAs.length,
      })),
    };
  }

  // ===========================================
  // OSCE Stations (from database)
  // ===========================================

  async getOSCEStations() {
    return this.prisma.oSCEStation.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // ===========================================
  // Pilot Evaluation (Kirkpatrick)
  // ===========================================

  async submitPilotEvaluation(participantId: string, data: {
    kirkpatrickLevel: 'REACTION' | 'LEARNING' | 'BEHAVIOR' | 'RESULTS';
    assessmentType: string;
    score?: number;
    maxScore?: number;
    responses?: Record<string, unknown>;
    notes?: string;
  }) {
    return this.prisma.pilotAssessment.create({
      data: {
        participantId,
        kirkpatrickLevel: data.kirkpatrickLevel,
        assessmentType: data.assessmentType,
        score: data.score,
        maxScore: data.maxScore,
        responses: data.responses as any,
        notes: data.notes,
        assessedAt: new Date(),
      },
    });
  }

  async getPilotResults(cohortId?: string) {
    let participantIds: string[] | undefined;

    if (cohortId) {
      const cohort = await this.prisma.cohort.findUnique({
        where: { id: cohortId },
        include: {
          enrollments: {
            select: { user: { select: { id: true } } },
          },
        },
      });
      if (cohort) {
        participantIds = cohort.enrollments.map(e => e.user.id);
      }
    }

    const assessments = await this.prisma.pilotAssessment.findMany({
      where: participantIds ? { participantId: { in: participantIds } } : {},
      orderBy: { assessedAt: 'desc' },
    });

    // Group by Kirkpatrick level
    type AssessmentType = typeof assessments[number];
    const byLevel = assessments.reduce((acc: Record<string, AssessmentType[]>, a: AssessmentType) => {
      if (!acc[a.kirkpatrickLevel]) acc[a.kirkpatrickLevel] = [];
      acc[a.kirkpatrickLevel].push(a);
      return acc;
    }, {} as Record<string, AssessmentType[]>);

    // Calculate averages for REACTION level
    const reactionAssessments = byLevel['REACTION'] || [];
    const satisfactionScores = reactionAssessments
      .filter((a: AssessmentType) => a.assessmentType === 'satisfaction' && a.score !== null)
      .map((a: AssessmentType) => a.score as number);

    const averageSatisfaction = satisfactionScores.length > 0
      ? satisfactionScores.reduce((sum: number, s: number) => sum + s, 0) / satisfactionScores.length
      : null;

    return {
      summary: {
        totalParticipants: new Set(assessments.map((a: AssessmentType) => a.participantId)).size,
        reactionCount: (byLevel['REACTION'] || []).length,
        learningCount: (byLevel['LEARNING'] || []).length,
        behaviorCount: (byLevel['BEHAVIOR'] || []).length,
        resultsCount: (byLevel['RESULTS'] || []).length,
        averageSatisfaction,
      },
      assessments: byLevel,
    };
  }

  async getParticipantPilotResults(participantId: string) {
    const assessments = await this.prisma.pilotAssessment.findMany({
      where: { participantId },
      orderBy: { assessedAt: 'desc' },
    });

    const epaAssessments = await this.prisma.ePAAssessment.findMany({
      where: { participantId },
      include: {
        epa: {
          select: {
            code: true,
            title: true,
          },
        },
      },
      orderBy: { assessedAt: 'desc' },
    });

    return {
      pilotAssessments: assessments,
      epaAssessments,
    };
  }

  // ===========================================
  // Instructor Training Status (TTT Course)
  // ===========================================

  async getMyTrainingStatus(userId: string) {
    // Get TTT course
    const tttCourse = await this.prisma.course.findUnique({
      where: { code: 'ORTAC-TTT-2025' },
      include: {
        parts: {
          orderBy: { sortOrder: 'asc' },
          include: {
            chapters: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
              select: { id: true, chapterNumber: true, title: true, slug: true },
            },
          },
        },
      },
    });

    if (!tttCourse) {
      return {
        tttProgress: null,
        osceStatus: null,
        certificate: null,
        message: 'Instruktörskursen är inte tillgänglig',
      };
    }

    // Get all chapter IDs from TTT course
    const chapterIds = tttCourse.parts.flatMap(p => p.chapters.map(c => c.id));

    // Get user's progress for these chapters
    const progress = await this.prisma.chapterProgress.findMany({
      where: { userId, chapterId: { in: chapterIds } },
    });

    const progressMap = new Map(progress.map(p => [p.chapterId, p]));

    // Calculate progress
    const chaptersWithProgress = chapterIds.map(id => {
      const chapterProgress = progressMap.get(id);
      return {
        chapterId: id,
        readProgress: chapterProgress?.readProgress ?? 0,
        quizPassed: chapterProgress?.quizPassed ?? false,
        completed: chapterProgress?.completedAt !== null && chapterProgress?.completedAt !== undefined,
      };
    });

    const completedCount = chaptersWithProgress.filter(c => c.completed).length;
    const quizPassedCount = chaptersWithProgress.filter(c => c.quizPassed).length;
    const totalChapters = chapterIds.length;

    // Check TTT-OSCE status (if enrolled in TTT cohort)
    const tttEnrollment = await this.prisma.enrollment.findFirst({
      where: {
        userId,
        cohort: { courseId: tttCourse.id },
      },
      include: {
        osceAssessments: true,
        cohort: { select: { id: true, name: true } },
      },
    });

    let osceStatus: {
      enrolled: boolean;
      cohortId: string | null;
      cohortName: string | null;
      assessmentsCompleted: number;
      assessmentsPassed: number;
      totalStations: number;
      passed: boolean | null;
    } | null = null;

    if (tttEnrollment) {
      const assessments = tttEnrollment.osceAssessments;
      const passedCount = assessments.filter(a => a.passed).length;
      // TTT has 4 OSCE stations
      const totalStations = 4;
      const allPassed = passedCount >= totalStations;

      osceStatus = {
        enrolled: true,
        cohortId: tttEnrollment.cohort.id,
        cohortName: tttEnrollment.cohort.name,
        assessmentsCompleted: assessments.length,
        assessmentsPassed: passedCount,
        totalStations,
        passed: assessments.length >= totalStations ? allPassed : null, // null = not yet assessed
      };
    }

    // Check certificate status
    const certificate = await this.prisma.certificate.findFirst({
      where: {
        userId,
        course: { code: 'ORTAC-TTT-2025' },
      },
      select: {
        id: true,
        certificateNumber: true,
        issuedAt: true,
        validUntil: true,
        verificationUrl: true,
      },
    });

    // Check if eligible for certificate (all chapters completed + all quizzes passed)
    const eligibleForCertificate = completedCount === totalChapters && quizPassedCount === totalChapters;

    return {
      tttProgress: {
        courseCode: tttCourse.code,
        courseName: tttCourse.name,
        totalChapters,
        completedChapters: completedCount,
        quizzesPassed: quizPassedCount,
        percentage: totalChapters > 0 ? Math.round((completedCount / totalChapters) * 100) : 0,
        chapters: chaptersWithProgress,
      },
      osceStatus,
      certificate: certificate || null,
      eligibleForCertificate,
    };
  }
}
