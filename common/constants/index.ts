import {
  BookOpen,
  ChartBarIcon,
  CircleHelpIcon,
  FolderIcon,
  Home,
  LayoutDashboard,
  ListTodo,
  SearchIcon,
  Settings2Icon,
  UsersIcon,
} from 'lucide-react';

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

export const adminSidebarData = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/admin',
      icon: LayoutDashboard,
    } as const,
    {
      title: 'Courses',
      url: '/admin/courses',
      icon: ListTodo,
    },
    {
      title: 'Analytics',
      url: '#',
      icon: ChartBarIcon,
    },
    {
      title: 'Projects',
      url: '#',
      icon: FolderIcon,
    },
    {
      title: 'Team',
      url: '#',
      icon: UsersIcon,
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '#',
      icon: Settings2Icon,
    },
    {
      title: 'Get Help',
      url: '#',
      icon: CircleHelpIcon,
    },
    {
      title: 'Search',
      url: '#',
      icon: SearchIcon,
    },
  ],
};
