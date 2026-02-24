import { Suspense } from 'react';
import { FilterProvider } from '@/context/filter-provider';
import { Header } from '@/modules/admin/course/layout/header';
import { Toolbar } from '@/modules/admin/course/layout/toolbar';
import { FilterContent } from '@/components/filter';
import { CourseList } from './courses';
import { CourseListSkeleton } from '@/modules/admin/course/layout/loading';

export default function Courses({ searchParams }: RouteParams) {
  return (
    <FilterProvider>
      <section className="space-y-10">
        <Header />
        <Toolbar />
      </section>

      <section className="mt-4">
        <Suspense fallback={<CourseListSkeleton />}>
          <FilterContent>
            <CourseList searchParams={searchParams} />
          </FilterContent>
        </Suspense>
      </section>
    </FilterProvider>
  );
}
