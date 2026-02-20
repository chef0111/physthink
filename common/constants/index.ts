import { BookOpen, Home, LayoutDashboard } from 'lucide-react';

export const userItems = [
  {
    href: '/',
    icon: Home,
    label: 'Home',
  },
  {
    href: '/courses',
    icon: BookOpen,
    label: 'Courses',
  },
  {
    href: '/dashboard',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
] as const;
