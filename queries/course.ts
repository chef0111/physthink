import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/lib/orpc';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface CreateCourseOptions {
  onReset: () => void;
}

export function useCreateCourse(options: CreateCourseOptions) {
  const router = useRouter();

  return useMutation(
    orpc.course.create.mutationOptions({
      onSuccess: () => {
        toast.success('Course created successfully!');
        options?.onReset?.();
        router.push('/admin/courses');
      },
      onError: (error) => {
        toast.error('Failed to create course', {
          description: error.message,
        });
      },
    })
  );
}

export function useUpdateCourse(courseId: string) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation(
    orpc.course.update.mutationOptions({
      onSuccess: () => {
        toast.success('Course updated successfully!');
        queryClient.invalidateQueries(
          orpc.course.get.queryOptions({ input: { id: courseId } })
        );
        router.push('/admin/courses');
      },
      onError: (error) => {
        toast.error('Failed to update course', {
          description: error.message,
        });
      },
    })
  );
}
