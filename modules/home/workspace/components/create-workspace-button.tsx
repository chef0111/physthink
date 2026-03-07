'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Loader } from '@/components/ui/loader';
import { useCreateWorkspace } from '@/queries/workspace';

export function CreateWorkspaceButton() {
  const { mutate, isPending } = useCreateWorkspace();

  return (
    <Button onClick={() => mutate({})} disabled={isPending}>
      {isPending ? <Loader /> : <Plus className="size-4" />}
      New Workspace
    </Button>
  );
}
