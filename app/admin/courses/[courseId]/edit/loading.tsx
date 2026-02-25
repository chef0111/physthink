import { Button } from '@/components/ui/button';
import { CourseTabs } from '@/modules/admin/course/components/course-tabs';
import { CourseForm } from '@/modules/admin/course/components/course-form';
import { ArrowLeft } from 'lucide-react';
import { CourseStructureSkeleton } from '@/modules/admin/course/layout/loading';
import { Skeleton } from '@/components/ui/skeleton';

export default function EditCourseLoading() {
  return (
    <>
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" size="icon">
          <ArrowLeft />
        </Button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Edit Course:</h1>
          <Skeleton className="h-6 w-64" />
        </div>
      </div>

      <CourseTabs
        basic={<CourseForm />}
        structure={<CourseStructureSkeleton />}
      />
    </>
  );
}
