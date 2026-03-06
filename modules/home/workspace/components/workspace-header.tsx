'use client';

import { ArrowLeft, Check, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Loader } from '@/components/ui/loader';

interface WorkspaceHeaderProps {
  title: string;
  onTitleChange: (value: string) => void;
  onTitleBlur: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
}

function SaveIndicator({ status }: { status: 'idle' | 'saving' | 'saved' }) {
  if (status === 'idle') return null;
  return (
    <span className="text-muted-foreground flex items-center gap-2 text-sm">
      {status === 'saving' ? (
        <>
          <Loader /> Saving...
        </>
      ) : (
        <>
          <Check className="size-4" /> Saved
        </>
      )}
    </span>
  );
}

export function WorkspaceHeader({
  title,
  onTitleChange,
  onTitleBlur,
  saveStatus,
}: WorkspaceHeaderProps) {
  return (
    <div className="bg-background fixed top-0 z-50 w-full border-b px-4 py-2">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/workspace">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <Input
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          className="max-w-xs"
        />
        <SaveIndicator status={saveStatus} />
        <div className="ml-auto">
          <SidebarTrigger className="size-8">
            <MessageSquare className="size-4" />
          </SidebarTrigger>
        </div>
      </div>
    </div>
  );
}
