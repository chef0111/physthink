import { CourseOverview } from './course';

export default function CoursePage({ params }: RouteParams) {
  return (
    <section className="mx-auto w-full pb-6">
      <CourseOverview params={params} />
    </section>
  );
}
