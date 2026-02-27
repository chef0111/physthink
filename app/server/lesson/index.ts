import z from 'zod';
import { admin } from '@/app/middleware/admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { writeSecurityMiddleware } from '@/app/middleware/arcjet/write';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import {
  UpdateLessonTitleSchema,
  DeleteLessonSchema,
  ReorderLessonSchema,
  LessonSchema,
  CreateLessonSchema,
  UpdateLessonSchema,
  LessonConfigSchema,
} from './dto';
import {
  getById,
  createLesson as createLessonDAL,
  updateLesson as updateLessonDAL,
  updateTitle,
  deleteLesson as deleteLessonDAL,
  updatePosition,
} from './dal';

export const getLesson = admin
  .use(standardSecurityMiddleware)
  .input(z.object({ id: z.string() }))
  .output(LessonSchema)
  .handler(async ({ input, errors }) => {
    const { id } = input;
    const lesson = await getById(id);
    if (!lesson) {
      throw errors.NOT_FOUND({ message: 'Lesson not found' });
    }
    return lesson;
  });

export const createLesson = admin
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(CreateLessonSchema)
  .handler(async ({ input }) => {
    const { title, chapterId, courseId } = input;

    revalidateTag(`course:${courseId}`, 'max');
    revalidatePath(`/admin/courses/${courseId}/edit`);
    return await createLessonDAL(title, chapterId);
  });

export const updateLesson = admin
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(UpdateLessonSchema)
  .output(LessonConfigSchema)
  .handler(async ({ input }) => {
    const { id, courseId, ...data } = input;
    const lesson = await updateLessonDAL(id, data);

    revalidateTag(`course:${courseId}`, 'max');
    revalidateTag(`lesson:${id}`, 'max');
    revalidatePath(`/admin/courses/${courseId}/edit`);
    revalidatePath(`/admin/courses/${courseId}/lesson/${id}`);

    return lesson;
  });

export const updateLessonTitle = admin
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(UpdateLessonTitleSchema)
  .handler(async ({ input }) => {
    const { id, courseId, title } = input;
    await updateTitle(id, title);

    revalidateTag(`course:${courseId}`, 'max');
    revalidatePath(`/admin/courses/${courseId}/edit`);
  });

export const deleteLesson = admin
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(DeleteLessonSchema)
  .handler(async ({ input }) => {
    const { id, courseId, chapterId } = input;
    await deleteLessonDAL(id, chapterId);

    revalidateTag(`course:${courseId}`, 'max');
    revalidatePath(`/admin/courses/${courseId}/edit`);
  });

export const reorderLesson = admin
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(ReorderLessonSchema)
  .handler(async ({ input }) => {
    const { lessons, chapterId, courseId } = input;
    await updatePosition(lessons, chapterId);

    revalidateTag(`course:${courseId}`, 'max');
    revalidateTag(`chapter:${chapterId}`, 'max');
    revalidatePath(`/admin/courses/${courseId}/edit`);
  });
