import 'server-only';

import z from 'zod';

export const LessonSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  thumbnail: z.string().nullish(),
  video: z.string().nullish(),
  position: z.number(),
});

export const CreateLessonSchema = z.object({
  title: z.string(),
  chapterId: z.string(),
  courseId: z.string(),
});

export const NewLessonSchema = CreateLessonSchema.omit({
  courseId: true,
});

export const UpdateLessonTitleSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  chapterId: z.string(),
  title: z.string().min(1, 'Title is required').max(100),
});

export const DeleteLessonSchema = z.object({
  id: z.string(),
  courseId: z.string(),
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
});

export type LessonDTO = z.infer<typeof LessonSchema>;
export type CreateLessonDTO = z.infer<typeof CreateLessonSchema>;
export type UpdateLessonTitleDTO = z.infer<typeof UpdateLessonTitleSchema>;
export type DeleteLessonDTO = z.infer<typeof DeleteLessonSchema>;
export type LessonOrderDTO = z.infer<typeof LessonOrderSchema>;
export type ReorderLessonDTO = z.infer<typeof ReorderLessonSchema>;
