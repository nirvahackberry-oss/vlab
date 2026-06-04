import {
  LayoutDashboard,
  LineChart,
  Users,
  Shield,
  GraduationCap,
  BookOpen,
  Layers,
  FlaskConical,
  Activity,
  Wallet,
  ReceiptText,
  FileText,
  Bell,
  ScrollText,
  Settings,
  Server,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Admin',
    email: 'admin@vlab.enterprise',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [],
  navGroups: [
    {
      title: 'Observability',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        // {
        //   title: 'Analytics',
        //   url: '/analytics',
        //   icon: LineChart,
        // },
      ],
    },
    {
      title: 'Compute & Labs',
      items: [
        {
          title: 'Lab Management',
          url: '/labs',
          icon: FlaskConical,
        },
        {
          title: 'Session Monitoring',
          url: '/sessions',
          icon: Activity,
        },
      ],
    },
    {
      title: 'Identity & Access',
      items: [
        {
          title: 'User Management',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Role Management',
          url: '/roles',
          icon: Shield,
        },
      ],
    },
    {
      title: 'Academic',
      items: [
        {
          title: 'Programs',
          url: '/programs',
          icon: GraduationCap,
        },
        {
          title: 'Courses',
          url: '/courses',
          icon: BookOpen,
        },
        {
          title: 'Semesters',
          url: '/semesters',
          icon: Layers,
        },
      ],
    },
    {
      title: 'Billing & Compliance',
      items: [
        {
          title: 'Credit Management',
          url: '/credits',
          icon: Wallet,
        },
        {
          title: 'Transactions',
          url: '/transactions',
          icon: ReceiptText,
        },
        {
          title: 'Reports',
          url: '/reports',
          icon: FileText,
        },
        {
          title: 'Audit Logs',
          url: '/audit-logs',
          icon: ScrollText,
        },
      ],
    },
    {
      title: 'Configuration',
      items: [
        // {
        //   title: 'Notifications',
        //   url: '/notifications',
        //   icon: Bell,
        //   badge: '3',
        // },
        // {
        //   title: 'Infrastructure',
        //   url: '/infrastructure',
        //   icon: Server,
        // },
        {
          title: 'Settings',
          url: '/settings',
          icon: Settings,
        },
      ],
    },
  ],
}
