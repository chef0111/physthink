import { authorized } from '@/app/middleware/auth';
import { CourseSchema } from '@/lib/validations';
import { createCourse as createCourseDAL } from './dal';

export const createCourse = authorized
  .input(CourseSchema)
  .handler(async ({ input, context }) => {
    const course = await createCourseDAL(input, context.user.id);
    return course;
  });
