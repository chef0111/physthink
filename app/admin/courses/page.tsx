import { Suspense } from 'react';
import { FilterProvider } from '@/context/filter-provider';
import { Header } from './components/header';
import { Toolbar } from './components/toolbar';
import { FilterContent } from '@/components/filter';
import { CourseList } from './components/courses';
import { CourseListSkeleton } from './components/course-skeleton';

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
