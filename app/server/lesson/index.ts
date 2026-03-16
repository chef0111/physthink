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
import { LessonDAL } from './dal';

export const getLesson = admin
  .route({
    method: 'GET',
    path: '/lesson/get',
    tags: ['lesson'],
  })
  .use(standardSecurityMiddleware)
  .input(z.object({ id: z.string() }))
  .output(LessonSchema)
  .handler(async ({ input, errors }) => {
    const { id } = input;
    const lesson = await LessonDAL.findById(id);
    if (!lesson) {
      throw errors.NOT_FOUND({ message: 'Lesson not found' });
    }
    return lesson;
  });

export const createLesson = admin
  .route({
    method: 'POST',
    path: '/lesson/create',
    tags: ['lesson'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(CreateLessonSchema)
  .handler(async ({ input }) => {
    const { title, chapterId, courseId, courseSlug } = input;

    revalidateTag(`course:${courseId}`, 'max');
    revalidatePath(`/admin/courses/${courseId}/edit`);
    revalidatePath(`/courses/${courseSlug}`);
    revalidatePath(`/dashboard/course/${courseSlug}`);
    return await LessonDAL.create(title, chapterId);
  });

export const updateLesson = admin
  .route({
    method: 'PUT',
    path: '/lesson/update',
    tags: ['lesson'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(UpdateLessonSchema)
  .output(LessonConfigSchema)
  .handler(async ({ input }) => {
    const { id, courseId, courseSlug, ...data } = input;
    const lesson = await LessonDAL.update(id, data);

    revalidateTag(`course:${courseId}`, 'max');
    revalidateTag(`lesson:${id}`, 'max');
    revalidatePath(`/admin/courses/${courseId}/edit`);
    revalidatePath(`/admin/courses/${courseId}/lesson/${id}`);
    revalidatePath(`/courses/${courseSlug}`);
    revalidatePath(`/dashboard/course/${courseSlug}`);
    return lesson;
  });

export const updateLessonTitle = admin
  .route({
    method: 'PATCH',
    path: '/lesson/update-title',
    tags: ['lesson'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(UpdateLessonTitleSchema)
  .handler(async ({ input }) => {
    const { id, courseId, courseSlug, title } = input;
    await LessonDAL.updateTitle(id, title);

    revalidateTag(`course:${courseId}`, 'max');
    revalidatePath(`/admin/courses/${courseId}/edit`);
    revalidatePath(`/courses/${courseSlug}`);
    revalidatePath(`/dashboard/course/${courseSlug}`);
  });

export const deleteLesson = admin
  .route({
    method: 'DELETE',
    path: '/lesson/delete',
    tags: ['lesson'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(DeleteLessonSchema)
  .handler(async ({ input }) => {
    const { id, courseId, chapterId, courseSlug } = input;
    await LessonDAL.delete(id, chapterId);

    revalidateTag(`course:${courseId}`, 'max');
    revalidatePath(`/admin/courses/${courseId}/edit`);
    revalidatePath(`/courses/${courseSlug}`);
    revalidatePath(`/dashboard/course/${courseSlug}`);
  });

export const reorderLesson = admin
  .route({
    method: 'PATCH',
    path: '/lesson/reorder',
    tags: ['lesson'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(ReorderLessonSchema)
  .handler(async ({ input }) => {
    const { lessons, chapterId, courseId, courseSlug } = input;
    await LessonDAL.updatePosition(lessons, chapterId);

    revalidateTag(`course:${courseId}`, 'max');
    revalidateTag(`chapter:${chapterId}`, 'max');
    revalidatePath(`/admin/courses/${courseId}/edit`);
    revalidatePath(`/courses/${courseSlug}`);
  });
