import 'server-only';

import { prisma } from '@/lib/prisma';
import { LessonConfigDTO, LessonOrderDTO } from './dto';

export class LessonDAL {
  private static readonly select = {
    id: true,
    title: true,
    content: true,
    thumbnail: true,
    video: true,
    position: true,
  };

  static async create(title: string, chapterId: string) {
    return prisma.$transaction(async (tx) => {
      const maxPos = await tx.lesson.findFirst({
        where: {
          chapterId,
        },
        select: {
          position: true,
        },
        orderBy: { position: 'desc' },
      });

      const lesson = await tx.lesson.create({
        data: { title, chapterId, position: (maxPos?.position ?? 0) + 1 },
        select: {
          id: true,
          title: true,
          chapterId: true,
          position: true,
        },
      });

      return lesson;
    });
  }

  static async update(id: string, data: LessonConfigDTO) {
    return prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.update({
        where: { id },
        data,
      });

      return lesson;
    });
  }

  static async getById(id: string) {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      select: this.select,
    });

    return lesson;
  }

  static async updateTitle(id: string, title: string) {
    return prisma.$transaction(async (tx) => {
      return tx.lesson.update({
        where: { id },
        data: { title },
      });
    });
  }

  static async delete(id: string, chapterId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.lesson.delete({ where: { id } });

      const remaining = await tx.lesson.findMany({
        where: { chapterId },
        orderBy: { position: 'asc' },
        select: { id: true },
      });

      await Promise.all(
        remaining.map((lesson, index) =>
          tx.lesson.update({
            where: { id: lesson.id },
            data: { position: index },
          })
        )
      );
    });
  }

  static async updatePosition(lessons: LessonOrderDTO[], chapterId: string) {
    const updates = lessons.map((lesson) =>
      prisma.lesson.update({
        where: { id: lesson.id, chapterId },
        data: { position: lesson.position },
      })
    );

    return await prisma.$transaction(updates);
  }
}

export const getById = (...args: Parameters<typeof LessonDAL.getById>) =>
  LessonDAL.getById(...args);

export const createLesson = (...args: Parameters<typeof LessonDAL.create>) =>
  LessonDAL.create(...args);

export const updateLesson = (...args: Parameters<typeof LessonDAL.update>) =>
  LessonDAL.update(...args);

export const updateTitle = (
  ...args: Parameters<typeof LessonDAL.updateTitle>
) => LessonDAL.updateTitle(...args);

export const deleteLesson = (...args: Parameters<typeof LessonDAL.delete>) =>
  LessonDAL.delete(...args);

export const updatePosition = (
  ...args: Parameters<typeof LessonDAL.updatePosition>
) => LessonDAL.updatePosition(...args);
