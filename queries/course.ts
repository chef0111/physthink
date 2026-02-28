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
  const queryClient = useQueryClient();

  return useMutation(
    orpc.course.update.mutationOptions({
      onSuccess: () => {
        toast.success('Course updated successfully!');
        queryClient.invalidateQueries(
          orpc.course.get.queryOptions({ input: { id: courseId } })
        );
      },
      onError: (error) => {
        toast.error('Failed to update course', {
          description: error.message,
        });
      },
    })
  );
}

export function useDeleteCourse() {
  const router = useRouter();

  return useMutation(
    orpc.course.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Course deleted successfully!');
        router.refresh();
      },
      onError: (error) => {
        toast.error('Failed to delete course', {
          description: error.message,
        });
      },
    })
  );
}

export function useEnrollCourse() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation(
    orpc.course.enroll.mutationOptions({
      onSuccess: () => {
        toast.success('Course Enrolled Successfully!');
        queryClient.invalidateQueries(
          orpc.course.listEnrolled.queryOptions({ input: {} })
        );
        router.push('/dashboard');
      },
      onError: (error) => {
        toast.error('Failed to enroll', {
          description: error.message,
        });
      },
    })
  );
}
