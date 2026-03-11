'use client';

import { ArrowLeft, Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Loader } from '@/components/ui/loader';
import { authClient } from '@/lib/auth-client';
import ThemeToggle from '@/components/ui/theme-toggle';
import { UserDropdown } from '@/components/user/user-dropdown';

interface WorkspaceHeaderProps {
  title: string;
  onTitleChange: (value: string) => void;
  onTitleBlur: () => void;
  saveStatus: 'idle' | 'saving' | 'saved';
  isLoading?: boolean;
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
  isLoading,
}: WorkspaceHeaderProps) {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const admin = user?.role === 'admin';

  return (
    <div className="bg-background fixed top-0 z-50 w-full border-b px-4 py-2">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/workspace">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        {isLoading ? (
          <div className="text-muted-foreground flex w-full items-center gap-3">
            <Input className="w-full max-w-xs" disabled={isLoading} />
            <Loader />
          </div>
        ) : (
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
            className="max-w-xs"
          />
        )}

        <SaveIndicator status={saveStatus} />
        <div className="ml-auto flex items-center gap-3">
          <SidebarTrigger />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isPending ? null : <UserDropdown user={user!} admin={admin} />}
          </div>
        </div>
      </div>
    </div>
  );
}
