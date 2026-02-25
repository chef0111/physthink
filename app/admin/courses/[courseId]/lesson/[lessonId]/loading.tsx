import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LessonForm } from '@/modules/admin/lesson/components/lesson-form';

export default function LessonPage() {
  return (
    <>
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon">
          <ArrowLeft />
          <span className="sr-only">Go back</span>
        </Button>

        <Skeleton className="h-6 w-48" />
      </div>

      <Card>
        <CardContent className="space-y-8 px-8">
          <CardHeader className="px-0">
            <CardTitle className="text-xl">Lesson Configuration</CardTitle>
            <CardDescription>
              Configure the structure and content of this lesson
            </CardDescription>
          </CardHeader>
          <LessonForm />
        </CardContent>
      </Card>
    </>
  );
}
