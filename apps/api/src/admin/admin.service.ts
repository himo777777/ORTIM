import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { UserRole, BloomLevel } from '../types/prisma-types';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // DASHBOARD
  // ============================================

  async getDashboardStats() {
    const [
      userCount,
      instructorCount,
      courseCount,
      cohortCount,
      questionCount,
      algorithmCount,
      certificateCount,
      activeEnrollments,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
      this.prisma.course.count(),
      this.prisma.cohort.count({ where: { isActive: true } }),
      this.prisma.quizQuestion.count(),
      this.prisma.algorithm.count(),
      this.prisma.certificate.count(),
      this.prisma.enrollment.count({ where: { status: 'active' } }),
    ]);

    // Recent activity
    const recentUsers = await this.prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    const recentCertificates = await this.prisma.certificate.findMany({
      take: 5,
      orderBy: { issuedAt: 'desc' },
      select: {
        id: true,
        certificateNumber: true,
        courseName: true,
        issuedAt: true,
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return {
      stats: {
        users: userCount,
        instructors: instructorCount,
        courses: courseCount,
        activeCohorts: cohortCount,
        questions: questionCount,
        algorithms: algorithmCount,
        certificates: certificateCount,
        activeEnrollments,
      },
      recentUsers,
      recentCertificates,
    };
  }

  // ============================================
  // USERS
  // ============================================

  async findAllUsers(params: {
    skip?: number;
    take?: number;
    search?: string;
    role?: UserRole;
  }) {
    const { skip = 0, take = 50, search, role } = params;

    const where: any = {};
    if (role) {
      where.role = role;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { personnummer: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          personnummer: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          workplace: true,
          speciality: true,
          createdAt: true,
          lastLoginAt: true,
          _count: {
            select: {
              enrollments: true,
              certificates: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, skip, take };
  }

  async findUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            cohort: {
              include: { course: true },
            },
          },
        },
        certificates: true,
        _count: {
          select: {
            quizAttempts: true,
            chapterProgress: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Användaren hittades inte');
    }

    return user;
  }

  async createUser(data: {
    personnummer: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    role?: UserRole;
    workplace?: string;
    speciality?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { personnummer: data.personnummer },
    });

    if (existing) {
      throw new ConflictException('Personnummer redan registrerat');
    }

    if (data.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists) {
        throw new ConflictException('E-postadress redan registrerad');
      }
    }

    return this.prisma.user.create({
      data: {
        personnummer: data.personnummer,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        role: data.role || 'PARTICIPANT',
        workplace: data.workplace,
        speciality: data.speciality,
      },
    });
  }

  async updateUser(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      role?: UserRole;
      workplace?: string;
      speciality?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Användaren hittades inte');
    }

    if (data.email && data.email !== user.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists) {
        throw new ConflictException('E-postadress redan registrerad');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Användaren hittades inte');
    }

    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  // ============================================
  // COURSES
  // ============================================

  async findAllCourses() {
    return this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            parts: true,
            cohorts: true,
          },
        },
        parts: {
          orderBy: { partNumber: 'asc' },
          include: {
            _count: {
              select: { chapters: true },
            },
          },
        },
      },
    });
  }

  async findCourse(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        parts: {
          orderBy: { partNumber: 'asc' },
          include: {
            chapters: {
              orderBy: { chapterNumber: 'asc' },
              include: {
                _count: {
                  select: {
                    quizQuestions: true,
                    algorithms: true,
                  },
                },
              },
            },
          },
        },
        cohorts: {
          orderBy: { startDate: 'desc' },
          take: 10,
          include: {
            instructor: {
              select: { firstName: true, lastName: true },
            },
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Kursen hittades inte');
    }

    return course;
  }

  async createCourse(data: {
    code: string;
    name: string;
    fullName: string;
    version: string;
    lipusNumber?: string;
    description?: string;
    estimatedHours?: number;
    passingScore?: number;
  }) {
    const existing = await this.prisma.course.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictException('Kurskod redan använd');
    }

    return this.prisma.course.create({ data });
  }

  async updateCourse(
    id: string,
    data: {
      name?: string;
      fullName?: string;
      version?: string;
      lipusNumber?: string;
      description?: string;
      estimatedHours?: number;
      passingScore?: number;
      isActive?: boolean;
    },
  ) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException('Kursen hittades inte');
    }

    return this.prisma.course.update({
      where: { id },
      data,
    });
  }

  // ============================================
  // CHAPTERS
  // ============================================

  async createChapter(data: {
    partId: string;
    chapterNumber: number;
    title: string;
    slug: string;
    content: string;
    estimatedMinutes?: number;
  }) {
    const part = await this.prisma.coursePart.findUnique({
      where: { id: data.partId },
    });

    if (!part) {
      throw new NotFoundException('Kursdelen hittades inte');
    }

    const existingSlug = await this.prisma.chapter.findUnique({
      where: { slug: data.slug },
    });

    if (existingSlug) {
      throw new ConflictException('Slug redan använd');
    }

    const maxSortOrder = await this.prisma.chapter.findFirst({
      where: { partId: data.partId },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });

    return this.prisma.chapter.create({
      data: {
        ...data,
        sortOrder: (maxSortOrder?.sortOrder || 0) + 1,
      },
    });
  }

  async updateChapter(
    id: string,
    data: {
      title?: string;
      content?: string;
      estimatedMinutes?: number;
      isActive?: boolean;
    },
  ) {
    const chapter = await this.prisma.chapter.findUnique({ where: { id } });
    if (!chapter) {
      throw new NotFoundException('Kapitlet hittades inte');
    }

    return this.prisma.chapter.update({
      where: { id },
      data: {
        ...data,
        contentVersion: data.content ? chapter.contentVersion + 1 : undefined,
      },
    });
  }

  // ============================================
  // QUESTIONS
  // ============================================

  async findAllQuestions(params: {
    skip?: number;
    take?: number;
    search?: string;
    chapterId?: string;
    bloomLevel?: BloomLevel;
  }) {
    const { skip = 0, take = 50, search, chapterId, bloomLevel } = params;

    const where: any = {};
    if (chapterId) {
      where.chapterId = chapterId;
    }
    if (bloomLevel) {
      where.bloomLevel = bloomLevel;
    }
    if (search) {
      where.OR = [
        { questionText: { contains: search, mode: 'insensitive' } },
        { questionCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [questions, total] = await Promise.all([
      this.prisma.quizQuestion.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          chapter: {
            select: { title: true, slug: true },
          },
          options: {
            orderBy: { sortOrder: 'asc' },
          },
          _count: {
            select: { attempts: true },
          },
        },
      }),
      this.prisma.quizQuestion.count({ where }),
    ]);

    return { questions, total, skip, take };
  }

  async findQuestion(id: string) {
    const question = await this.prisma.quizQuestion.findUnique({
      where: { id },
      include: {
        chapter: true,
        options: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Frågan hittades inte');
    }

    return question;
  }

  async createQuestion(data: {
    questionCode: string;
    chapterId?: string;
    bloomLevel: BloomLevel;
    questionText: string;
    explanation: string;
    reference?: string;
    isExamQuestion?: boolean;
    options: {
      optionLabel: string;
      optionText: string;
      isCorrect: boolean;
    }[];
  }) {
    const existing = await this.prisma.quizQuestion.findUnique({
      where: { questionCode: data.questionCode },
    });

    if (existing) {
      throw new ConflictException('Frågekod redan använd');
    }

    const { options, ...questionData } = data;

    return this.prisma.quizQuestion.create({
      data: {
        ...questionData,
        options: {
          create: options.map((opt, index) => ({
            ...opt,
            sortOrder: index + 1,
          })),
        },
      },
      include: {
        options: true,
      },
    });
  }

  async updateQuestion(
    id: string,
    data: {
      chapterId?: string;
      bloomLevel?: BloomLevel;
      questionText?: string;
      explanation?: string;
      reference?: string;
      isActive?: boolean;
      isExamQuestion?: boolean;
    },
  ) {
    const question = await this.prisma.quizQuestion.findUnique({ where: { id } });
    if (!question) {
      throw new NotFoundException('Frågan hittades inte');
    }

    return this.prisma.quizQuestion.update({
      where: { id },
      data,
      include: {
        options: true,
      },
    });
  }

  async updateQuestionOptions(
    questionId: string,
    options: {
      id?: string;
      optionLabel: string;
      optionText: string;
      isCorrect: boolean;
    }[],
  ) {
    // Delete existing options and create new ones
    await this.prisma.quizOption.deleteMany({
      where: { questionId },
    });

    await this.prisma.quizOption.createMany({
      data: options.map((opt, index) => ({
        questionId,
        optionLabel: opt.optionLabel,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        sortOrder: index + 1,
      })),
    });

    return this.findQuestion(questionId);
  }

  async deleteQuestion(id: string) {
    const question = await this.prisma.quizQuestion.findUnique({ where: { id } });
    if (!question) {
      throw new NotFoundException('Frågan hittades inte');
    }

    await this.prisma.quizQuestion.delete({ where: { id } });
    return { success: true };
  }

  // ============================================
  // ALGORITHMS
  // ============================================

  async findAllAlgorithms() {
    return this.prisma.algorithm.findMany({
      orderBy: { code: 'asc' },
      include: {
        chapter: {
          select: { title: true, slug: true },
        },
      },
    });
  }

  async findAlgorithm(id: string) {
    const algorithm = await this.prisma.algorithm.findUnique({
      where: { id },
      include: {
        chapter: true,
      },
    });

    if (!algorithm) {
      throw new NotFoundException('Algoritmen hittades inte');
    }

    return algorithm;
  }

  async createAlgorithm(data: {
    code: string;
    title: string;
    description?: string;
    svgContent: string;
    chapterId?: string;
  }) {
    const existing = await this.prisma.algorithm.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new ConflictException('Algoritmkod redan använd');
    }

    return this.prisma.algorithm.create({ data });
  }

  async updateAlgorithm(
    id: string,
    data: {
      title?: string;
      description?: string;
      svgContent?: string;
      chapterId?: string;
      isActive?: boolean;
    },
  ) {
    const algorithm = await this.prisma.algorithm.findUnique({ where: { id } });
    if (!algorithm) {
      throw new NotFoundException('Algoritmen hittades inte');
    }

    return this.prisma.algorithm.update({
      where: { id },
      data: {
        ...data,
        version: data.svgContent ? algorithm.version + 1 : undefined,
      },
    });
  }

  async deleteAlgorithm(id: string) {
    const algorithm = await this.prisma.algorithm.findUnique({ where: { id } });
    if (!algorithm) {
      throw new NotFoundException('Algoritmen hittades inte');
    }

    await this.prisma.algorithm.delete({ where: { id } });
    return { success: true };
  }

  // ============================================
  // DETAILED STATISTICS
  // ============================================

  async getDetailedStats(filters: {
    courseCode?: string;
    cohortId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { courseCode, cohortId, startDate, endDate } = filters;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
    }

    // Completion statistics by week
    const completionByWeek = await this.prisma.chapterProgress.groupBy({
      by: ['completedAt'],
      where: {
        completedAt: {
          not: null,
          ...dateFilter,
        },
      },
      _count: true,
      orderBy: { completedAt: 'asc' },
    });

    // Process to weekly data
    const weeklyCompletions: Record<string, number> = {};
    completionByWeek.forEach((item) => {
      if (item.completedAt) {
        const weekStart = this.getWeekStart(item.completedAt);
        weeklyCompletions[weekStart] = (weeklyCompletions[weekStart] || 0) + item._count;
      }
    });

    const completionData = Object.entries(weeklyCompletions).map(([week, count]) => ({
      week,
      completions: count,
    }));

    // Quiz score distribution
    const quizScores = await this.prisma.chapterProgress.findMany({
      where: {
        bestQuizScore: { not: null },
        ...(cohortId ? {
          user: {
            enrollments: {
              some: { cohortId },
            },
          },
        } : {}),
      },
      select: { bestQuizScore: true },
    });

    const scoreDistribution = this.calculateScoreDistribution(quizScores.map(q => q.bestQuizScore as number));

    // Pass rates by chapter
    const chapterPassRates = await this.prisma.chapter.findMany({
      where: {
        ...(courseCode ? {
          part: {
            course: { code: courseCode },
          },
        } : {}),
      },
      select: {
        id: true,
        title: true,
        chapterNumber: true,
        _count: {
          select: {
            progress: true,
          },
        },
      },
    });

    const passRatesWithDetails = await Promise.all(
      chapterPassRates.map(async (chapter) => {
        const passed = await this.prisma.chapterProgress.count({
          where: {
            chapterId: chapter.id,
            quizPassed: true,
          },
        });
        const total = chapter._count.progress;
        return {
          chapterId: chapter.id,
          chapterNumber: chapter.chapterNumber,
          title: chapter.title,
          total,
          passed,
          passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        };
      }),
    );

    // Certificate statistics
    const certificateStats = await this.prisma.certificate.groupBy({
      by: ['courseCode'],
      _count: true,
    });

    // User activity (enrollments over time)
    const enrollmentByMonth = await this.prisma.enrollment.groupBy({
      by: ['enrolledAt'],
      where: {
        enrolledAt: dateFilter,
      },
      _count: true,
      orderBy: { enrolledAt: 'asc' },
    });

    const monthlyEnrollments: Record<string, number> = {};
    enrollmentByMonth.forEach((item) => {
      if (item.enrolledAt) {
        const monthKey = item.enrolledAt.toISOString().substring(0, 7);
        monthlyEnrollments[monthKey] = (monthlyEnrollments[monthKey] || 0) + item._count;
      }
    });

    const enrollmentData = Object.entries(monthlyEnrollments).map(([month, count]) => ({
      month,
      enrollments: count,
    }));

    return {
      completionByWeek: completionData,
      scoreDistribution,
      chapterPassRates: passRatesWithDetails,
      certificateStats,
      enrollmentByMonth: enrollmentData,
    };
  }

  private getWeekStart(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
  }

  private calculateScoreDistribution(scores: number[]): { range: string; count: number }[] {
    const ranges = [
      { min: 0, max: 49, label: '0-49%' },
      { min: 50, max: 59, label: '50-59%' },
      { min: 60, max: 69, label: '60-69%' },
      { min: 70, max: 79, label: '70-79%' },
      { min: 80, max: 89, label: '80-89%' },
      { min: 90, max: 100, label: '90-100%' },
    ];

    return ranges.map((range) => ({
      range: range.label,
      count: scores.filter((s) => s >= range.min && s <= range.max).length,
    }));
  }

  // ============================================
  // CSV EXPORT
  // ============================================

  async exportParticipants(cohortId?: string): Promise<string> {
    const where: any = {};
    if (cohortId) {
      where.enrollments = { some: { cohortId } };
    }

    const users = await this.prisma.user.findMany({
      where: {
        ...where,
        role: 'PARTICIPANT',
      },
      select: {
        personnummer: true,
        firstName: true,
        lastName: true,
        email: true,
        workplace: true,
        speciality: true,
        createdAt: true,
        lastLoginAt: true,
        enrollments: {
          select: {
            cohort: { select: { name: true } },
            enrolledAt: true,
            status: true,
          },
        },
        _count: {
          select: {
            certificates: true,
            chapterProgress: true,
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    // Build CSV
    const headers = [
      'Personnummer',
      'Förnamn',
      'Efternamn',
      'E-post',
      'Arbetsplats',
      'Specialitet',
      'Registrerad',
      'Senast inloggad',
      'Kohort',
      'Kapitel lästa',
      'Certifikat',
    ];

    const rows = users.map((u) => [
      u.personnummer,
      u.firstName,
      u.lastName,
      u.email || '',
      u.workplace || '',
      u.speciality || '',
      u.createdAt.toISOString().split('T')[0],
      u.lastLoginAt?.toISOString().split('T')[0] || '',
      u.enrollments.map((e) => e.cohort.name).join('; '),
      u._count.chapterProgress.toString(),
      u._count.certificates.toString(),
    ]);

    return this.arrayToCsv([headers, ...rows]);
  }

  async exportProgress(courseCode?: string): Promise<string> {
    const where: any = {};
    if (courseCode) {
      where.chapter = { part: { course: { code: courseCode } } };
    }

    const progress = await this.prisma.chapterProgress.findMany({
      where,
      select: {
        user: {
          select: {
            personnummer: true,
            firstName: true,
            lastName: true,
          },
        },
        chapter: {
          select: {
            chapterNumber: true,
            title: true,
            part: {
              select: {
                course: { select: { code: true } },
              },
            },
          },
        },
        readProgress: true,
        completedAt: true,
        quizPassed: true,
        bestQuizScore: true,
        quizAttempts: true,
      },
      orderBy: [
        { user: { lastName: 'asc' } },
        { chapter: { chapterNumber: 'asc' } },
      ],
    });

    const headers = [
      'Personnummer',
      'Namn',
      'Kurskod',
      'Kapitel',
      'Kapiteltitel',
      'Läsprogress %',
      'Slutfört',
      'Quiz godkänd',
      'Bästa resultat %',
      'Antal försök',
    ];

    const rows = progress.map((p) => [
      p.user.personnummer,
      `${p.user.firstName} ${p.user.lastName}`,
      p.chapter.part.course.code,
      p.chapter.chapterNumber.toString(),
      p.chapter.title,
      Math.round(p.readProgress).toString(),
      p.completedAt ? 'Ja' : 'Nej',
      p.quizPassed ? 'Ja' : 'Nej',
      p.bestQuizScore?.toString() || '',
      p.quizAttempts.toString(),
    ]);

    return this.arrayToCsv([headers, ...rows]);
  }

  async exportCertificates(courseCode?: string): Promise<string> {
    const where: any = {};
    if (courseCode) {
      where.courseCode = courseCode;
    }

    const certificates = await this.prisma.certificate.findMany({
      where,
      select: {
        certificateNumber: true,
        courseName: true,
        courseCode: true,
        issuedAt: true,
        validUntil: true,
        examScore: true,
        examPassed: true,
        isRecertification: true,
        recertificationCount: true,
        user: {
          select: {
            personnummer: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { issuedAt: 'desc' },
    });

    const headers = [
      'Certifikatnummer',
      'Personnummer',
      'Namn',
      'E-post',
      'Kurs',
      'Kurskod',
      'Utfärdat',
      'Giltigt till',
      'Resultat %',
      'Godkänd',
      'Recertifiering',
      'Antal förnyelser',
    ];

    const rows = certificates.map((c) => [
      c.certificateNumber,
      c.user.personnummer,
      `${c.user.firstName} ${c.user.lastName}`,
      c.user.email || '',
      c.courseName,
      c.courseCode,
      c.issuedAt.toISOString().split('T')[0],
      c.validUntil.toISOString().split('T')[0],
      c.examScore?.toFixed(1) || '',
      c.examPassed ? 'Ja' : 'Nej',
      c.isRecertification ? 'Ja' : 'Nej',
      (c.recertificationCount || 0).toString(),
    ]);

    return this.arrayToCsv([headers, ...rows]);
  }

  private arrayToCsv(data: string[][]): string {
    return data
      .map((row) =>
        row
          .map((cell) => {
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const escaped = cell.replace(/"/g, '""');
            if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
              return `"${escaped}"`;
            }
            return escaped;
          })
          .join(','),
      )
      .join('\n');
  }
}
