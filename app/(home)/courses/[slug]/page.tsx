import { Suspense } from 'react';
import { Preview } from './preview';
import { CoursePreviewSkeleton } from '@/modules/home/courses/layout/loading';

export default function CoursePreview({ params }: RouteParams) {
  return (
    <section className="mx-auto mt-6 grid max-w-7xl grid-cols-1 gap-8 px-6 lg:grid-cols-3">
      <Suspense fallback={<CoursePreviewSkeleton />}>
        <Preview params={params} />
      </Suspense>
    </section>
  );
}
