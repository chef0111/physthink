import { prisma } from '@/lib/prisma';
import { CourseDTO } from './dto';

export class CourseDAL {
  static async create(data: CourseDTO, userId: string) {
    return prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: {
          title: data.title,
          description: data.description,
          thumbnail: data.thumbnail,
          duration: data.duration,
          level: data.level,
          category: data.category,
          readme: data.readme,
          slug: data.slug,
          status: data.status,
          userId,
        },
      });

      return course;
    });
  }
}

export const createCourse = (...args: Parameters<typeof CourseDAL.create>) =>
  CourseDAL.create(...args);
