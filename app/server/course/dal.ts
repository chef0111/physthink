import { prisma } from '@/lib/prisma';
import { CourseDTO } from './dto';

export class CourseDAL {
  static async create(data: CourseDTO, userId: string) {
    return prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: { ...data, userId },
      });

      return course;
    });
  }
}

export const createCourse = (...args: Parameters<typeof CourseDAL.create>) =>
  CourseDAL.create(...args);
