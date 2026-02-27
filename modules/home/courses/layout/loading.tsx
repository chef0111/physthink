import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
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
    <Card className="group relative flex flex-col gap-2 border pt-3 pb-0">
      <div className="relative mx-3">
        <Skeleton className="h-72 w-full rounded-md md:h-64 lg:h-72 xl:h-64" />
      </div>
      <CardContent className="mt-1 flex flex-col gap-0! px-4 pb-0">
        <div>
          <Skeleton className="h-4.5 w-3/4 max-w-64" />
          <Skeleton className="mt-2 h-3.5 w-full max-w-96" />
        </div>

        <div className="mt-5 flex h-full items-end gap-x-4">
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-5.5" />
            <Skeleton className="h-4 w-6" />
          </div>
          <div className="flex w-full items-center gap-1.5">
            <Skeleton className="size-5.5" />
            <Skeleton className="h-4 w-full max-w-36" />
          </div>
        </div>
      </CardContent>

      <CardFooter className="bg-accent dark:bg-muted/50 border-t p-3!">
        <Skeleton className="h-10 w-full rounded-md" />
      </CardFooter>
    </Card>
  );
};

export const CoursePreviewSkeleton = () => {
  return (
    <>
      <div className="order-1 pb-10 lg:col-span-2">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg">
          <Skeleton className="h-full w-full" />
        </div>

        <div className="mt-8 space-y-5">
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="mt-2 h-6 w-full" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-24" />
          </div>

          <Card className="mt-8 gap-4 p-4">
            <Skeleton className="h-6 w-1/3" />
            {Array.from({ length: 3 }).map((_, index) => (
              <CardContent key={index} className="flex flex-col gap-2 p-0">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            ))}
          </Card>

          <div className="mt-12 space-y-6">
            <div className="flex items-end justify-between">
              <Skeleton className="h-7 w-32" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-24" />
              </div>
            </div>

            <ContentPreviewSkeleton />
          </div>
        </div>
      </div>

      <EnrollCardSkeleton />
    </>
  );
};

export const ContentPreviewSkeleton = () => {
  return (
    <div className="space-y-4 pb-10">
      <Card className="gap-0 overflow-hidden border-2 p-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="size-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-5 w-24" />
          </div>
        </CardContent>

        <div className="bg-muted/30 border-t">
          <div className="space-y-2 p-4">
            <Skeleton className="h-11.5 w-full" />
            <Skeleton className="h-11.5 w-full" />
            <Skeleton className="h-11.5 w-full" />
          </div>
        </div>
      </Card>

      {Array.from({ length: 2 }).map((_, index) => (
        <Card key={index} className="gap-0 overflow-hidden border-2 p-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-5 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export const EnrollCardSkeleton = () => {
  return (
    <div className="order-2 col-span-1">
      <div className="sticky top-20">
        <Card className="gap-4 py-0">
          <CardContent className="space-y-4 p-6 pb-0! lg:p-4">
            <div className="w-full space-y-2.5">
              <div className="flex w-full items-center justify-between">
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-5 w-15 rounded-full" />
              </div>
              <div className="flex max-w-56 flex-col gap-1.5">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>

            <div className="space-y-3 pt-2.5">
              <Skeleton className="h-5 w-32" />
              <Card className="bg-background dark:bg-background/50 gap-0 py-0">
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="size-8 rounded-md" />
                    <Skeleton className="h-5 w-28" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              </Card>

              <Skeleton className="mt-1 h-16 w-full rounded-lg" />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 border-t p-3!">
            <Skeleton className="h-10 w-full rounded-md" />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
