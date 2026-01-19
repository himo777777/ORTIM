import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';

// Types
export type ABTestStatus = 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
export type TestType = 'content' | 'ui' | 'quiz' | 'algorithm';
export type MetricType = 'completion_rate' | 'quiz_score' | 'time_on_page' | 'click_rate' | 'conversion_rate';

export interface CreateTestDto {
  name: string;
  description?: string;
  testType: TestType;
  targetPage?: string;
  trafficPercent?: number;
  primaryMetric: MetricType;
  secondaryMetrics?: MetricType[];
  startDate?: Date;
  endDate?: Date;
  variants: CreateVariantDto[];
}

export interface CreateVariantDto {
  name: string;
  description?: string;
  isControl?: boolean;
  config: Record<string, unknown>;
  weight?: number;
}

export interface TestResults {
  testId: string;
  testName: string;
  status: ABTestStatus;
  startDate: Date | null;
  endDate: Date | null;
  totalParticipants: number;
  variants: VariantResults[];
  winner: VariantResults | null;
  isSignificant: boolean;
  confidenceLevel: number;
}

export interface VariantResults {
  id: string;
  name: string;
  isControl: boolean;
  participants: number;
  conversions: number;
  conversionRate: number;
  averageMetricValue: number;
  standardError: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  uplift: number; // Compared to control
  pValue: number;
}

@Injectable()
export class ABTestService {
  private readonly logger = new Logger(ABTestService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Create a new A/B test with variants
   */
  async createTest(dto: CreateTestDto, createdById?: string) {
    // Validate variants
    if (!dto.variants || dto.variants.length < 2) {
      throw new BadRequestException('Minst två varianter krävs (kontroll + minst en testgrupp)');
    }

    const totalWeight = dto.variants.reduce((sum, v) => sum + (v.weight || 50), 0);
    if (totalWeight !== 100) {
      throw new BadRequestException('Summan av vikterna måste vara 100');
    }

    const hasControl = dto.variants.some((v) => v.isControl);
    if (!hasControl) {
      // Auto-mark first variant as control
      dto.variants[0].isControl = true;
    }

    return this.prisma.aBTest.create({
      data: {
        name: dto.name,
        description: dto.description,
        testType: dto.testType,
        targetPage: dto.targetPage,
        trafficPercent: dto.trafficPercent || 100,
        primaryMetric: dto.primaryMetric,
        secondaryMetrics: dto.secondaryMetrics as unknown as object,
        startDate: dto.startDate,
        endDate: dto.endDate,
        createdById,
        variants: {
          create: dto.variants.map((v) => ({
            name: v.name,
            description: v.description,
            isControl: v.isControl || false,
            config: v.config as object,
            weight: v.weight || 50,
          })),
        },
      },
      include: {
        variants: true,
      },
    });
  }

  /**
   * Get all tests with optional filtering
   */
  async getTests(status?: ABTestStatus, testType?: TestType) {
    return this.prisma.aBTest.findMany({
      where: {
        ...(status && { status }),
        ...(testType && { testType }),
      },
      include: {
        variants: {
          select: {
            id: true,
            name: true,
            isControl: true,
            weight: true,
            impressions: true,
            conversions: true,
          },
        },
        _count: {
          select: {
            assignments: true,
            conversions: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single test by ID
   */
  async getTest(testId: string) {
    const test = await this.prisma.aBTest.findUnique({
      where: { id: testId },
      include: {
        variants: true,
        _count: {
          select: {
            assignments: true,
            conversions: true,
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Test hittades inte');
    }

    return test;
  }

  /**
   * Update test status
   */
  async updateTestStatus(testId: string, status: ABTestStatus) {
    const test = await this.getTest(testId);

    // Validation
    if (status === 'RUNNING' && test.status === 'COMPLETED') {
      throw new BadRequestException('Ett avslutat test kan inte startas om');
    }

    const updates: Record<string, unknown> = { status };

    if (status === 'RUNNING' && !test.startDate) {
      updates.startDate = new Date();
    }

    if (status === 'COMPLETED' && !test.endDate) {
      updates.endDate = new Date();
    }

    return this.prisma.aBTest.update({
      where: { id: testId },
      data: updates,
      include: { variants: true },
    });
  }

  /**
   * Delete a test
   */
  async deleteTest(testId: string) {
    await this.getTest(testId);
    return this.prisma.aBTest.delete({ where: { id: testId } });
  }

  /**
   * Get or assign a variant for a user/session
   */
  async getVariantAssignment(
    testId: string,
    userId?: string,
    sessionId?: string,
  ): Promise<{ variantId: string; config: Record<string, unknown> } | null> {
    if (!userId && !sessionId) {
      throw new BadRequestException('userId eller sessionId krävs');
    }

    const test = await this.prisma.aBTest.findUnique({
      where: { id: testId },
      include: { variants: true },
    });

    if (!test || test.status !== 'RUNNING') {
      return null;
    }

    // Check traffic allocation
    if (test.trafficPercent < 100) {
      const random = Math.random() * 100;
      if (random > test.trafficPercent) {
        return null; // User not in test
      }
    }

    // Check for existing assignment
    const existingAssignment = await this.prisma.aBTestAssignment.findFirst({
      where: {
        testId,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(sessionId ? [{ sessionId }] : []),
        ],
      },
      include: {
        variant: true,
      },
    });

    if (existingAssignment) {
      return {
        variantId: existingAssignment.variantId,
        config: existingAssignment.variant.config as Record<string, unknown>,
      };
    }

    // Assign to variant based on weights
    const variant = this.selectVariantByWeight(test.variants);

    await this.prisma.aBTestAssignment.create({
      data: {
        testId,
        variantId: variant.id,
        userId,
        sessionId,
      },
    });

    // Update impressions
    await this.prisma.aBTestVariant.update({
      where: { id: variant.id },
      data: { impressions: { increment: 1 } },
    });

    return {
      variantId: variant.id,
      config: variant.config as Record<string, unknown>,
    };
  }

  /**
   * Select variant based on weights
   */
  private selectVariantByWeight(variants: { id: string; weight: number; config: unknown }[]) {
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }

  /**
   * Record a conversion
   */
  async recordConversion(
    testId: string,
    metricName: string,
    metricValue: number,
    userId?: string,
    sessionId?: string,
  ) {
    if (!userId && !sessionId) {
      throw new BadRequestException('userId eller sessionId krävs');
    }

    // Find assignment
    const assignment = await this.prisma.aBTestAssignment.findFirst({
      where: {
        testId,
        OR: [
          ...(userId ? [{ userId }] : []),
          ...(sessionId ? [{ sessionId }] : []),
        ],
      },
    });

    if (!assignment) {
      return null; // User not in test
    }

    // Record conversion
    const conversion = await this.prisma.aBTestConversion.create({
      data: {
        testId,
        variantId: assignment.variantId,
        userId,
        sessionId,
        metricName,
        metricValue,
      },
    });

    // Update variant conversions count
    await this.prisma.aBTestVariant.update({
      where: { id: assignment.variantId },
      data: { conversions: { increment: 1 } },
    });

    return conversion;
  }

  /**
   * Get test results with statistical analysis
   */
  async getTestResults(testId: string): Promise<TestResults> {
    const test = await this.prisma.aBTest.findUnique({
      where: { id: testId },
      include: {
        variants: {
          include: {
            _count: {
              select: {
                assignments: true,
                conversionRecords: true,
              },
            },
          },
        },
      },
    });

    if (!test) {
      throw new NotFoundException('Test hittades inte');
    }

    // Get conversion data for primary metric
    const conversionData = await this.prisma.aBTestConversion.groupBy({
      by: ['variantId'],
      where: {
        testId,
        metricName: test.primaryMetric,
      },
      _count: true,
      _avg: {
        metricValue: true,
      },
      _sum: {
        metricValue: true,
      },
    });

    const conversionMap = new Map(conversionData.map((c) => [c.variantId, c]));

    // Find control variant
    const controlVariant = test.variants.find((v) => v.isControl);
    const controlData = controlVariant ? conversionMap.get(controlVariant.id) : null;
    const controlRate = controlVariant && controlData
      ? (controlData._count / controlVariant._count.assignments) || 0
      : 0;

    // Calculate results for each variant
    const variantResults: VariantResults[] = test.variants.map((variant) => {
      const data = conversionMap.get(variant.id);
      const participants = variant._count.assignments;
      const conversions = data?._count || 0;
      const conversionRate = participants > 0 ? conversions / participants : 0;
      const avgValue = data?._avg?.metricValue || 0;

      // Standard error for proportion
      const standardError = participants > 0
        ? Math.sqrt((conversionRate * (1 - conversionRate)) / participants)
        : 0;

      // 95% confidence interval
      const z = 1.96;
      const confidenceInterval = {
        lower: Math.max(0, conversionRate - z * standardError),
        upper: Math.min(1, conversionRate + z * standardError),
      };

      // Uplift compared to control
      const uplift = controlRate > 0 ? ((conversionRate - controlRate) / controlRate) * 100 : 0;

      // P-value (simplified z-test)
      const pValue = this.calculatePValue(
        conversionRate,
        controlRate,
        participants,
        controlVariant?._count.assignments || 0,
      );

      return {
        id: variant.id,
        name: variant.name,
        isControl: variant.isControl,
        participants,
        conversions,
        conversionRate,
        averageMetricValue: avgValue,
        standardError,
        confidenceInterval,
        uplift,
        pValue,
      };
    });

    // Determine winner
    const nonControlVariants = variantResults.filter((v) => !v.isControl);
    const significantWinners = nonControlVariants.filter(
      (v) => v.pValue < 0.05 && v.uplift > 0,
    );
    const winner = significantWinners.length > 0
      ? significantWinners.reduce((a, b) => (a.uplift > b.uplift ? a : b))
      : null;

    const totalParticipants = variantResults.reduce((sum, v) => sum + v.participants, 0);

    return {
      testId: test.id,
      testName: test.name,
      status: test.status as ABTestStatus,
      startDate: test.startDate,
      endDate: test.endDate,
      totalParticipants,
      variants: variantResults,
      winner,
      isSignificant: winner !== null,
      confidenceLevel: winner ? (1 - winner.pValue) * 100 : 0,
    };
  }

  /**
   * Calculate p-value using two-proportion z-test
   */
  private calculatePValue(
    rate1: number,
    rate2: number,
    n1: number,
    n2: number,
  ): number {
    if (n1 === 0 || n2 === 0) return 1;

    const pooledRate = ((rate1 * n1) + (rate2 * n2)) / (n1 + n2);
    const standardError = Math.sqrt(
      pooledRate * (1 - pooledRate) * (1 / n1 + 1 / n2),
    );

    if (standardError === 0) return 1;

    const zScore = (rate1 - rate2) / standardError;
    const pValue = 2 * (1 - this.normalCDF(Math.abs(zScore)));

    return pValue;
  }

  /**
   * Normal CDF approximation
   */
  private normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * Get active tests for a page/component
   */
  async getActiveTestsForPage(targetPage: string) {
    return this.prisma.aBTest.findMany({
      where: {
        status: 'RUNNING',
        targetPage,
      },
      include: {
        variants: {
          select: {
            id: true,
            name: true,
            isControl: true,
            config: true,
            weight: true,
          },
        },
      },
    });
  }

  /**
   * Get user's active test assignments
   */
  async getUserAssignments(userId: string) {
    return this.prisma.aBTestAssignment.findMany({
      where: {
        userId,
        test: {
          status: 'RUNNING',
        },
      },
      include: {
        test: {
          select: {
            id: true,
            name: true,
            testType: true,
            targetPage: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            config: true,
          },
        },
      },
    });
  }

  /**
   * Auto-complete tests that have ended
   */
  @Cron(CronExpression.EVERY_HOUR)
  async autoCompleteExpiredTests() {
    const now = new Date();

    const expiredTests = await this.prisma.aBTest.findMany({
      where: {
        status: 'RUNNING',
        endDate: { lte: now },
      },
    });

    for (const test of expiredTests) {
      await this.updateTestStatus(test.id, 'COMPLETED');
      this.logger.log(`Auto-completed test: ${test.name} (${test.id})`);
    }
  }

  /**
   * Get test summary for dashboard
   */
  async getTestSummary() {
    const tests = await this.prisma.aBTest.groupBy({
      by: ['status'],
      _count: true,
    });

    const statusCounts = tests.reduce((acc, t) => {
      acc[t.status] = t._count;
      return acc;
    }, {} as Record<string, number>);

    const activeTests = await this.prisma.aBTest.count({
      where: { status: 'RUNNING' },
    });

    const totalParticipants = await this.prisma.aBTestAssignment.count();

    const totalConversions = await this.prisma.aBTestConversion.count();

    return {
      total: tests.reduce((sum, t) => sum + t._count, 0),
      byStatus: {
        draft: statusCounts.DRAFT || 0,
        running: statusCounts.RUNNING || 0,
        paused: statusCounts.PAUSED || 0,
        completed: statusCounts.COMPLETED || 0,
      },
      activeTests,
      totalParticipants,
      totalConversions,
    };
  }
}
