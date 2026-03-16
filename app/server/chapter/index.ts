import { admin } from '@/app/middleware/admin';
import { revalidatePath, revalidateTag } from 'next/cache';
import { writeSecurityMiddleware } from '@/app/middleware/arcjet/write';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import {
  CreateChapterSchema,
  UpdateChapterTitleSchema,
  DeleteChapterSchema,
  ReorderChapterSchema,
} from './dto';
import { ChapterDAL } from './dal';

export const createChapter = admin
  .route({
    method: 'POST',
    path: '/chapter/create',
    tags: ['chapter'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(CreateChapterSchema)
  .handler(async ({ input }) => {
    const { title, courseId } = input;

    revalidateTag(`course:${courseId}`, 'max');
    revalidatePath(`/admin/courses/${courseId}/edit`);
    return await ChapterDAL.create(title, courseId);
  });

export const updateChapterTitle = admin
  .route({
    method: 'PATCH',
    path: '/chapter/update-title',
    tags: ['chapter'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(UpdateChapterTitleSchema)
  .handler(async ({ input }) => {
    const { id, courseId, courseSlug, title } = input;
    await ChapterDAL.updateTitle(id, title);

    revalidateTag(`course:${courseId}`, 'max');
    revalidateTag(`chapter:${id}`, 'max');
    revalidatePath(`/admin/courses/${courseId}/edit`);
    revalidatePath(`/courses/${courseSlug}`);
    revalidatePath(`/dashboard/course/${courseSlug}`);
  });

export const deleteChapter = admin
  .route({
    method: 'DELETE',
    path: '/chapter/delete',
    tags: ['chapter'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(DeleteChapterSchema)
  .handler(async ({ input }) => {
    const { id, courseId, courseSlug } = input;
    await ChapterDAL.delete(id, courseId);

    revalidateTag(`course:${courseId}`, 'max');
    revalidatePath(`/admin/courses/${courseId}/edit`);
    revalidatePath(`/courses/${courseSlug}`);
    revalidatePath(`/dashboard/course/${courseSlug}`);
  });

export const reorderChapter = admin
  .route({
    method: 'PATCH',
    path: '/chapter/reorder',
    tags: ['chapter'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(ReorderChapterSchema)
  .handler(async ({ input }) => {
    const { chapters, courseId, courseSlug } = input;
    await ChapterDAL.updatePosition(chapters, courseId);

    revalidateTag(`course:${courseId}`, 'max');
    chapters.forEach((chapter) => {
      revalidateTag(`chapter:${chapter.id}`, 'max');
    });
    revalidatePath(`/admin/courses/${courseId}/edit`);
    revalidatePath(`/courses/${courseSlug}`);
    revalidatePath(`/dashboard/course/${courseSlug}`);
  });
