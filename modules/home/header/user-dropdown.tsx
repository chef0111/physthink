'use client';

import { LogOutIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Route } from 'next';
import Link from 'next/link';
import UserAvatar from './user-avatar';
import type { User } from '@/lib/auth';
import { authClient } from '@/lib/auth-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { userItems } from '@/common/constants';

interface UserDropdownProps {
  user: User;
  className?: string;
}

export function UserDropdown({ user, className }: UserDropdownProps) {
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
          <DropdownMenuGroup>
            {userItems.map(({ href, icon: Icon, label }) => (
              <DropdownMenuItem asChild key={href}>
                <Link href={href as Route}>
                  <Icon className="opacity-60" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <SignOutItem />
        </DropdownMenuContent>
      </DropdownMenuGroup>
    </DropdownMenu>
  );
}

function SignOutItem() {
  const router = useRouter();

  async function handleSignOut() {
    const { error } = await authClient.signOut();
    if (error) {
      toast.error(error.message || 'Something went wrong');
    } else {
      toast.success('Signed out successfully');
      router.push('/');
    }
  }

  return (
    <DropdownMenuItem onClick={handleSignOut}>
      <LogOutIcon className="size-4" /> <span>Sign out</span>
    </DropdownMenuItem>
  );
}
