import { orpc } from '@/lib/orpc';
import { requireSession } from '@/lib/session';
import { getQueryClient } from '@/lib/query/hydration';
import { PublicCourseListDTO } from '@/app/server/course/dto';
import { DataRenderer } from '@/components/data-renderer';
import { resolveData, queryFetch } from '@/lib/query/helper';
import CourseCard from '@/modules/home/courses/components/course-card';
import { EmptyEnrolledCourses } from '@/modules/home/courses/layout/empty';
import { NextPagination } from '@/components/ui/next-pagination';
import { Calendar } from '@/components/ui/calendar';
import { CompactCalendar } from '@/modules/home/dashboard/components/compact-calendar';
import { Button } from '@/components/ui/button';
import { CalendarIcon, Box } from 'lucide-react';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/card';

export const WelcomeBanner = async () => {
  const session = await requireSession();
  const username = session.user.name;

  return (
    <div className="flex flex-col items-start max-lg:w-full sm:flex-row sm:items-center lg:flex-col lg:items-start">
      <div className="my-auto h-fit space-y-2 max-lg:w-full">
        <h1 className="text-2xl leading-none font-bold tracking-tight">
          WELCOME BACK!
        </h1>
        <h2 className="text-primary text-xl leading-none font-bold tracking-wide uppercase max-sm:mb-4 lg:mb-8">
          {username}
        </h2>
      </div>
      <div className="mx-auto flex w-full flex-col space-y-3 sm:w-fit">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wider uppercase max-lg:hidden">
          Calendar
        </h2>
        <Calendar
          mode="single"
          className="ring-border/30 mb-0 rounded-lg border ring-3 max-lg:hidden"
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="pointer-events-none size-17 rounded-lg bg-transparent! max-md:hidden lg:hidden"
          >
            <CalendarIcon className="text-muted-foreground size-10" />
          </Button>
          <CompactCalendar className="w-full justify-center sm:w-fit lg:hidden" />
        </div>
      </div>
      <Card className="mt-4 flex w-full flex-col gap-2 space-y-2 p-4 sm:w-fit lg:w-full">
        <CardTitle className="text-sm font-medium tracking-wider uppercase">
          Activity
        </CardTitle>
        <Button asChild>
          <Link href="/dashboard/workspace">
            <Box className="size-4" />
            Create 3D Illustration
          </Link>
        </Button>
      </Card>
    </div>
  );
};

export function getDashboardCourses({
  searchParams,
}: Pick<RouteParams, 'searchParams'>) {
  const queryClient = getQueryClient();

  const courseData = async () => {
    const { page, pageSize, query, sort, filter } = await searchParams;

    const enrolledOptions = orpc.course.listEnrolled.queryOptions({
      input: {
        page: Number(page) || 1,
        pageSize: Number(pageSize) || 6,
        query,
        sort,
        filter,
      },
    });

    const availableOptions = orpc.course.listPublic.queryOptions({
      input: { filter: 'unregistered', pageSize: 4 },
    });

    const [enrolledResult, availableResult] = await Promise.all([
      queryFetch<PublicCourseListDTO>(
        queryClient.fetchQuery(enrolledOptions),
        'Failed to fetch enrolled courses'
      ),
      queryFetch<PublicCourseListDTO>(
        queryClient.fetchQuery(availableOptions),
        'Failed to fetch available courses'
      ),
    ]);

    return { enrolledResult, availableResult };
  };

  async function EnrolledCourses() {
    const { page, pageSize } = await searchParams;
    const { enrolledResult } = await courseData();

    const {
      data: enrolledCourses,
      success,
      error,
    } = resolveData(enrolledResult, (data) => data.courses, []);

    const { data: totalCourses } = resolveData(
      enrolledResult,
      (data) => data.totalCourses,
      0
    );

    return (
      <>
        <DataRenderer
          data={enrolledCourses}
          success={success}
          error={error}
          renderEmpty={() => (
            <div className="bg-muted/30 flex flex-col items-center justify-center rounded-xl border border-dashed">
              <EmptyEnrolledCourses />
            </div>
          )}
          render={(courses) => (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((course) => (
                <CourseCard
                  key={`enrolled-${course.id}`}
                  data={course}
                  href="dashboard/course"
                  action="View Course"
                />
              ))}
            </div>
          )}
        />
        <NextPagination
          page={page}
          pageSize={pageSize}
          totalCount={totalCourses}
          className="pt-6"
        />
      </>
    );
  }

  async function AvailableCourses() {
    const { availableResult } = await courseData();

    const {
      data: publicCourses,
      success,
      error,
    } = resolveData(availableResult, (data) => data.courses, []);

    return (
      <DataRenderer
        data={publicCourses}
        success={success}
        error={error}
        renderEmpty={() => (
          <div className="text-muted-foreground py-8 text-center">
            No new available courses at the moment.
          </div>
        )}
        render={(courses) => (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {courses.map((course) => (
              <CourseCard
                key={`public-${course.id}`}
                data={course}
                renderFooter={false}
              />
            ))}
          </div>
        )}
      />
    );
  }

  return { EnrolledCourses, AvailableCourses };
}
