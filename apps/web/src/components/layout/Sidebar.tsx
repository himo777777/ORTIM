import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';
import {
  Home,
  BookOpen,
  Brain,
  Timer,
  Award,
  Users,
  BarChart3,
  ClipboardCheck,
  Workflow,
  AlertTriangle,
  FileText,
  Download,
  FlaskConical,
  Settings,
  Activity,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: ('PARTICIPANT' | 'INSTRUCTOR' | 'ADMIN')[];
}

const navItems: NavItem[] = [
  { to: '/', label: 'Översikt', icon: Home },
  { to: '/course', label: 'Kursinnehåll', icon: BookOpen },
  { to: '/quiz', label: 'Quiz', icon: Brain },
  { to: '/review', label: 'Repetition', icon: Timer },
  { to: '/algorithms', label: 'Algoritmer', icon: Workflow },
  { to: '/certificates', label: 'Certifikat', icon: Award },
];

const instructorItems: NavItem[] = [
  { to: '/instructor', label: 'Utbildarportal', icon: BarChart3, roles: ['INSTRUCTOR', 'ADMIN'] },
  {
    to: '/instructor/cohorts',
    label: 'Kohorter',
    icon: Users,
    roles: ['INSTRUCTOR', 'ADMIN'],
  },
  {
    to: '/instructor/osce',
    label: 'OSCE',
    icon: ClipboardCheck,
    roles: ['INSTRUCTOR', 'ADMIN'],
  },
  {
    to: '/instructor/at-risk',
    label: 'Riskdeltagare',
    icon: AlertTriangle,
    roles: ['INSTRUCTOR', 'ADMIN'],
  },
  {
    to: '/instructor/reports',
    label: 'Rapporter',
    icon: FileText,
    roles: ['INSTRUCTOR', 'ADMIN'],
  },
  {
    to: '/instructor/export',
    label: 'Dataexport',
    icon: Download,
    roles: ['INSTRUCTOR', 'ADMIN'],
  },
];

const adminItems: NavItem[] = [
  { to: '/admin', label: 'Adminpanel', icon: Settings, roles: ['ADMIN'] },
  { to: '/admin/analytics', label: 'Analytics', icon: Activity, roles: ['ADMIN'] },
  { to: '/admin/ab-tests', label: 'A/B-tester', icon: FlaskConical, roles: ['ADMIN'] },
];

interface SidebarProps {
  collapsed?: boolean;
}

export function Sidebar({ collapsed = false }: SidebarProps) {
  const { user } = useAuthStore();

  const isInstructorOrAdmin = user?.role === 'INSTRUCTOR' || user?.role === 'ADMIN';
  const isAdmin = user?.role === 'ADMIN';

  const renderNavItem = (item: NavItem) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.to === '/'}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive
            ? 'bg-primary text-primary-foreground'
            : 'text-muted-foreground',
          collapsed && 'justify-center px-2'
        )
      }
      title={collapsed ? item.label : undefined}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );

  return (
    <nav className="flex flex-col gap-2 p-4 h-full overflow-y-auto scrollbar-thin">
      <div className="space-y-1">
        {navItems.map(renderNavItem)}
      </div>

      {isInstructorOrAdmin && (
        <>
          <div className="my-4 border-t" />
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Utbildare
            </p>
          )}
          <div className="space-y-1">
            {instructorItems.map(renderNavItem)}
          </div>
        </>
      )}

      {isAdmin && (
        <>
          <div className="my-4 border-t" />
          {!collapsed && (
            <p className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Admin
            </p>
          )}
          <div className="space-y-1">
            {adminItems.map(renderNavItem)}
          </div>
        </>
      )}
    </nav>
  );
}
