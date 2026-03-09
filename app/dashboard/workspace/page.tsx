import { Suspense } from 'react';
import { Header } from '@/modules/home/header';
import { WorkspaceListSkeleton } from '@/modules/home/workspace/layout/loading';
import { WorkspaceList } from '@/app/dashboard/workspace/workspace';
import { CreateWorkspaceButton } from '@/modules/home/workspace/components/create-workspace-button';
import { FilterContent, FilterInput, SortSelect } from '@/components/filter';
import { WorkspaceSortOptions } from '@/common/constants/filters';
import { FilterProvider } from '@/context/filter-provider';

export default function WorkspaceListPage({ searchParams }: RouteParams) {
  return (
    <main className="mx-auto">
      <FilterProvider>
        <Header />
        <section className="mx-auto max-w-7xl px-6 py-8">
          <div className="mb-10 flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4 max-sm:flex-col-reverse">
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">
                  Workspaces
                </h1>
                <p className="text-muted-foreground text-sm">
                  Create and manage your 3D illustration workspaces
                </p>
              </div>
              <CreateWorkspaceButton />
            </div>

            <div className="flex h-10 flex-col items-center gap-3 sm:flex-row">
              <FilterInput placeholder="Search course..." />
              <SortSelect
                options={WorkspaceSortOptions}
                width="min-w-30"
                className="min-h-10 w-full sm:w-auto"
                containerClassName="w-full sm:w-auto"
              />
            </div>
          </div>
          <Suspense fallback={<WorkspaceListSkeleton />}>
            <FilterContent>
              <WorkspaceList searchParams={searchParams} />
            </FilterContent>
          </Suspense>
        </section>
      </FilterProvider>
    </main>
  );
}
