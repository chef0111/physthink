'use client';

import { cn } from '@/lib/utils';
import ThemeToggle from '@/components/ui/theme-toggle';
import { Brand } from '@/components/ui/brand';
import { authClient } from '@/lib/auth-client';
import { UserDropdown } from '@/components/user/user-dropdown';
import { DesktopNav } from '../header/desktop-nav';
import { LoginButton } from '../header/login-button';
import { NavigationMenuItem } from '@/components/ui/navigation-menu';
import Link from 'next/link';

export function Navbar() {
  const { data, isPending } = authClient.useSession();
  const user = data?.user;
  const admin = user?.role === 'admin';

  return (
    <header
      className={cn(
        'fixed top-0 z-50 w-full border-b border-transparent',
        'border-border bg-sidebar/95 supports-backdrop-filter:bg-sidebar/50 backdrop-blur-md'
      )}
    >
      <nav>
        <div className="mx-auto flex h-14 w-full items-center justify-between px-6">
          <div className="flex items-center gap-5">
            <Brand size={20} className="p-1.5" />
            <NavigationMenuItem
              className="hover:bg-muted rounded-md px-2 py-1.5"
              asChild
            >
              <Link href="/dashboard">Dashboard</Link>
            </NavigationMenuItem>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            {isPending ? null : user ? (
              <UserDropdown user={user} admin={admin} />
            ) : (
              <LoginButton />
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
