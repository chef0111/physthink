'use client';

import { cn } from '@/lib/utils';
import { useScroll } from '@/hooks/use-scroll';
import ThemeToggle from '@/components/ui/theme-toggle';
import { Brand } from '@/components/ui/brand';
import { LoginButton } from './login-button';
import { DesktopNav } from './desktop-nav';
import { authClient } from '@/lib/auth-client';
import { UserDropdown } from '@/components/user/user-dropdown';

export function Header() {
  const { data, isPending } = authClient.useSession();
  const user = data?.user;
  const admin = user?.role === 'admin';
  const scrolled = useScroll(10);

  return (
    <header
      className={cn('sticky top-0 z-50 w-full border-b border-transparent', {
        'border-border bg-background/95 supports-backdrop-filter:bg-background/50 backdrop-blur-sm':
          scrolled,
      })}
    >
      <nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-5">
          <Brand />
          <DesktopNav />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isPending ? null : user ? (
            <UserDropdown user={user} admin={admin} />
          ) : (
            <LoginButton />
          )}
        </div>
      </nav>
    </header>
  );
}
