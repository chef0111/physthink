import z from 'zod';
import { CourseDAL } from './dal';
import { prisma } from '@/lib/prisma';
import { admin } from '@/app/middleware/admin';
import { authorized } from '@/app/middleware/auth';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CourseSchema, QueryParamsSchema } from '@/lib/validations';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import { heavyWriteSecurityMiddleware } from '@/app/middleware/arcjet/heavy-write';
import { writeSecurityMiddleware } from '@/app/middleware/arcjet/write';
import { readSecurityMiddleware } from '@/app/middleware/arcjet/read';
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

export const createCourse = admin
  .route({
    method: 'POST',
    path: '/course/create',
    tags: ['course'],
  })
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

    const course = await CourseDAL.create(input, context.user.id);

    revalidateTag('courses', 'max');
    revalidatePath('/admin/courses');

    return course;
  });

export const listCourses = admin
  .route({
    method: 'GET',
    path: '/course/list',
    tags: ['course'],
  })
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(QueryParamsSchema)
  .output(CoursesListSchema)
  .handler(async ({ input }) => {
    const courses = await CourseDAL.findMany(input);
    return courses;
  });

export const listPublicCourses = authorized
  .route({
    method: 'GET',
    path: '/course/list-public',
    tags: ['course'],
  })
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(QueryParamsSchema)
  .output(PublicCourseListSchema)
  .handler(async ({ input, context }) => {
    const courses = await CourseDAL.publicFindMany({
      ...input,
      userId: context.user.id,
    });
    return courses;
  });

export const getCourse = admin
  .route({
    method: 'GET',
    path: '/course/get',
    tags: ['course'],
  })
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(z.object({ id: z.string() }))
  .output(GetCourseSchema)
  .handler(async ({ input, errors }) => {
    const course = await CourseDAL.findById(input.id);
    if (!course) {
      throw errors.NOT_FOUND({ message: 'Course not found' });
    }
    return course;
  });

export const getCourseSlug = admin
  .route({
    method: 'GET',
    path: '/course/get-slug',
    tags: ['course'],
  })
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(z.object({ id: z.string() }))
  .output(CourseSlugSchema)
  .handler(async ({ input, errors }) => {
    const course = await CourseDAL.findSlug(input.id);
    if (!course) {
      throw errors.NOT_FOUND({ message: 'Course not found' });
    }
    return course;
  });

export const getCourseBySlug = authorized
  .route({
    method: 'GET',
    path: '/course/get-by-slug',
    tags: ['course'],
  })
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(z.object({ slug: z.string() }))
  .output(CoursePreviewSchema)
  .handler(async ({ input, context, errors }) => {
    const course = await CourseDAL.findBySlug(input.slug, context.user.id);
    if (!course) {
      throw errors.NOT_FOUND({ message: 'Course not found' });
    }
    return course;
  });

export const updateCourse = admin
  .route({
    method: 'PUT',
    path: '/course/update',
    tags: ['course'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(UpdateCourseSchema)
  .output(UpdateCourseSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    const course = await CourseDAL.update(id, input);

    revalidateTag(`course:${course.id}`, 'max');
    revalidateTag('courses', 'max');
    revalidatePath('/admin/courses');
    revalidatePath(`/admin/courses/${id}/edit`);
    revalidatePath(`/courses`);
    revalidatePath(`/courses/${course.slug}`);

    return { id: course.id, ...data };
  });

export const deleteCourse = admin
  .route({
    method: 'DELETE',
    path: '/course/delete',
    tags: ['course'],
  })
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

    await CourseDAL.delete(existing.id);

    revalidateTag(`course:${existing.id}`, 'max');
    revalidateTag('courses', 'max');
    revalidatePath('/admin/courses');
    revalidatePath('/courses');
    revalidatePath('/dashboard');
  });

export const enroll = authorized
  .route({
    method: 'POST',
    path: '/course/enroll',
    tags: ['course'],
  })
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

    const enrollment = await CourseDAL.enroll(input.courseId, context.user.id);

    revalidateTag(`course:${input.courseId}`, 'max');
    revalidateTag(`enrolled-courses:${context.user.id}`, 'max');
    revalidatePath(`/courses`);
    revalidatePath(`/dashboard`);

    return enrollment;
  });

export const listEnrolled = authorized
  .route({
    method: 'GET',
    path: '/course/list-enrolled',
    tags: ['course'],
  })
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(QueryParamsSchema)
  .output(PublicCourseListSchema)
  .handler(async ({ input, context }) => {
    const { courses, totalCourses } = await CourseDAL.listEnrolled(
      context.user.id,
      input
    );
    return { courses, totalCourses };
  });
