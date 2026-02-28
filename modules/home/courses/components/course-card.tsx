import { PublicCoursesDTO } from '@/app/server/course/dto';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from '@/components/ui/card';
import { Ring } from '@/components/ui/ring';
import { cn } from '@/lib/utils';
import { ArrowRight, SchoolIcon, TimerIcon } from 'lucide-react';
import { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';

interface CourseCardProps {
  data: PublicCoursesDTO;
  href?: string;
  action?: string;
  renderFooter?: boolean;
}

export default function CourseCard({
  data,
  href = 'courses',
  action = 'Learn More',
  renderFooter = true,
}: CourseCardProps) {
  return (
    <Card className="group relative flex flex-col gap-2 border pt-3 pb-0">
      <div className="absolute top-4.5 right-4.5 z-10">
        <Badge className="bg-primary text-primary-foreground rounded-sm">
          {data.level}
        </Badge>
      </div>
      <div className="relative mx-3 aspect-video">
        <Link href={`/${href}/${data.slug}` as Route}>
          <Image
            src={data.thumbnail}
            alt={`${data.title} thumbnail`}
            fill
            className="rounded-md object-cover"
          />
        </Link>
        <Ring className="ring-2" />
      </div>
      <CardContent
        className={cn(
          'flex h-full flex-col items-stretch px-4',
          renderFooter ? 'pb-0' : 'pb-4'
        )}
      >
        <div>
          <Link
            href={`/${href}/${data.slug}` as Route}
            className="group-hover:text-primary line-clamp-2 grow text-lg font-medium underline-offset-4 transition-colors hover:underline"
          >
            <CardTitle className="text-justify">{data.title}</CardTitle>
          </Link>
          <CardDescription className="mt-1 line-clamp-2 leading-tight">
            {data.description}
          </CardDescription>
        </div>

        <div className="mt-4 flex h-full items-end gap-x-4">
          <div className="flex items-center gap-1.5">
            <TimerIcon className="text-primary! bg-primary/10 size-6 rounded-sm p-1" />
            <CardDescription>{data.duration}h</CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <SchoolIcon className="text-primary! bg-primary/10 size-6 rounded-sm p-1" />
            <CardDescription className="w-full truncate">
              {data.category}
            </CardDescription>
          </div>
        </div>
      </CardContent>
      {renderFooter && (
        <CardFooter className="bg-muted/50 border-t p-3!">
          <Button
            size="lg"
            className="group/btn w-full gap-2 text-base"
            asChild
          >
            <Link href={`/${href}/${data.slug}` as Route}>
              {action}
              <ArrowRight className="transition-transform group-hover/btn:translate-x-1.5" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
