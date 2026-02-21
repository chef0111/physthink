import { authorized } from '@/app/middleware/auth';
import { CourseSchema } from '@/lib/validations';
import { createCourse as createCourseDAL } from './dal';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import { heavyWriteSecurityMiddleware } from '@/app/middleware/arcjet/heavy-write';
import { revalidatePath, revalidateTag } from 'next/cache';

export const createCourse = authorized
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
