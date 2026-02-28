import {
  CourseSortOptions,
  PublicCourseFilterOptions,
} from '@/common/constants/filters';
import {
  FilterContent,
  FilterInput,
  FilterSelect,
  SortSelect,
} from '@/components/filter';
import { CourseListSkeleton } from '@/modules/home/courses/layout/loading';
import { Suspense } from 'react';
import { CourseList } from './courses';
import { FilterProvider } from '@/context/filter-provider';

export default function Courses({ searchParams }: RouteParams) {
  return (
    <FilterProvider>
      <section className="mx-auto max-w-7xl space-y-6 px-6">
        <div className="mt-6 flex flex-col gap-1">
          <h1 className="text-xl font-bold">Explore Courses</h1>
          <p className="text-muted-foreground">
            Browse our collection of courses designed to help you achieve your
            goals
          </p>
        </div>

        <div className="flex h-10 flex-col items-center gap-3 sm:flex-row">
          <FilterInput placeholder="Search course..." />
          <SortSelect
            options={CourseSortOptions}
            width="min-w-30"
            className="min-h-10 w-full sm:w-auto"
            containerClassName="w-full sm:w-auto"
          />
          <FilterSelect
            filters={PublicCourseFilterOptions}
            width="min-w-32"
            className="min-h-10 w-full sm:w-auto"
            containerClassName="w-full sm:w-auto"
          />
        </div>

        <div className="pb-10">
          <Suspense fallback={<CourseListSkeleton />}>
            <FilterContent>
              <CourseList searchParams={searchParams} />
            </FilterContent>
          </Suspense>
        </div>
      </section>
    </FilterProvider>
  );
}
