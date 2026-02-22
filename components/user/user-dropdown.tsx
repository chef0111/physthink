'use client';

import { Route } from 'next';
import Link from 'next/link';
import UserAvatar from './user-avatar';
import type { User } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogOutIcon, ShieldUser } from 'lucide-react';
import { userItems } from '@/common/constants';
import { useSignOut } from '@/hooks/use-sign-out';
import { cn } from '@/lib/utils';

interface UserDropdownProps {
  user: User;
  admin?: boolean;
  className?: string;
}

export function UserDropdown({
  user,
  admin = false,
  className,
}: UserDropdownProps) {
  const handleSignOut = useSignOut();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className={cn('no-focus', className)}>
        <UserAvatar
          name={user.name}
          image={user.image}
          className="border-foreground bg-background size-9 cursor-pointer rounded-full border object-cover"
        />
      </DropdownMenuTrigger>
      <DropdownMenuGroup>
        <DropdownMenuContent align="end" className="min-w-54 border">
          <DropdownMenuLabel className="flex flex-col gap-1 truncate">
            <span className="truncate">{user.name}</span>
            <span className="truncate">{user.email}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {admin && (
            <>
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/admin">
                  <ShieldUser className="opacity-60" aria-hidden="true" />
                  <span>Admin</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          <DropdownMenuGroup>
            {userItems.map(({ href, icon: Icon, label }) => (
              <DropdownMenuItem asChild key={href} className="cursor-pointer">
                <Link href={href as Route}>
                  <Icon className="opacity-60" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer" onClick={handleSignOut}>
            <LogOutIcon className="size-4" /> <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenuGroup>
    </DropdownMenu>
  );
}
