'use client';

import { Loader } from '@/components/ui/loader';

interface ToolStatusProps {
  status: string;
}

export function ToolStatus({ status }: ToolStatusProps) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 py-1 text-xs">
      <Loader />
      <span>{status}</span>
    </div>
  );
}
