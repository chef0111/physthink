'use client';

import {
  CourseSortOptions,
  CourseFilterOptions,
} from '@/common/constants/filters';
import { FilterInput, SortSelect, FilterSelect } from '@/components/filter';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export function Toolbar() {
  const { open: sidebarOpen } = useSidebar();

  return (
    <div
      className={cn(
        'flex h-10 items-center gap-3 max-sm:mb-24 max-sm:flex-col',
        sidebarOpen ? 'md:mb-24 md:flex-col lg:mb-0 lg:flex-row' : 'sm:flex-row'
      )}
    >
      <FilterInput placeholder="Search course..." />
      <SortSelect
        options={CourseSortOptions}
        width="min-w-30"
        className={cn(
          'max-sm:w-full',
          sidebarOpen ? 'w-full sm:w-auto md:w-full lg:w-auto' : 'sm:w-auto'
        )}
        containerClassName={cn(
          'max-sm:w-full',
          sidebarOpen ? 'w-full sm:w-auto md:w-full lg:w-auto' : 'sm:w-auto'
        )}
      />
      <FilterSelect
        filters={CourseFilterOptions}
        width="min-w-33"
        className={cn(
          'h-10! max-sm:w-full',
          sidebarOpen ? 'w-full sm:w-auto md:w-full lg:w-auto' : 'sm:w-auto'
        )}
        containerClassName={cn(
          'max-sm:w-full',
          sidebarOpen ? 'w-full sm:w-auto md:w-full lg:w-auto' : 'sm:w-auto'
        )}
      />
    </div>
  );
}
