import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from '@/components/ui/navigation-menu';
import Link from 'next/link';

export const DesktopNav = () => {
  return (
    <NavigationMenu className="hidden md:flex">
      <NavigationMenuList className="gap-2">
        <NavigationMenuItem
          className="hover:bg-muted rounded-md px-2 py-1.5"
          asChild
        >
          <Link href="/">Home</Link>
        </NavigationMenuItem>
        <NavigationMenuItem
          className="hover:bg-muted rounded-md px-2 py-1.5"
          asChild
        >
          <Link href="/courses">Courses</Link>
        </NavigationMenuItem>
        <NavigationMenuItem
          className="hover:bg-muted rounded-md px-2 py-1.5"
          asChild
        >
          <Link href="/dashboard">Dashboard</Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
