import { useMutation } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';
import { toast } from 'sonner';

interface CreateCourseOptions {
  onReset: () => void;
}

export function useCreateCourse(options: CreateCourseOptions) {
  return useMutation(
    orpc.course.create.mutationOptions({
      onSuccess: () => {
        toast.success('Course created successfully!');
        options?.onReset?.();
      },
      onError: (error) => {
        toast.error('Failed to create course', {
          description: error.message,
        });
      },
    })
  );
}
