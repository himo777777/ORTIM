import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.course.findMany({
      where: { isActive: true },
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
}
