import { admin } from '@/app/middleware/admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CourseSchema, QueryParamsSchema } from '@/lib/validations';
import {
  createCourse as createCourseDAL,
  getCourseById,
  listCourses as listCoursesDAL,
  updateCourse as updateCourseDAL,
} from './dal';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import { heavyWriteSecurityMiddleware } from '@/app/middleware/arcjet/heavy-write';
import { writeSecurityMiddleware } from '@/app/middleware/arcjet/write';
import { CoursesListSchema, GetCourseSchema, UpdateCourseSchema } from './dto';
import { readSecurityMiddleware } from '@/app/middleware/arcjet/read';
import z from 'zod';

export const createCourse = admin
  .use(standardSecurityMiddleware)
  .use(heavyWriteSecurityMiddleware)
  .input(CourseSchema)
  .handler(async ({ input, context }) => {
    const course = await createCourseDAL(input, context.user.id);

    revalidateTag(`course:${course.id}`, 'max');
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

export const getCourse = admin
  .use(standardSecurityMiddleware)
  .use(readSecurityMiddleware)
  .input(z.object({ id: z.string() }))
  .output(GetCourseSchema)
  .handler(async ({ input }) => {
    const course = await getCourseById(input.id);
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

    return { id: course.id, ...data };
  });
