'use client';

import { Loader } from '@/components/ui/loader';
import TextShimmer from '@/components/ui/text-shimmer';
import { CheckCircle2 } from 'lucide-react';

interface ToolStatusProps {
  status: string;
  isActive?: boolean;
}

export function ToolStatus({ status, isActive = true }: ToolStatusProps) {
  return (
    <div className="text-muted-foreground flex items-center gap-2 py-1 text-xs">
      {isActive ? (
        <>
          <Loader size={14} />
          <TextShimmer duration={1.5} className="text-xs">
            {status}
          </TextShimmer>
        </>
      ) : (
        <>
          <CheckCircle2 className="text-muted-foreground/60 size-3.5" />
          <span className="text-muted-foreground/60">{status}</span>
        </>
      )}
    </div>
  );
}
