import 'server-only';

import z from 'zod';

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().nullish(),
  thumbnail: z.string().nullish(),
  video: z.string().nullish(),
  position: z.number(),
});

export const CreateLessonSchema = z.object({
  title: z.string(),
  chapterId: z.string(),
  courseId: z.string(),
  courseSlug: z.string(),
});

export const UpdateLessonSchema = LessonSchema.extend({
  courseId: z.string(),
  courseSlug: z.string(),
}).omit({
  position: true,
});

export const LessonConfigSchema = LessonSchema.omit({
  id: true,
  position: true,
});

export const NewLessonSchema = CreateLessonSchema.omit({
  courseId: true,
});

export const UpdateLessonTitleSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  courseSlug: z.string(),
  chapterId: z.string(),
  title: z.string().min(1, 'Title is required').max(100),
});

export const DeleteLessonSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  courseSlug: z.string(),
  chapterId: z.string(),
});

export const LessonOrderSchema = LessonSchema.pick({
  id: true,
  position: true,
});

export const ReorderLessonSchema = z.object({
  lessons: z.array(LessonOrderSchema),
  chapterId: z.string(),
  courseId: z.string(),
  courseSlug: z.string(),
});

export type LessonDTO = z.infer<typeof LessonSchema>;
export type CreateLessonDTO = z.infer<typeof CreateLessonSchema>;
export type LessonConfigDTO = z.infer<typeof LessonConfigSchema>;
export type UpdateLessonTitleDTO = z.infer<typeof UpdateLessonTitleSchema>;
export type DeleteLessonDTO = z.infer<typeof DeleteLessonSchema>;
export type LessonOrderDTO = z.infer<typeof LessonOrderSchema>;
export type ReorderLessonDTO = z.infer<typeof ReorderLessonSchema>;
