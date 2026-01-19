/**
 * ORTAC Content Validation Tests
 *
 * Integration tests that verify the integrity of course content in the database.
 * These tests use the actual database to validate:
 * - Course structure (courses, parts, chapters)
 * - Quiz questions and options
 * - Badges and gamification
 * - EPAs and OSCE stations
 */

import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../common/prisma/prisma.service';

describe('Content Validation', () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('Course Structure', () => {
    it('should have ORTAC-2025 course', async () => {
      const course = await prisma.course.findUnique({
        where: { code: 'ORTAC-2025' },
      });

      expect(course).toBeDefined();
      expect(course?.name).toBe('ORTAC');
      expect(course?.isActive).toBe(true);
      expect(course?.instructorOnly).toBe(false);
    });

    it('should have ORTAC-TTT-2025 instructor course', async () => {
      const course = await prisma.course.findUnique({
        where: { code: 'ORTAC-TTT-2025' },
      });

      expect(course).toBeDefined();
      expect(course?.instructorOnly).toBe(true);
    });

    it('should have 17 ORTAC chapters', async () => {
      const course = await prisma.course.findUnique({
        where: { code: 'ORTAC-2025' },
        include: {
          parts: {
            include: {
              chapters: { where: { isActive: true } },
            },
          },
        },
      });

      const chapterCount = course?.parts.reduce(
        (sum, part) => sum + part.chapters.length,
        0
      );

      expect(chapterCount).toBe(17);
    });

    it('should have 4 TTT chapters', async () => {
      const course = await prisma.course.findUnique({
        where: { code: 'ORTAC-TTT-2025' },
        include: {
          parts: {
            include: {
              chapters: { where: { isActive: true } },
            },
          },
        },
      });

      const chapterCount = course?.parts.reduce(
        (sum, part) => sum + part.chapters.length,
        0
      );

      expect(chapterCount).toBe(4);
    });

    it('chapters should be in correct order within each part', async () => {
      const parts = await prisma.coursePart.findMany({
        include: {
          chapters: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      // Verify sortOrder is sequential within each part
      for (const part of parts) {
        for (let i = 1; i < part.chapters.length; i++) {
          expect(part.chapters[i].sortOrder).toBeGreaterThan(
            part.chapters[i - 1].sortOrder
          );
        }
      }
    });
  });

  describe('Quiz Validation', () => {
    it('should have at least 100 quiz questions', async () => {
      const count = await prisma.quizQuestion.count({
        where: { isActive: true },
      });

      expect(count).toBeGreaterThanOrEqual(100);
    });

    it('every question should have exactly one correct answer', async () => {
      const questions = await prisma.quizQuestion.findMany({
        where: { isActive: true },
        include: { options: true },
      });

      for (const question of questions) {
        const correctOptions = question.options.filter((o) => o.isCorrect);
        expect(correctOptions.length).toBe(1);
      }
    });

    it('every question should have 4-5 options', async () => {
      const questions = await prisma.quizQuestion.findMany({
        where: { isActive: true },
        include: { options: true },
      });

      for (const question of questions) {
        expect(question.options.length).toBeGreaterThanOrEqual(4);
        expect(question.options.length).toBeLessThanOrEqual(5);
      }
    });

    it('every question should have a valid Bloom level', async () => {
      const validLevels = [
        'KNOWLEDGE',
        'COMPREHENSION',
        'APPLICATION',
        'ANALYSIS',
        'SYNTHESIS',
      ];

      const questions = await prisma.quizQuestion.findMany({
        where: { isActive: true },
        select: { questionCode: true, bloomLevel: true },
      });

      for (const question of questions) {
        expect(validLevels).toContain(question.bloomLevel);
      }
    });

    it('every question should have an explanation', async () => {
      const questions = await prisma.quizQuestion.findMany({
        where: { isActive: true },
        select: { questionCode: true, explanation: true },
      });

      for (const question of questions) {
        expect(question.explanation).toBeDefined();
        expect(question.explanation.trim().length).toBeGreaterThan(10);
      }
    });
  });

  describe('Content Integrity', () => {
    it('every chapter should have content', async () => {
      const chapters = await prisma.chapter.findMany({
        where: { isActive: true },
        select: { title: true, content: true },
      });

      for (const chapter of chapters) {
        expect(chapter.content).toBeDefined();
        expect(chapter.content.trim().length).toBeGreaterThan(100);
      }
    });

    it('every chapter should have at least one learning objective', async () => {
      const chapters = await prisma.chapter.findMany({
        where: { isActive: true },
        include: { learningObjectives: true },
      });

      for (const chapter of chapters) {
        expect(chapter.learningObjectives.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('every chapter should have quiz questions', async () => {
      const chapters = await prisma.chapter.findMany({
        where: { isActive: true },
        include: { quizQuestions: { where: { isActive: true } } },
      });

      for (const chapter of chapters) {
        expect(chapter.quizQuestions.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Gamification', () => {
    it('should have at least 20 badges', async () => {
      const count = await prisma.badge.count({
        where: { isActive: true },
      });

      expect(count).toBeGreaterThanOrEqual(20);
    });

    it('badges should have valid categories', async () => {
      const expectedCategories = [
        'PROGRESS',
        'ACHIEVEMENT',
        'STREAK',
        'SPECIAL',
        'LIMB_LEVEL',
        'COMPETENCE',
        'ENGAGEMENT',
      ];

      const badges = await prisma.badge.findMany({
        where: { isActive: true },
        select: { code: true, category: true },
      });

      for (const badge of badges) {
        expect(expectedCategories).toContain(badge.category);
      }
    });

    it('LIMB_LEVEL badges should exist', async () => {
      const limbBadges = await prisma.badge.findMany({
        where: { category: 'LIMB_LEVEL', isActive: true },
      });

      expect(limbBadges.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Algorithms', () => {
    it('should have at least 10 algorithms', async () => {
      const count = await prisma.algorithm.count({
        where: { isActive: true },
      });

      expect(count).toBeGreaterThanOrEqual(10);
    });

    it('algorithms should have SVG content', async () => {
      const algorithms = await prisma.algorithm.findMany({
        where: { isActive: true },
        select: { code: true, svgContent: true },
      });

      for (const algorithm of algorithms) {
        expect(algorithm.svgContent).toBeDefined();
        expect(algorithm.svgContent.trim().length).toBeGreaterThan(100);
      }
    });
  });

  describe('EPAs', () => {
    it('should have 12 EPAs', async () => {
      const count = await prisma.ePA.count({
        where: { isActive: true },
      });

      expect(count).toBe(12);
    });

    it('EPAs should have objectives and criteria', async () => {
      const epas = await prisma.ePA.findMany({
        where: { isActive: true },
      });

      for (const epa of epas) {
        expect(epa.objectives.length).toBeGreaterThanOrEqual(1);
        expect(epa.criteria.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('OSCE Stations', () => {
    it('should have at least 8 OSCE stations', async () => {
      const count = await prisma.oSCEStation.count({
        where: { isActive: true },
      });

      expect(count).toBeGreaterThanOrEqual(8);
    });

    it('OSCE stations should have checklist items', async () => {
      const stations = await prisma.oSCEStation.findMany({
        where: { isActive: true },
      });

      for (const station of stations) {
        expect(station.checklist.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('OSCE stations should have critical errors defined', async () => {
      const stations = await prisma.oSCEStation.findMany({
        where: { isActive: true },
      });

      for (const station of stations) {
        expect(station.criticalErrors).toBeDefined();
        // criticalErrors can be empty but should be defined
        expect(Array.isArray(station.criticalErrors)).toBe(true);
      }
    });
  });

  describe('Branding', () => {
    it('chapter content should not contain old ORTIM branding', async () => {
      const chapters = await prisma.chapter.findMany({
        where: { isActive: true },
        select: { title: true, content: true },
      });

      for (const chapter of chapters) {
        expect(chapter.content).not.toContain('ORTIM');
        expect(chapter.content).not.toContain('B-ORTIM');
        expect(chapter.content).not.toContain('BORTIM');
      }
    });

    it('quiz questions should not contain old ORTIM branding', async () => {
      const questions = await prisma.quizQuestion.findMany({
        where: { isActive: true },
        select: { questionCode: true, questionText: true },
      });

      for (const question of questions) {
        expect(question.questionText).not.toContain('ORTIM');
        expect(question.questionText).not.toContain('B-ORTIM');
      }
    });
  });
});
