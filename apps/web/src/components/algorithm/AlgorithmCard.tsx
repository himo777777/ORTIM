import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { GitBranch, ExternalLink } from 'lucide-react';

interface AlgorithmCardProps {
  id: string;
  code: string;
  title: string;
  description?: string;
  relatedChapterTitle?: string;
  className?: string;
}

export function AlgorithmCard({
  id,
  code,
  title,
  description,
  relatedChapterTitle,
  className,
}: AlgorithmCardProps) {
  return (
    <Link
      to={`/algorithms/${id}`}
      className={cn(
        'group block bg-card border rounded-xl p-5 transition-all',
        'hover:shadow-lg hover:border-primary/50',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <GitBranch className="h-6 w-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">{code}</span>
          </div>

          <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>

          {description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {description}
            </p>
          )}

          {relatedChapterTitle && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3" />
              <span>Relaterat till: {relatedChapterTitle}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
