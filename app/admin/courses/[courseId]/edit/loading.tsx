import { Button } from '@/components/ui/button';
import { CourseTabs } from '@/modules/admin/course/components/course-tabs';
import { CourseForm } from '@/modules/admin/course/components/course-form';
import { ArrowLeft } from 'lucide-react';
import { CourseStructureSkeleton } from '@/modules/admin/course/layout/loading';

export default function EditCourseLoading() {
  return (
    <>
      <div className="flex items-center gap-4">
        <Button type="button" variant="outline" size="icon">
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold">Edit Course</h1>
      </div>

      <CourseTabs
        basic={<CourseForm />}
        structure={<CourseStructureSkeleton />}
      />
    </>
  );
}
