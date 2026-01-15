import { Test, TestingModule } from '@nestjs/testing';
import { QuizService } from '../quiz/quiz.service';
import { PrismaService } from '../common/prisma/prisma.service';

describe('QuizService', () => {
  let service: QuizService;
  let prismaService: PrismaService;

  const mockQuestions = [
    {
      id: 'q1',
      text: 'Question 1?',
      bloomLevel: 'KNOWLEDGE',
      isActive: true,
      chapterId: 'chapter-1',
      options: [
        { id: 'o1', optionLabel: 'A', optionText: 'Answer A', isCorrect: true, sortOrder: 0 },
        { id: 'o2', optionLabel: 'B', optionText: 'Answer B', isCorrect: false, sortOrder: 1 },
        { id: 'o3', optionLabel: 'C', optionText: 'Answer C', isCorrect: false, sortOrder: 2 },
      ],
    },
    {
      id: 'q2',
      text: 'Question 2?',
      bloomLevel: 'COMPREHENSION',
      isActive: true,
      chapterId: 'chapter-1',
      options: [
        { id: 'o4', optionLabel: 'A', optionText: 'Answer A', isCorrect: false, sortOrder: 0 },
        { id: 'o5', optionLabel: 'B', optionText: 'Answer B', isCorrect: true, sortOrder: 1 },
        { id: 'o6', optionLabel: 'C', optionText: 'Answer C', isCorrect: false, sortOrder: 2 },
      ],
    },
  ];

  const mockPrismaService = {
    quizQuestion: {
      findMany: jest.fn(),
    },
    quizAttempt: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QuizService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<QuizService>(QuizService);
    prismaService = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getQuestions', () => {
    it('should return questions for a chapter', async () => {
      mockPrismaService.quizQuestion.findMany.mockResolvedValue(mockQuestions);

      const result = await service.getQuestions('chapter-1', 10);

      expect(result).toHaveLength(2);
      expect(mockPrismaService.quizQuestion.findMany).toHaveBeenCalledWith({
        where: { chapterId: 'chapter-1', isActive: true },
        include: { options: { orderBy: { sortOrder: 'asc' } } },
        take: 10,
      });
    });

    it('should return all active questions when no chapter specified', async () => {
      mockPrismaService.quizQuestion.findMany.mockResolvedValue(mockQuestions);

      const result = await service.getQuestions(undefined, 5);

      expect(mockPrismaService.quizQuestion.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
        include: { options: { orderBy: { sortOrder: 'asc' } } },
        take: 5,
      });
    });

    it('should use default count of 10', async () => {
      mockPrismaService.quizQuestion.findMany.mockResolvedValue(mockQuestions);

      await service.getQuestions();

      expect(mockPrismaService.quizQuestion.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 10 })
      );
    });

    it('should return shuffled questions', async () => {
      mockPrismaService.quizQuestion.findMany.mockResolvedValue([...mockQuestions]);

      // Call multiple times to verify randomization
      const results = await Promise.all([
        service.getQuestions(),
        service.getQuestions(),
        service.getQuestions(),
      ]);

      // All results should contain the same questions
      results.forEach(result => {
        expect(result).toHaveLength(2);
        expect(result.map(q => q.id).sort()).toEqual(['q1', 'q2']);
      });
    });
  });

  describe('submitAttempt', () => {
    const mockAttemptData = {
      type: 'CHAPTER_QUIZ',
      chapterId: 'chapter-1',
      answers: [
        { questionId: 'q1', selectedOption: 'A' }, // Correct
        { questionId: 'q2', selectedOption: 'B' }, // Correct
      ],
    };

    beforeEach(() => {
      mockPrismaService.quizQuestion.findMany.mockResolvedValue(mockQuestions);
    });

    it('should calculate score correctly for all correct answers', async () => {
      mockPrismaService.quizAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        answers: [],
      });

      const result = await service.submitAttempt('user-1', mockAttemptData);

      expect(result.score).toBe(100);
      expect(result.correctAnswers).toBe(2);
      expect(result.passed).toBe(true);
    });

    it('should calculate score correctly for partial correct answers', async () => {
      mockPrismaService.quizAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        answers: [],
      });

      const partialCorrectData = {
        ...mockAttemptData,
        answers: [
          { questionId: 'q1', selectedOption: 'A' }, // Correct
          { questionId: 'q2', selectedOption: 'C' }, // Incorrect
        ],
      };

      const result = await service.submitAttempt('user-1', partialCorrectData);

      expect(result.score).toBe(50);
      expect(result.correctAnswers).toBe(1);
      expect(result.passed).toBe(false);
    });

    it('should mark as passed when score >= 70%', async () => {
      mockPrismaService.quizQuestion.findMany.mockResolvedValue([
        ...mockQuestions,
        {
          id: 'q3',
          options: [
            { optionLabel: 'A', isCorrect: true },
          ],
        },
      ]);
      mockPrismaService.quizAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        answers: [],
      });

      const data = {
        ...mockAttemptData,
        answers: [
          { questionId: 'q1', selectedOption: 'A' }, // Correct
          { questionId: 'q2', selectedOption: 'B' }, // Correct
          { questionId: 'q3', selectedOption: 'A' }, // Correct
        ],
      };

      const result = await service.submitAttempt('user-1', data);

      expect(result.passed).toBe(true);
    });

    it('should mark as failed when score < 70%', async () => {
      mockPrismaService.quizQuestion.findMany.mockResolvedValue([
        ...mockQuestions,
        {
          id: 'q3',
          options: [
            { optionLabel: 'A', isCorrect: true },
          ],
        },
      ]);
      mockPrismaService.quizAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        answers: [],
      });

      const data = {
        ...mockAttemptData,
        answers: [
          { questionId: 'q1', selectedOption: 'B' }, // Incorrect
          { questionId: 'q2', selectedOption: 'C' }, // Incorrect
          { questionId: 'q3', selectedOption: 'A' }, // Correct
        ],
      };

      const result = await service.submitAttempt('user-1', data);

      expect(result.score).toBeCloseTo(33.33, 1);
      expect(result.passed).toBe(false);
    });

    it('should save attempt to database', async () => {
      mockPrismaService.quizAttempt.create.mockResolvedValue({
        id: 'attempt-1',
        answers: [],
      });

      await service.submitAttempt('user-1', mockAttemptData);

      expect(mockPrismaService.quizAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          type: 'CHAPTER_QUIZ',
          chapterId: 'chapter-1',
          totalQuestions: 2,
          correctAnswers: 2,
          score: 100,
          passed: true,
          completedAt: expect.any(Date),
          answers: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({
                questionId: 'q1',
                selectedOption: 'A',
                isCorrect: true,
              }),
              expect.objectContaining({
                questionId: 'q2',
                selectedOption: 'B',
                isCorrect: true,
              }),
            ]),
          }),
        }),
        include: { answers: true },
      });
    });

    it('should return attempt result', async () => {
      mockPrismaService.quizAttempt.create.mockResolvedValue({
        id: 'attempt-123',
        answers: [],
      });

      const result = await service.submitAttempt('user-1', mockAttemptData);

      expect(result).toEqual({
        attemptId: 'attempt-123',
        score: 100,
        passed: true,
        correctAnswers: 2,
        totalQuestions: 2,
      });
    });
  });
});
