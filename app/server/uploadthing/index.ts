import { authorized } from '@/app/middleware/auth';
import { DeleteFileSchema } from './dto';
import { deleteFile } from './dal';

export const deleteFiles = authorized
  .input(DeleteFileSchema)
  .handler(async ({ input }) => {
    await deleteFile(input.key);
    return { success: true };
  });
