import Link from 'next/link';
import { BookOpen, HomeIcon, Inbox, SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '@/components/ui/empty';

export function EmptyCourseList() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-16 rounded-xl">
          <Inbox className="size-8" />
        </EmptyMedia>
        <EmptyTitle>No Courses Found</EmptyTitle>
        <EmptyDescription>
          There's currently no courses yet. <br />
          Please return when there're courses available.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/">
            <HomeIcon />
            Back to Home
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function EmptyEnrolledCourses() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon" className="size-16 rounded-xl">
          <BookOpen className="size-8" />
        </EmptyMedia>
        <EmptyTitle>No Courses Found</EmptyTitle>
        <EmptyDescription>
          You have not enrolled in any courses yet.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link href="/courses">
            <SearchIcon />
            Browse Courses
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
