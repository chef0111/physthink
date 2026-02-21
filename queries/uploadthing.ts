import { useMutation } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';

export function useDeleteFile() {
  return useMutation(orpc.uploadthing.delete.mutationOptions());
}
