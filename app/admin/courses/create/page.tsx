import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { CourseForm } from '@/modules/admin/course/course-form';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateCourse() {
  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/courses">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create Course</h1>
      </div>

      <Card>
        <CardContent className="space-y-8 px-4">
          <CardHeader className="px-4">
            <CardTitle className="text-2xl">Basic Information</CardTitle>
            <CardDescription>
              Provide basic information about the course
            </CardDescription>
          </CardHeader>
          <CourseForm />
        </CardContent>
      </Card>
    </>
  );
}
