import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const CourseListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <CourseSkeleton key={index} />
      ))}
    </div>
  );
};

export const CourseSkeleton = () => {
  return (
    <Card className="group relative flex flex-col border pt-3 pb-4">
      <div className="relative mx-3">
        <Skeleton className="h-72 w-full rounded-md md:h-64 lg:h-72 xl:h-64" />
      </div>
      <CardContent className="flex h-35.5 flex-col gap-0! px-4">
        <div>
          <Skeleton className="h-5 w-64 max-w-full" />
          <Skeleton className="mt-2 h-4 w-88 max-w-full" />
        </div>

        <div className="mb-4 flex h-full items-end gap-x-4">
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-6" />
            <Skeleton className="h-4.5 w-6" />
          </div>
          <div className="flex w-full items-center gap-1.5">
            <Skeleton className="size-6" />
            <Skeleton className="h-4.5 w-full max-w-36" />
          </div>
        </div>

        <Skeleton className="h-32 w-full rounded-md" />
      </CardContent>
    </Card>
  );
};
