import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// Prediction types
export type PredictionType = 'dropout_risk' | 'exam_score' | 'completion_date';

export interface PredictionResult {
  userId: string;
  userName: string;
  predictionType: PredictionType;
  value: number;
  confidence: number;
  factors: RiskFactor[];
  generatedAt: Date;
}

export interface RiskFactor {
  factor: string;
  impact: 'positive' | 'negative';
  weight: number;
  description: string;
}

export interface AtRiskLearner {
  userId: string;
  userName: string;
  email: string | null;
  cohort: string | null;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  factors: RiskFactor[];
  lastActivity: Date | null;
  progress: number;
  recommendedActions: string[];
}

@Injectable()
export class PredictionService {
  private readonly logger = new Logger(PredictionService.name);

  // Vikter för riskfaktorer (justerbara)
  private readonly RISK_WEIGHTS = {
    inactivityDays: 2.5,
    lowProgress: 2.0,
    failedQuizzes: 1.5,
    noRecentLogin: 1.8,
    lowEngagement: 1.2,
    missingDeadline: 2.2,
    lowQuizScore: 1.3,
    shortSessions: 0.8,
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Beräkna avbrottsrisk för en användare
   */
  async calculateDropoutRisk(userId: string): Promise<PredictionResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            cohort: true,
          },
        },
        chapterProgress: true,
        quizAttempts: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
        sessions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!user) {
      throw new Error('Användare hittades inte');
    }

    const factors: RiskFactor[] = [];
    let riskScore = 0;

    // Faktor 1: Inaktivitet
    const daysSinceActivity = user.lastActivityAt
      ? Math.floor((Date.now() - user.lastActivityAt.getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    if (daysSinceActivity > 14) {
      const impact = Math.min(30, daysSinceActivity * this.RISK_WEIGHTS.inactivityDays);
      riskScore += impact;
      factors.push({
        factor: 'Lång inaktivitet',
        impact: 'negative',
        weight: impact,
        description: `${daysSinceActivity} dagar sedan senaste aktivitet`,
      });
    } else if (daysSinceActivity < 3) {
      factors.push({
        factor: 'Regelbunden aktivitet',
        impact: 'positive',
        weight: -10,
        description: `Aktiv de senaste ${daysSinceActivity} dagarna`,
      });
      riskScore -= 10;
    }

    // Faktor 2: Framsteg
    const totalChapters = await this.prisma.chapter.count({ where: { isActive: true } });
    const completedChapters = user.chapterProgress.filter((p) => p.readProgress === 100).length;
    const progressPercent = totalChapters > 0 ? (completedChapters / totalChapters) * 100 : 0;

    if (progressPercent < 20 && daysSinceActivity > 7) {
      const impact = (100 - progressPercent) * 0.2 * this.RISK_WEIGHTS.lowProgress;
      riskScore += impact;
      factors.push({
        factor: 'Lågt framsteg',
        impact: 'negative',
        weight: impact,
        description: `Endast ${Math.round(progressPercent)}% av kursen slutförd`,
      });
    } else if (progressPercent > 70) {
      factors.push({
        factor: 'Bra framsteg',
        impact: 'positive',
        weight: -15,
        description: `${Math.round(progressPercent)}% av kursen slutförd`,
      });
      riskScore -= 15;
    }

    // Faktor 3: Quiz-resultat
    const recentQuizzes = user.quizAttempts.slice(0, 5);
    const failedQuizzes = recentQuizzes.filter((q) => !q.passed).length;
    const avgScore = recentQuizzes.length > 0
      ? recentQuizzes.reduce((sum, q) => sum + q.score, 0) / recentQuizzes.length
      : 0;

    if (failedQuizzes >= 3) {
      const impact = failedQuizzes * 5 * this.RISK_WEIGHTS.failedQuizzes;
      riskScore += impact;
      factors.push({
        factor: 'Upprepade misslyckade quiz',
        impact: 'negative',
        weight: impact,
        description: `${failedQuizzes} av senaste 5 quiz underkända`,
      });
    }

    if (avgScore < 50 && recentQuizzes.length >= 3) {
      const impact = (50 - avgScore) * 0.3 * this.RISK_WEIGHTS.lowQuizScore;
      riskScore += impact;
      factors.push({
        factor: 'Låga quiz-poäng',
        impact: 'negative',
        weight: impact,
        description: `Genomsnitt ${Math.round(avgScore)}% på senaste quiz`,
      });
    }

    // Faktor 4: Engagemang (streak, XP)
    if (user.currentStreak === 0 && user.totalXP < 100) {
      const impact = 10 * this.RISK_WEIGHTS.lowEngagement;
      riskScore += impact;
      factors.push({
        factor: 'Lågt engagemang',
        impact: 'negative',
        weight: impact,
        description: 'Ingen streak och låg XP',
      });
    } else if (user.currentStreak >= 7) {
      factors.push({
        factor: 'Stark streak',
        impact: 'positive',
        weight: -20,
        description: `${user.currentStreak} dagars streak`,
      });
      riskScore -= 20;
    }

    // Faktor 5: Sessionslängd
    const recentSessions = user.sessions.filter((s) => s.durationSeconds);
    const avgSessionLength = recentSessions.length > 0
      ? recentSessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / recentSessions.length
      : 0;

    if (avgSessionLength < 300 && recentSessions.length >= 3) { // < 5 minuter
      const impact = 8 * this.RISK_WEIGHTS.shortSessions;
      riskScore += impact;
      factors.push({
        factor: 'Korta sessioner',
        impact: 'negative',
        weight: impact,
        description: `Genomsnittlig sessionstid: ${Math.round(avgSessionLength / 60)} minuter`,
      });
    }

    // Normalisera riskpoäng till 0-100
    riskScore = Math.max(0, Math.min(100, riskScore));

    // Beräkna konfidens baserat på datamängd
    const dataPoints = [
      user.quizAttempts.length,
      user.chapterProgress.length,
      user.sessions.length,
    ].reduce((sum, n) => sum + Math.min(n, 10), 0);
    const confidence = Math.min(0.95, 0.4 + (dataPoints / 30) * 0.55);

    // Spara prediktion
    await this.prisma.userPrediction.create({
      data: {
        userId,
        predictionType: 'dropout_risk',
        value: riskScore,
        confidence,
        factors: factors as unknown as Record<string, unknown>,
      },
    });

    return {
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      predictionType: 'dropout_risk',
      value: riskScore,
      confidence,
      factors,
      generatedAt: new Date(),
    };
  }

  /**
   * Hämta alla riskdeltagare
   */
  async getAtRiskLearners(minRiskScore = 40): Promise<AtRiskLearner[]> {
    // Hämta alla aktiva användare
    const users = await this.prisma.user.findMany({
      where: {
        enrollments: { some: { status: 'ACTIVE' } },
      },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { cohort: true },
        },
        chapterProgress: true,
        quizAttempts: { take: 5, orderBy: { startedAt: 'desc' } },
        sessions: { take: 5, orderBy: { startedAt: 'desc' } },
      },
    });

    const atRiskLearners: AtRiskLearner[] = [];

    for (const user of users) {
      try {
        const prediction = await this.calculateDropoutRisk(user.id);

        if (prediction.value >= minRiskScore) {
          // Beräkna progress
          const totalChapters = await this.prisma.chapter.count({ where: { isActive: true } });
          const completedChapters = user.chapterProgress.filter((p) => p.readProgress === 100).length;
          const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

          // Bestäm risknivå
          let riskLevel: 'low' | 'medium' | 'high' | 'critical';
          if (prediction.value >= 80) riskLevel = 'critical';
          else if (prediction.value >= 60) riskLevel = 'high';
          else if (prediction.value >= 40) riskLevel = 'medium';
          else riskLevel = 'low';

          // Generera rekommenderade åtgärder
          const recommendedActions = this.generateRecommendations(prediction.factors, riskLevel);

          atRiskLearners.push({
            userId: user.id,
            userName: `${user.firstName} ${user.lastName}`,
            email: user.email,
            cohort: user.enrollments[0]?.cohort?.name || null,
            riskScore: Math.round(prediction.value),
            riskLevel,
            factors: prediction.factors.filter((f) => f.impact === 'negative'),
            lastActivity: user.lastActivityAt,
            progress,
            recommendedActions,
          });
        }
      } catch (error) {
        this.logger.error(`Failed to calculate risk for user ${user.id}: ${error}`);
      }
    }

    // Sortera efter riskpoäng (högst först)
    return atRiskLearners.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Prediktera examenspoäng
   */
  async predictExamScore(userId: string): Promise<PredictionResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        quizAttempts: {
          where: { type: 'PRACTICE' },
          orderBy: { startedAt: 'desc' },
          take: 20,
        },
        chapterProgress: true,
      },
    });

    if (!user) {
      throw new Error('Användare hittades inte');
    }

    const factors: RiskFactor[] = [];

    // Beräkna baserat på övningsresultat
    const practiceScores = user.quizAttempts.map((q) => q.score);
    const avgPracticeScore = practiceScores.length > 0
      ? practiceScores.reduce((a, b) => a + b, 0) / practiceScores.length
      : 50;

    // Trend i resultat
    const recentScores = practiceScores.slice(0, 5);
    const olderScores = practiceScores.slice(5, 10);
    const recentAvg = recentScores.length > 0
      ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
      : avgPracticeScore;
    const olderAvg = olderScores.length > 0
      ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length
      : avgPracticeScore;

    const trend = recentAvg - olderAvg;

    if (trend > 5) {
      factors.push({
        factor: 'Positiv trend',
        impact: 'positive',
        weight: 5,
        description: `Resultaten förbättras med ${Math.round(trend)}%`,
      });
    } else if (trend < -5) {
      factors.push({
        factor: 'Negativ trend',
        impact: 'negative',
        weight: -5,
        description: `Resultaten försämras med ${Math.round(Math.abs(trend))}%`,
      });
    }

    // Framsteg
    const completedChapters = user.chapterProgress.filter((p) => p.readProgress === 100).length;
    const totalChapters = await this.prisma.chapter.count({ where: { isActive: true } });
    const progressFactor = totalChapters > 0 ? completedChapters / totalChapters : 0;

    // Predikterat poäng (viktad kombination)
    const predictedScore = Math.min(100, Math.max(0,
      avgPracticeScore * 0.6 +
      (trend > 0 ? trend * 0.5 : trend * 0.3) +
      progressFactor * 20 +
      Math.min(10, practiceScores.length * 0.5)
    ));

    const confidence = Math.min(0.9, 0.3 + (practiceScores.length / 20) * 0.6);

    factors.push({
      factor: 'Övningssnitt',
      impact: avgPracticeScore >= 70 ? 'positive' : 'negative',
      weight: avgPracticeScore >= 70 ? 10 : -10,
      description: `Genomsnitt på övningar: ${Math.round(avgPracticeScore)}%`,
    });

    await this.prisma.userPrediction.create({
      data: {
        userId,
        predictionType: 'exam_score',
        value: predictedScore,
        confidence,
        factors: factors as unknown as Record<string, unknown>,
      },
    });

    return {
      userId,
      userName: `${user.firstName} ${user.lastName}`,
      predictionType: 'exam_score',
      value: Math.round(predictedScore),
      confidence,
      factors,
      generatedAt: new Date(),
    };
  }

  /**
   * Hämta prediktionshistorik för användare
   */
  async getPredictionHistory(userId: string, type?: PredictionType) {
    const where: Record<string, unknown> = { userId };
    if (type) where.predictionType = type;

    return this.prisma.userPrediction.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Generera rekommenderade åtgärder
   */
  private generateRecommendations(factors: RiskFactor[], riskLevel: string): string[] {
    const recommendations: string[] = [];

    const negativeFactors = factors.filter((f) => f.impact === 'negative').map((f) => f.factor);

    if (negativeFactors.includes('Lång inaktivitet')) {
      recommendations.push('Skicka påminnelse via e-post');
      recommendations.push('Kontakta via telefon om ingen respons inom 3 dagar');
    }

    if (negativeFactors.includes('Lågt framsteg')) {
      recommendations.push('Boka individuell handledning');
      recommendations.push('Föreslå studieplan med delmål');
    }

    if (negativeFactors.includes('Upprepade misslyckade quiz') || negativeFactors.includes('Låga quiz-poäng')) {
      recommendations.push('Rekommendera repetition av svåra kapitel');
      recommendations.push('Erbjud extra övningsmaterial');
    }

    if (negativeFactors.includes('Lågt engagemang')) {
      recommendations.push('Introducera gamification-mål');
      recommendations.push('Bjud in till studiegrupp');
    }

    if (riskLevel === 'critical') {
      recommendations.unshift('PRIORITET: Omedelbar kontakt krävs');
    }

    return recommendations.slice(0, 5);
  }
}
