import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { GridLayout } from './grid-layout';

export const CourseListSkeleton = () => {
  return (
    <GridLayout>
      {Array.from({ length: 6 }).map((_, index) => (
        <CourseSkeleton key={index} />
      ))}
    </GridLayout>
  );
};

export const CourseSkeleton = () => {
  return (
    <Card className="group relative flex flex-col border pt-3 pb-4">
      <div className="relative mx-3">
        <Skeleton className="h-72 w-full rounded-md sm:h-54 md:h-64" />
      </div>
      <CardContent className="flex h-36 flex-col gap-0! px-4">
        <div>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>

        <div className="mb-4 flex h-full items-end gap-x-5">
          <div className="flex items-center gap-2">
            <Skeleton className="size-6" />
            <Skeleton className="h-4.5 w-6" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="size-6" />
            <Skeleton className="h-4.5 w-16" />
          </div>
        </div>

        <Skeleton className="h-32 w-full rounded-md" />
      </CardContent>
    </Card>
  );
};
