import { admin } from '@/app/middleware/admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { CourseSchema, QueryParamsSchema } from '@/lib/validations';
import {
  createCourse as createCourseDAL,
  listCourses as listCoursesDAL,
} from './dal';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import { heavyWriteSecurityMiddleware } from '@/app/middleware/arcjet/heavy-write';
import { CoursesListSchema } from './dto';
import { readSecurityMiddleware } from '@/app/middleware/arcjet/read';

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
