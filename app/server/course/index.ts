import { prisma } from '@/lib/prisma';
import { admin } from '@/app/middleware/admin';
import { authorized } from '@/app/middleware/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CourseSchema, QueryParamsSchema } from '@/lib/validations';
import {
  createCourse as createCourseDAL,
  deleteCourse as deleteCourseDAL,
  getCourseById,
  getCourseBySlug as getCourseBySlugDAL,
  listCourses as listCoursesDAL,
  listPublicCourses as listPublicCoursesDAL,
  updateCourse as updateCourseDAL,
  enrollCourse as enrollCourseDAL,
  listEnrolledCourses as listEnrolledCoursesDAL,
  getSlug,
} from './dal';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import { heavyWriteSecurityMiddleware } from '@/app/middleware/arcjet/heavy-write';
import { writeSecurityMiddleware } from '@/app/middleware/arcjet/write';
import {
  CoursePreviewSchema,
  CoursesListSchema,
  DeleteCourseSchema,
  GetCourseSchema,
  PublicCourseListSchema,
  UpdateCourseSchema,
  EnrollCourseSchema,
  CourseSlugSchema,
} from './dto';
import { readSecurityMiddleware } from '@/app/middleware/arcjet/read';
import z from 'zod';

export const createCourse = admin
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .input(CourseSchema)
  .handler(async ({ input, context, errors }) => {
    const existing = await prisma.course.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });

    if (existing) {
      throw errors.CONFLICT({
        data: {
          field: 'slug',
          value: input.slug,
        },
        cause: 'SLUG_ALREADY_EXISTS',
        message: 'Slug already exists',
      });
    }

    const course = await createCourseDAL(input, context.user.id);

    revalidateTag('courses', 'max');
    revalidatePath('/admin/courses');

    return course;
  });

export const listCourses = admin
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(QueryParamsSchema)
  .output(CoursesListSchema)
  .handler(async ({ input }) => {
    const courses = await listCoursesDAL(input);
    return courses;
  });

export const listPublicCourses = authorized
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(QueryParamsSchema)
  .output(PublicCourseListSchema)
  .handler(async ({ input, context }) => {
    const courses = await listPublicCoursesDAL({
      ...input,
      userId: context.user.id,
    });
    return courses;
  });

export const getCourse = admin
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(z.object({ id: z.string() }))
  .output(GetCourseSchema)
  .handler(async ({ input, errors }) => {
    const course = await getCourseById(input.id);
    if (!course) {
      throw errors.NOT_FOUND({ message: 'Course not found' });
    }
    return course;
  });

export const getCourseSlug = admin
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(z.object({ id: z.string() }))
  .output(CourseSlugSchema)
  .handler(async ({ input, errors }) => {
    const course = await getSlug(input.id);
    if (!course) {
      throw errors.NOT_FOUND({ message: 'Course not found' });
    }
    return course;
  });

export const getCourseBySlug = authorized
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(z.object({ slug: z.string() }))
  .output(CoursePreviewSchema)
  .handler(async ({ input, errors }) => {
    const course = await getCourseBySlugDAL(input.slug);
    if (!course) {
      throw errors.NOT_FOUND({ message: 'Course not found' });
    }
    return course;
  });

export const updateCourse = admin
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(UpdateCourseSchema)
  .output(UpdateCourseSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    const course = await updateCourseDAL(id, input);

    revalidateTag(`course:${course.id}`, 'max');
    revalidateTag('courses', 'max');
    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${id}/edit`);
    revalidatePath(`/courses`);
    revalidatePath(`/courses/${course.slug}`);

    return { id: course.id, ...data };
  });

export const deleteCourse = admin
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(DeleteCourseSchema)
  .handler(async ({ input, errors }) => {
    const existing = await prisma.course.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });

    if (!existing) {
      throw errors.BAD_REQUEST({
        data: {
          field: 'slug',
          value: input.slug,
        },
        cause: 'SLUG_NOT_MATCH',
        message: 'Slug does not match',
      });
    }

    await deleteCourseDAL(existing.id);

    revalidateTag(`course:${existing.id}`, 'max');
    revalidateTag('courses', 'max');
    revalidatePath('/admin/courses');
    revalidatePath('/courses');
    revalidatePath('/dashboard');
  });

export const enroll = authorized
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(EnrollCourseSchema)
  .handler(async ({ input, context, errors }) => {
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: context.user.id,
        courseId: input.courseId,
      },
    });

    if (existingEnrollment) {
      throw errors.CONFLICT({
        message: 'You are already enrolled in this course',
      });
    }

    const enrollment = await enrollCourseDAL(input.courseId, context.user.id);

    revalidateTag(`course:${input.courseId}`, 'max');
    revalidateTag(`enrolled-courses:${context.user.id}`, 'max');
    revalidatePath(`/courses`);
    revalidatePath(`/dashboard`);

    return enrollment;
  });

export const listEnrolled = authorized
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(QueryParamsSchema)
  .output(PublicCourseListSchema)
  .handler(async ({ input, context }) => {
    const { courses, totalCourses } = await listEnrolledCoursesDAL(
      context.user.id,
      input
    );
    return { courses, totalCourses };
  });
