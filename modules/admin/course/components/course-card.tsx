import { CourseListDTO } from '@/app/server/course/dto';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Ring } from '@/components/ui/ring';
import {
  ArrowRight,
  EditIcon,
  EyeIcon,
  GitPullRequestArrow,
  MoreVertical,
  SchoolIcon,
  TimerIcon,
  Trash2,
} from 'lucide-react';
import { Route } from 'next';
import Image from 'next/image';
import Link from 'next/link';

interface CourseCardProps {
  data: CourseListDTO;
}

export default function CourseCard({ data }: CourseCardProps) {
  return (
    <Card className="group relative flex flex-col border pt-3 pb-4">
      <div className="absolute top-4.5 right-4.5 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon">
              <MoreVertical />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 border-2">
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href={`/admin/courses/${data.id}/edit` as Route}>
                  <EditIcon className="mr-1 opacity-60" />
                  Edit Course
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/admin/courses/${data.slug}` as Route}>
                  <EyeIcon className="mr-1 opacity-60" />
                  Preview Course
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" asChild>
              <Link href={`/admin/courses/${data.id}/delete` as Route}>
                <Trash2 className="mr-1" />
                Delete Course
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="relative mx-3">
        <Image
          src={data.thumbnail}
          alt={`${data.title} thumbnail`}
          width={600}
          height={400}
          className="aspect-video h-72 w-full rounded-md object-cover sm:h-54 md:h-64"
        />
        <Ring className="ring-2" />
      </div>
      <CardContent className="flex h-full flex-col items-stretch px-4">
        <div>
          <Link
            href={`/admin/courses/${data.slug}` as Route}
            className="group-hover:text-primary line-clamp-2 grow text-lg font-medium underline-offset-4 transition-colors hover:underline"
          >
            <CardTitle className="text-justify">{data.title}</CardTitle>
          </Link>
          <CardDescription className="mt-1 line-clamp-2 leading-tight">
            {data.description}
          </CardDescription>
        </div>

        <div className="my-4 flex h-full items-end gap-x-4">
          <div className="flex items-center gap-1.5">
            <TimerIcon className="text-primary! bg-primary/10 size-6 rounded-sm p-1" />
            <CardDescription>{data.duration}h</CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <SchoolIcon className="text-primary! bg-primary/10 size-6 rounded-sm p-1" />
            <CardDescription>{data.level}</CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            <GitPullRequestArrow className="text-primary! bg-primary/10 size-6 rounded-sm p-1" />
            <CardDescription>{data.status}</CardDescription>
          </div>
        </div>

        <Button size="lg" className="group/btn text-base" asChild>
          <Link href={`/admin/courses/${data.id}/edit` as Route}>
            Edit Course{' '}
            <ArrowRight className="transition-transform group-hover/btn:translate-x-1.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
