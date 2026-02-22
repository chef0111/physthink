'use client';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const Header = () => {
  const { open: sidebarOpen } = useSidebar();
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 max-sm:flex-col-reverse',
        sidebarOpen ? 'md:flex-col-reverse lg:flex-row' : 'sm:flex-row'
      )}
    >
      <h1 className="flex flex-col gap-1 text-2xl leading-none font-semibold">
        Your courses
        <p className="text-muted-foreground text-lg font-light">
          Here you will see all of the courses
        </p>
      </h1>

      <Button
        className={cn(
          'h-10 text-lg max-sm:w-full sm:text-base',
          sidebarOpen ? 'md:w-full lg:w-fit' : 'sm:w-fit'
        )}
        asChild
      >
        <Link href="/admin/courses/create">Create Course</Link>
      </Button>
    </div>
  );
};
