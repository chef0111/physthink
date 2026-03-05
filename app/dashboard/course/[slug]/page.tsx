import { CourseOverview } from './course';

export default function CoursePage({ params }: RouteParams) {
  return (
    <section className="w-full pb-6">
      <CourseOverview params={params} />
    </section>
  );
}
