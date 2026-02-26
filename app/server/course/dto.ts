import 'server-only';

import z from 'zod';
import { CourseSchema } from '@/lib/validations';
import { ChapterSchema } from '../chapter/dto';

export const GetCourseSchema = CourseSchema.extend({
  id: z.string(),
  chapters: z.array(ChapterSchema),
});

export const DeleteCourseSchema = z.object({
  id: z.string(),
});

export const UpdateCourseSchema = CourseSchema.extend({ id: z.string() });

export const CourseListSchema = GetCourseSchema.omit({
  readme: true,
  category: true,
  chapters: true,
});

export const CoursesListSchema = z.object({
  courses: z.array(CourseListSchema),
  totalCourses: z.number(),
});

export type Course = z.infer<typeof CourseSchema>;
export type CourseDTO = z.infer<typeof GetCourseSchema>;
export type UpdateCourseDTO = z.infer<typeof UpdateCourseSchema>;
export type DeleteCourseDTO = z.infer<typeof DeleteCourseSchema>;
export type CourseListDTO = z.infer<typeof CourseListSchema>;
export type CoursesListDTO = z.infer<typeof CoursesListSchema>;
