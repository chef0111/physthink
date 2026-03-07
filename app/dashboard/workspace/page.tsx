import { Suspense } from 'react';
import { Header } from '@/modules/home/header';
import {
  WorkspaceList,
  WorkspaceListSkeleton,
} from '@/modules/home/workspace/components/workspace-list';
import { CreateWorkspaceButton } from '@/modules/home/workspace/components/create-workspace-button';

export default function WorkspaceListPage() {
  return (
    <main className="mx-auto">
      <Header />
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Workspaces
            </h1>
            <p className="text-muted-foreground text-sm">
              Create and manage your 3D illustration workspaces
            </p>
          </div>
          <CreateWorkspaceButton />
        </div>
        <Suspense fallback={<WorkspaceListSkeleton />}>
          <WorkspaceList />
        </Suspense>
      </section>
    </main>
  );
}
