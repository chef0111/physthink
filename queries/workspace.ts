'use client';

import { orpc } from '@/lib/orpc';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export function useCreateWorkspace() {
  const router = useRouter();

  return useMutation(
    orpc.workspace.create.mutationOptions({
      onSuccess: (workspace) => {
        toast.success('Workspace created successfully');
        router.push(`/dashboard/workspace/${workspace.id}`);
      },
      onError: (error) => {
        toast.error('Failed to create workspace', {
          description: error.message,
        });
      },
    })
  );
}

export function useUpdateWorkspace(options?: {
  onMutate?: () => void;
  onSuccess?: () => void;
  onError?: () => void;
}) {
  return useMutation(
    orpc.workspace.update.mutationOptions({
      onMutate: options?.onMutate,
      onSuccess: options?.onSuccess,
      onError: options?.onError,
    })
  );
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation(
    orpc.workspace.delete.mutationOptions({
      onSuccess: async () => {
        toast.success('Workspace deleted');
        await queryClient.invalidateQueries(
          orpc.workspace.list.queryOptions({ input: { page: 1, pageSize: 50 } })
        );
      },
      onError: (error) => {
        toast.error('Failed to delete workspace', {
          description: error.message,
        });
      },
    })
  );
}
