import { UTApi } from 'uploadthing/server';
import { admin } from '@/app/middleware/admin';
import { DeleteFileSchema } from './dto';
import { standardSecurityMiddleware } from '@/app/middleware/arcjet/standard';
import { writeSecurityMiddleware } from '@/app/middleware/arcjet/write';

const utApi = new UTApi();

export const deleteFiles = admin
  .route({
    method: 'DELETE',
    path: '/uploadthing/delete',
    tags: ['uploadthing'],
  })
  .use(standardSecurityMiddleware)
  .use(writeSecurityMiddleware)
  .input(DeleteFileSchema)
  .handler(async ({ input }) => {
    await utApi.deleteFiles(input.key);
    return { success: true };
  });
