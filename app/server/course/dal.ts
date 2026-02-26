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
  PublicCourseListDTO,
  PublicCoursesSchema,
} from './dto';
import { getPagination, validateOne, validatePaginated } from '../utils';
import { Prisma } from '@/generated/prisma/client';
import { CourseSchema } from '@/lib/validations';

type CourseSort = 'newest' | 'oldest';
type CourseFilter = 'beginner' | 'intermediate' | 'advanced';
type AdminCourseFilter = 'draft' | 'published' | 'archived' | CourseFilter;
export class CourseDAL {
  private static readonly select = {
    id: true,
    title: true,
    description: true,
    thumbnail: true,
    level: true,
    duration: true,
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

  private static getAdminCourseFilter(
    filter?: AdminCourseFilter
  ): Prisma.CourseWhereInput | undefined {
    switch (filter) {
      case 'draft':
        return { status: 'Draft' };
      case 'published':
        return { status: 'Published' };
      case 'archived':
        return { status: 'Archived' };
      case 'beginner':
        return { level: 'Beginner' };
      case 'intermediate':
        return { level: 'Intermediate' };
      case 'advanced':
        return { level: 'Advanced' };
      default:
        return undefined;
    }
  }

  private static getPublicCourseFilter(
    filter?: CourseFilter
  ): Prisma.CourseWhereInput | undefined {
    switch (filter) {
      case 'beginner':
        return { level: 'Beginner' };
      case 'intermediate':
        return { level: 'Intermediate' };
      case 'advanced':
        return { level: 'Advanced' };
      default:
        return undefined;
    }
  }

  static async create(data: Course, userId: string) {
    return prisma.$transaction(async (tx) => {
      const course = await tx.course.create({
        data: { ...data, userId },
      });

      return validateOne(course, CourseSchema, 'Course');
    });
  }

  static async findMany(params: QueryParams): Promise<CoursesListDTO> {
    const { page, pageSize, query, filter, sort } = params;
    const { offset, limit } = getPagination({ page, pageSize });

    const where: Prisma.CourseWhereInput = {
      ...this.getAdminCourseFilter(filter as AdminCourseFilter),
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
      select: { ...this.select, status: true },
      skip: offset,
      take: limit,
    });

    const totalCourses = await prisma.course.count({ where });

    return validatePaginated(
      { courses, totalCourses },
      CourseListSchema,
      'Courses'
    );
  }

  static async publicFindMany(
    params: QueryParams
  ): Promise<PublicCourseListDTO> {
    const { page, pageSize, query, filter, sort } = params;
    const { offset, limit } = getPagination({ page, pageSize });

    const where: Prisma.CourseWhereInput = {
      ...this.getPublicCourseFilter(filter as CourseFilter),
      status: 'Published',
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
      select: { ...this.select, category: true },
      skip: offset,
      take: limit,
    });

    const totalCourses = await prisma.course.count({ where });

    return validatePaginated(
      { courses, totalCourses },
      PublicCoursesSchema,
      'Courses'
    );
  }

  static async findById(id: string): Promise<CourseDTO> {
    const data = await prisma.course.findUnique({
      where: { id },
      select: {
        ...this.select,
        status: true,
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

  static async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.course.delete({
        where: { id },
      });
    });
  }
}

export const createCourse = (...args: Parameters<typeof CourseDAL.create>) =>
  CourseDAL.create(...args);
export const listCourses = (...args: Parameters<typeof CourseDAL.findMany>) =>
  CourseDAL.findMany(...args);
export const listPublicCourses = (
  ...args: Parameters<typeof CourseDAL.publicFindMany>
) => CourseDAL.publicFindMany(...args);
export const getCourseById = (...args: Parameters<typeof CourseDAL.findById>) =>
  CourseDAL.findById(...args);
export const updateCourse = (...args: Parameters<typeof CourseDAL.update>) =>
  CourseDAL.update(...args);
export const deleteCourse = (...args: Parameters<typeof CourseDAL.delete>) =>
  CourseDAL.delete(...args);
