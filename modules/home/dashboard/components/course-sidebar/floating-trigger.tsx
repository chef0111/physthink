'use client';

import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';

export function FloatingSidebarTrigger() {
  const { state } = useSidebar();

  if (state === 'expanded') return null;

  return (
    <div className="bg-background/50 fixed top-20 left-0 z-50 flex items-center justify-center rounded-r-full border border-l-0 shadow-md backdrop-blur-sm transition-all">
      <SidebarTrigger className="h-11 w-10 rounded-full rounded-l-none [&_svg]:size-4" />
    </div>
  );
}
