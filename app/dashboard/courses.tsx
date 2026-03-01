import { orpc } from '@/lib/orpc';
import { requireSession } from '@/lib/session';
import { getQueryClient } from '@/lib/query/hydration';
import { PublicCourseListDTO } from '@/app/server/course/dto';
import { DataRenderer } from '@/components/data-renderer';
import { resolveData, safeFetch } from '@/lib/query/helper';
import CourseCard from '@/modules/home/courses/components/course-card';
import { EmptyEnrolledCourses } from '@/modules/home/courses/layout/empty';
import { NextPagination } from '@/components/ui/next-pagination';
import { Calendar } from '@/components/ui/calendar';

export const WelcomeBanner = async () => {
  const session = await requireSession();
  const username = session.user.name;

  return (
    <div className="order-1 self-start lg:sticky lg:top-20 lg:col-span-1 lg:mx-auto">
      <h1 className="mb-2 text-2xl font-bold tracking-tight">WELCOME BACK!</h1>
      <h2 className="text-primary mb-8 text-xl font-bold tracking-wide uppercase">
        {username}
      </h2>
      <div className="mx-auto flex w-full flex-col space-y-3 max-lg:hidden">
        <h2 className="text-muted-foreground text-sm font-medium tracking-wider uppercase">
          Calendar
        </h2>
        <Calendar
          mode="single"
          className="ring-border/20 rounded-lg border ring-3"
        />
      </div>
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
      safeFetch<PublicCourseListDTO>(
        queryClient.fetchQuery(enrolledOptions),
        'Failed to fetch enrolled courses'
      ),
      safeFetch<PublicCourseListDTO>(
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
