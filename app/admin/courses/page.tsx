import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Courses() {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Your courses</h1>

        <Button asChild>
          <Link href="/admin/courses/create">Create Course</Link>
        </Button>
      </div>

      <div>
        <h1 className="text-muted-foreground">
          Here you will see all of the courses
        </h1>
      </div>
    </section>
  );
}
