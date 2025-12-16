import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface VisuallyHiddenProps {
  children: ReactNode;
  as?: 'span' | 'div' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  className?: string;
}

/**
 * Visually hide content while keeping it accessible to screen readers.
 * Use this for labels, descriptions, or other content that should be
 * announced but not visible.
 */
export function VisuallyHidden({
  children,
  as: Component = 'span',
  className,
}: VisuallyHiddenProps) {
  return <Component className={cn('sr-only', className)}>{children}</Component>;
}
