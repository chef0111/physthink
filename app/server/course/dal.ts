import 'server-only';

import { prisma } from '@/lib/prisma';
import {
  Course,
  CoursesListDTO,
  CourseDTO,
  GetCourseSchema,
  CourseListSchema,
  UpdateCourseDTO,
  UpdateCourseSchema,
} from './dto';
import { getPagination, validateOne, validatePaginated } from '../utils';
import { Prisma } from '@/generated/prisma/client';

type CourseSort = 'newest' | 'oldest';
type CourseFilter = 'draft' | 'published' | 'archived';

export class CourseDAL {
  private static readonly select = {
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

  static async create(data: Course, userId: string) {
    return prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: { ...data, userId },
      });

      return course;
    });
  }

  static async findMany(params: QueryParams): Promise<CoursesListDTO> {
    const { page, pageSize, query, filter, sort } = params;
    const { offset, limit } = getPagination({ page, pageSize });

    const where: Prisma.CourseWhereInput = {
      ...this.getStatusFilter(filter as CourseFilter),
    };

    if (query) {
      where.OR = [
        {
          title: {
            contains: query,
            mode: 'insensitive',
          },
        },
        {
          description: {
            contains: query,
            mode: 'insensitive',
          },
        },
      ];
    }

    const courses = await prisma.course.findMany({
      where,
      orderBy: this.getSortCriteria(sort as CourseSort),
      select: this.select,
      skip: offset,
      take: limit,
    });

    const totalCourses = await prisma.course.count({ where });

    return validatePaginated(
      { courses, totalCourses },
      CourseListSchema,
      'Course'
    );
  }

  static async findById(id: string): Promise<CourseDTO> {
    const data = await prisma.course.findUnique({
      where: { id },
      select: {
        ...this.select,
        readme: true,
        category: true,
        chapters: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            position: true,
            lessons: {
              orderBy: { position: 'asc' },
              select: {
                id: true,
                title: true,
                content: true,
                thumbnail: true,
                video: true,
                position: true,
              },
            },
          },
        },
      },
    });

    return validateOne(data, GetCourseSchema, 'Course');
  }

  static async update(id: string, data: UpdateCourseDTO) {
    return prisma.$transaction(async (tx) => {
      const course = await tx.course.update({
        where: { id },
        data,
      });

      return validateOne(course, UpdateCourseSchema, 'Course');
    });
  }
}

export const createCourse = (...args: Parameters<typeof CourseDAL.create>) =>
  CourseDAL.create(...args);
export const listCourses = (...args: Parameters<typeof CourseDAL.findMany>) =>
  CourseDAL.findMany(...args);
export const getCourseById = (...args: Parameters<typeof CourseDAL.findById>) =>
  CourseDAL.findById(...args);
export const updateCourse = (...args: Parameters<typeof CourseDAL.update>) =>
  CourseDAL.update(...args);
