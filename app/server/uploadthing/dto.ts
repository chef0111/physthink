import z from 'zod';

export const DeleteFileSchema = z.object({
  key: z.string().min(1, { message: 'File key is required.' }),
});

export type DeleteFileDTO = z.infer<typeof DeleteFileSchema>;
