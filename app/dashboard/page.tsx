import { Suspense } from 'react';
import { Header } from '@/modules/home/header';
import { WelcomeBanner, WelcomeBannerFallback } from './welcome-banner';
import { EnrolledCourses } from './enrolled-courses';
import { AvailableCourses } from './available-courses';
import { FilterProvider } from '@/context/filter-provider';
import { FilterContent, FilterSelect, SortSelect } from '@/components/filter';
import {
  CourseSortOptions,
  EnrolledCourseFilterOptions,
} from '@/common/constants/filters';
import {
  CourseCardSkeleton,
  CourseSkeleton,
} from '@/modules/home/courses/layout/loading';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function Dashboard({ searchParams }: RouteParams) {
  return (
    <main className="mx-auto max-w-7xl">
      <Header />
      <section className="px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 xl:grid-cols-4">
          <Suspense fallback={<WelcomeBannerFallback />}>
            <WelcomeBanner />
          </Suspense>

          {/* Enrolled Courses */}
          <FilterProvider>
            <div className="order-2 space-y-6 lg:col-span-2 xl:col-span-3">
              <div className="flex items-center justify-between gap-2 max-sm:flex-col max-sm:items-start">
                <h2 className="text-2xl font-semibold tracking-tight uppercase">
                  Enrolled Course
                </h2>
                <div className="flex items-center gap-2 max-sm:w-full max-sm:flex-col">
                  <SortSelect
                    options={CourseSortOptions}
                    className="max-sm:w-full"
                    containerClassName="max-sm:w-full"
                  />
                  <FilterSelect
                    filters={EnrolledCourseFilterOptions}
                    className="max-sm:w-full"
                    containerClassName="max-sm:w-full"
                  />
                </div>
              </div>
              <Suspense
                fallback={
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <CourseSkeleton key={index} />
                    ))}
                  </div>
                }
              >
                <FilterContent>
                  <EnrolledCourses searchParams={searchParams} />
                </FilterContent>
              </Suspense>
            </div>
          </FilterProvider>
        </div>

        <Separator className="my-10" />

        {/* Available Courses */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight uppercase">
              Available Courses
            </h2>
            <Button variant="outline" size="sm" asChild>
              <Link href="/courses">View All</Link>
            </Button>
          </div>

          <Suspense
            fallback={
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                <CourseCardSkeleton />
                <CourseCardSkeleton />
                <CourseCardSkeleton />
                <CourseCardSkeleton />
              </div>
            }
          >
            <AvailableCourses />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
