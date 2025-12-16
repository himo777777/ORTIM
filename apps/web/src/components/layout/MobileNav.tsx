import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, BookOpen, Brain, Timer, Award } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Hem', icon: Home },
  { to: '/course', label: 'Kurs', icon: BookOpen },
  { to: '/quiz', label: 'Quiz', icon: Brain },
  { to: '/review', label: 'Rep.', icon: Timer },
  { to: '/certificates', label: 'Cert.', icon: Award },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[4rem] touch-target',
                'transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
