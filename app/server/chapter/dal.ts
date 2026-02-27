import 'server-only';

import { prisma } from '@/lib/prisma';
import { ChapterOrderDTO } from './dto';

export class ChapterDAL {
  static async create(title: string, courseId: string) {
    return prisma.$transaction(async (tx) => {
      const maxPos = await tx.chapter.findFirst({
        where: {
          courseId,
        },
        select: {
          position: true,
        },
        orderBy: { position: 'desc' },
      });

      const chapter = await tx.chapter.create({
        data: { title, courseId, position: (maxPos?.position ?? 0) + 1 },
        select: {
          id: true,
          title: true,
          courseId: true,
          position: true,
        },
      });

      return chapter;
    });
  }

  static async updateTitle(id: string, title: string) {
    return prisma.$transaction(async (tx) => {
      return tx.chapter.update({
        where: { id },
        data: { title },
      });
    });
  }

  static async delete(id: string, courseId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.chapter.delete({ where: { id } });

      const remaining = await tx.chapter.findMany({
        where: { courseId },
        orderBy: { position: 'asc' },
        select: { id: true },
      });

      await Promise.all(
        remaining.map((chapter, index) =>
          tx.chapter.update({
            where: { id: chapter.id },
            data: { position: index },
          })
        )
      );
    });
  }

  static async updatePosition(chapters: ChapterOrderDTO[], courseId: string) {
    const updates = chapters.map((chapter) =>
      prisma.chapter.update({
        where: { id: chapter.id, courseId },
        data: { position: chapter.position },
      })
    );

    return await prisma.$transaction(updates);
  }
}

export const createChapter = (...args: Parameters<typeof ChapterDAL.create>) =>
  ChapterDAL.create(...args);

export const updateTitle = (
  ...args: Parameters<typeof ChapterDAL.updateTitle>
) => ChapterDAL.updateTitle(...args);

export const deleteChapter = (...args: Parameters<typeof ChapterDAL.delete>) =>
  ChapterDAL.delete(...args);

export const updatePosition = (
  ...args: Parameters<typeof ChapterDAL.updatePosition>
) => ChapterDAL.updatePosition(...args);
