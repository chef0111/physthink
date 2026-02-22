import 'server-only';

import z from 'zod';
import { CourseSchema } from '@/lib/validations';

export const CourseListSchema = CourseSchema.omit({
  readme: true,
  category: true,
}).extend({
  id: z.string(),
});

export const CoursesListSchema = z.object({
  courses: z.array(CourseListSchema),
  totalCourses: z.number(),
});

export type CourseDTO = z.infer<typeof CourseSchema>;
export type CourseListDTO = z.infer<typeof CourseListSchema>;
export type CoursesListDTO = z.infer<typeof CoursesListSchema>;
