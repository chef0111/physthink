import { orpc } from '@/lib/orpc';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useCreateChapter(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.chapter.create.mutationOptions({
      onSuccess: () => {
        toast.success('Chapter created successfully');
        queryClient.invalidateQueries(
          orpc.course.get.queryOptions({ input: { id: courseId } })
        );
      },
      onError: (error) => {
        toast.error('Failed to create chapter', {
          description: error.message,
        });
      },
    })
  );
}

export function useUpdateChapterTitle(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.chapter.updateTitle.mutationOptions({
      onSuccess: () => {
        toast.success('Chapter title updated');
        queryClient.invalidateQueries(
          orpc.course.get.queryOptions({ input: { id: courseId } })
        );
      },
      onError: (error) => {
        toast.error('Failed to update chapter title', {
          description: error.message,
        });
      },
    })
  );
}

export function useDeleteChapter(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.chapter.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Chapter deleted');
        queryClient.invalidateQueries(
          orpc.course.get.queryOptions({ input: { id: courseId } })
        );
      },
      onError: (error) => {
        toast.error('Failed to delete chapter', {
          description: error.message,
        });
      },
    })
  );
}

export function useReorderChapter(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.chapter.reorder.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          orpc.course.get.queryOptions({ input: { id: courseId } })
        );
      },
    })
  );
}
