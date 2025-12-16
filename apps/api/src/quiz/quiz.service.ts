import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class QuizService {
  constructor(private prisma: PrismaService) {}

  async getQuestions(chapterId?: string, count = 10) {
    const whereClause = chapterId
      ? { chapterId, isActive: true }
      : { isActive: true };

    const questions = await this.prisma.quizQuestion.findMany({
      where: whereClause,
      include: {
        options: { orderBy: { sortOrder: 'asc' } },
      },
      take: count,
    });

    // Shuffle questions
    return questions.sort(() => Math.random() - 0.5);
  }

  async submitAttempt(userId: string, data: {
    type: string;
    chapterId?: string;
    answers: { questionId: string; selectedOption: string }[];
  }) {
    const questions = await this.prisma.quizQuestion.findMany({
      where: {
        id: { in: data.answers.map(a => a.questionId) },
      },
      include: { options: true },
    });

    let correctAnswers = 0;
    const answerResults = data.answers.map(answer => {
      const question = questions.find(q => q.id === answer.questionId);
      const correctOption = question?.options.find(o => o.isCorrect);
      const isCorrect = correctOption?.optionLabel === answer.selectedOption;
      if (isCorrect) correctAnswers++;
      return {
        questionId: answer.questionId,
        selectedOption: answer.selectedOption,
        isCorrect,
      };
    });

    const score = (correctAnswers / data.answers.length) * 100;
    const passed = score >= 70;

    const attempt = await this.prisma.quizAttempt.create({
      data: {
        userId,
        type: data.type,
        chapterId: data.chapterId,
        totalQuestions: data.answers.length,
        correctAnswers,
        score,
        passed,
        completedAt: new Date(),
        answers: {
          create: answerResults,
        },
      },
      include: { answers: true },
    });

    return {
      attemptId: attempt.id,
      score,
      passed,
      correctAnswers,
      totalQuestions: data.answers.length,
    };
  }
}
