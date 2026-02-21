import { useMutation } from '@tanstack/react-query';
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
