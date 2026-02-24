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
} from './dto';
import {
  getById,
  createLesson as createLessonDAL,
  updateTitle,
  deleteLesson as deleteLessonDAL,
  updatePosition,
} from './dal';

export const getLesson = admin
  .use(standardSecurityMiddleware)
  .input(z.object({ id: z.string() }))
  .output(LessonSchema)
  .handler(async ({ input }) => {
    const { id } = input;
    return await getById(id);
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
