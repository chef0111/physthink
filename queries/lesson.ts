import { orpc } from '@/lib/orpc';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useCreateLesson(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.lesson.create.mutationOptions({
      onSuccess: () => {
        toast.success('Lesson created successfully');
        queryClient.invalidateQueries(
          orpc.course.get.queryOptions({ input: { id: courseId } })
        );
      },
      onError: (error) => {
        toast.error('Failed to create lesson', {
          description: error.message,
        });
      },
    })
  );
}

export function useUpdateLesson(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.lesson.update.mutationOptions({
      onSuccess: () => {
        toast.success('Lesson updated successfully');
        queryClient.invalidateQueries(
          orpc.lesson.get.queryOptions({ input: { id: lessonId } })
        );
      },
      onError: (error) => {
        toast.error('Failed to update lesson', {
          description: error.message,
        });
      },
    })
  );
}

export function useUpdateLessonTitle(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.lesson.updateTitle.mutationOptions({
      onSuccess: () => {
        toast.success('Lesson title updated');
        queryClient.invalidateQueries(
          orpc.course.get.queryOptions({ input: { id: courseId } })
        );
      },
      onError: (error) => {
        toast.error('Failed to update lesson title', {
          description: error.message,
        });
      },
    })
  );
}

export function useDeleteLesson(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.lesson.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Lesson deleted!');
        queryClient.invalidateQueries(
          orpc.course.get.queryOptions({ input: { id: courseId } })
        );
      },
      onError: (error) => {
        toast.error('Failed to delete lesson', {
          description: error.message,
        });
      },
    })
  );
}

export function useReorderLesson(courseId: string) {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.lesson.reorder.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(
          orpc.course.get.queryOptions({ input: { id: courseId } })
        );
      },
    })
  );
}
