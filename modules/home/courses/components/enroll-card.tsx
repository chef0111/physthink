import { CoursePreviewDTO } from '@/app/server/course/dto';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ArrowRight,
  BookOpen,
  ChartColumnBig,
  CircleCheck,
  ClockIcon,
} from 'lucide-react';

interface EnrollCardProps {
  course: CoursePreviewDTO;
}

export const EnrollCard = ({ course }: EnrollCardProps) => {
  const totalLessons = course.chapters.reduce(
    (total, chapter) => total + chapter.lessons.length,
    0
  );

  return (
    <div className="order-2 col-span-1">
      <div className="sticky top-20">
        <Card className="gap-4 py-0">
          <CardContent className="space-y-4 p-6 pb-0! lg:p-4">
            <div>
              <div className="flex w-full items-center justify-between">
                <CardTitle className="text-primary text-2xl font-bold">
                  Get it now!
                </CardTitle>
                <Badge className="flex items-center gap-1 border border-green-600/30 bg-green-600/10 text-green-600 dark:border-green-300/30 dark:bg-green-300/10 dark:text-green-300">
                  <CircleCheck className="size-4" />
                  Free
                </Badge>
              </div>
              <CardDescription className="w-full max-w-72">
                Complete this course and earn an awesome certificate
              </CardDescription>
            </div>

            <div className="space-y-3">
              <h4 className="text-base font-medium">What you'll get:</h4>
              <Card className="bg-background dark:bg-background/50 gap-0 py-0">
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon-sm"
                      className="bg-primary/10! text-primary! pointer-events-none"
                    >
                      <ChartColumnBig className="size-4" />
                    </Button>
                    <span className="font-semibold">Difficulty Level</span>
                  </div>
                  <span className="font-semibold tracking-wide">
                    {course.level}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon-sm"
                      className="bg-primary/10! text-primary! pointer-events-none"
                    >
                      <ClockIcon className="size-4" />
                    </Button>
                    <span className="font-semibold">Course Duration</span>
                  </div>
                  <span className="font-semibold tracking-wide">
                    {course.duration}
                    {course.duration > 1 ? ' hours' : ' hour'}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon-sm"
                      className="bg-primary/10! text-primary! pointer-events-none"
                    >
                      <BookOpen className="size-4" />
                    </Button>
                    <span className="font-semibold">Total Lessons</span>
                  </div>
                  <span className="font-semibold tracking-wide">
                    {totalLessons} {totalLessons > 1 ? 'lessons' : 'lesson'}
                  </span>
                </div>
              </Card>
            </div>

            <Alert className="flex items-center gap-4 border-green-600/30 bg-green-500/10 dark:border-green-300/30">
              <Button
                size="icon"
                className="pointer-events-none rounded-full bg-green-600/10! text-green-600 dark:bg-green-300/10! dark:text-green-300"
              >
                <CircleCheck className="size-4" />
              </Button>
              <div>
                <AlertTitle className="text-green-600 dark:text-green-300">
                  Life-time Access
                </AlertTitle>
                <AlertDescription className="opacity-80">
                  Access to all learning materials
                </AlertDescription>
              </div>
            </Alert>
          </CardContent>

          <CardFooter className="bg-muted/50 border-t p-3!">
            <Button size="lg" className="group/btn w-full text-base">
              Enroll Course{' '}
              <ArrowRight className="transition-transform group-hover/btn:translate-x-1.5" />
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
