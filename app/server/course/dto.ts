import 'server-only';

import z from 'zod';
import { CourseSchema } from '@/lib/validations';
import { ChapterSchema } from '../chapter/dto';

export const GetCourseSchema = CourseSchema.extend({
  id: z.string(),
  chapters: z.array(ChapterSchema),
});

export const CourseSlugSchema = z.object({ slug: z.string() });

export const DeleteCourseSchema = z.object({
  id: z.string(),
  slug: z.string(),
});

export const EnrollCourseSchema = z.object({
  courseId: z.string(),
});

export const UpdateCourseSchema = CourseSchema.extend({ id: z.string() });

export const CourseListSchema = GetCourseSchema.omit({
  readme: true,
  category: true,
  chapters: true,
});

export const PublicCoursesSchema = GetCourseSchema.omit({
  readme: true,
  status: true,
  chapters: true,
});

export const CoursePreviewSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnail: z.string(),
  level: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  duration: z.number(),
  slug: z.string(),
  category: z.string(),
  readme: z.string(),
  chapters: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      lessons: z.array(
        z.object({
          id: z.string(),
          title: z.string(),
          content: z.string().nullish(),
          thumbnail: z.string().nullish(),
          video: z.string().nullish(),
        })
      ),
    })
  ),
});

export const CoursesListSchema = z.object({
  courses: z.array(CourseListSchema),
  totalCourses: z.number(),
});

export const PublicCourseListSchema = z.object({
  courses: z.array(PublicCoursesSchema),
  totalCourses: z.number(),
});

export type Course = z.infer<typeof CourseSchema>;
export type CourseDTO = z.infer<typeof GetCourseSchema>;
export type CourseSlugDTO = z.infer<typeof CourseSlugSchema>;
export type UpdateCourseDTO = z.infer<typeof UpdateCourseSchema>;
export type DeleteCourseDTO = z.infer<typeof DeleteCourseSchema>;
export type CourseListDTO = z.infer<typeof CourseListSchema>;
export type CoursesListDTO = z.infer<typeof CoursesListSchema>;
export type PublicCoursesDTO = z.infer<typeof PublicCoursesSchema>;
export type PublicCourseListDTO = z.infer<typeof PublicCourseListSchema>;
export type CoursePreviewDTO = z.infer<typeof CoursePreviewSchema>;
