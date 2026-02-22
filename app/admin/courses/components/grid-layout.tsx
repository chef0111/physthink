'use client';

import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export const GridLayout = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  const { open: sidebarOpen } = useSidebar();
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 sm:grid-cols-2',
        sidebarOpen
          ? 'md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3'
          : 'sm:grid-cols-2 xl:grid-cols-3',
        className
      )}
    >
      {children}
    </div>
  );
};
