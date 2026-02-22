'use client';

import * as React from 'react';

import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';
import { NavUser } from '@/components/user/user-nav';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { LogoIcon } from '@/components/ui/logo';
import { adminSidebarData } from '@/common/constants';

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-10 data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/">
                <LogoIcon className="ml-1 size-5! transition-all duration-200 group-data-[collapsible=icon]:ml-0" />
                <span className="text-xl font-semibold">
                  Phys<span className="text-primary font-bold">Think</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={adminSidebarData.navMain} />
        <NavSecondary
          items={adminSidebarData.navSecondary}
          className="absolute bottom-16 pr-6 transition-all duration-200 group-data-[collapsible=icon]:bottom-12"
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
