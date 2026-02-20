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

export const courseLevels = ['Beginner', 'Intermediate', 'Advanced'] as const;

export const courseStatus = ['Draft', 'Published', 'Archived'] as const;

export const courseCategories = [
  'Kinematics of a Particle',
  'Dynamics of a Particle',
  'Work and Energy – Conservation Laws',
  'Momentum and Collisions',
  'Rigid Body Mechanics',
  'Oscillations and Mechanical Waves',
  'Thermodynamics',
  'Electric Field',
  'Electric Potential and Capacitors',
  'Electric Current and DC Circuits',
  'Magnetic Field',
  'Electromagnetic Induction',
  'Electromagnetic Waves',
  'Others',
] as const;
