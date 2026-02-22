import 'server-only';

import { prisma } from '@/lib/prisma';
import { CourseDTO, CoursesListDTO } from './dto';
import { getPagination } from '../utils';
import { Prisma } from '@/generated/prisma/client';

type CourseSort = 'newest' | 'oldest';
type CourseFilter = 'draft' | 'published' | 'archived';

export class CourseDAL {
  private static readonly selectFields = {
    id: true,
    title: true,
    description: true,
    thumbnail: true,
    level: true,
    duration: true,
    status: true,
    slug: true,
  };

  private static getSortCriteria(
    sort?: CourseSort
  ): Prisma.CourseOrderByWithRelationInput {
    switch (sort) {
      case 'oldest':
        return { createdAt: 'asc' };
      case 'newest':
        return { createdAt: 'desc' };
      default:
        return { createdAt: 'desc' };
    }
  }

  private static getStatusFilter(
    filter?: CourseFilter
  ): Prisma.CourseWhereInput | undefined {
    switch (filter) {
      case 'draft':
        return { status: 'Draft' };
      case 'published':
        return { status: 'Published' };
      case 'archived':
        return { status: 'Archived' };
      default:
        return undefined;
    }
  }

  static async create(data: CourseDTO, userId: string) {
    return prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: { ...data, userId },
      });

      return course;
    });
  }

  static async findMany(params: QueryParams): Promise<CoursesListDTO> {
    const { query, filter, sort, page, pageSize } = params;
    const { offset, limit } = getPagination({ page, pageSize });

    const where: Prisma.CourseWhereInput = {
      ...this.getStatusFilter(filter as CourseFilter),
    };

    if (query) {
      where.title = {
        contains: query,
        mode: 'insensitive',
      };
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: this.getSortCriteria(sort as CourseSort),
      select: this.selectFields,
      skip: offset,
      take: limit,
    });

    const totalCourses = await prisma.course.count({ where });

    return { courses, totalCourses };
  }
}

export const createCourse = (...args: Parameters<typeof CourseDAL.create>) =>
  CourseDAL.create(...args);
export const listCourses = (...args: Parameters<typeof CourseDAL.findMany>) =>
  CourseDAL.findMany(...args);
