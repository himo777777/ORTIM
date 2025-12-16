import { cn } from '@/lib/utils';

interface SkipLink {
  id: string;
  label: string;
}

interface SkipLinksProps {
  links: SkipLink[];
  className?: string;
}

export function SkipLinks({ links, className }: SkipLinksProps) {
  return (
    <nav aria-label="Skip links" className={cn('skip-links', className)}>
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="skip-link"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
}

interface SkipLinkTargetProps {
  id: string;
  children?: React.ReactNode;
  as?: 'main' | 'nav' | 'section' | 'div';
  className?: string;
}

export function SkipLinkTarget({
  id,
  children,
  as: Component = 'div',
  className,
}: SkipLinkTargetProps) {
  return (
    <Component id={id} tabIndex={-1} className={cn('outline-none', className)}>
      {children}
    </Component>
  );
}
