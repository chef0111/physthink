import 'server-only';

import { prisma } from '@/lib/prisma';
import { Course, UpdateCourseDTO } from './dto';
import { getPagination } from '../utils';
import { Prisma } from '@/generated/prisma/client';

type CourseSort = 'newest' | 'oldest' | 'popular';
type CourseFilter = 'beginner' | 'intermediate' | 'advanced' | 'unregistered';
type AdminCourseFilter = 'draft' | 'published' | 'archived' | CourseFilter;
export class CourseDAL {
  private static readonly courseSelect = {
    id: true,
    title: true,
    description: true,
    thumbnail: true,
    level: true,
    duration: true,
    slug: true,
  };

  private static readonly chapterSelect = { id: true, title: true };

  private static readonly lessonSelect = {
    id: true,
    title: true,
    content: true,
    thumbnail: true,
    video: true,
  };

  private static getSortCriteria(
    sort?: CourseSort
  ): Prisma.CourseOrderByWithRelationInput {
    switch (sort) {
      case 'oldest':
        return { createdAt: 'asc' };
      case 'newest':
        return { createdAt: 'desc' };
      case 'popular':
        return { enrollments: { _count: 'desc' } };
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
    filter?: CourseFilter,
    userId?: string
  ): Prisma.CourseWhereInput | undefined {
    switch (filter) {
      case 'beginner':
        return { level: 'Beginner' };
      case 'intermediate':
        return { level: 'Intermediate' };
      case 'advanced':
        return { level: 'Advanced' };
      case 'unregistered':
        return userId ? { enrollments: { none: { userId } } } : undefined;
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

  static async findMany(params: QueryParams) {
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
      select: { ...this.courseSelect, status: true },
      skip: offset,
      take: limit,
    });

    const totalCourses = await prisma.course.count({ where });

    return { courses, totalCourses };
  }

  static async publicFindMany(params: QueryParams & { userId?: string }) {
    const { page, pageSize, query, filter, sort, userId } = params;
    const { offset, limit } = getPagination({ page, pageSize });

    const where: Prisma.CourseWhereInput = {
      ...this.getPublicCourseFilter(filter as CourseFilter, userId),
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
      select: { ...this.courseSelect, category: true },
      skip: offset,
      take: limit,
    });

    const totalCourses = await prisma.course.count({ where });

    return { courses, totalCourses };
  }

  static async findById(id: string) {
    const course = await prisma.course.findUnique({
      where: { id },
      select: {
        ...this.courseSelect,
        status: true,
        readme: true,
        category: true,
        chapters: {
          orderBy: { position: 'asc' },
          select: {
            ...this.chapterSelect,
            position: true,
            lessons: {
              orderBy: { position: 'asc' },
              select: { ...this.lessonSelect, position: true },
            },
          },
        },
      },
    });

    return course;
  }

  static async findBySlug(slug: string) {
    const course = await prisma.course.findUnique({
      where: { slug },
      select: {
        ...this.courseSelect,
        readme: true,
        category: true,
        chapters: {
          orderBy: { position: 'asc' },
          select: {
            ...this.chapterSelect,
            lessons: {
              orderBy: { position: 'asc' },
              select: this.lessonSelect,
            },
          },
        },
      },
    });

    return course;
  }

  static async update(id: string, data: UpdateCourseDTO) {
    return prisma.$transaction(async (tx) => {
      const course = await tx.course.update({
        where: { id },
        data,
      });

      return course;
    });
  }

  static async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      await tx.course.delete({
        where: { id },
      });
    });
  }

  static async enroll(courseId: string, userId: string) {
    return prisma.enrollment.create({
      data: { courseId, userId },
    });
  }

  static async listEnrolled(userId: string, params: QueryParams) {
    const { page, pageSize, query, filter, sort } = params;
    const { offset, limit } = getPagination({ page, pageSize });

    const where: Prisma.CourseWhereInput = {
      ...this.getPublicCourseFilter(filter as CourseFilter, userId),
      enrollments: {
        some: { userId },
      },
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
      select: { ...this.courseSelect, category: true },
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
export const listPublicCourses = (
  ...args: Parameters<typeof CourseDAL.publicFindMany>
) => CourseDAL.publicFindMany(...args);
export const getCourseById = (...args: Parameters<typeof CourseDAL.findById>) =>
  CourseDAL.findById(...args);
export const getCourseBySlug = (
  ...args: Parameters<typeof CourseDAL.findBySlug>
) => CourseDAL.findBySlug(...args);
export const updateCourse = (...args: Parameters<typeof CourseDAL.update>) =>
  CourseDAL.update(...args);
export const deleteCourse = (...args: Parameters<typeof CourseDAL.delete>) =>
  CourseDAL.delete(...args);
export const enrollCourse = (...args: Parameters<typeof CourseDAL.enroll>) =>
  CourseDAL.enroll(...args);
export const listEnrolledCourses = (
  ...args: Parameters<typeof CourseDAL.listEnrolled>
) => CourseDAL.listEnrolled(...args);
