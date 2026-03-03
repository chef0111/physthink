import { Suspense } from 'react';
import { CourseOverview } from './course';
import { CourseOverviewSkeleton } from '@/modules/home/dashboard/layout/loading';

export default function CoursePage({ params }: RouteParams) {
  return (
    <section className="mx-auto w-full pb-6">
      <Suspense fallback={<CourseOverviewSkeleton />}>
        <CourseOverview params={params} />
      </Suspense>
    </section>
  );
}
