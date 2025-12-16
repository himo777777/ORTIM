import { cn } from '@/lib/utils';

interface SkipLink {
  href: string;
  label: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
  className?: string;
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', label: 'Hoppa till huvudinnehåll' },
  { href: '#main-navigation', label: 'Hoppa till navigation' },
];

export function SkipLinks({ links = defaultLinks, className }: SkipLinksProps) {
  return (
    <nav
      aria-label="Snabblänkar"
      className={cn('sr-only focus-within:not-sr-only', className)}
    >
      <ul className="fixed top-0 left-0 z-[100] flex gap-2 p-2 bg-background">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className={cn(
                'sr-only focus:not-sr-only',
                'inline-block px-4 py-2 rounded-md',
                'bg-primary text-primary-foreground',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                'font-medium text-sm'
              )}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
